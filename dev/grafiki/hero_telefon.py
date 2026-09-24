#!/usr/bin/env python3
"""
Kadr hero na telefon: prawe 70% zdjęcia (atomizery Nicci), wyostrzony, w trzech szerokościach.

  python3 dev/grafiki/hero_telefon.py [źródło=refs/hero-czysty.webp]

Wynik: site/img/hero/hero-m-1000.webp, hero-m-1400.webp (piksele źródła) i hero-m-2100.webp (EDSR x2,
potem zmniejszenie do 2100 px) dla ekranów 3x. Na telefonie kadr ma ok. 720 px szerokości CSS, więc ekran 3x
potrzebuje ok. 2150 px, a źródło ma w tym miejscu tylko 1400.

Wymaga opencv-contrib-python-headless (moduł dnn_superres), pillow i numpy, najlepiej w osobnym venv:
  python3 -m venv /tmp/sr && /tmp/sr/bin/pip install opencv-contrib-python-headless pillow numpy
  /tmp/sr/bin/python dev/grafiki/hero_telefon.py
Model EDSR_x2.pb (38 MB, github.com/Saafke/EDSR_Tensorflow) pobiera się sam do dev/grafiki/zrodla/ (poza gitem).
EDSR na procesorze trwa ok. 9 minut.

Proporcje kadru są wpisane w site/css/strona.css (blok telefonu w sekcji hero): górne 31,7% to ściana, dolne 23,8%
kamień i piasek, środek atomizerów na 59% szerokości, stosunek boków 1400:1116. Przy zmianie X0 popraw też CSS.
"""
import os
import sys
import urllib.request

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'refs', 'hero-czysty.webp')
OUT = os.path.join(ROOT, 'site', 'img', 'hero')
MODEL = os.path.join(ROOT, 'dev', 'grafiki', 'zrodla', 'EDSR_x2.pb')
MODEL_URL = 'https://raw.githubusercontent.com/Saafke/EDSR_Tensorflow/master/models/EDSR_x2.pb'
X0 = 0.30          # kadr od 30% szerokości do prawej krawędzi: wystarcza na każdy telefon do 767 px
TILE, OVERLAP = 400, 16
QUALITY = 82


def edsr_x2(bgr):
    if not os.path.exists(MODEL):
        os.makedirs(os.path.dirname(MODEL), exist_ok=True)
        print('pobieram model EDSR x2')
        urllib.request.urlretrieve(MODEL_URL, MODEL)
    sr = cv2.dnn_superres.DnnSuperResImpl_create()
    sr.readModel(MODEL)
    sr.setModel('edsr', 2)
    h, w = bgr.shape[:2]
    out = np.zeros((h * 2, w * 2, 3), np.uint8)
    # kafelki z zakładką: mniej pamięci, bez szwów na łączeniach
    for y in range(0, h, TILE):
        for x in range(0, w, TILE):
            ya, xa = max(0, y - OVERLAP), max(0, x - OVERLAP)
            yb, xb = min(h, y + TILE + OVERLAP), min(w, x + TILE + OVERLAP)
            up = sr.upsample(bgr[ya:yb, xa:xb])
            oy, ox = (y - ya) * 2, (x - xa) * 2
            th, tw = min(TILE, h - y) * 2, min(TILE, w - x) * 2
            out[y * 2:y * 2 + th, x * 2:x * 2 + tw] = up[oy:oy + th, ox:ox + tw]
    return out


def save(im, name):
    path = os.path.join(OUT, name)
    im.save(path, 'WEBP', quality=QUALITY, method=6)
    print(name, im.size, os.path.getsize(path) // 1024, 'KB')


def main():
    src = Image.open(SRC).convert('RGB')
    w, h = src.size
    crop = src.crop((round(w * X0), 0, w, h))
    cw, ch = crop.size

    save(crop.filter(ImageFilter.UnsharpMask(radius=1.0, percent=55, threshold=2)), 'hero-m-1400.webp')
    small = crop.resize((1000, round(1000 * ch / cw)), Image.LANCZOS)
    save(small.filter(ImageFilter.UnsharpMask(radius=0.7, percent=45, threshold=2)), 'hero-m-1000.webp')

    up = edsr_x2(cv2.cvtColor(np.array(crop), cv2.COLOR_RGB2BGR))
    big = Image.fromarray(cv2.cvtColor(up, cv2.COLOR_BGR2RGB)).resize((2100, round(2100 * ch / cw)), Image.LANCZOS)
    save(big.filter(ImageFilter.UnsharpMask(radius=0.8, percent=35, threshold=2)), 'hero-m-2100.webp')


if __name__ == '__main__':
    main()
