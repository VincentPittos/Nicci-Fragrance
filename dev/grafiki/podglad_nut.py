#!/usr/bin/env python3
"""Podgląd miniatur nut przyciętych do koła, na grafitowym i kremowym tle (jak w szufladzie i karcie)."""
import os
import sys

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DIR = os.path.join(ROOT, 'site', 'img', 'nuty')
out, names = sys.argv[1], sorted(f for f in os.listdir(DIR) if f.endswith('.webp'))
S, P, COLS = 96, 16, 8
rows = (len(names) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * (S + P) + P, rows * (S + P) * 2 + P * 2), (26, 24, 23))
cream = Image.new('RGB', (sheet.width, rows * (S + P) + P), (243, 234, 223))
sheet.paste(cream, (0, rows * (S + P) + P))
mask = Image.new('L', (S * 4, S * 4), 0); ImageDraw.Draw(mask).ellipse((0, 0, S * 4, S * 4), fill=255)
mask = mask.resize((S, S), Image.LANCZOS)
for half in (0, 1):
    for i, n in enumerate(names):
        r, c = divmod(i, COLS)
        im = Image.open(os.path.join(DIR, n)).convert('RGB').resize((S, S), Image.LANCZOS)
        sheet.paste(im, (P + c * (S + P), P + r * (S + P) + half * (rows * (S + P) + P)), mask)
sheet.save(out, quality=88)
print(out, len(names))
