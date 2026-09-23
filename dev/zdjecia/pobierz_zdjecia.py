#!/usr/bin/env python3
"""
Pobieranie oficjalnych zdjęć produktów ze stron producentów.

Metody:
  shopify  wyszukiwarka sklepu (search/suggest.json) → dane produktu (products/<uchwyt>.json) → zdjęcia
  html     strona produktu → wszystkie og:image
  render   strona budowana skryptem → Chromium (obrazy_strony.js) → og:image, JSON-LD i duże <img>
Strony z ochroną przed botami (403: Louis Vuitton, Dior, MFK, Versace, YSL, Hermès) pomijamy, nie obchodzimy
zabezpieczeń. Te zdjęcia musi dostarczyć właściciel (własne albo materiały prasowe).
Każde źródło trafia do dev/zdjecia/zrodla.csv (id, marka, nazwa, strona, plik obrazu, wymiary), bo raport
końcowy musi wymienić źródło każdego zdjęcia. Pliki surowe: dev/zdjecia/zrodla/ (poza gitem).

Użycie:
  python3 dev/zdjecia/pobierz_zdjecia.py shopify   # wszystkie pozycje z listy SHOPIFY
  python3 dev/zdjecia/pobierz_zdjecia.py html      # wszystkie pozycje z listy HTML
  python3 dev/zdjecia/pobierz_zdjecia.py render    # wszystkie pozycje z listy RENDER
"""
import csv
import json
import os
import re
import subprocess
import sys
import unicodedata
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'zrodla')
CSV = os.path.join(HERE, 'zrodla.csv')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

# id: (sklep, zapytanie, słowa wykluczające w tytule)
SHOPIFY = {
    'p06': ('https://www.xerjoff.com/en-us', 'Torino21', ['deodorant', 'set', 'kit', '15ml', 'tennis']),
    'p07': ('https://www.xerjoff.com/en-us', 'Renaissance', ['deodorant', 'set', 'kit']),
    'p08': ('https://www.xerjoff.com/en-us', 'Erba Pura', ['deodorant', 'set', 'kit', 'gift']),
    'p09': ('https://www.xerjoff.com/en-us', 'Uden', ['overdose', 'deodorant', 'set', 'kit']),
    'p10': ('https://www.xerjoff.com/en-us', 'Naxos', ['deodorant', 'set', 'kit', 'gift']),
    'p15': ('https://amouage.com/en-eu', 'Search', ['sample', 'set', 'gift']),
    'p16': ('https://amouage.com/en-eu', 'Reflection Man', ['sample', 'set', 'gift', '45']),
    'p17': ('https://amouage.com/en-eu', 'Outlands', ['sample', 'set', 'gift']),
    'p19': ('https://amouage.com/en-eu', 'Interlude Man', ['sample', 'set', 'gift', '53', 'black iris']),
    'p20': ('https://amouage.com/en-eu', 'Enclave', ['sample', 'set', 'gift']),
    'p11': ('https://creedboutique.com', 'Aventus', ['absolu', 'her', 'cologne', 'set', 'sample', 'body', 'deodorant', 'gift', 'travel']),
    'p12': ('https://creedboutique.com', 'Absolu Aventus', ['set', 'sample', 'gift', 'travel']),
    'p14': ('https://creedboutique.com', 'Silver Mountain Water', ['set', 'sample', 'body', 'gift', 'travel', 'soap', 'lotion', 'shower', 'candle']),
    'p32': ('https://www.tomfordbeauty.com', 'handle:ombre-leather-eau-de-parfum', []),
    'p33': ('https://www.tomfordbeauty.com', 'handle:noir-extreme-eau-de-parfum', []),
    'p34': ('https://www.tomfordbeauty.com', 'Lost Cherry', ['set', 'body', 'mini', 'travel', 'candle', 'lip']),
    'p35': ('https://www.tomfordbeauty.com', 'Tobacco Vanille', ['set', 'body', 'mini', 'travel', 'candle']),
    'p36': ('https://www.tomfordbeauty.com', 'Bois Pacifique', ['set', 'body', 'mini', 'travel']),
    'p37': ('https://www.tomfordbeauty.com', 'handle:oud-wood-eau-de-parfum', []),
    'p38': ('https://www.tomfordbeauty.com', 'handle:ebene-fume-eau-de-parfum', []),
    'p39': ('https://www.marcantoinebarrois.com', 'Ganymede', ['set', 'sample', 'travel', 'extrait', 'refill']),
    'p40': ('https://terenziboutique.us', 'handle:engf', []),  # Kirké, oficjalny sklep Tiziana Terenzi
    'p41': ('https://maisoncrivelli.com', 'handle:oud-maracuja', []),
    'p45': ('https://sospirointernational.com', 'handle:vibrato', []),
    'p44': ('https://essentialparfums.com', 'Bois Imperial', ['set', 'sample', 'refill', 'discovery', 'candle', 'body']),
    'p46': ('https://nutu.store', 'Casa di Capri', ['set', 'sample', 'discovery']),
    'p47': ('https://nutu.store', 'Secco di Como', ['set', 'sample', 'discovery']),
    'p48': ('https://nutu.store', 'Aurora Siciliana', ['set', 'sample', 'discovery']),
    'p49': ('https://nutu.store', 'Safrano Absolu', ['set', 'sample', 'discovery']),
    'p50': ('https://nutu.store', 'Milano 3AM', ['set', 'sample', 'discovery']),
}

