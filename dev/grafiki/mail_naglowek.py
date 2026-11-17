#!/usr/bin/env python3
"""
Nagłówek maila z kodem −99% (dev/maile/kod-essentials.html, decyzje 101 i 106).

Tło: zdjęcie bazowe grafiki „−99% na Siedem Legend” bez napisu (baza z obniżoną skałą, 1856 × 2320), dobudowane
u góry do 2:3 i przerobione w Nano Banana Pro (Muapi): skały do samych krawędzi kadru, bez winiety i ściemnień,
jedno naturalne, ciepłe światło z góry (poświata u góry na środku, za logo). Flakony i odlewki zostają na miejscu,
więc napis kładziemy tym samym dev/grafiki/napis_99.py (styl L_legendy_anton_krem, dopisek „na Siedem Legend”)
i tą samą maską pierwszego planu co na poście i w popupie. Na koniec logo na górze. Bez dorobionej poświaty i bez
wtapiania boków i dołu w kolor maila: grafika dochodzi do krawędzi.

    python3 dev/grafiki/mail_naglowek.py TLO_MUAPI.jpg BAZA_MASKA.png LOGO_PNG [SKALA DY]

TLO_MUAPI.jpg  wynik Muapi (kadr 2:3, wejście: baza 1856 × 2320 z dobudowanymi 464 px u góry)
BAZA_MASKA.png maska pierwszego planu bazy (1856 × 2320)
LOGO_PNG       site/img/marka/logo-pelne-zloto.svg wyrenderowane do PNG z przezroczystością (264 × 288)
SKALA DY       dopasowanie wyniku do wejścia (domyślnie 0.9138 i -9: zmierzone na flakonach, korelacja 0,97)
Fonty: NICCI_FONTY (jak w napis_99.py). Wynik: site/img/email/essentials-naglowek-v2-1200.jpg
(nowa nazwa, bo /img/* ma w przeglądarce pamięć podręczną na tydzień).
"""
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, 'site', 'img', 'email', 'essentials-naglowek-v2-1200.jpg')
W_BAZA, H_BAZA, DOBUDOWA = 1856, 2320, 464
W = 1200
LOGO_W, LOGO_H, LOGO_Y = 132, 144, 72   # przy szerokości 1200 (66 × 72 px w mailu), jak wcześniej


def main():
    tlo_p, maska_p, logo_p = sys.argv[1:4]
    skala = float(sys.argv[4]) if len(sys.argv) > 4 else 0.9138
    dy = int(sys.argv[5]) if len(sys.argv) > 5 else -9

    # wynik Muapi w skali wejścia; wiersz y wejścia to wiersz y + dy wyniku
    t = Image.open(tlo_p).convert('RGB')
    t = t.resize((W_BAZA, round(t.height / skala)), Image.LANCZOS)
    a = np.asarray(t)
    y0 = DOBUDOWA + dy
    need = y0 + H_BAZA
    if a.shape[0] < need:   # brakujące wiersze na samym dole (skała): powielamy ostatni
        a = np.concatenate([a, np.repeat(a[-1:], need - a.shape[0], 0)], 0)
    gora, kadr = a[:y0], a[y0:need]

    with tempfile.TemporaryDirectory() as tmp:
        baza = os.path.join(tmp, 'baza.png')
        Image.fromarray(kadr).save(baza)
        env = dict(os.environ, PODPIS='na Siedem Legend', SUB_MODE='prawo')
        subprocess.run([sys.executable, '-I', os.path.join(HERE, 'napis_99.py'), baza, maska_p, tmp, 'L_legendy_anton_krem'],
                       check=True, env=env, stdout=subprocess.DEVNULL)
        z_napisem = np.asarray(Image.open(os.path.join(tmp, 'L_legendy_anton_krem.png')).convert('RGB'))

    full = Image.fromarray(np.concatenate([gora, z_napisem], 0))
    full = full.resize((W, round(full.height * W / W_BAZA)), Image.LANCZOS)
    logo = Image.open(logo_p).convert('RGBA').resize((LOGO_W, LOGO_H), Image.LANCZOS)
    full.paste(logo, ((W - LOGO_W) // 2, LOGO_Y), logo)
    full.save(OUT, quality=86, optimize=True, progressive=True)
    print(OUT, full.size, os.path.getsize(OUT) // 1024, 'KB')


if __name__ == '__main__':
    main()
