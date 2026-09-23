#!/usr/bin/env python3
"""
Kadr rodziny (kwadrat 2048 px z OpenArt) → warianty do karuzeli:
  site/img/rodziny/{slug}-45-640.webp, -45-1280.webp   (4:5, lewa kolumna na komputerze)
  site/img/rodziny/{slug}-43-800.webp, -43-1200.webp   (4:3, nad panelem na telefonie)
Surowce leżą w dolnych dwóch trzecich kadru, więc kadr 4:3 bierzemy z dołu (kotwica 0,7).
Użycie: python3 dev/grafiki/przetworz_kadr.py <plik.png> <slug> [--kotwica-43 0.7]
"""
import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def crop(im, ratio, anchor_y=0.5, anchor_x=0.5):
    w, h = im.size
    if w / h > ratio:
        nw = int(h * ratio); x = int((w - nw) * anchor_x); return im.crop((x, 0, x + nw, h))
    nh = int(w / ratio); y = int((h - nh) * anchor_y); return im.crop((0, y, w, y + nh))


def main(path, slug, out_dir='rodziny', anchor43=0.7):
    im = Image.open(path).convert('RGB')
    out = os.path.join(ROOT, 'site', 'img', out_dir)
    os.makedirs(out, exist_ok=True)
    c45, c43 = crop(im, 4 / 5), crop(im, 4 / 3, anchor_y=anchor43)
    for w in (640, 1280):
        c45.resize((w, int(w * 5 / 4)), Image.LANCZOS).save(os.path.join(out, f'{slug}-45-{w}.webp'), 'WEBP', quality=80, method=6)
    for w in (800, 1200):
        c43.resize((w, int(w * 3 / 4)), Image.LANCZOS).save(os.path.join(out, f'{slug}-43-{w}.webp'), 'WEBP', quality=80, method=6)
    print(slug, 'ok', {f: os.path.getsize(os.path.join(out, f)) // 1024 for f in os.listdir(out) if f.startswith(slug)})


if __name__ == '__main__':
    a = sys.argv[1:]
    anchor = float(a[a.index('--kotwica-43') + 1]) if '--kotwica-43' in a else 0.7
    main(a[0], a[1], anchor43=anchor)
