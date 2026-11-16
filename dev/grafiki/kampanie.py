#!/usr/bin/env python3
"""
Grafiki kampanii na stronę (popup newslettera, strona ofert): tła z OpenArt bez napisów, napisy są w HTML.
Źródła 2752 x 1536 (16:9) i 1856 x 2304 (4:5) leżą w dev/grafiki/zrodla/kampanie (poza repozytorium).

    python3 dev/grafiki/kampanie.py

Wynik w site/img/kampanie/NAZWA-SZEROKOŚĆ.{webp,avif}:
  essentials-*       popup na komputerze, pełny kadr 4:5 (u góry ciemne tło na napis −99%)
  essentials-pas-*   popup na telefonie, pas z flakonami i siedmioma odlewkami (ok. 640:405)
  black-weeks-*      hero strony ofert 16:9 na komputerze, black-weeks-pion-* 4:5 na telefonie
  christmas-*        to samo dla oferty świątecznej
"""
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zapis import zapisz  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'dev', 'grafiki', 'zrodla', 'kampanie')
OUT = os.path.join(ROOT, 'site', 'img', 'kampanie')

# (plik źródłowy, nazwa wyniku, kadr jako ułamki (lewo, góra, prawo, dół) albo None, szerokości)
ZADANIA = [
    ('essentials-4x5.webp', 'essentials', None, (480, 720, 960)),
    ('essentials-4x5.webp', 'essentials-pas', (0.0, 0.25, 1.0, 0.76), (640, 960)),
    ('black-weeks-16x9.webp', 'black-weeks', None, (1280, 1920, 2560)),
    ('black-weeks-4x5.webp', 'black-weeks-pion', None, (640, 960)),
    ('christmas-16x9.webp', 'christmas', None, (1280, 1920, 2560)),
    ('christmas-4x5.webp', 'christmas-pion', None, (640, 960)),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    for plik, nazwa, kadr, szerokosci in ZADANIA:
        im = Image.open(os.path.join(SRC, plik)).convert('RGB')
        if kadr:
            w, h = im.size
            im = im.crop((round(kadr[0] * w), round(kadr[1] * h), round(kadr[2] * w), round(kadr[3] * h)))
        for sz in szerokosci:
            if sz > im.width:
                continue
            out = im.resize((sz, round(im.height * sz / im.width)), Image.LANCZOS)
            zapisz(out, os.path.join(OUT, '%s-%d' % (nazwa, sz)))
            print(nazwa, sz, out.size)


if __name__ == '__main__':
    main()
