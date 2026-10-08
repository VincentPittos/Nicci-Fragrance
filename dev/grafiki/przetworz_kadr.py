#!/usr/bin/env python3
"""
Kadr rodziny (kwadrat 2048 px z OpenArt) → warianty do karuzeli, każdy w WebP i AVIF (dev/grafiki/zapis.py):
  site/img/rodziny/{slug}-45-640, -45-1280   (4:5, lewa kolumna na komputerze)
  site/img/rodziny/{slug}-43-800, -43-1200   (4:3, nad panelem na telefonie)
Surowce leżą w dolnych dwóch trzecich kadru, więc kadr 4:3 bierzemy z dołu (kotwica 0,7).
Użycie: python3 dev/grafiki/przetworz_kadr.py <plik.png> <slug> [--kotwica-43 0.7]
Źródła na stronie: dev/grafiki/zrodla/{slug}.png, cytrusowa z test-cytrusowa-nb2.png, orientalna z orientalna-v2.png,
wszystkie z kotwicą 0,7 (październik 2026: WebP odtworzone z tych źródeł co do piksela).
"""
import os
import sys
from PIL import Image

from zapis import zapisz

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WEBP = dict(quality=80)  # kadry rodzin od początku w WebP q80


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
        zapisz(c45.resize((w, int(w * 5 / 4)), Image.LANCZOS), os.path.join(out, f'{slug}-45-{w}'), webp=WEBP)
    for w in (800, 1200):
        zapisz(c43.resize((w, int(w * 3 / 4)), Image.LANCZOS), os.path.join(out, f'{slug}-43-{w}'), webp=WEBP)
    print(slug, 'ok', {f: os.path.getsize(os.path.join(out, f)) // 1024 for f in os.listdir(out) if f.startswith(slug)})


if __name__ == '__main__':
    a = sys.argv[1:]
    anchor = float(a[a.index('--kotwica-43') + 1]) if '--kotwica-43' in a else 0.7
    main(a[0], a[1], anchor43=anchor)
