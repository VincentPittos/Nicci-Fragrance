#!/usr/bin/env python3
"""
Cięcie arkusza miniatur nut (siatka 4×4) na pojedyncze pliki site/img/nuty/{slug}.webp.

Kafelki są o kilka poziomów jaśniejsze od tła arkusza. Profil jasności (80. percentyl w każdej kolumnie
i wierszu, więc bez surowców) po odjęciu ruchomej mediany, która zdejmuje gradient światła, ma wyraźne dołki
w szczelinach między kafelkami. Z kandydatów bierzemy trzy szczeliny o równych odstępach: to odrzuca
przypadkowe dołki od cieni surowców. Z odstępu i szerokości szczeliny wynikają cztery kafelki.
Kadr to kwadrat wewnątrz kafelka (CROP jego boku), więc po przycięciu do koła nie widać krawędzi papieru.

Użycie: python3 dev/grafiki/tnij_nuty.py <arkusz.png> slug1,slug2,...,slug16   (kolejnością wierszami)
"""
import itertools
import os
import sys

import numpy as np
from numpy.lib.stride_tricks import sliding_window_view
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'site', 'img', 'nuty')
SIZE = 256
CROP = 0.88  # bok kadru jako część krótszego boku kafelka


def gutters(profile, k=201):
    """Cztery kafelki wzdłuż osi z trzech wewnętrznych szczelin: dołki profilu 12–70 px w równych odstępach."""
    pad = np.pad(profile, k // 2, mode='edge')
    d = profile - np.median(sliding_window_view(pad, k), axis=1)
    d = np.convolve(d, np.ones(7) / 7, mode='same')  # percentyle są całkowite, bez wygładzenia szczelina się rwie
    low = d < -1.0
    cand, start = [], None
    for i, v in enumerate(np.append(low, False)):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if 12 <= i - start <= 70:
                cand.append((start, i))
            start = None
    n, best = len(profile), None
    for trio in itertools.combinations(cand, 3):
        a, b = trio[1][0] - trio[0][0], trio[2][0] - trio[1][0]
        if min(a, b) < n / 6 or abs(a - b) / max(a, b) > 0.06:
            continue
        sp = spans_from(trio)
        if sp[0][0] < 0 or sp[3][1] > n:  # cztery kafelki muszą się zmieścić w arkuszu
            continue
        score = abs(a - b) / max(a, b) + abs((sp[0][0] + sp[3][1]) / 2 - n / 2) / n
        if best is None or score < best[0]:
            best = (score, sp)
    assert best, f'nie znaleziono równych szczelin: {cand}'
    return best[1]


def spans_from(g):
    pitch = (g[2][0] - g[0][0]) / 2
    tw = pitch - sum(e - s for s, e in g) / 3
    return [(g[0][0] - tw, g[0][0]), (g[0][1], g[1][0]), (g[1][1], g[2][0]), (g[2][1], g[2][1] + tw)]


def tiles(a):
    g = a.mean(axis=2)
    return gutters(np.percentile(g, 80, axis=0)), gutters(np.percentile(g, 80, axis=1))


def main():
    src, slugs = sys.argv[1], sys.argv[2].split(',')
    assert len(slugs) == 16, 'potrzeba 16 nazw'
    im = Image.open(src).convert('RGB')
    cols, rows = tiles(np.asarray(im))
    os.makedirs(OUT, exist_ok=True)
    for i, slug in enumerate(slugs):
        r, c = divmod(i, 4)
        (x0, x1), (y0, y1) = cols[c], rows[r]
        half = min(x1 - x0, y1 - y0) * CROP / 2
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        box = tuple(int(round(v)) for v in (cx - half, cy - half, cx + half, cy + half))
        path = os.path.join(OUT, f'{slug}.webp')
        im.crop(box).resize((SIZE, SIZE), Image.LANCZOS).save(path, 'WEBP', quality=82, method=6)
        print(slug, box, os.path.getsize(path) // 1024, 'KB')
    print('kolumny', cols, 'wiersze', rows)


if __name__ == '__main__':
    main()
