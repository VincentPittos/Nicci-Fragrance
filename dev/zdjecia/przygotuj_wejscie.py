#!/usr/bin/env python3
"""
Wybór wariantów zdjęć i poprawki przed ujednoliceniem.

WYBOR: który wariant z zrodla.csv idzie do katalogu (przejrzany na arkuszach kontaktowych: jasne tło albo
przezroczystość, sam flakon, bez pudełka i scen z ludźmi). ODZNAKI: plakietki nagród w rogu zdjęcia
(Fragrance Foundation Awards) usuwamy, bo nie są częścią flakonu i psułyby wykrywanie obiektu.
Wynik: dev/zdjecia/zrodla/wybrane/{id}.{ext}, wejście dla ujednolic_zdjecia.py, oraz dev/zdjecia/zrodla-wybrane.csv:
źródło każdego zdjęcia użytego na stronie (do raportu końcowego).
"""
import csv
import json
import os
import shutil

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'zrodla')
OUT = os.path.join(RAW, 'wybrane')

WYBOR = {pid: '0' for pid in (
    'p06 p07 p08 p09 p10 p11 p12 p14 p15 p16 p17 p19 p20 p21 p22 p23 p24 p25 p27 p28 p29 p30 p31 '
    'p32 p33 p34 p35 p36 p37 p38 p39 p40 p44 p45 p59 p61 p62 p66 p67 p68').split()}
WYBOR.update({'p41': '1', 'p46': '2', 'p47': '2', 'p48': '2', 'p49': '2', 'p50': '2', 'p69': '1', 'p70': '1', 'p71': '2'})

# id: (x0, y0, x1, y1) jako części szerokości i wysokości zdjęcia
ODZNAKI = {
    'p36': (0.74, 0.0, 1.0, 0.20),   # Bois Pacifique: przezroczyste tło, plakietkę czyścimy do przezroczystości
    'p68': (0.70, 0.14, 1.0, 0.36),  # 1 Million: jasne tło, plakietkę zamalowujemy kolorem tła obok
}


# ustawienia dla ujednolic_zdjecia.py: miękki cień obok flakonu (Amouage na papierze, Rabanne, Sospiro, Crivelli)
USTAWIENIA = {pid: {'cien': True} for pid in 'p15 p16 p17 p19 p20 p41 p45 p66 p67'.split()}


def main():
    rows = {(r['id'], r['wariant']): r for r in csv.DictReader(open(os.path.join(HERE, 'zrodla.csv'), encoding='utf-8'))}
    names = {}
    mock = os.path.join(os.path.dirname(HERE), 'dane', 'produkty.csv')
    if os.path.exists(mock):
        names = {r['id']: (r['marka'], r['nazwa']) for r in csv.DictReader(open(mock, encoding='utf-8'))}
    with open(os.path.join(HERE, 'zrodla-wybrane.csv'), 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['id', 'marka', 'nazwa', 'strona_producenta', 'plik_zrodlowy', 'poprawki'])
        for pid, v in sorted(WYBOR.items()):
            r = rows[(pid, v)]
            marka, nazwa = names.get(pid, ('', ''))
            w.writerow([pid, marka, nazwa, r['strona'], r['obraz'], 'usunięta plakietka nagrody' if pid in ODZNAKI else ''])
    shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(OUT)
    for pid, v in sorted(WYBOR.items()):
        r = rows[(pid, v)]
        src = os.path.join(RAW, r['plik'])
        ext = os.path.splitext(src)[1]
        dst = os.path.join(OUT, pid + ext)
        if pid not in ODZNAKI:
            shutil.copy(src, dst)
            continue
        im = Image.open(src)
        im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
        a = np.array(im)
        h, w = a.shape[:2]
        x0, y0, x1, y1 = ODZNAKI[pid]
        box = (slice(int(y0 * h), int(y1 * h)), slice(int(x0 * w), int(x1 * w)))
        if a.shape[2] == 4:
            a[box] = 0
        else:
            ref = a[int(y1 * h):int(y1 * h) + 20, int(x0 * w):int(x1 * w)].reshape(-1, 3)
            a[box] = np.median(ref, axis=0).astype(np.uint8)
        Image.fromarray(a).save(os.path.splitext(dst)[0] + '.png')
    json.dump(USTAWIENIA, open(os.path.join(OUT, 'ustawienia.json'), 'w', encoding='utf-8'), indent=1)
    print(len(os.listdir(OUT)), 'plików w', OUT)


if __name__ == '__main__':
    main()
