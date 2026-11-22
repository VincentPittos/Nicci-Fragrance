"""Prawdziwe logo NICCI na etykietach atomizerów: stary (wygenerowany) nadruk wymazany z czarnego kwadratu
(zostaje jego światło), w to miejsce logo z site/img/marka/logo-pelne-zloto.svg w kolorze starego nadruku.
Użycie: nicci_etykiety.py katalog wejscie wyjscie 'cx,cy,kat_czytania;...'"""
import sys, math, numpy as np
sys.path.insert(0, sys.argv[1])
from etyk import *
from PIL import ImageDraw

D, src, dst, spec = sys.argv[1:5]
o = Obraz(D + '/' + src)
logo = Image.open(D + '/logo_nicci.png').split()[-1]   # alfa logo 1505 x 1640

def wykryj(cx, cy, R=60, prog=70):
    x0, y0 = int(cx - R), int(cy - R)
    L = lum(o.a[y0:y0 + 2 * R, x0:x0 + 2 * R])
    m = Image.fromarray(((L < prog) * 255).astype(np.uint8))
    m = m.filter(ImageFilter.MinFilter(3))           # odcięcie cienkich połączeń z piaskiem
    ImageDraw.floodfill(m, (R, R), 128)
    k = np.asarray(m) == 128
    k = np.asarray(Image.fromarray((k * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    # wypełnienie dziur po jasnym nadruku: zamknięcie (rozszerz, zwęź) o 9 px
    zk = Image.fromarray((k * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))
    k = np.asarray(zk) > 0
    ys, xs = np.nonzero(k)
    best = None
    for a in np.arange(0, 90, 0.5):
        t = math.radians(a); u = (math.cos(t), math.sin(t)); v = (-math.sin(t), math.cos(t))
        pu = xs * u[0] + ys * u[1]; pv = xs * v[0] + ys * v[1]
        lu, hu = np.percentile(pu, [0.3, 99.7]); lv, hv = np.percentile(pv, [0.3, 99.7])
        if best is None or (hu - lu) * (hv - lv) < best[0]: best = ((hu - lu) * (hv - lv), a, lu, hu, lv, hv)
    _, a, lu, hu, lv, hv = best
    return a, (lu, hu, lv, hv), len(xs), (x0, y0)

for wpis in spec.split(';'):
    v = list(map(float, wpis.split(',')))
    quad = [(v[0], v[1]), (v[2], v[3]), (v[4], v[5]), (v[6], v[7])]   # TL, TR, BR, BL w układzie etykiety
    c = np.mean(quad, 0)
    bok = np.mean([np.hypot(*(np.array(quad[i]) - np.array(quad[(i + 1) % 4]))) for i in range(4)])
    print('etykieta', c.round(1), 'bok', round(bok, 1))
    # kolor starego nadruku: jasne piksele w środku etykiety
    wew = [tuple(c + (np.array(p) - c) * 0.8) for p in quad]
    L = lum(o.a); reg = o.mask(wew) > 0.5
    jasne = reg & (L > np.percentile(L[reg], 88))
    kolor = np.median(o.a[jasne], axis=0)
    kolor = np.clip(np.maximum(0.5 * kolor + 0.5 * kolor.mean(), 150), 0, 220)   # srebrny nadruk: kolor starego, ale bez złotego odcienia
    print('  kolor nadruku', kolor.round())
    # czarne tło etykiety odtworzone gładką powierzchnią (wielomian 2. stopnia w każdym kanale) dopasowaną do pikseli
    # tła bez nadruku: znika cały stary nadruk, a odblask i światło zostają; poza 0,9 boku (ramka, faza) bez zmian
    obsz = [tuple(c + (np.array(p) - c) * 0.9) for p in quad]
    m_twardy = o.mask(obsz) > 0.5
    ys, xs = np.nonzero(m_twardy)
    L = lum(o.a)
    tla = L[ys, xs] <= np.percentile(L[ys, xs], 55)
    X = (xs - c[0]) / bok; Y = (ys - c[1]) / bok
    A = np.stack([np.ones_like(X), X, Y, X * X, X * Y, Y * Y], 1)
    wsp = []
    for k in range(3):
        sel = tla.copy()
        for _ in range(2):
            co = np.linalg.lstsq(A[sel], o.a[ys, xs, k][sel], rcond=None)[0]
            res = o.a[ys, xs, k] - A @ co
            sel = sel & (np.abs(res) < 2.5 * res[sel].std() + 1)
        wsp.append((co, res[sel].std()))
    gy, gx = np.mgrid[0:o.H, 0:o.W]
    x0, x1 = int(xs.min()) - 3, int(xs.max()) + 4; y0, y1 = int(ys.min()) - 3, int(ys.max()) + 4
    GX = (gx[y0:y1, x0:x1] - c[0]) / bok; GY = (gy[y0:y1, x0:x1] - c[1]) / bok
    GA = np.stack([np.ones_like(GX), GX, GY, GX * GX, GX * GY, GY * GY], -1)
    rng = np.random.default_rng(7)
    nowe = np.stack([GA @ wsp[k][0] + rng.normal(0, min(wsp[k][1], 3.0), GX.shape) for k in range(3)], -1)
    ms = o.mask(obsz, 0.8)[y0:y1, x0:x1, None]
    o.a[y0:y1, x0:x1] = o.a[y0:y1, x0:x1] * (1 - ms) + nowe * ms
    # logo na płótnie etykiety: znak i NICCI (bez „FRAGRANCE”, które przy boku ok. 50 px ma 2 px i wychodzi jak szum),
    # płótno od razu w rozmiarze zbliżonym do etykiety (LANCZOS), żeby przekształcenie nie gubiło szczegółów
    S = int(round(bok * 2))
    znak = logo.crop((0, 0, 1505, 1490))
    lh = int(S * 0.74); lw = int(lh * 1505 / 1490)
    can = Image.new('L', (S, S), 0)
    can.paste(znak.resize((lw, lh), Image.LANCZOS), ((S - lw) // 2, int(S * 0.13)))
    H = homog([(0, 0), (S, 0), (S, S), (0, S)], quad)
    o.ink(o.warp(can, H), kolor, gain=0.95, soft=0.35)
o.save(D + '/' + dst)
print('gotowe')
