"""Warianty napisu −99% za flakonami na grafice NICCI ESSENTIALS (do akceptacji właściciela).
Warstwy: tło zdjęcia -> poświata i duży napis -> pierwszy plan (flakony, odlewki, skała wg maski) -> małe napisy.
Użycie: napisy.py zdjęcie.png maska.png katalog_wyjścia"""
import os
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

SRC, MASK, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
F = os.environ.get('NICCI_FONTY', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'zrodla', 'fonty')) + '/'  # kroje OFL z Google Fonts (poza repozytorium)
os.makedirs(OUT, exist_ok=True)
photo = Image.open(SRC).convert('RGB')
W, H = photo.size
mask = Image.open(MASK).convert('L')
TEKST = '−99%'


def font(name, size, axes=None):
    ft = ImageFont.truetype(F + name, size)
    if axes:
        ft.set_variation_by_axes(axes)
    return ft


def text_mask(ft, text, tracking=0.0, minus_bold=0.0):
    """Maska napisu przycięta do liter; tracking jako ułamek rozmiaru (ujemny = ciaśniej).
    minus_bold pogrubia sam znak minus (w krojach didone jest włoskowaty i ginie przy cyfrach)."""
    size = ft.size
    widths = [ft.getlength(c) for c in text]
    total = sum(widths) + tracking * size * (len(text) - 1)
    pad = int(size * 0.3)
    im = Image.new('L', (int(total) + 2 * pad, int(size * 1.6) + 2 * pad), 0)
    d = ImageDraw.Draw(im)
    x = pad
    for c, w in zip(text, widths):
        sw = int(minus_bold * size) if c == '\u2212' else 0
        d.text((x, pad), c, font=ft, fill=255, stroke_width=sw, stroke_fill=255)
        x += w + tracking * size
    return im.crop(im.getbbox())


def gradient(w, h, stops):
    """Pionowy gradient: stops = [(pozycja 0..1, (r,g,b)), ...]."""
    ys = np.linspace(0, 1, h)[:, None]
    out = np.zeros((h, 1, 3), np.float32)
    for i in range(3):
        out[..., i] = np.interp(ys, [s[0] for s in stops], [s[1][i] for s in stops])
    return Image.fromarray(np.repeat(out, w, 1).astype(np.uint8))


_a = np.asarray(mask) > 200
TOP_C = float(np.percentile([np.argmax(_a[:, x]) for x in range(int(W * 0.35), int(W * 0.65)) if _a[:, x].any()], 10))


def place(m, width_frac, hide, min_top=0.085):
    """Skaluje napis do ułamka szerokości kadru i ustawia go tak, żeby ułamek „hide” jego wysokości chował się
    za korkami flakonów w środku kadru (TOP_C z maski). Gdy wyszłoby za wysoko, zmniejsza napis."""
    while True:
        tw = int(W * width_frac)
        th = int(m.height * tw / m.width)
        y = int(TOP_C + hide * th - th)
        if y >= H * min_top or width_frac < 0.5:
            break
        width_frac -= 0.01
    return m.resize((tw, th), Image.LANCZOS), (W - tw) // 2, y


def compose(st):
    base = photo.copy().convert('RGBA')
    m = text_mask(font(st['font'], 900, st.get('axes')), TEKST, st.get('tracking', 0), st.get('minus_bold', 0))
    if st.get('outline'):
        thick = st['outline']
        m = ImageChops.subtract(m.filter(ImageFilter.MaxFilter(thick)), m.filter(ImageFilter.MinFilter(3)))
    m, x, y = place(m, st['width'], st.get('hide', 0.33), st.get('min_top', 0.085))
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    # poświata za napisem
    if st.get('glow'):
        col, op, rad = st['glow']
        g = Image.new('L', (W, H), 0); g.paste(m, (x, y))
        g = g.filter(ImageFilter.GaussianBlur(rad)).point(lambda v: int(v * op))
        layer = Image.alpha_composite(layer, Image.merge('RGBA', (*Image.new('RGB', (W, H), col).split(), g)))
    fill = gradient(m.width, m.height, st['fill'])
    # połysk: jaśniejsza górna krawędź liter, ciemniejsza dolna (delikatny relief)
    if st.get('bevel'):
        hi = ImageChops.subtract(m, m.transform(m.size, Image.AFFINE, (1, 0, 0, 0, 1, -4))).filter(ImageFilter.GaussianBlur(2))
        lo = ImageChops.subtract(m, m.transform(m.size, Image.AFFINE, (1, 0, 0, 0, 1, 4))).filter(ImageFilter.GaussianBlur(2))
        fill = Image.composite(Image.new('RGB', m.size, (255, 244, 220)), fill, hi.point(lambda v: int(v * 0.55)))
        fill = Image.composite(Image.new('RGB', m.size, (60, 40, 15)), fill, lo.point(lambda v: int(v * 0.45)))
    t = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    t.paste(Image.merge('RGBA', (*fill.split(), m.point(lambda v: int(v * st.get('opacity', 1.0))))), (x, y))
    layer = Image.alpha_composite(layer, t)
    out = Image.alpha_composite(base, layer)
    # pierwszy plan z powrotem na wierzch: napis chowa się za flakonami i skałą
    out = Image.composite(photo.convert('RGBA'), out, mask)
    # małe napisy na wierzchu
    d = ImageDraw.Draw(out)
    brand = font('Jost[wght].ttf', int(W * 0.026), [500])
    bm = text_mask(brand, 'NICCI ESSENTIALS', tracking=0.42)
    bx, by = (W - bm.width) // 2, int(H * st.get('brand_top', 0.04))
    out.paste(Image.new('RGBA', bm.size, (213, 168, 101, 255)), (bx, by), bm)
    sub = font('Carattere-Regular.ttf', int(W * 0.062))
    sm = text_mask(sub, os.environ.get('PODPIS', '7 zapachów po 1 ml'))   # dopisek pismem pod dużym napisem
    if os.environ.get('SUB_MODE') == 'prawo':
        # pod dużym napisem, wyrównany do prawej krawędzi „%”, nad niższymi flakonami po prawej
        sx, sy = x + m.width - sm.width - int(W * 0.01), y + m.height + int(H * 0.012)
        # nie może wchodzić na flakony: w tym samym rzędzie szukamy miejsca najbliżej prawej krawędzi „%”,
        # najpierw z odstępem od flakonów, potem bez; gdy nic nie pasuje, zostaje miejsce wyjściowe
        ma = np.asarray(mask)
        def hits(px, py, pad):
            return (ma[max(0, py - pad):py + sm.height + pad, max(0, px - pad):px + sm.width + pad] > 40).mean() > 0.0005
        x_max = W - int(W * 0.045) - sm.width
        cands = sorted(range(int(W * 0.04), x_max + 1, 6), key=lambda px: abs(px - sx))
        for pad in (int(W * 0.02), 0):
            ok = [px for px in cands if not hits(px, sy, pad)]
            if ok:
                sx = ok[0]
                break
    else:
        sx, sy = (W - sm.width) // 2, int(H * float(os.environ.get('SUB_TOP', '0.885')))
    sh = Image.new('L', (W, H), 0); sh.paste(sm, (sx, sy)); sh = sh.filter(ImageFilter.GaussianBlur(10)).point(lambda v: int(v * 0.8))
    out = Image.alpha_composite(out, Image.merge('RGBA', (*Image.new('RGB', (W, H), (0, 0, 0)).split(), sh)))
    out.paste(Image.new('RGBA', sm.size, (243, 234, 223, 255)), (sx, sy), sm)
    return out.convert('RGB')


