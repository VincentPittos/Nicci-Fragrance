#!/usr/bin/env python3
"""
Zdjęcia flakonów przysłane przez właściciela (Dysk, folder „Nicci Fragrance”), dla produktów, których strony
producentów blokują pobieranie.

  python3 dev/zdjecia/zdjecia_wlasciciela.py <katalog_z_plikami_z_dysku>
  python3 dev/zdjecia/ujednolic_zdjecia.py dev/zdjecia/zrodla/wlasciciel

Pierwszy krok kopiuje pliki pod nazwą id produktu do dev/zdjecia/zrodla/wlasciciel/ (poza gitem). Zdjęcie, którego
krótszy bok ma mniej niż 1000 px, najpierw powiększa EDSR (x2, w razie potrzeby dwa razy), bo na karcie flakon
ma ok. 740 px wysokości. Potem czyści tło (czyste_tlo) i zapisuje bezstratnie jako PNG. Wymaga
opencv-contrib-python-headless w venv, jak dev/grafiki/hero_telefon.py.
Źródła trafiają do dev/zdjecia/zrodla-wlasciciel.csv (raport końcowy).
"""
import csv
import os
import sys

import cv2
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(HERE, 'zrodla', 'wlasciciel')
MODEL = os.path.join(ROOT, 'dev', 'grafiki', 'zrodla', 'EDSR_x2.pb')
MIN_SIDE = 1000
JASNE = 250          # tło JPG: piksele jaśniejsze od tego progu, połączone z krawędzią, stają się czystą bielą
# PNG, w których wokół flakonu zostały nieprzezroczyste białe resztki tła (p64: pola obok nakrętki)
RESZTKI_BIELI = {'p64': 245}

# id: plik z Dysku. p52 (Sauvage Parfum) celowo pominięty: przysłany plik to Sauvage Eau de Parfum
# (inne stężenie, etykieta „EAU DE PARFUM”), czekamy na właściwe zdjęcie.
PLIKI = {
    'p01': 'louis-vuitton-imagination--LP0476_PM2_Front view.webp',
    'p02': 'louis-vuitton-pacific-chill---LP0460_PM2_Front view.webp',
    'p03': 'louis-vuitton-afternoon-swim--LP0487_PM2_Front view.webp',
    'p04': 'Louis Vuitton Nouveau Monde.jpg',
    'p05': 'louis-vuitton-ombre-nomade--LP0096_PM2_Front view.webp',
    'p42': 'grandsoirpack.png',
    'p43': 'Maison_Francis_Kurdjian_-_Baccarat_Rouge_540_disponible_en_abanuc.webp',
    'p51': 'Dior Homme Cologne.jpg',
    'p53': 'sauvage elixir.png',
    'p54': 'dior-sauvage-extrait-parfum.png',
    'p55': 'versace-eros-parfum-perfume-cologne-238192.webp',
    'p63': 'ysl y parfum.webp',
    'p64': 'yves-saint-laurent-myslf-le-parfum-tester-100ml.png',
    'p65': "Hermès Terre d'Hermès Eau Intense Vétiver.webp",
}


def edsr_x2(rgba):
    """Powiększenie x2: kolor przez EDSR, kanał alfa (jeśli jest) zwykłą interpolacją."""
    sr = cv2.dnn_superres.DnnSuperResImpl_create()
    sr.readModel(MODEL)
    sr.setModel('edsr', 2)
    rgb = np.array(rgba.convert('RGB'))
    up = sr.upsample(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
    out = Image.fromarray(cv2.cvtColor(up, cv2.COLOR_BGR2RGB))
    if rgba.mode == 'RGBA':
        alpha = rgba.getchannel('A').resize(out.size, Image.LANCZOS)
        out.putalpha(alpha)
    return out


def czyste_tlo(im, pid):
    """Szum tła źródła (254 zamiast 255 po kompresji i powiększeniu) przeszedłby w ujednolic_zdjecia.py do mapy
    cieniowania i zostawił na karcie jaśniejszy prostokąt wokół flakonu. JPG: jasne tło połączone z krawędzią
    zdjęcia staje się czystą bielą. PNG z listy RESZTKI_BIELI: białe pola połączone z przezroczystością stają się
    przezroczyste. Białe napisy na flakonie nie łączą się z tłem, więc zostają."""
    a = np.array(im)
    if im.mode == 'RGBA':
        if pid not in RESZTKI_BIELI:
            return im
        seed = a[..., 3] == 0
        region = seed | (a[..., :3].min(axis=2) >= RESZTKI_BIELI[pid])
    else:
        seed = None
        region = a.min(axis=2) >= JASNE
    _, labels = cv2.connectedComponents(region.astype(np.uint8), connectivity=4)
    start = labels[seed] if seed is not None else np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]])
    keep = np.unique(start)
    tlo = np.isin(labels, keep[keep != 0])
    if im.mode == 'RGBA':
        a[tlo, 3] = 0
    else:
        a[tlo] = 255
    return Image.fromarray(a, im.mode)


def main():
    src_dir = sys.argv[1]
    os.makedirs(OUT, exist_ok=True)
    rows = []
    for pid, name in PLIKI.items():
        im = Image.open(os.path.join(src_dir, name))
        im = im.convert('RGBA') if im.mode in ('RGBA', 'LA', 'P') else im.convert('RGB')
        if im.mode == 'RGBA' and im.getchannel('A').getextrema()[0] == 255:
            # kanał alfa bez przezroczystości: tło modeluje ujednolic_zdjecia.py, jak przy JPG (inaczej zostaje ramka)
            im = im.convert('RGB')
        size0 = im.size
        steps = 0
        while min(im.size) < MIN_SIDE and steps < 2:
            im = edsr_x2(im)
            steps += 1
        im = czyste_tlo(im, pid)
        for old in ('.jpg', '.png'):  # wcześniejsze przebiegi mogły zapisać JPG
            if os.path.exists(os.path.join(OUT, pid + old)):
                os.remove(os.path.join(OUT, pid + old))
        im.save(os.path.join(OUT, pid + '.png'))
        rows.append({'id': pid, 'plik_od_wlasciciela': name, 'rozmiar_zrodla': '%dx%d' % size0,
                     'powiekszenie': 'EDSR x%d' % (2 ** steps) if steps else ''})
        print(pid, name, size0, '->', im.size, ('EDSR x%d' % (2 ** steps)) if steps else '')
    with open(os.path.join(HERE, 'zrodla-wlasciciel.csv'), 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['id', 'plik_od_wlasciciela', 'rozmiar_zrodla', 'powiekszenie'])
        w.writeheader()
        w.writerows(rows)


if __name__ == '__main__':
    main()
