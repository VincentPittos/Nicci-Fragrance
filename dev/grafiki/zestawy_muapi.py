#!/usr/bin/env python3
"""
Grafiki zestawów z Nano Banana Pro (Muapi) do kart w zakładce „Zestawy” (decyzja 102). Źródła 1856 × 2304 leżą
w dev/grafiki/zrodla/zestawy/ID-muapi.jpg (poza repozytorium); prompty i referencje: zdjęcia produktów ze strony,
atomizery NICCI z sesji (d_4432) i odlewka 1 ml. W Essentials pas z unoszącymi się korkami nad flakonami został
zastąpiony gładkim tłem, a grupa przesunięta do środka kadru.

    python3 dev/grafiki/zestawy_muapi.py

Wynik: site/img/zestawy/ID-v2-{400,600,800}.{webp,avif}, kadr 4:5 ze środka. Nowa nazwa (v2), bo /img/* ma
w przeglądarce pamięć podręczną na tydzień. Winter Discovery Set (z07) czeka na zdjęcie Hugo Boss Bottled Absolu
i zostaje przy grafice z dev/grafiki/zestawy_grafiki.py.
"""
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zapis import zapisz  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'dev', 'grafiki', 'zrodla', 'zestawy')
OUT = os.path.join(ROOT, 'site', 'img', 'zestawy')
ZESTAWY = ['essentials', 'z04', 'z05', 'z06']


def main():
    for sid in ZESTAWY:
        im = Image.open(os.path.join(SRC, sid + '-muapi.jpg')).convert('RGB')
        w, h = im.size
        cw = min(w, round(h * 4 / 5))
        ch = round(cw * 5 / 4)
        x0, y0 = (w - cw) // 2, (h - ch) // 2
        im = im.crop((x0, y0, x0 + cw, y0 + ch))
        for size in (400, 600, 800):
            zapisz(im.resize((size, size * 5 // 4), Image.LANCZOS), os.path.join(OUT, '%s-v2-%d' % (sid, size)))
        print(sid, (cw, ch))


if __name__ == '__main__':
    main()
