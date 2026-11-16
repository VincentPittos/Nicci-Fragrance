"""Dokłada 2 odlewki z przodu zdjęcia M (kopie odlewek D3 i D5 z tego samego zdjęcia, to samo światło).
Kształt odlewki wycinany z pomiarów: kapturek, karbowany kołnierz, szkło z zaokrąglonym dnem.
Użycie: dodaj_odlewki.py wejście.png wyjście.png"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
W, H = im.size

# części odlewki w pikselach zdjęcia: (kapturek), (kołnierz), (szkło); dno = dół szkła
D3 = dict(cap=(1092, 1447, 1212, 1634), collar=(1087, 1632, 1220, 1728), glass=(1086, 1726, 1223, 1966))
D5 = dict(cap=(1454, 1412, 1575, 1601), collar=(1452, 1600, 1580, 1691), glass=(1452, 1689, 1582, 1921))


def cut(spec):
    x0 = min(b[0] for b in spec.values()) - 4
    y0 = min(b[1] for b in spec.values()) - 4
    x1 = max(b[2] for b in spec.values()) + 4
    y1 = max(b[3] for b in spec.values()) + 4
    crop = im.crop((x0, y0, x1, y1))
    m = Image.new('L', crop.size, 0)
    d = ImageDraw.Draw(m)
    c, k, g = spec['cap'], spec['collar'], spec['glass']
    d.rounded_rectangle((c[0] - x0, c[1] - y0, c[2] - x0, c[3] - y0), radius=6, fill=255)
    d.rectangle((k[0] - x0, k[1] - y0, k[2] - x0, k[3] - y0), fill=255)
    d.rounded_rectangle((g[0] - x0, g[1] - y0, g[2] - x0, g[3] - y0), radius=14, fill=255)
    m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    return crop, m


def place(base, spec, cx, base_y, scale, bright=1.0):
    crop, m = cut(spec)
    w, h = int(crop.width * scale), int(crop.height * scale)
    crop = crop.resize((w, h), Image.LANCZOS)
    m = m.resize((w, h), Image.LANCZOS)
    if bright != 1.0:
        crop = ImageEnhance.Brightness(crop).enhance(bright)
    x = int(cx - w / 2)
    y = int(base_y - h + 4 * scale)  # dół wycinka ma 4 px zapasu
    # cień kontaktowy pod dnem i miękki cień w prawo w głąb (światło z lewej z przodu)
    sh = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(sh)
    bw = w * 0.56
    d.ellipse((cx - bw, base_y - 10, cx + bw, base_y + 12), fill=215)
    sh = sh.filter(ImageFilter.GaussianBlur(7))
    cast = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(cast)
    d.polygon([(cx - w * 0.45, base_y), (cx + w * 0.5, base_y), (cx + w * 1.35, base_y - 26), (cx + w * 0.2, base_y - 30)], fill=120)
    cast = cast.filter(ImageFilter.GaussianBlur(14))
    sh = Image.fromarray(np.maximum(np.asarray(sh), np.asarray(cast)))
    base = Image.composite(Image.new('RGB', (W, H), (6, 5, 5)), base, sh)
    base.paste(crop, (x, y), m)
    return base


out = place(im, D3, cx=905, base_y=2034, scale=1.07, bright=1.02)
out = place(out, D5, cx=1395, base_y=2008, scale=1.05)
out.save(dst)
print('gotowe', out.size)
