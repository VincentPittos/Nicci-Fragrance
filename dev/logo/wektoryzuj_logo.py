#!/usr/bin/env python3
"""
Wektoryzacja logo z refs/logo-zrodlo.webp (złoto na czerni, 2000 px) do SVG z przezroczystym tłem.
Wynik w site/img/marka/: logo-pelne.svg (znak + NICCI + FRAGRANCE), logo-znak.svg (sam znak),
favicon.svg, favicon-32.png, apple-touch-icon.png (180 px).
Kolor przez currentColor, więc logo działa w złocie na ciemnym i w ciemnym kolorze na jasnym.
"""
import os
import numpy as np
import potrace
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'refs', 'logo-zrodlo.webp')
OUT = os.path.join(ROOT, 'site', 'img', 'marka')
GOLD = '#D5A865'
BLACK = '#040404'

im = np.asarray(Image.open(SRC).convert('RGB')).astype(np.int32)
# złoto ma R ~211, cienie w tle najwyżej ~28: próg w połowie odcina tło, zostawia wygładzone krawędzie
mask = im[:, :, 0] >= 110
ys, xs = np.where(mask)
print('obszar logo', xs.min(), ys.min(), xs.max(), ys.max())

# podział na znak i napisy po pustych wierszach
rows = mask.any(axis=1)
bands, inside, start = [], False, 0
for y, r in enumerate(rows):
    if r and not inside: inside, start = True, y
    if not r and inside: inside = False; bands.append((start, y))
print('pasy', bands)


def trace(m):
    # potracer traktuje wartości fałszywe jako tusz, więc przekazujemy odwróconą maskę
    bm = potrace.Bitmap(~m)
    return bm.trace(turdsize=8, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY,
                    alphamax=1.0, opticurve=True, opttolerance=0.2)


def path_d(plist, dx=0, dy=0):
    f = lambda p: f'{p.x - dx:.1f} {p.y - dy:.1f}'
    parts = []
    for curve in plist:
        parts.append('M' + f(curve.start_point))
        for seg in curve.segments:
            if seg.is_corner:
                parts.append('L' + f(seg.c) + 'L' + f(seg.end_point))
            else:
                parts.append('C' + f(seg.c1) + ' ' + f(seg.c2) + ' ' + f(seg.end_point))
        parts.append('Z')
    return ''.join(parts)


def svg(m, title, pad=0):
    ys, xs = np.where(m)
    x0, y0, x1, y1 = xs.min() - pad, ys.min() - pad, xs.max() + 1 + pad, ys.max() + 1 + pad
    d = path_d(trace(m), x0, y0)
    w, h = x1 - x0, y1 - y0
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="{title}">'
            f'<title>{title}</title><path fill="currentColor" fill-rule="evenodd" d="{d}"/></svg>\n'), (w, h)


os.makedirs(OUT, exist_ok=True)
full, size = svg(mask, 'Nicci Fragrance')
open(os.path.join(OUT, 'logo-pelne.svg'), 'w').write(full)
emblem_mask = mask.copy()
emblem_mask[bands[-2][0]:, :] = False  # znak: wszystko nad napisem NICCI
emblem, esize = svg(emblem_mask, 'Nicci Fragrance, znak')
open(os.path.join(OUT, 'logo-znak.svg'), 'w').write(emblem)
print('pełne', size, 'znak', esize, 'bajtów', len(full), len(emblem))

# favicon: złoty znak na czerni, z marginesem
fav = emblem.replace('currentColor', GOLD)
vb = [int(v) for v in fav.split('viewBox="')[1].split('"')[0].split()]
side = int(max(vb[2], vb[3]) * 1.25)
ox, oy = (side - vb[2]) / 2, (side - vb[3]) / 2
inner = fav.split('<path')[1].split('/>')[0]
fav_svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {side} {side}"><rect width="{side}" height="{side}" rx="{side*0.18:.0f}" fill="{BLACK}"/>'
           f'<g transform="translate({ox:.1f} {oy:.1f})"><path{inner}/></g></svg>\n')
open(os.path.join(OUT, 'favicon.svg'), 'w').write(fav_svg)

# PNG z rastra źródłowego: znak przeskalowany na czerń marki
e_ys, e_xs = np.where(emblem_mask)
crop = Image.open(SRC).convert('RGB').crop((e_xs.min(), e_ys.min(), e_xs.max() + 1, e_ys.max() + 1))
for name, px in (('favicon-32.png', 32), ('apple-touch-icon.png', 180)):
    canvas = Image.new('RGB', (px, px), BLACK)
    inner_px = int(px * 0.78)
    c = crop.copy(); c.thumbnail((inner_px, inner_px), Image.LANCZOS)
    canvas.paste(c, ((px - c.width) // 2, (px - c.height) // 2))
    canvas.save(os.path.join(OUT, name), optimize=True)
print('gotowe')
