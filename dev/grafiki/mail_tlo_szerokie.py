#!/usr/bin/env python3
"""
Szerokie tło pasa nagłówka w mailu z kodem −99% (decyzja 107): ta sama scena co grafika nagłówka, przedłużona w bok
w Nano Banana Pro (skały i ciemne tło do bocznych krawędzi, to samo światło z góry). W mailu leży jako tło komórki
pod grafiką 600 px (background-size 1800px auto), więc na szerokim ekranie grafika łączy się z bocznymi krawędziami.
Środek to dokładnie grafika nagłówka, więc styk jest ciągły także wtedy, gdy obraz grafiki się nie wczyta.

    python3 dev/grafiki/mail_tlo_szerokie.py WYNIK_MUAPI_21x9.jpg NAGLOWEK_1200.jpg [SKALA DX DY]

Wejście Muapi: tło bez napisu i logo (mail_naglowek.py z NICCI_TLO_BEZ_NAPISU, 1200 × 1794) na środku płótna
4186 × 1794 (21:9). SKALA DX DY: dopasowanie wyniku do wejścia (domyślnie 0.7564 1 -7, korelacja 0,94 na flakonach).
Wynik: site/img/email/essentials-naglowek-tlo-3600.jpg, 2700 × 1346 px (1,5× na 1800 px szerokości w mailu:
tyle szczegółu ma wynik Muapi; środek i tak zakrywa grafika nagłówka).
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'site', 'img', 'email', 'essentials-naglowek-tlo-3600.jpg')
PLOTNO_W, H, W_NAGL = 4186, 1794, 1200
SZER = 3600                      # 1800 px w mailu przy 2×
ZAPIS_W = 2700                   # zapis w 1,5×


def main():
    wyn_p, nagl_p = sys.argv[1], sys.argv[2]
    s = float(sys.argv[3]) if len(sys.argv) > 3 else 0.7564
    dx = int(sys.argv[4]) if len(sys.argv) > 4 else 1
    dy = int(sys.argv[5]) if len(sys.argv) > 5 else -7
    b = Image.open(wyn_p).convert('RGB')
    b = np.asarray(b.resize((round(b.width / s), round(b.height / s)), Image.LANCZOS))
    # płótno[y, x] = b[y + dy, x + dx]; brakujące wiersze i kolumny na brzegach powielamy
    ys = np.clip(np.arange(H) + dy, 0, b.shape[0] - 1)
    xs = np.clip(np.arange(PLOTNO_W) + dx, 0, b.shape[1] - 1)
    p = b[ys][:, xs]
    x0 = (PLOTNO_W - SZER) // 2
    t = p[:, x0:x0 + SZER].astype(np.float32)
    nagl = Image.open(nagl_p).convert('RGB')
    assert nagl.size == (W_NAGL, H), nagl.size
    n = np.asarray(nagl).astype(np.float32)
    # styk bez uskoku jasności: w każdym wierszu różnica koloru między brzegiem grafiki a bokiem tuż za nim,
    # wygładzona w pionie i wygaszana w głąb boku (ok. 400 px przy 2×), bez winiety i bez cieni
    xl, xr = (SZER - W_NAGL) // 2, (SZER + W_NAGL) // 2
    k = np.exp(-0.5 * (np.arange(-45, 46) / 15.0) ** 2); k /= k.sum()

    def gladz(v):
        return np.stack([np.convolve(np.pad(v[:, c], 45, mode='edge'), k, mode='valid') for c in range(3)], -1)

    d_l = gladz(n[:, :8].mean(1) - t[:, xl - 8:xl].mean(1))
    d_r = gladz(n[:, -8:].mean(1) - t[:, xr:xr + 8].mean(1))
    odl = np.arange(SZER, dtype=np.float32)
    w_l = np.clip(1 - (xl - odl) / 400.0, 0, 1) * (odl < xl)
    w_r = np.clip(1 - (odl - xr + 1) / 400.0, 0, 1) * (odl >= xr)
    w_l, w_r = w_l * w_l * (3 - 2 * w_l), w_r * w_r * (3 - 2 * w_r)
    t += d_l[:, None, :] * w_l[None, :, None] + d_r[:, None, :] * w_r[None, :, None]
    tlo = Image.fromarray(np.clip(t, 0, 255).astype(np.uint8))
    tlo.paste(nagl, (xl, 0))
    tlo = tlo.resize((ZAPIS_W, round(H * ZAPIS_W / SZER)), Image.LANCZOS)
    tlo.save(OUT, quality=78, optimize=True, progressive=True)
    print(OUT, tlo.size, os.path.getsize(OUT) // 1024, 'KB')


if __name__ == '__main__':
    main()
