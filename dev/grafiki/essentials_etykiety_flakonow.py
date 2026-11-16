"""Poprawia przekłamane przez AI napisy na flakonach w zdjęciu NICCI ESSENTIALS, przenosząc prawdziwe napisy
ze zdjęć producenta (site/img/produkty/pXX-800.webp) jako „farbę”: z packshotu liczona jest przezroczystość druku
względem lokalnego tła, w zdjęciu stary napis jest wymazywany (interpolacja tła między wierszem nad i pod nim),
a w jego miejsce nakładany jest druk w kolorze z istniejącego, poprawnego napisu na tym samym flakonie.
Użycie: etykiety_flakonow.py wejście.png wyjście.png"""
import os
import sys
import numpy as np
from PIL import Image, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
P = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'site', 'img', 'produkty') + '/'
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
rng = np.random.default_rng(5)


def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def erase(box, light_text, texture=False, tex_y=None):
    """Wymazuje prostokąt (x0, y0, x1, y1 włącznie) interpolacją między pasami 3 wierszy nad i pod nim, kolumna po
    kolumnie (refleksy na metalu i szkle są pionowe). Gdy pas odniesienia trafia w druk lub ramkę, bierze drugi.
    texture: dokłada ziarno papieru z pasa tuż nad prostokątem (bez łat gładszych od reszty etykiety)."""
    x0, y0, x1, y1 = box
    top = np.median(im[y0 - 4:y0 - 1, x0:x1 + 1], 0)
    bot = np.median(im[y1 + 2:y1 + 5, x0:x1 + 1], 0)
    lt, lb = lum(top), lum(bot)
    if light_text:
        bad_t, bad_b = lt > np.median(lt) + 25, lb > np.median(lb) + 25
    else:
        bad_t, bad_b = lt < np.median(lt) - 25, lb < np.median(lb) - 25
    top[bad_t] = bot[bad_t]
    bot[bad_b] = top[bad_b]
    n = y1 - y0 + 1
    fill = np.stack([top * (1 - (i + 1) / (n + 1)) + bot * ((i + 1) / (n + 1)) for i in range(n)])
    if texture:
        src_y0 = tex_y if tex_y is not None else max(0, y0 - n - 2)
        patch = im[src_y0:src_y0 + n, x0:x1 + 1]
        pim = Image.fromarray(np.clip(patch, 0, 255).astype(np.uint8))
        hp = patch - np.asarray(pim.filter(ImageFilter.GaussianBlur(2))).astype(np.float32)
        fill = fill + np.clip(hp, -12, 12)
    im[y0:y1 + 1, x0:x1 + 1] = fill


def erase_cols(box, ref_rows, feather=3):
    """Metal z pionowymi refleksami: każda kolumna prostokąta dostaje medianę swojej kolumny z czystych wierszy
    ref_rows; brzegi u góry i u dołu przechodzą płynnie w oryginał (feather wierszy)."""
    x0, y0, x1, y1 = box
    ref = np.median(np.stack([im[r, x0:x1 + 1] for r in ref_rows]), 0)
    n = y1 - y0 + 1
    for i in range(n):
        w = min(1.0, (i + 1) / feather, (n - i) / feather)
        im[y0 + i, x0:x1 + 1] = im[y0 + i, x0:x1 + 1] * (1 - w) + (ref + rng.normal(0, 1.0, (x1 - x0 + 1, 1))) * w


def ink_alpha(pack, box, light_text, gain=1.0):
    """Przezroczystość druku w kadrze packshotu: ciemny druk na jasnym tle albo jasny na ciemnym."""
    crop = Image.open(P + pack + '-800.webp').convert('RGB').crop(box)
    L = lum(np.asarray(crop).astype(np.float32))
    # tło kolumna po kolumnie: refleksy na metalu i szkle są pionowe, druk zajmuje tylko część wierszy
    if light_text:
        bg = np.percentile(L, 15, axis=0)[None, :].repeat(L.shape[0], 0)
        top = np.percentile(L, 99)
        a = (L - bg) / np.maximum(top - bg, 25)
    else:
        bg = np.percentile(L, 88, axis=0)[None, :].repeat(L.shape[0], 0)
        low = np.percentile(L, 1)
        a = (bg - L) / np.maximum(bg - low, 25)
    a = np.clip((a - 0.22) / 0.78 * gain, 0, 1)
    return Image.fromarray((a * 255).astype(np.uint8))


def put(alpha, dbox, color):
    """Nakłada druk o danej przezroczystości w prostokąt dbox (x0, y0, x1, y1, końce wyłącznie) zdjęcia."""
    x0, y0, x1, y1 = [int(round(v)) for v in dbox]
    a = np.asarray(alpha.resize((x1 - x0, y1 - y0), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.3))).astype(np.float32)[..., None] / 255
    reg = im[y0:y1, x0:x1]
    im[y0:y1, x0:x1] = reg * (1 - a) + np.array(color, np.float32) * a


def sample_ink(box, light_text):
    reg = im[box[1]:box[3], box[0]:box[2]].reshape(-1, 3)
    L = lum(reg)
    sel = reg[L > np.percentile(L, 96)] if light_text else reg[L < np.percentile(L, 4)]
    return np.median(sel, 0)


# ---------- Essential Parfums Bois Impérial: podpis twórcy i dolna linijka ----------
ink = sample_ink((560, 1280, 720, 1293), False)              # „BOIS IMPÉRIAL” na tej etykiecie
erase((580, 1300, 695, 1323), False, texture=True, tex_y=1326)
put(ink_alpha('p44', (339, 528, 464, 550), False), (585.5, 1302.5, 687.5, 1320.5), ink)   # by Quentin Bisch
erase((585, 1354, 690, 1367), False, texture=True, tex_y=1330)
put(ink_alpha('p44', (343, 592, 458, 602), False), (589.5, 1356.5, 684.5, 1364.8), ink)   # MOD 1151EX • 16%

# ---------- Montale Chocolate Greedy: napis w ramce i pojemność ----------
ink = sample_ink((1040, 1300, 1170, 1330), False)            # MONTALE nad ramką
erase_cols((1112, 1095, 1181, 1104), [1093, 1094, 1106, 1107])
put(ink_alpha('p29', (378, 491, 448, 501), False, gain=2.2), (1116.0, 1095.6, 1178.0, 1104.4), ink)  # PARIS pod logo
erase_cols((1036, 1356, 1170, 1387), list(range(1347, 1355)) + [1388, 1389])
put(ink_alpha('p29', (292, 783, 435, 811), False), (1035.9, 1360.1, 1168.7, 1384.6), ink)  # CHOCOLATE GREEDY / EAU DE PARFUM
erase_cols((1112, 1398, 1180, 1414), [1396, 1397, 1416, 1417, 1418])
put(ink_alpha('p29', (386, 823, 444, 843), False), (1123.0, 1397.5, 1175.0, 1410.5), ink)  # 3.4 Fl.oz

# ---------- Mancera Red Tobacco: Eau de parfum i pojemność ----------
ink = sample_ink((1535, 1225, 1615, 1250), True) * 0.92      # TOBACCO (kremowe złoto), druk drobny, trochę ciemniej
erase((1514, 1271, 1619, 1306), True)
put(ink_alpha('p25', (401, 602, 504, 636), True), (1516.0, 1272.0, 1617.3, 1305.4), ink)   # EAU DE PARFUM / 4 FLoz / 120 ML

Image.fromarray(np.clip(im, 0, 255).astype(np.uint8)).save(dst)
print('gotowe')