ZLOTO = [(0, (250, 232, 190)), (0.35, (232, 200, 142)), (0.6, (213, 168, 101)), (0.85, (176, 138, 78)), (1, (150, 112, 60))]
KREM = [(0, (250, 245, 236)), (1, (232, 215, 195))]
SZAMPAN = [(0, (255, 255, 255)), (0.55, (243, 234, 223)), (1, (214, 190, 150))]
STYLE = {
    'A_bodoni_zloto': dict(font='BodoniModa[opsz,wght].ttf', axes=[900, 96], width=0.94, fill=ZLOTO, bevel=True,
                          glow=((213, 168, 101), 0.35, 60), tracking=-0.02, minus_bold=0.035),
    'G_bodoni_krem': dict(font='BodoniModa[opsz,wght].ttf', axes=[900, 96], width=0.94, fill=KREM,
                         glow=((213, 168, 101), 0.3, 70), tracking=-0.02, minus_bold=0.035),
    'H_anton_zloto_najwiekszy': dict(font='Anton-Regular.ttf', width=0.95, hide=0.40, fill=ZLOTO, bevel=True,
                                     glow=((213, 168, 101), 0.3, 70), min_top=0.075),
    'B_anton_krem': dict(font='Anton-Regular.ttf', width=0.90, top=0.075, fill=KREM, glow=((213, 168, 101), 0.28, 70), tracking=0.0),
    # grafika z obniżoną skałą (post i popup „−99% na Siedem Legend”): korki zasłaniają tylko dół cyfr,
    # żeby pod „%” zmieścił się dopisek nad niższymi flakonami po prawej
    'L_legendy_anton_krem': dict(font='Anton-Regular.ttf', width=0.92, hide=0.09, fill=KREM, glow=((213, 168, 101), 0.28, 70), tracking=0.0),
    'C_playfair_szampan': dict(font='PlayfairDisplay[wght].ttf', axes=[900], width=0.94, fill=SZAMPAN, bevel=True,
                               glow=((255, 236, 200), 0.22, 60), tracking=-0.03, minus_bold=0.02, hide=0.28),
    'D_jost_zloto': dict(font='Jost[wght].ttf', axes=[800], width=0.92, top=0.10, fill=ZLOTO, bevel=True, glow=((213, 168, 101), 0.3, 60), tracking=-0.04),
    'E_abril_zloto_plaskie': dict(font='AbrilFatface-Regular.ttf', width=0.94, top=0.09, fill=[(0, (213, 168, 101)), (1, (213, 168, 101))],
                                  glow=((213, 168, 101), 0.3, 50), tracking=-0.01),
    'F_anton_kontur': dict(font='Anton-Regular.ttf', width=0.90, top=0.075, fill=ZLOTO, outline=11, glow=((213, 168, 101), 0.22, 40)),
}

if __name__ == '__main__':
    only = sys.argv[4:] or list(STYLE)
    for k in only:
        im = compose(STYLE[k])
        im.save(os.path.join(OUT, k + '.png'))
        im.resize((1080, 1340), Image.LANCZOS).save(os.path.join(OUT, k + '.jpg'), quality=88)
        print('gotowe', k)
