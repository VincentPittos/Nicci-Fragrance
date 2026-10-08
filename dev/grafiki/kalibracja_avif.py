#!/usr/bin/env python3
"""
Dobór jakości AVIF w dev/grafiki/zapis.py: dla próbki zdjęć produktów, kadrów rodzin i hero porównuje WebP q82
(dotychczasowy zapis strony) z AVIF w kilku jakościach. Miarą jest SSIM do bezstratnego wzorca w tym samym rozmiarze.
Wybieramy najniższą jakość AVIF, przy której średni i najgorszy SSIM nie są niższe niż w WebP q82.

    python3 dev/grafiki/kalibracja_avif.py [liczba_zdjęć_produktów=24]
"""
import glob
import importlib.util
import io
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
JAKOSCI = (45, 50, 55, 60, 65, 70)


def ssim(a, b):
    a = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY).astype(np.float64)
    b = cv2.cvtColor(b, cv2.COLOR_RGB2GRAY).astype(np.float64)
    c1, c2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    g = lambda x: cv2.GaussianBlur(x, (11, 11), 1.5)
    m1, m2 = g(a), g(b)
    s1, s2, s12 = g(a * a) - m1 ** 2, g(b * b) - m2 ** 2, g(a * b) - m1 * m2
    return float((((2 * m1 * m2 + c1) * (2 * s12 + c2)) / ((m1 ** 2 + m2 ** 2 + c1) * (s1 + s2 + c2))).mean())


def koduj(im, fmt, **kw):
    buf = io.BytesIO()
    im.save(buf, fmt, **kw)
    n = buf.tell()
    buf.seek(0)
    return n, np.array(Image.open(buf).convert('RGB'))


def wzorce(n_prod):
    """(nazwa grupy, obraz bezstratny w docelowym rozmiarze)"""
    spec = importlib.util.spec_from_file_location('ujednolic', os.path.join(ROOT, 'dev', 'zdjecia', 'ujednolic_zdjecia.py'))
    uj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(uj)
    zrodla = []
    for d in ('wybrane', 'wlasciciel'):
        katalog = os.path.join(ROOT, 'dev', 'zdjecia', 'zrodla', d)
        cfg_p = os.path.join(katalog, 'ustawienia.json')
        cfg = json.load(open(cfg_p, encoding='utf-8')) if os.path.exists(cfg_p) else {}
        for f in sorted(glob.glob(os.path.join(katalog, 'p*.*'))):
            zrodla.append((f, cfg.get(os.path.splitext(os.path.basename(f))[0], {})))
    krok = max(1, len(zrodla) // n_prod)
    for f, opt in zrodla[::krok][:n_prod]:
        _, _, canvas = uj.process(f, (0xF1, 0xEF, 0xEC), 0.74, opt.get('tol', 18), opt.get('cien', False))
        if canvas is not None:
            for w in (600, 800):
                yield 'produkty', canvas.resize((w, int(w * 1.25)), Image.LANCZOS)
    for f in sorted(glob.glob(os.path.join(ROOT, 'dev', 'grafiki', 'zrodla', '*.png'))):
        if os.path.basename(f).startswith(('nuty-', 'test-', 'slodka-v1', 'orientalna.')):
            continue
        im = Image.open(f).convert('RGB')
        w, h = im.size
        yield 'rodziny', im.crop((0, int((h - w * 3 / 4) * 0.7), w, int((h - w * 3 / 4) * 0.7 + w * 3 / 4))).resize((1200, 900), Image.LANCZOS)
    hero = os.path.join(ROOT, 'refs', 'hero-czysty.webp')
    if os.path.exists(hero):
        yield 'hero', Image.open(hero).convert('RGB')


def main():
    n_prod = int(sys.argv[1]) if len(sys.argv) > 1 else 24
    wyniki = {}
    for grupa, im in wzorce(n_prod):
        ref = np.array(im)
        r = wyniki.setdefault(grupa, {})
        for nazwa, fmt, kw in [('webp q82', 'WEBP', dict(quality=82, method=6))] + [('avif q%d' % q, 'AVIF', dict(quality=q, speed=4)) for q in JAKOSCI]:
            n, dec = koduj(im, fmt, **kw)
            x = r.setdefault(nazwa, [0, []])
            x[0] += n
            x[1].append(ssim(ref, dec))
    for grupa, r in wyniki.items():
        base = r['webp q82'][0]
        print(grupa, len(r['webp q82'][1]), 'obrazów')
        for nazwa, (n, ss) in r.items():
            print('  %-9s %6d KB  %4.0f%%  SSIM śr %.4f  min %.4f' % (nazwa, n // 1024, 100 * n / base, np.mean(ss), np.min(ss)))


if __name__ == '__main__':
    main()
