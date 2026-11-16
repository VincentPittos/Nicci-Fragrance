#!/usr/bin/env python3
"""
Rolki z Instagrama na stronie głównej (sekcja 4, decyzja 93). Źródło: 7 plików mp4 z folderu „Rolki na Stronę Nicci”
na Dysku (720 x 1280, 25 kl./s, AAC), zapisane lokalnie jako r1.mp4 do r7.mp4 w kolejności z tabeli ROLKI.

    python3 dev/grafiki/rolki.py KATALOG_Z_PLIKAMI_MP4 [--okladki]   (--okladki: tylko obrazy, bez ponownego kodowania filmów)

Dla każdej rolki K (kolejność na stronie) powstaje:
  site/media/rolki/rolka-K.mp4          pełny film z dźwiękiem, 540 x 960, H.264 CRF 28, AAC 96 kb/s (odtwarzacz po kliknięciu)
  site/media/rolki/rolka-K-zajawka.mp4  6 s bez dźwięku, 360 x 640, CRF 30 (zapętlony podgląd w boxie)
  site/img/rolki/rolka-K-{320,640}.{webp,avif}  pierwsza klatka zajawki: widać ją tylko do startu zajawki, więc
                                                 przejście w film jest niewidoczne (i jako obraz w oknie z filmem)
Wszystkie mp4 z +faststart, żeby przeglądarka zaczęła odtwarzać przed pobraniem całego pliku.
Wymaga ffmpeg w PATH i Pillow 11.2+ (AVIF).
"""
import os
import subprocess
import sys
import tempfile

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zapis import zapisz  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_MEDIA = os.path.join(ROOT, 'site', 'media', 'rolki')
OUT_IMG = os.path.join(ROOT, 'site', 'img', 'rolki')

# (plik źródłowy, początek 6-sekundowej zajawki); tytuł z Dysku w komentarzu
ROLKI = [
    ('r1.mp4', 2.5),   # Kobiety oceniają zapachy dla mężczyzn
    ('r4.mp4', 0.0),   # Zapachy idealne na randkę
    ('r7.mp4', 2.0),  # 🎁🎁🎁 (zamówienie z wiadomości: odlewanie i pakowanie)
    ('r6.mp4', 0.0),   # Narzekasz na trwałość w perfumach? 5 propozycji na chłodne dni
    ('r5.mp4', 0.0),   # Masz już swój zestaw perfum? Nicci skomponuje go za Ciebie
    ('r3.mp4', 4.0),   # Masz już swój zapach sukcesu
    ('r2.mp4', 0.0),   # Dzisiaj razem. A Ty z jakim zapachem dzisiaj się wybierasz
]
X264 = ['-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']


def ff(*args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)


def main():
    src = sys.argv[1]
    tylko_okladki = '--okladki' in sys.argv[2:]
    os.makedirs(OUT_MEDIA, exist_ok=True)
    os.makedirs(OUT_IMG, exist_ok=True)
    for k, (plik, start) in enumerate(ROLKI, 1):
        wej = os.path.join(src, plik)
        pelny = os.path.join(OUT_MEDIA, 'rolka-%d.mp4' % k)
        zajawka = os.path.join(OUT_MEDIA, 'rolka-%d-zajawka.mp4' % k)
        if not tylko_okladki:
            ff('-i', wej, '-vf', 'scale=540:960:flags=lanczos', *X264, '-crf', '28', '-c:a', 'aac', '-b:a', '96k', '-ac', '2', pelny)
            ff('-ss', str(start), '-t', '6', '-i', wej, '-vf', 'scale=360:640:flags=lanczos', *X264, '-crf', '30', '-an', zajawka)
        with tempfile.TemporaryDirectory() as tmp:
            png = os.path.join(tmp, 'k.png')
            ff('-ss', str(start), '-i', wej, '-frames:v', '1', png)
            kadr = Image.open(png).convert('RGB')
            for szer in (320, 640):
                zapisz(kadr.resize((szer, round(szer * 16 / 9)), Image.LANCZOS), os.path.join(OUT_IMG, 'rolka-%d-%d' % (k, szer)))
        print('rolka-%d: %s, film %d KB, zajawka %d KB' % (k, plik, os.path.getsize(pelny) // 1024, os.path.getsize(zajawka) // 1024))


if __name__ == '__main__':
    main()
