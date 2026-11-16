"""Więcej miejsca nad flakonami: zdjęcie skalowane do S i wstawione na dół płótna 4:5 tej samej szerokości.
Góra: tło przedłużone w górę (kolor kolumn z górnego pasa, lekko ciemniejszy ku górze).
Boki: tło przedłużone poziomo, skała odbita lustrzanie od krawędzi i przyciemniona winietą, żeby szew był niewidoczny.
Użycie: powieksz_tlo.py wejście.png wyjście.png [skala]"""
import sys
import numpy as np
from PIL import Image, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
S = float(sys.argv[3]) if len(sys.argv) > 3 else 0.85
im = Image.open(src).convert('RGB')
W, H = im.size
CW, CH = W, round(W * 1.25)
w, h = round(W * S), round(H * S)
sm = np.asarray(im.resize((w, h), Image.LANCZOS)).astype(np.float32)
x0, y0 = (CW - w) // 2, CH - h
can = np.zeros((CH, CW, 3), np.float32)
can[y0:, x0:x0 + w] = sm

# boki: lustrzane odbicie pasa przy krawędzi (ciągłość konturów skały) dla całej wysokości zdjęcia
left = sm[:, :x0][:, ::-1]
right = sm[:, w - (CW - x0 - w):][:, ::-1]
can[y0:, :x0] = left
can[y0:, x0 + w:] = right
# winieta na bokach: przyciemnienie do 55% przy samej krawędzi, płynnie do 100% w głąb
xs = np.arange(CW, dtype=np.float32)
vig = np.ones(CW, np.float32)
edge = x0 + 60
vig[:edge] = 0.55 + 0.45 * np.clip(xs[:edge] / edge, 0, 1) ** 1.5
vig[CW - edge:] = vig[:edge][::-1]
can *= vig[None, :, None]

# góra: kolor każdej kolumny z górnych 24 rzędów płótna (już z bokami), ku górze ciemniej o 18%
top = can[y0:y0 + 24].mean(0)
top = np.asarray(Image.fromarray(np.clip(top[None], 0, 255).astype(np.uint8)).resize((CW, 1)).filter(ImageFilter.BoxBlur(0))).astype(np.float32)[0]
top = np.asarray(Image.fromarray(np.clip(top, 0, 255).astype(np.uint8)[None]).filter(ImageFilter.GaussianBlur(25))).astype(np.float32)[0]
for y in range(y0):
    t = y / max(y0 - 1, 1)  # 0 u góry płótna, 1 przy zdjęciu
    can[y] = top * (0.82 + 0.18 * t)
# miękkie przejście 50 px na szwie u góry
band = 50
for i in range(band):
    a = i / band
    can[y0 + i] = can[y0 + i] * a + top * (1 - a) * (0.82 + 0.18)
# drobne ziarno, żeby dobudowane tło nie było gładsze od zdjęcia
rng = np.random.default_rng(7)
noise = rng.normal(0, 1.6, (CH, CW, 1)).astype(np.float32)
mask = np.zeros((CH, CW, 1), np.float32); mask[:y0] = 1; mask[:, :x0] = 1; mask[:, x0 + w:] = 1
can = can + noise * mask
Image.fromarray(np.clip(can, 0, 255).astype(np.uint8)).save(dst)
print('płótno', CW, CH, 'zdjęcie od y', y0, 'boki', x0)
