#!/usr/bin/env python3
"""
Ujednolicenie zdjęć flakonów do siatki katalogu.

Wejście: katalog z plikami nazwanymi id produktu (p01.jpg, p07.png, p12.webp...), zdjęcia na jednolitym tle
(jasnym albo ciemnym) lub PNG z przezroczystością. Wyjście: site/img/produkty/{id}-400.webp i {id}-800.webp
w proporcji 4:5, z tym samym tłem, flakonem tej samej wysokości i tak samo posadzonym w kadrze. Bez tego
siatka rozjeżdża się wizualnie.

Tło źródła modelujemy gładką powierzchnią dopasowaną do pasków brzegowych (łapie gradient i winietę),
a za tło uznajemy obszar podobny do tego modelu i połączony z krawędzią zdjęcia (wypełnienie od brzegu).
Jasna etykieta albo czarna nakrętka wewnątrz flakonu nie łączy się z brzegiem, więc zostaje. Przy ciemnym
tle maska jest zwężana o 2 px, żeby na jasnym tle nie było ciemnej obwódki.

Flakon kopiujemy bez zmian. Tło wokół niego (z cieniem) przenosimy jako mapę cieniowania: piksel źródła
podzielony przez model tła, pomnożony przez nowy kolor tła. Cień zostaje miękki i naturalny, a tło wychodzi
równo w nowym kolorze, bez szwu na brzegu wycinka. PNG z przezroczystością wklejamy po kanale alfa.

Opcjonalny plik ustawienia.json w katalogu wejściowym: {"p15": {"cien": true, "tol": 24}}. "cien" liczy
neutralne przyciemnienie tła (cień obok flakonu) do tła przy wyznaczaniu rozmiaru i położenia flakonu, żeby
cień go nie zmniejszał ani nie przesuwał. Tylko tam, gdzie trzeba: przy białym flakonie na białym tle mógłby
zjeść jego cieniowanie.

Użycie:
    python3 dev/zdjecia/ujednolic_zdjecia.py <katalog_wejściowy> [--tlo F1EFEC] [--wysokosc 0.74]
Wynik obok: dev/zdjecia/raport.csv z wymiarami, tłem źródła i ostrzeżeniami (np. ciemne tło, flakon ucięty);
wiersze z kolejnych przebiegów się łączą.
"""
import argparse
import csv
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'site', 'img', 'produkty')
SIZES = (400, 800)  # szerokość; wysokość = 1,25 × szerokość (4:5)


