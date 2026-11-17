"""Essentials: obniża wysoką skałę z Creed Aventus i Xerjoff Erba Pura o D pikseli (skala 1856 x 2320).
Skała ma płaską górę na wysokości ok. 1225, więc wystarczy przesunąć w dół dwa flakony i pas górnej krawędzi skały;
niżej ściana skały zostaje z oryginału (ta sama faktura). Miejsce nad nową krawędzią wypełnia gładkie tło
(wielomian dopasowany do tła wokół) z ziarnem. Kapsle Imagination i Essential Parfums oraz Montale zostają z przodu.
Użycie: nizsza_skala.py ESS_PNG MASKA_PNG KATALOG_WYJ D"""
import os
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, msk, out, D = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
os.makedirs(out, exist_ok=True)
A = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
M = np.asarray(Image.open(msk).convert('L')).astype(np.float32) / 255
Hh, Ww = M.shape
yy, xx = np.mgrid[0:Hh, 0:Ww]

def soft(mask, r):
    return np.asarray(Image.fromarray((np.clip(mask, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255

def ramp(v, a, b):
    return np.clip((v - a) / float(b - a), 0, 1)

X0, X1 = 392, 978          # od lewego boku skały do Montale
TOP = 1225                 # górna krawędź skały
# 1) Creed + Xerjoff (z maski pierwszego planu, nad krawędzią skały)
UP = np.zeros_like(M)
UP[700:TOP + 16, 470:968] = M[700:TOP + 16, 470:968]
# 2) przód, który ma przykryć przesunięte rzeczy: kapsel Imagination, kapsel EP, Montale (pomiar z powiększenia)
fr = Image.new('L', (Ww, Hh), 0)
d = ImageDraw.Draw(fr)
d.rounded_rectangle([382, 1311, 532, 1338], radius=6, fill=255)   # Imagination: dysk kapsla
d.rectangle([412, 1336, 505, 1368], fill=255)                      # szyjka pod kapslem
d.rounded_rectangle([385, 1365, 531, 1399], radius=8, fill=255)    # pierścień
d.rectangle([400, 1397, 521, 1460], fill=255)                      # szyjka
d.rectangle([370, 1440, 560, 1500], fill=255)                      # ramiona flakonu
d.rectangle([642, 1316, 758, 1434], fill=255)                      # EP: kapsel
d.rectangle([590, 1428, 816, 1500], fill=255)                      # EP: góra szkła
caps = fr.copy()                                                   # kapsle bez Montale (do nowej maski)
d.rectangle([979, 1080, 1130, 1500], fill=255)                     # Montale
FRONT = soft(np.asarray(fr).astype(np.float32) / 255, 0.7)

# 3) gładkie tło: wielomian 3. stopnia dopasowany do tła wokół (bez flakonów, skał i przodu)
UPd = soft(UP > 0.05, 0) > 0
UPd = np.asarray(Image.fromarray((UPd * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(31))) > 0
valid = (~UPd) & (FRONT < 0.01) & (yy >= 450) & (yy <= 1300) & (xx >= 150) & (xx <= 1000)
valid &= ~((xx >= X0 - 30) & (xx <= 990) & (yy >= TOP - 14))   # skała
valid &= ~((xx >= 975) & (yy >= 1060))                          # Montale i dalej
idx = np.nonzero(valid[::3, ::3])
py, px = idx[0] * 3, idx[1] * 3
def feats(x, y):
    x = (x - 600) / 500.0
    y = (y - 1000) / 500.0
    return np.stack([np.ones_like(x), x, y, x * x, x * y, y * y, x ** 3, x * x * y, x * y * y, y ** 3], -1)
Fv = feats(px.astype(np.float64), py.astype(np.float64))
coef = [np.linalg.lstsq(Fv, A[py, px, c].astype(np.float64), rcond=None)[0] for c in range(3)]
bx0, bx1, by0, by1 = 360, 1000, 650, 1480
gy, gx = np.mgrid[by0:by1, bx0:bx1]
Fg = feats(gx.astype(np.float64), gy.astype(np.float64))
fill = np.stack([Fg @ coef[c] for c in range(3)], -1).astype(np.float32)
res = A[py, px] - np.stack([Fv @ coef[c] for c in range(3)], -1)
print('reszta dopasowania tła (odch. std)', np.round(res.std(0), 2))
rng = np.random.default_rng(7)
n = rng.normal(0, 1, gy.shape).astype(np.float32)
n = np.asarray(Image.fromarray(((n * 30) + 128).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32)
n = (n - 128) / 30 * 2.6
fill += n[..., None]

def crop(a):
    return a[by0:by1, bx0:bx1]

Ab = crop(A)
# przesunięty obraz (wszystko o D w dół)
S_ = np.zeros_like(A)
S_[D:] = A[:-D]
Sb = crop(S_)
UPs = np.zeros_like(UP)
UPs[D:] = UP[:-D]
UPsb = soft(crop(UPs), 0.6)
gyx_in = (gx >= X0) & (gx <= X1)
# pas krawędzi skały (źródło: wiersze TOP-20..TOP+50), wchodzi łagodnie od góry i schodzi w ścianę z oryginału
src_row = gy - D
strip = ramp(src_row, TOP - 22, TOP - 6) * gyx_in
below = ramp(gy, TOP + 50 + D - 18, TOP + 50 + D) * gyx_in      # dalej ściana skały z oryginału
comp = fill.copy()
comp = comp * (1 - strip[..., None]) + Sb * strip[..., None]
comp = comp * (1 - below[..., None]) + Ab * below[..., None]
comp = comp * (1 - UPsb[..., None]) + Sb * UPsb[..., None]
Fb = crop(FRONT)
comp = comp * (1 - Fb[..., None]) + Ab * Fb[..., None]

# obszar zmiany: miejsce po flakonach i pas od starej do nowej krawędzi skały (z miękkim brzegiem)
CH = np.zeros((Hh, Ww), np.float32)
CH[np.asarray(Image.fromarray((UP > 0.05).astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(41))) > 0] = 1
CH[TOP - 40:TOP + D + 70, X0 - 10:X1 + 1] = 1
CH = np.maximum(CH, UPs)
CHb = soft(crop(CH), 6)
OUT = A.copy()
OUT[by0:by1, bx0:bx1] = Ab * (1 - CHb[..., None]) + comp * CHb[..., None]
Image.fromarray(OUT.clip(0, 255).astype(np.uint8)).save(os.path.join(out, 'ess.png'))

# nowa maska pierwszego planu (do chowania napisu za flakonami): bez starych flakonów i starego pasa skały
NM = M.copy()
NM[CH > 0.5] = 0
rock_new = (yy >= TOP + D) & (xx >= X0) & (xx <= X1)
NM = np.maximum(NM, np.maximum(UPs, rock_new.astype(np.float32)))
NM = np.maximum(NM, (np.asarray(caps) > 0).astype(np.float32))   # Montale zostaje z maski pierwotnej (jego kształt, nie prostokąt)
Image.fromarray((NM * 255).astype(np.uint8)).save(os.path.join(out, 'ess_maska.png'))
print('zapisano', out)
