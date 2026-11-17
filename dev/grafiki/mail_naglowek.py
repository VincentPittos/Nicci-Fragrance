#!/usr/bin/env python3
"""
Nagłówek maila z kodem −99% (dev/maile/kod-essentials.html, decyzja 101): grafika „−99% na Siedem Legend” wydłużona
w górę o pas na logo. Pas to dobudowane ciemne tło z poświatą, która wychodzi zza logo i płynnie przechodzi
w poświatę nad „−99%”. Logo stoi tam, gdzie wcześniej stało w osobnym czarnym pasku (66 × 72 px przy szerokości
maila 600 px, 36 px od góry). Boki i dół grafiki wtapiają się w kolor tła maila (TLO), więc marginesy obok grafiki
mają ten sam kolor co sekcje.

    python3 dev/grafiki/mail_naglowek.py LOGO_PNG

LOGO_PNG: site/img/marka/logo-pelne-zloto.svg wyrenderowane do PNG z przezroczystością (264 × 288 px, 2× na 1200).
Wynik: site/img/email/essentials-naglowek-1200.jpg (1200 × 1772).
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'dev', 'grafiki', 'zrodla', 'kampanie', 'essentials-legend-v3-4x5.png')
OUT = os.path.join(ROOT, 'site', 'img', 'email', 'essentials-naglowek-1200.jpg')
W = 1200
PAS = 272                      # 136 px w mailu: 36 nad logo, 72 logo, 28 pod logo
LOGO_W, LOGO_H, LOGO_Y = 132, 144, 72
TLO = np.array([9, 8, 7], np.float32)   # #090807, tło maila i ciemnych sekcji


def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def main():
    logo = Image.open(sys.argv[1]).convert('RGBA').resize((LOGO_W, LOGO_H), Image.LANCZOS)
    img = Image.open(SRC).convert('RGB').resize((W, round(W * 2320 / 1856)), Image.LANCZOS)
    a = np.asarray(img).astype(np.float32)
    H = a.shape[0]

    # pas nad grafiką: tło + poświata (gaussowska elipsa) ze środkiem za logo
    yy, xx = np.mgrid[0:PAS, 0:W].astype(np.float32)
    cx, cy = W / 2, LOGO_Y + LOGO_H / 2
    glow = np.exp(-(((xx - cx) / (W * 0.20)) ** 2 + ((yy - cy) / (PAS * 0.95)) ** 2))[..., None]
    szczyt = np.array([112, 80, 40], np.float32)       # ciepłe złoto, jak poświata nad „−99%”
    pas = TLO + (szczyt - TLO) * glow
    # dół pasa przechodzi dokładnie w pierwszy wiersz grafiki (średnia z 6 wierszy, wygładzona w poziomie)
    gora = a[:6].mean(0)
    k = 31
    gora = np.stack([np.convolve(np.pad(gora[:, c], k // 2, mode='edge'), np.ones(k) / k, mode='valid') for c in range(3)], -1)
    w = smooth((yy - PAS * 0.35) / (PAS * 0.65))[..., None]
    pas = pas * (1 - w) + (pas + (gora[None, :, :] - pas[-1:, :, :])) * w

    full = np.concatenate([pas, a], 0)
    FH = full.shape[0]
    # boki i dół wtopione w tło maila
    yy, xx = np.mgrid[0:FH, 0:W].astype(np.float32)
    bok = smooth(np.minimum(xx, W - 1 - xx) / 56.0)
    dol = smooth((FH - 1 - yy) / 70.0)
    m = (bok * dol)[..., None]
    full = full * m + TLO * (1 - m)
    # drobne ziarno, żeby poświata nie robiła pasów w JPG
    rng = np.random.default_rng(3)
    full = full + rng.normal(0, 1.1, full.shape[:2])[..., None]
    out = Image.fromarray(np.clip(full, 0, 255).astype(np.uint8))
    out.paste(logo, ((W - LOGO_W) // 2, LOGO_Y), logo)
    out.save(OUT, quality=84, optimize=True, progressive=True)
    print(OUT, out.size, os.path.getsize(OUT) // 1024, 'KB')


if __name__ == '__main__':
    main()