def background_model(a):
    """Tło jako gładka powierzchnia drugiego stopnia dopasowana do pasków brzegowych, osobno dla kanałów."""
    h, w, _ = a.shape
    b = max(4, min(h, w) // 40)
    m = np.zeros((h, w), bool)
    m[:b] = m[-b:] = True
    m[:, :b] = m[:, -b:] = True
    ys, xs = np.nonzero(m)
    step = max(1, len(xs) // 20000)
    ys, xs = ys[::step], xs[::step]
    X = lambda x, y: np.stack([np.ones_like(x), x, y, x * y, x * x, y * y], axis=-1)
    xn, yn = xs / w, ys / h
    coef = np.linalg.lstsq(X(xn, yn), a[ys, xs].astype(np.float64), rcond=None)[0]
    gy, gx = np.mgrid[0:h, 0:w]
    model = X(gx / w, gy / h) @ coef
    return np.clip(model, 0, 255).astype(np.float32), np.median(a[ys, xs], axis=0)


def subject_mask(a, tol, shadow=False):
    """Maska obiektu 0..1: wszystko, co nie jest tłem połączonym z krawędzią zdjęcia."""
    model, bg = background_model(a)
    smooth = cv2.medianBlur(a, 5).astype(np.float32)  # faktura papieru nie ma zatrzymywać wypełnienia
    diff = np.abs(smooth - model).max(axis=2)
    near = diff <= tol
    if shadow:
        r = (smooth + 1) / (model + 1)
        near |= (r.max(axis=2) < 0.99) & (r.min(axis=2) > 0.5) & (r.max(axis=2) - r.min(axis=2) < 0.07)
    _, labels = cv2.connectedComponents(near.astype(np.uint8), connectivity=4)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    background = np.isin(labels, border[border != 0])  # etykieta 0 to piksele różne od tła
    # pasek 3 px przy tle: krycie rośnie z odległością od koloru tła (wygładzona krawędź);
    # głębiej w obiekcie krycie pełne, nawet jeśli kolor przypomina tło (biała etykieta na białym tle)
    band = cv2.dilate(background.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool) & ~background
    soft = np.clip((diff - tol * 0.5) / (tol * 1.5), 0, 1)
    alpha = np.ones(diff.shape, np.float32)
    alpha[background] = 0
    alpha[band] = soft[band]
    return alpha, bg, model


def box_of(mask):
    """Prostokąt obiektu; wiersze i kolumny z mniej niż 0,2% pikseli to szum."""
    m = mask > 0.5
    rows = np.where(m.sum(axis=1) > m.shape[1] * 0.002)[0]
    cols = np.where(m.sum(axis=0) > m.shape[0] * 0.002)[0]
    if not len(rows) or not len(cols):
        return None
    return cols[0], rows[0], cols[-1] + 1, rows[-1] + 1


def process(path, target_bg, height_ratio, tol, shadow=False):
    src = Image.open(path)
    warn = []
    target = np.array(target_bg, np.float32)
    rgba = None
    if src.mode in ('RGBA', 'LA') or (src.mode == 'P' and 'transparency' in src.info):
        rgba = np.asarray(src.convert('RGBA')).astype(np.float32)
        if rgba[..., 3].min() > 250:  # kanał alfa jest, ale zdjęcie całe nieprzezroczyste
            rgba = None
    if rgba is not None:
        rgb, alpha = rgba[..., :3], rgba[..., 3] / 255
        shading = None
        bg_txt = 'przezroczyste'
    else:
        a = np.asarray(src.convert('RGB'))
        rgb = a.astype(np.float32)
        alpha, bg, model = subject_mask(a, tol, shadow)
        if bg.mean() < 90:
            alpha = cv2.erode(alpha, np.ones((5, 5), np.uint8))
            shading = None  # na ciemnym tle cieniowanie nie ma sensu, wklejamy sam flakon
            warn.append('ciemne tło źródła, wycięte od krawędzi, sprawdź obwódkę')
        else:
            if bg.mean() < 200:
                warn.append('średnio jasne albo niejednolite tło źródła, sprawdź ręcznie')
            # cieniowanie tła: faktura papieru wygładzona, cień (niska częstotliwość) zostaje
            shading = cv2.GaussianBlur(np.clip(rgb / np.maximum(model, 1), 0, 1.15), (0, 0), 3)
        bg_txt = '#%02X%02X%02X' % tuple(int(c) for c in bg)
    h, w = alpha.shape
    box = box_of(alpha)
    if not box:
        return None, ['nie znaleziono flakonu']
    x0, y0, x1, y1 = box
    if x0 <= 1 or y0 <= 1 or x1 >= w - 1 or y1 >= h - 1:
        warn.append('obiekt dotyka krawędzi źródła, flakon może być ucięty')

    # wycinek z zapasem na cień; na jego brzegu wszystko płynnie przechodzi w czyste nowe tło
    mx, my = int((x1 - x0) * 0.35), int((y1 - y0) * 0.12)
    rx0, ry0, rx1, ry1 = max(0, x0 - mx), max(0, y0 - my), min(w, x1 + mx), min(h, y1 + my)
    al = cv2.GaussianBlur(alpha[ry0:ry1, rx0:rx1], (0, 0), 0.8)[..., None]
    part = rgb[ry0:ry1, rx0:rx1]
    back = target if shading is None else np.clip(target * shading[ry0:ry1, rx0:rx1], 0, 255)
    comp = al * part + (1 - al) * back
    rh, rw = comp.shape[:2]
    fy = np.minimum(np.arange(rh), np.arange(rh)[::-1]) / max(1, my * 0.8)
    fx = np.minimum(np.arange(rw), np.arange(rw)[::-1]) / max(1, mx * 0.8)
    feather = np.clip(np.minimum.outer(fy, fx), 0, 1)[..., None]
    feather = np.maximum(feather, al)  # sam flakon nigdy nie blednie
    comp = target + feather * (comp - target)

    W = 1600
    H = int(W * 1.25)
    scale = (H * height_ratio) / (y1 - y0)
    if (x1 - x0) * scale > W * 0.86:
        scale = (W * 0.86) / (x1 - x0)
        warn.append('szeroki obiekt, dopasowany do szerokości')
    region = Image.fromarray(np.clip(comp, 0, 255).astype(np.uint8))
    region = region.resize((max(1, round(rw * scale)), max(1, round(rh * scale))), Image.LANCZOS)
    # flakon wyśrodkowany w poziomie, podstawa na 88% wysokości kadru
    bx = (W - (x1 - x0) * scale) / 2
    by = H * 0.88 - (y1 - y0) * scale
    ox, oy = round(bx - (x0 - rx0) * scale), round(max(0, by) - (y0 - ry0) * scale)
    canvas = Image.new('RGB', (W, H), tuple(int(c) for c in target_bg))
    canvas.paste(region, (ox, oy))

    pid = os.path.splitext(os.path.basename(path))[0]
    os.makedirs(OUT, exist_ok=True)
    for size in SIZES:
        canvas.resize((size, int(size * 1.25)), Image.LANCZOS).save(os.path.join(OUT, f'{pid}-{size}.webp'), 'WEBP', quality=82, method=6)
    return {'id': pid, 'zrodlo_px': f'{w}x{h}', 'tlo_zrodla': bg_txt}, warn


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('--tlo', default='F1EFEC', help='kolor tła docelowego, hex bez #')
    ap.add_argument('--wysokosc', type=float, default=0.74, help='wysokość flakonu jako część wysokości kadru')
    ap.add_argument('--tol', type=int, default=18, help='czułość wykrywania obiektu względem tła')
    args = ap.parse_args()
    target = tuple(int(args.tlo[i:i + 2], 16) for i in (0, 2, 4))
    cfg_path = os.path.join(args.src, 'ustawienia.json')
    cfg = json.load(open(cfg_path, encoding='utf-8')) if os.path.exists(cfg_path) else {}
    rows = []
    for name in sorted(os.listdir(args.src)):
        if not name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            continue
        opt = cfg.get(os.path.splitext(name)[0], {})
        info, warn = process(os.path.join(args.src, name), target, args.wysokosc, opt.get('tol', args.tol), opt.get('cien', False))
        rows.append(dict(info or {'id': name}, ostrzezenia='; '.join(warn)))
        print(name, 'OK' if not warn else ' / '.join(warn))
    # raport łączy przebiegi (zdjęcia producentów i zdjęcia właściciela): nowy wiersz zastępuje stary o tym samym id
    report = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'raport.csv')
    merged = {}
    if os.path.exists(report):
        with open(report, newline='', encoding='utf-8') as f:
            merged = {r['id']: r for r in csv.DictReader(f)}
    merged.update({r['id']: r for r in rows})
    with open(report, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['id', 'zrodlo_px', 'tlo_zrodla', 'ostrzezenia'])
        w.writeheader()
        w.writerows(merged[k] for k in sorted(merged))


if __name__ == '__main__':
    sys.exit(main())
