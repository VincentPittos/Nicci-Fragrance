#!/usr/bin/env python3
"""
Okładki boxów w sekcji Instagram na stronie głównej (decyzja 88): kadry 9:16 ze zdjęć z sesji Nicciego
(folder FOTY NICCI na Dysku Skalentry, podgląd 2400 x 1600 px). Stoją tam, dopóki właściciel nie przyśle rolek;
wtedy okładką będzie pierwsza klatka rolki.

    python3 dev/grafiki/instagram_okladki.py KATALOG_ZE_ZDJĘCIAMI

W katalogu pliki d_NNNN.png (NNNN = numer zdjęcia _JAKNNNN z sesji). Wynik: site/img/instagram/rolka-K-{320,640}.{webp,avif}.
"""
import os
import sys

from PIL import Image, ImageEnhance

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zapis import zapisz  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'site', 'img', 'instagram')

# (numer zdjęcia, środek kadru w poziomie jako ułamek szerokości)
KADRY = [(4521, 0.50), (4509, 0.56), (4432, 0.47), (4539, 0.64), (4476, 0.56), (4498, 0.62)]


def main():
    src = sys.argv[1]
    os.makedirs(OUT, exist_ok=True)
    for k, (nr, cx) in enumerate(KADRY, 1):
        im = Image.open(os.path.join(src, 'd_%d.png' % nr)).convert('RGB')
        w, h = im.size
        cw = round(h * 9 / 16)
        x0 = min(max(0, round(cx * w - cw / 2)), w - cw)
        kadr = ImageEnhance.Contrast(im.crop((x0, 0, x0 + cw, h))).enhance(1.04)
        for szer in (320, 640):
            zapisz(kadr.resize((szer, round(szer * 16 / 9)), Image.LANCZOS), os.path.join(OUT, 'rolka-%d-%d' % (k, szer)))
        print('rolka-%d: _JAK%d, kadr od x=%d' % (k, nr, x0))


if __name__ == '__main__':
    main()
