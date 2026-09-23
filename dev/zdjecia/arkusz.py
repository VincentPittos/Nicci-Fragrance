#!/usr/bin/env python3
"""Arkusz kontaktowy wariantów zdjęć: python3 dev/zdjecia/arkusz.py <wyjście.jpg> [id ...]"""
import csv, os, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
rows = list(csv.DictReader(open(os.path.join(HERE, 'zrodla.csv'), encoding='utf-8')))
ids = sys.argv[2:] or sorted({r['id'] for r in rows})
by = {}
for r in rows:
    if r['id'] in ids: by.setdefault(r['id'], []).append(r)
TW, TH, PER = 150, 190, 3
cell_w = TW * 4 + 20
sheet = Image.new('RGB', (cell_w * PER, (TH + 34) * ((len(ids) + PER - 1) // PER)), (255, 255, 255))
d = ImageDraw.Draw(sheet)
font = ImageFont.load_default()
for i, pid in enumerate(ids):
    x0, y0 = (i % PER) * cell_w, (i // PER) * (TH + 34)
    d.text((x0 + 4, y0 + 2), pid + ' ' + (by.get(pid, [{}])[0].get('tytul', '')[:40]), fill=(0, 0, 0), font=font)
    for j, r in enumerate(sorted(by.get(pid, []), key=lambda r: r["wariant"])[:4]):
        try:
            im = Image.open(os.path.join(HERE, 'zrodla', r['plik'])).convert('RGB'); im.thumbnail((TW - 6, TH - 6))
            sheet.paste(im, (x0 + j * TW + 3, y0 + 18))
            d.text((x0 + j * TW + 4, y0 + 18 + TH - 16), str(j) + ' ' + r['wymiary'], fill=(200, 0, 0), font=font)
        except Exception as e:
            d.text((x0 + j * TW + 4, y0 + 40), 'błąd', fill=(200, 0, 0), font=font)
sheet.save(sys.argv[1], quality=82)
print(sheet.size)