# id: strona produktu u producenta (og:image)
HTML = {
    'p21': 'https://www.manceraparfums.com/en/fruity/30-lemon-line.html',
    'p22': 'https://www.manceraparfums.com/en/woody/16-cedrat-boise.html',
    'p23': 'https://www.manceraparfums.com/en/marine/106-french-riviera.html',
    'p24': 'https://www.manceraparfums.com/en/gourmand/110-tonka-cola.html',
    'p25': 'https://www.manceraparfums.com/en/oriental/67-red-tobacco.html',
    'p27': 'https://www.montaleparfums.com/en/gourmand/176-intense-cafe.html',
    'p28': 'https://www.montaleparfums.com/en/gourmand/282-484-arabians-tonka.html',
    'p29': 'https://www.montaleparfums.com/en/gourmand/35-24-chocolate-greedy-argent.html',
    'p30': 'https://www.montaleparfums.com/en/gourmand/203-honey-aoud.html',
    'p31': 'https://www.montaleparfums.com/en/spices/194-146-intense-pepper.html',
    'p59': 'https://www.hugoboss.com/us/boss-bottled-elixir-eau-de-toilette-100ml/hbna58129503_999.html',
    'p61': 'https://www.hugoboss.com/us/boss-bottled-beyond-eau-de-parfum-100-ml-%E2%80%93-3.38-fl.-oz./hbna58604808_999.html',
    'p62': 'https://www.hugoboss.com/us/boss-bottled-bold-citrus-eau-de-parfum-100ml/hbna58228597_999.html',
}

# id: strona produktu budowana skryptem (render w Chromium)
RENDER = {
    'p66': 'https://www.rabanne.com/ww/en/fragrance/p/black-xs--000000000065150134',
    'p67': 'https://www.rabanne.com/us/en_US/fragrance/p/invictus--000000000065055742',
    'p68': 'https://www.rabanne.com/us/en_US/fragrance/p/1-million--000000000065051844',
    'p69': 'https://www.azzaro.com/en/fragrances/azzaro-chrome/eau-de-parfum',
    'p70': 'https://www.azzaro.com/en/fragrances/azzaro-forever-wanted-elixir/eau-de-parfum',
    'p71': 'https://www.azzaro.com/en/fragrances/azzaro-the-most-wanted/parfum',
}

# pomijane w kandydatach z renderu: logotypy, ekrany ładowania, banery zgód
SKIP = ('logo', 'loader', 'cookielaw', 'onetrust', 'icon', 'sprite')


def get(url, binary=False):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'en,pl;q=0.8'})
    with urllib.request.urlopen(req, timeout=25) as r:
        data = r.read()
        return data if binary else data.decode('utf-8', 'replace')


def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def shopify_find(base, query, exclude):
    q = urllib.parse.quote(query)
    data = json.loads(get(f'{base}/search/suggest.json?q={q}&resources%5Btype%5D=product&resources%5Blimit%5D=10'))
    products = data['resources']['results']['products']
    want = norm(query)
    for p in products:
        t = norm(p['title'])
        if want in t and not any(x in t for x in exclude):
            handle = p['url'].split('/products/')[1].split('?')[0]
            return p['title'], handle
    return None, None


