"""Maska pierwszego planu bez modeli.
1) Kontury: gradient jasności (po lekkim rozmyciu, żeby ziarno nie dawało krawędzi). Tło i złota poświata są gładkie.
2) Domknięcie konturów i zalanie tła od górnej krawędzi: to, czego zalanie nie dosięgnie, to flakony, odlewki i skała.
3) Tło szacowane rozmyciem samego tła (poza maską), potem miękka krawędź z różnicy obrazu od tła.
Użycie: maska_klasyczna.py wejście.png wyjście_maska.png [próg_gradientu] [domknięcie_px]"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
G = float(sys.argv[3]) if len(sys.argv) > 3 else 5.0
K = int(sys.argv[4]) if len(sys.argv) > 4 else 9
im = Image.open(src).convert('RGB')
W, H = im.size
full = np.asarray(im).astype(np.float32)


def box(a, r):
    for ax in (0, 1):
        n = a.shape[ax]
        p = np.concatenate([np.repeat(a.take([0], ax), r + 1, ax), a, np.repeat(a.take([-1], ax), r, ax)], ax)
        c = np.cumsum(p, ax)
        a = (c.take(range(2 * r + 1, 2 * r + 1 + n), ax) - c.take(range(0, n), ax)) / (2 * r + 1)
    return a


def gauss(a, r):
    for _ in range(3):
        a = box(a, r)
    return a


# 1) gradient: max po kanałach, na obrazie rozmytym o ~1,5 px
sm = np.asarray(im.filter(ImageFilter.GaussianBlur(1.6))).astype(np.float32)
gx = np.zeros_like(sm); gy = np.zeros_like(sm)
gx[:, 1:-1] = (sm[:, 2:] - sm[:, :-2]) / 2
gy[1:-1, :] = (sm[2:, :] - sm[:-2, :]) / 2
grad = np.sqrt(gx ** 2 + gy ** 2).max(2)
edges = (grad > G).astype(np.uint8) * 255
e = Image.fromarray(edges)
# usuń pojedyncze iskry złotego pyłu: zostają tylko krawędzie, które przetrwają małe otwarcie
e = e.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
# 2) domknięcie konturów
closed = e.filter(ImageFilter.MaxFilter(K))
fl = closed.copy()
for x in range(0, W, 8):
    if fl.getpixel((x, 0)) == 0:
        ImageDraw.floodfill(fl, (x, 0), 128)
solid = (np.asarray(fl) != 128).astype(np.uint8) * 255
# cofnij poszerzenie z domknięcia (zostaje o 1 px szersze, krawędź dopracuje rampa)
solidI = Image.fromarray(solid).filter(ImageFilter.MinFilter(K - 2 if K > 3 else 1))
solid = np.asarray(solidI).astype(np.float32) / 255

# 3) tło spoza maski i rampa różnicy na krawędzi
sc = 4
small = np.asarray(im.resize((W // sc, H // sc), Image.BOX)).astype(np.float32)
msk = 1 - np.asarray(Image.fromarray((solid * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(13)).resize((W // sc, H // sc), Image.BOX)).astype(np.float32) / 255
num = gauss(small * msk[..., None], 10)
den = gauss(msk, 10)[..., None] + 1e-3
bg = num / den
bgF = np.asarray(Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)).astype(np.float32)
d = np.abs(full - bgF).max(2)
ramp = np.clip((d - 6) / 14, 0, 1)
inner = np.asarray(Image.fromarray((solid * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5))).astype(np.float32) / 255
outer = np.asarray(Image.fromarray((solid * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))).astype(np.float32) / 255
alpha = np.maximum(inner, ramp * outer)
out = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))
out.save(dst)
print('pierwszy plan', round(float(alpha.mean()), 3))
