#!/usr/bin/env python3
"""
Grafiki zestawów do zakładki „Zestawy” w katalogu (decyzja 99): flakony składników ułożone w grupę na tym samym
jasnym tle, na którym stoją zdjęcia produktów (site/img/produkty/pNN-800.webp, tło 241, 240, 236), więc karta
zestawu wygląda jak karta zapachu. Tylny rząd mniejszy i wyżej, przedni większy i niżej, flakony lekko na siebie
zachodzą. Sylwetka flakonu jest nieprzezroczysta (wypełnienie od brzegu zdjęcia), cień pod flakonem przechodzi
przez mnożenie, więc zostaje miękki.

    python3 dev/grafiki/zestawy_grafiki.py [ID_ZESTAWU ...]   (bez argumentów: wszystkie aktywne z dev/dane/arkusz.json)

Wynik: site/img/zestawy/ID-{400,600,800}.{webp,avif} (4:5, jak zdjęcia produktów).
Składnik bez zdjęcia na stronie jest pomijany z ostrzeżeniem (np. p60 Bottled Absolu w z07).
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zapis import zapisz  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROD = os.path.join(ROOT, 'site', 'img', 'produkty')
OUT = os.path.join(ROOT, 'site', 'img', 'zestawy')
BG = np.array([241, 240, 236], np.float32)
W, H = 1600, 2000            # praca w 2x, wynik 800 x 1000
UKRYTE = {'z01', 'z03'}      # zestawy zdjęte ze sprzedaży (decyzja 99)


def wczytaj(pid):
    f = os.path.join(PROD, pid + '-800.webp')
    if not os.path.exists(f):
        return None
    a = np.asarray(Image.open(f).convert('RGB')).astype(np.float32)
    # tylko piksele ciemniejsze od tła liczą się jako flakon: jaśniejsza poświata wokół części packshotów to tło
    d = np.clip(BG - a, 0, None).max(2)
    ys, xs = np.nonzero(d > 6)
    # flakon: ramka pikseli innych niż tło (z cieniem pod spodem)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    a = a[y0:y1, x0:x1]
    d = d[y0:y1, x0:x1]
    # sylwetka: wszystko, do czego nie da się dojść od brzegu przez piksele podobne do tła
    tlo = Image.fromarray(((d < 10) * 255).astype(np.uint8))
    tlo = Image.fromarray(255 - np.asarray(Image.fromarray(255 - np.asarray(tlo)).filter(ImageFilter.MaxFilter(3))))
    t = Image.new('L', (tlo.width + 2, tlo.height + 2), 255)
    t.paste(tlo, (1, 1))
    ImageDraw.floodfill(t, (0, 0), 128)
    sylw = (np.asarray(t)[1:-1, 1:-1] != 128).astype(np.float32)
    sylw = np.asarray(Image.fromarray((sylw * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
    # wysokość samej sylwetki (bez cienia) do skalowania
    rows = np.nonzero(sylw.max(1) > 0.5)[0]
    return a, sylw, rows.min(), rows.max() + 1


def uklad(n):
    """(rząd, skala wysokości, środek x jako ułamek, podstawa y jako ułamek) dla n flakonów."""
    if n <= 3:
        xs = [0.5] if n == 1 else np.linspace(0.3, 0.7, n)
        return [(1, 0.50, x, 0.80) for x in xs]
    tyl = n // 2 + (n % 2 == 0 and n > 4)
    tyl = {4: 2, 5: 3, 6: 3, 7: 4}.get(n, n // 2)
    przod = n - tyl
    out = []
    for i, x in enumerate(np.linspace(0.18, 0.82, tyl) if tyl > 1 else [0.5]):
        out.append((0, 0.40, x, 0.60))
    for i, x in enumerate(np.linspace(0.30, 0.70, przod) if przod > 1 else [0.5]):
        out.append((1, 0.46, x, 0.80))
    return out


def zestaw(sid, sklad):
    canvas = np.tile(BG, (H, W, 1))
    flakony = [(pid, wczytaj(pid)) for pid in sklad]
    brak = [pid for pid, f in flakony if f is None]
    if brak:
        print('  ostrzeżenie:', sid, 'bez zdjęcia na stronie:', ', '.join(brak))
    flakony = [(pid, f) for pid, f in flakony if f is not None]
    pozycje = uklad(len(flakony))
    # najpierw tylny rząd, potem przedni (przedni zasłania)
    kolejnosc = sorted(range(len(flakony)), key=lambda i: pozycje[i][0])
    for i in kolejnosc:
        pid, (a, sylw, r0, r1) = flakony[i]
        rzad, hs, cx, base = pozycje[i]
        # wysokość z układu, ale szeroki, niski flakon nie może być szerszy niż 26% (przód) i 24% (tył) kadru
        k = min(hs * H / (r1 - r0), (0.26 if rzad else 0.24) * W / a.shape[1])
        nw, nh = max(1, int(a.shape[1] * k)), max(1, int(a.shape[0] * k))
        a2 = np.asarray(Image.fromarray(a.clip(0, 255).astype(np.uint8)).resize((nw, nh), Image.LANCZOS)).astype(np.float32)
        s2 = np.asarray(Image.fromarray((sylw * 255).astype(np.uint8)).resize((nw, nh), Image.LANCZOS)).astype(np.float32)[..., None] / 255
        x0 = int(cx * W - nw / 2)
        y0 = int(base * H - r1 * k)              # dół sylwetki na podstawie rzędu
        xa, ya = max(0, x0), max(0, y0)
        xb, yb = min(W, x0 + nw), min(H, y0 + nh)
        sub = canvas[ya:yb, xa:xb]
        part = a2[ya - y0:yb - y0, xa - x0:xb - x0]
        sm = s2[ya - y0:yb - y0, xa - x0:xb - x0]
        ratio = np.clip(part / BG, 0, 1.0)
        sub = sub * ratio * (1 - sm) + part * sm  # cień przez mnożenie, flakon nieprzezroczysty
        canvas[ya:yb, xa:xb] = sub
    im = Image.fromarray(canvas.clip(0, 255).astype(np.uint8))
    os.makedirs(OUT, exist_ok=True)
    for w in (400, 600, 800):
        zapisz(im.resize((w, w * 5 // 4), Image.LANCZOS), os.path.join(OUT, '%s-%d' % (sid, w)))
    print(sid, len(flakony), 'flakonów')


def main():
    d = json.load(open(os.path.join(ROOT, 'dev', 'dane', 'arkusz.json')))
    rows = d['Zestawy']
    hdr = rows[0]
    tylko = sys.argv[1:]
    for r in rows[1:]:
        z = dict(zip(hdr, r))
        if tylko and z['id'] not in tylko:
            continue
        if not tylko and (str(z['aktywny']).upper() != 'TAK' or z['id'] in UKRYTE):
            continue
        sklad = [c.split(':')[0].strip() for c in str(z['sklad']).split(',') if c.strip()]
        zestaw(z['id'], sklad)


if __name__ == '__main__':
    main()