def save(pid, image_url, n=0):
    os.makedirs(RAW, exist_ok=True)
    ext = os.path.splitext(urllib.parse.urlparse(image_url).path)[1].lower() or '.jpg'
    path = os.path.join(RAW, f'{pid}_{n}{ext}')
    with open(path, 'wb') as f:
        f.write(get(image_url, binary=True))
    return path


def log(rows):
    old = {}
    if os.path.exists(CSV):
        for r in csv.DictReader(open(CSV, encoding='utf-8')):
            old[(r['id'], r['wariant'])] = r
    for r in rows:
        r['wariant'] = str(r['wariant'])
        old[(r['id'], r['wariant'])] = r
    with open(CSV, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['id', 'wariant', 'tytul', 'strona', 'obraz', 'wymiary', 'plik'])
        w.writeheader()
        for k in sorted(old):
            w.writerow(old[k])


def run_shopify(ids=None):
    rows = []
    for pid, (base, query, exclude) in SHOPIFY.items():
        if ids and pid not in ids:
            continue
        try:
            if query.startswith('handle:'):
                title, handle = query[7:], query[7:]
            else:
                title, handle = shopify_find(base, query, exclude)
            if not handle:
                print(pid, query, 'BRAK W WYSZUKIWARCE')
                continue
            product = json.loads(get(f'{base}/products/{handle}.json'))['product']
            for n, img in enumerate(product['images'][:3]):
                src = img['src'].split('?')[0]
                path = save(pid, src, n)
                rows.append({'id': pid, 'wariant': n, 'tytul': title, 'strona': f'{base}/products/{handle}',
                             'obraz': src, 'wymiary': f"{img['width']}x{img['height']}", 'plik': os.path.basename(path)})
            print(pid, title, '|', len(product['images']), 'zdjęć')
        except Exception as e:  # jedna marka nie może zatrzymać reszty
            print(pid, query, 'BŁĄD', str(e)[:120])
    log(rows)


def big(url):
    """Większy wariant obrazu, gdy CDN przyjmuje parametry rozmiaru."""
    if 'images.hugoboss.com' in url:
        return url.split('?')[0] + '?wid=1600&qlt=90'
    return url


def run_html(ids=None):
    rows = []
    for pid, page in HTML.items():
        if ids and pid not in ids:
            continue
        try:
            html = get(page)
            found = re.findall(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', html) + \
                re.findall(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', html)
            srcs = list(dict.fromkeys(big(urllib.parse.urljoin(page, u.replace('&amp;', '&'))) for u in found))
            if not srcs:
                print(pid, 'brak og:image'); continue
            for n, src in enumerate(srcs[:3]):
                path = save(pid, src, n)
                rows.append({'id': pid, 'wariant': n, 'tytul': '', 'strona': page, 'obraz': src, 'wymiary': '', 'plik': os.path.basename(path)})
            print(pid, len(srcs), 'og:image')
        except Exception as e:
            print(pid, 'BŁĄD', str(e)[:120])
    log(rows)


def run_render(ids=None):
    todo = {pid: url for pid, url in RENDER.items() if not ids or pid in ids}
    if not todo:
        return
    out = subprocess.run(['node', os.path.join(HERE, 'obrazy_strony.js'), *todo.values()], capture_output=True, text=True, timeout=900)
    data = json.loads(out.stdout)
    rows = []
    for pid, url in todo.items():
        d = data.get(url, {})
        if d.get('status') != 200:
            print(pid, 'BŁĄD', d.get('status'), d.get('error', '')[:100]); continue
        cand = d.get('og', []) + d.get('ld', []) + [i['src'] for i in sorted(d.get('img', []), key=lambda i: -i['w'] * i['h'])]
        cand = [c for c in dict.fromkeys(cand) if c and not any(k in c.lower() for k in SKIP)]
        for n, src in enumerate(cand[:4]):
            try:
                path = save(pid, src, n)
            except Exception as e:
                print(pid, n, 'BŁĄD pobrania', str(e)[:80]); continue
            rows.append({'id': pid, 'wariant': n, 'tytul': d.get('title', ''), 'strona': url, 'obraz': src, 'wymiary': '', 'plik': os.path.basename(path)})
        print(pid, d.get('title', '')[:50], '|', len(cand), 'kandydatów')
    log(rows)


if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'shopify'
    ids = sys.argv[2:] or None
    {'shopify': run_shopify, 'html': run_html, 'render': run_render}[mode](ids)
