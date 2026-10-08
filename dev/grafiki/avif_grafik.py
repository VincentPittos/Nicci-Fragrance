#!/usr/bin/env python3
"""
AVIF dla grafik, które nie mają własnego skryptu z zapisem w dwóch formatach (dev/grafiki/zapis.py):

  hero na komputer   site/img/hero/hero-{800,1200,1600,2000}  ze źródła refs/hero-czysty.webp (zmniejszenie LANCZOS;
                     WebP q80 wychodzi taki sam jak dotychczasowe pliki, więc zapisujemy oba formaty)
  sekcja 2           site/img/sekcja2/odlewanie-{300,600,1200}.avif  z obecnych plików WebP
  miniatury nut      site/img/nuty/{slug}.avif  z obecnych plików WebP

Przy odlewaniu i nutach nie mamy zapisanej dokładnej obróbki ze źródeł (kadr, korekta, kolejność slugów w arkuszach
tnij_nuty.py), więc AVIF powstaje z WebP. Różnica do WebP jest poniżej progu widoczności (SSIM ok. 0,996).
Kadry rodzin: dev/grafiki/przetworz_kadr.py, hero na telefon: dev/grafiki/hero_telefon.py, zdjęcia produktów:
dev/zdjecia/ujednolic_zdjecia.py.

    python3 dev/grafiki/avif_grafik.py
"""
import glob
import os

from PIL import Image

from zapis import AVIF, zapisz

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IMG = os.path.join(ROOT, 'site', 'img')


def main():
    hero = Image.open(os.path.join(ROOT, 'refs', 'hero-czysty.webp')).convert('RGB')
    w0, h0 = hero.size
    for w in (800, 1200, 1600, 2000):
        im = hero if w == w0 else hero.resize((w, round(w * h0 / w0)), Image.LANCZOS)
        zapisz(im, os.path.join(IMG, 'hero', f'hero-{w}'), webp=dict(quality=80))
    for f in sorted(glob.glob(os.path.join(IMG, 'sekcja2', '*.webp')) + glob.glob(os.path.join(IMG, 'nuty', '*.webp'))):
        Image.open(f).convert('RGB').save(f[:-5] + '.avif', 'AVIF', **AVIF)
    for d in ('hero', 'sekcja2', 'nuty'):
        pliki = glob.glob(os.path.join(IMG, d, '*'))
        kb = lambda ext: sum(os.path.getsize(p) for p in pliki if p.endswith(ext)) // 1024
        print(d, 'WebP', kb('.webp'), 'KB, AVIF', kb('.avif'), 'KB')


if __name__ == '__main__':
    main()
