#!/usr/bin/env python3
"""
Grafiki zestawów z Nano Banana Pro (Muapi) do kart w zakładce „Zestawy” (decyzja 102). Źródła 1856 × 2304 leżą
w dev/grafiki/zrodla/zestawy/ID-muapi.jpg (poza repozytorium); prompty i referencje: zdjęcia produktów ze strony,
atomizery NICCI z sesji (d_4432), odlewka 1 ml, a dla Bottled Absolu zdjęcie ze strony hugoboss.com.
Essentials (v3): luźny, niesymetryczny układ jak w Entry i Autumn; zdublowany flakon Bois Impérial usunięty edycją
w Nano Banana. Winter (v2): logo NICCI na bocznej ściance atomizerów, granatowy flakon Oud Maracujá, trzy drobne
napisy na etykietach poprawione ręcznie (EXTRAIT, EAU DE PARFUM, 100ML).

    python3 dev/grafiki/zestawy_muapi.py [ID ...]   (bez argumentów: wszystkie)

Wynik: site/img/zestawy/ID-WERSJA-{400,600,800}.{webp,avif}, kadr 4:5 ze środka. Każda nowa grafika dostaje nową
wersję w nazwie (WERSJE niżej i ZESTAWY_ZDJECIA w site/js/app.js), bo /img/* ma w przeglądarce pamięć podręczną
na tydzień.
"""
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zapis import zapisz  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'dev', 'grafiki', 'zrodla', 'zestawy')
OUT = os.path.join(ROOT, 'site', 'img', 'zestawy')
WERSJE = {'essentials': 'v3', 'z04': 'v2', 'z05': 'v2', 'z06': 'v2', 'z07': 'v2'}


def main():
    for sid in sys.argv[1:] or WERSJE:
        im = Image.open(os.path.join(SRC, sid + '-muapi.jpg')).convert('RGB')
        w, h = im.size
        cw = min(w, round(h * 4 / 5))
        ch = round(cw * 5 / 4)
        x0, y0 = (w - cw) // 2, (h - ch) // 2
        im = im.crop((x0, y0, x0 + cw, y0 + ch))
        for size in (400, 600, 800):
            zapisz(im.resize((size, size * 5 // 4), Image.LANCZOS), os.path.join(OUT, '%s-%s-%d' % (sid, WERSJE[sid], size)))
        print(sid, (cw, ch))


if __name__ == '__main__':
    main()
