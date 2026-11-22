"""Narzędzia do poprawiania przekłamanych etykiet: homografia, wymazanie napisu, przeszczep druku i tłoczenia."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def lum(x):
    return x[..., 0] * 0.299 + x[..., 1] * 0.587 + x[..., 2] * 0.114

def boxblur(arr, r):
    for ax in (0, 1):
        n = arr.shape[ax]
        pad = [(0, 0)] * arr.ndim; pad[ax] = (r + 1, r)
        p = np.pad(arr, pad, mode='edge'); c = np.cumsum(p, ax)
        arr = (np.take(c, range(2 * r + 1, 2 * r + 1 + n), ax) - np.take(c, range(0, n), ax)) / (2 * r + 1)
    return arr

def blur(arr, r):
    rr = max(1, int(round(r / 1.7))); arr = arr.astype(np.float32)
    for _ in range(3): arr = boxblur(arr, rr)
    return arr

def homog(src, dst):
    """3x3 H: dst ~ H @ src."""
    A, b = [], []
    for (x, y), (u, v) in zip(src, dst):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); b.append(v)
    h = np.linalg.lstsq(np.array(A, float), np.array(b, float), rcond=None)[0]
    return np.append(h, 1).reshape(3, 3)

def apply(H, pts):
    out = []
    for x, y in pts:
        p = H @ np.array([x, y, 1.0]); out.append((p[0] / p[2], p[1] / p[2]))
    return out

class Obraz:
    def __init__(self, path):
        self.im = Image.open(path).convert('RGB'); self.a = np.asarray(self.im).astype(np.float32)
        self.W, self.H = self.im.size

    def mask(self, pts, feather=0):
        m = Image.new('L', (self.W, self.H), 0); ImageDraw.Draw(m).polygon([tuple(p) for p in pts], fill=255)
        if feather: m = m.filter(ImageFilter.GaussianBlur(feather))
        return np.asarray(m).astype(np.float32) / 255

    def warp(self, src_img, H_src_to_dst):
        """Obraz źródłowy przeniesiony na płótno tego obrazu."""
        Hi = np.linalg.inv(H_src_to_dst); Hi = Hi / Hi[2, 2]
        return src_img.transform((self.W, self.H), Image.PERSPECTIVE, tuple(Hi.flatten()[:8]), resample=Image.BICUBIC)

    def erase_text(self, pts, thr, r, grow=3, dark=True, support=None):
        """Napis (ciemny albo jasny względem mediany) w wielokącie zastąpiony tłem z otoczenia."""
        reg = self.mask(pts) > 0.5; L = lum(self.a); med = np.median(L[reg])
        t = reg & ((L < med - thr) if dark else (L > med + thr))
        t = np.asarray(Image.fromarray((t * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(grow))) > 0
        w = (~t).astype(np.float32)
        if support is not None: w = w * (self.mask(support) > 0.5)
        fill = blur(self.a * w[..., None], r) / np.maximum(blur(w, r)[..., None], 1e-3)
        fill = fill + np.random.default_rng(1).normal(0, 1.5, fill.shape[:2])[..., None]
        self.a = np.where(t[..., None], fill, self.a)
        return int(t.sum())

    def smooth(self, pts, r, feather=3):
        """Wygładzenie (np. tłoczenia na szkle) w wielokącie; zwraca odchylenie górnoprzepustowe sprzed zmiany."""
        reg = self.mask(pts) > 0.5; L = lum(self.a); hp = L - blur(L, 6); s = float(hp[reg].std())
        soft = self.mask(pts, feather)[..., None]; low = blur(self.a, r)
        self.a = self.a * (1 - soft) + low * soft
        return s

    def ink(self, alpha_img, color, gain=1.0, soft=0.4):
        al = np.asarray(alpha_img.filter(ImageFilter.GaussianBlur(soft))).astype(np.float32)[..., None] / 255 * gain
        al = np.clip(al, 0, 1); self.a = self.a * (1 - al) + np.array(color, np.float32) * al

    def relief(self, rel, tint=(1, 1, 1)):
        self.a = self.a + rel[..., None] * np.array(tint, np.float32)

    def paste(self, rgb_img, m):
        self.a = self.a * (1 - m[..., None]) + np.asarray(rgb_img).astype(np.float32) * m[..., None]

    def median_rgb(self, pts, cond):
        reg = self.mask(pts) > 0.5; L = lum(self.a); sel = reg & cond(L, self.a)
        return np.median(self.a[sel], axis=0)

    def save(self, path, q=95):
        Image.fromarray(np.clip(self.a, 0, 255).astype(np.uint8)).save(path, quality=q)

def dark_ink_alpha(src_arr, box, lo=15, floor=45, region=None):
    """Ciemny druk na jasnym tle -> alfa (0..255) na pełnym płótnie źródła, tylko w box."""
    x0, y0, x1, y1 = box
    L = lum(src_arr[y0:y1, x0:x1])
    bg = blur(np.asarray(Image.fromarray(np.clip(L, 0, 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))).astype(np.float32), 3)
    al = np.clip((bg - L - lo) / np.maximum(bg - floor - lo, 10), 0, 1)
    full = np.zeros(src_arr.shape[:2], np.float32); full[y0:y1, x0:x1] = al
    return Image.fromarray((full * 255).astype(np.uint8))

def light_ink_alpha(src_arr, box, lo=12, ceil=235):
    x0, y0, x1, y1 = box
    L = lum(src_arr[y0:y1, x0:x1])
    bg = blur(np.asarray(Image.fromarray(np.clip(L, 0, 255).astype(np.uint8)).filter(ImageFilter.MinFilter(9))).astype(np.float32), 3)
    al = np.clip((L - bg - lo) / np.maximum(ceil - bg - lo, 10), 0, 1)
    full = np.zeros(src_arr.shape[:2], np.float32); full[y0:y1, x0:x1] = al
    return Image.fromarray((full * 255).astype(np.uint8))
