"""Na etykietach odlewek zamienia nieczytelne znaczki pod „NICCI” na napis FRAGRANCE (jak w logo marki).
Linia znaczków: wymazana interpolacją papieru etykiety między wierszem nad nią i pod nią (zachowuje cieniowanie),
potem FRAGRANCE krojem Jost, wyśrodkowane pod NICCI, rysowane w 4x i zmniejszane (gładkie krawędzie).
Użycie: etykiety_fragrance.py wejście.png wyjście.png"""
import os
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
FONT = os.path.join(os.environ.get('NICCI_FONTY', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'zrodla', 'fonty')), 'Jost[wght].ttf')
im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(np.float32)

# (x0, y0, x1, y1) linii znaczków (włącznie) i (lewy, prawy) brzeg słowa NICCI, zmierzone na powiększeniach
ETYKIETY = [
    ((829, 1872, 894, 1880), (817, 910)),
    ((978, 1832, 1046, 1843), (970, 1062)),
    ((1117, 1915, 1197, 1928), (1110, 1205)),
    ((1302, 1786, 1367, 1799), (1290, 1385)),
    ((1494, 1868, 1557, 1878), (1477, 1575)),
]
rng = np.random.default_rng(3)
for (x0, y0, x1, y1), (n0, n1) in ETYKIETY:
    top, bot = a[y0 - 1, x0:x1 + 1].copy(), a[y1 + 1, x0:x1 + 1].copy()
    lt, lb = top.mean(1), bot.mean(1)
    # gdy wiersz odniesienia trafia w literę NICCI albo krawędź, bierzemy drugi wiersz
    top[lt < 170] = bot[lt < 170]
    bot[lb < 170] = top[lb < 170]
    n = y1 - y0 + 1
    for i in range(n):
        t = (i + 1) / (n + 1)
        a[y0 + i, x0:x1 + 1] = top * (1 - t) + bot * t + rng.normal(0, 1.2, (x1 - x0 + 1, 1))
    # kolor druku: najciemniejsze piksele słowa NICCI nad linią
    word = a[y0 - 30:y0 - 2, n0:n1]
    ink = np.median(word.reshape(-1, 3)[word.reshape(-1, 3).mean(1) < np.percentile(word.mean(2), 8)], 0)
    a_img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    # FRAGRANCE: szerokość ok. 80% słowa NICCI, wysokość wersalików ok. 6 px
    Z = 4
    target_w = (n1 - n0) * 0.80 * Z
    size = 40
    ft = ImageFont.truetype(FONT, size); ft.set_variation_by_axes([500])
    def width(sz, tr):
        f = ImageFont.truetype(FONT, sz); f.set_variation_by_axes([500])
        return sum(f.getlength(c) for c in 'FRAGRANCE') + tr * sz * 8, f
    tr = 0.16
    lo, hi = 8, 200
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if width(mid, tr)[0] < target_w:
            lo = mid
        else:
            hi = mid
    tw, ft = width(lo, tr)
    canvas = Image.new('L', (int(tw) + 20, lo * 2), 0)
    d = ImageDraw.Draw(canvas)
    x = 10
    for c in 'FRAGRANCE':
        d.text((x, 0), c, font=ft, fill=255)
        x += ft.getlength(c) + tr * lo
    canvas = canvas.crop(canvas.getbbox())
    small = canvas.resize((max(1, round(canvas.width / Z)), max(1, round(canvas.height / Z))), Image.LANCZOS)
    small = small.filter(ImageFilter.GaussianBlur(0.25))
    cx = (n0 + n1) / 2
    px = int(round(cx - small.width / 2))
    py = int(round((y0 + y1) / 2 - small.height / 2))
    a_img.paste(Image.new('RGB', small.size, tuple(int(v) for v in ink)), (px, py), small)
    a = np.asarray(a_img).astype(np.float32)
    print('etykieta', (x0, y0), 'FRAGRANCE', small.size, 'kolor', [int(v) for v in ink])

Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(dst)
