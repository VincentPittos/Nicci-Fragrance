#!/usr/bin/env python3
"""
Ujednolicenie zdjęć flakonów do siatki katalogu.

Wejście: katalog z plikami nazwanymi id produktu (p01.jpg, p07.png, p12.webp...), zdjęcia na jasnym,
jednolitym tle. Wyjście: site/img/produkty/{id}-400.webp i {id}-800.webp w proporcji 4:5, z tym samym tłem,
flakonem tej samej wysokości i tak samo posadzonym w kadrze. Bez tego siatka rozjeżdża się wizualnie.

Użycie:
    python3 dev/zdjecia/ujednolic_zdjecia.py <katalog_wejściowy> [--tlo F1EFEC] [--wysokosc 0.74]
Wynik obok: dev/zdjecia/raport.csv z wymiarami, tłem źródła i ostrzeżeniami (np. ciemne tło, flakon ucięty).
"""
import argparse
import csv
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'site', 'img', 'produkty')
SIZES = (400, 800)  # szerokość; wysokość = 1,25 × szerokość (4:5)


def background_color(a):
    """Mediana z pasków brzegowych: tło źródła."""
    h, w, _ = a.shape
    b = max(4, min(h, w) // 40)
    edge = np.concatenate([a[:b].reshape(-1, 3), a[-b:].reshape(-1, 3), a[:, :b].reshape(-1, 3), a[:, -b:].reshape(-1, 3)])
    return np.median(edge, axis=0)


def subject_box(a, bg, tol):
    """Prostokąt obejmujący piksele wyraźnie różne od tła (flakon i jego cień)."""
    diff = np.abs(a.astype(np.int32) - bg.astype(np.int32)).max(axis=2)
    mask = diff > tol
    # usuwamy pojedyncze szumy: minimum 0,2% pikseli w wierszu/kolumnie
    rows = np.where(mask.sum(axis=1) > mask.shape[1] * 0.002)[0]
    cols = np.where(mask.sum(axis=0) > mask.shape[0] * 0.002)[0]
    if not len(rows) or not len(cols):
        return None
    return cols[0], rows[0], cols[-1] + 1, rows[-1] + 1


def process(path, target_bg, height_ratio, tol):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im)
    bg = background_color(a)
    warn = []
    if bg.mean() < 200:
        warn.append('ciemne albo niejednolite tło źródła, sprawdź ręcznie')
    box = subject_box(a, bg, tol)
    if not box:
        return None, ['nie znaleziono flakonu']
    x0, y0, x1, y1 = box
    if x0 <= 1 or y0 <= 1 or x1 >= a.shape[1] - 1 or y1 >= a.shape[0] - 1:
        warn.append('obiekt dotyka krawędzi źródła, flakon może być ucięty')
    subject = im.crop(box)

    # maska: im dalej od tła źródła, tym bardziej kryje; miękka krawędź zamiast prostokątnego szwu
    sa = np.asarray(subject).astype(np.float32)
    diff = np.abs(sa - bg.astype(np.float32)).max(axis=2)
    alpha = np.clip((diff - tol * 0.4) / (tol * 1.6), 0, 1)
    alpha_img = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))

    W = 1600
    H = int(W * 1.25)
    canvas = Image.new('RGB', (W, H), tuple(int(c) for c in target_bg))
    scale = (H * height_ratio) / subject.height
    if subject.width * scale > W * 0.86:
        scale = (W * 0.86) / subject.width
        warn.append('szeroki obiekt, dopasowany do szerokości')
    size = (max(1, int(subject.width * scale)), max(1, int(subject.height * scale)))
    subject = subject.resize(size, Image.LANCZOS)
    alpha_img = alpha_img.resize(size, Image.LANCZOS)
    # flakon wyśrodkowany w poziomie, podstawa na 88% wysokości kadru
    x = (W - subject.width) // 2
    y = max(0, int(H * 0.88) - subject.height)
    canvas.paste(subject, (x, y), alpha_img)

    pid = os.path.splitext(os.path.basename(path))[0]
    os.makedirs(OUT, exist_ok=True)
    for w in SIZES:
        canvas.resize((w, int(w * 1.25)), Image.LANCZOS).save(os.path.join(OUT, f'{pid}-{w}.webp'), 'WEBP', quality=82, method=6)
    return {'id': pid, 'zrodlo_px': f'{im.width}x{im.height}', 'tlo_zrodla': '#%02X%02X%02X' % tuple(int(c) for c in bg)}, warn


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('--tlo', default='F1EFEC', help='kolor tła docelowego, hex bez #')
    ap.add_argument('--wysokosc', type=float, default=0.74, help='wysokość flakonu jako część wysokości kadru')
    ap.add_argument('--tol', type=int, default=18, help='czułość wykrywania obiektu względem tła')
    args = ap.parse_args()
    target = tuple(int(args.tlo[i:i + 2], 16) for i in (0, 2, 4))
    rows = []
    for name in sorted(os.listdir(args.src)):
        if not name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            continue
        info, warn = process(os.path.join(args.src, name), target, args.wysokosc, args.tol)
        rows.append(dict(info or {'id': name}, ostrzezenia='; '.join(warn)))
        print(name, 'OK' if not warn else ' / '.join(warn))
    with open(os.path.join(os.path.dirname(__file__), 'raport.csv'), 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['id', 'zrodlo_px', 'tlo_zrodla', 'ostrzezenia'])
        w.writeheader()
        w.writerows(rows)


if __name__ == '__main__':
    sys.exit(main())
