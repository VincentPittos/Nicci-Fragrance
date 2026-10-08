"""
Zapis grafik strony w dwóch formatach: AVIF dla przeglądarek, które go znają (Chrome 85+, Firefox 93+, Safari 16.4+),
i WebP jako zapas dla starszych (np. iPhone z iOS 15). Strona podaje oba przez <picture> i <source type="image/avif">.

AVIF przy tej samej jakości (SSIM do bezstratnego wzorca nie niższy niż w WebP q82) waży mniej więcej połowę WebP.
Jakość dobrana pomiarem na zdjęciach produktów, kadrach rodzin i hero: dev/grafiki/kalibracja_avif.py.
Wymaga Pillow 11.2 lub nowszego (wbudowana obsługa AVIF).
"""
from PIL import features

WEBP = dict(quality=82, method=6)
AVIF = dict(quality=60, speed=4)


def zapisz(im, base, webp=None, avif=None):
    """Zapisuje obraz jako base.webp i base.avif. webp i avif nadpisują domyślne ustawienia (np. jakość kadrów rodzin)."""
    if not features.check('avif'):
        raise SystemExit('Pillow bez obsługi AVIF: zaktualizuj Pillow do 11.2 lub nowszego')
    im = im.convert('RGB')
    im.save(base + '.webp', 'WEBP', **dict(WEBP, **(webp or {})))
    im.save(base + '.avif', 'AVIF', **dict(AVIF, **(avif or {})))
