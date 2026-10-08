#!/usr/bin/env python3
"""
Zdjęcia zapachów dodanych w październiku 2026 (Lp. 56 i 72 do 100 w arkuszu doradcy).

Te same zasady co pobierz_zdjecia.py: tylko oficjalne strony i sklepy producentów, zapis źródła każdego pliku
w dev/zdjecia/zrodla.csv, bez obchodzenia zabezpieczeń (403: Kilian, Versace, Maison Francis Kurkdjian; te zdjęcia
dostarcza właściciel). Dodatkowo każdy adres sprawdzamy w robots.txt danej strony, zanim go pobierzemy.

Metody:
  shopify  produkt po uchwycie (handle) albo wyszukaniu: wyszukiwarka sklepu, gdy robots.txt na nią pozwala,
           w przeciwnym razie mapa strony (sitemap_products); dane z /products/<uchwyt>.json
  html     strona produktu → og:image (adres strony z mapy strony producenta)

Użycie:
  python3 dev/zdjecia/pobierz_nowe.py            # wszystkie
  python3 dev/zdjecia/pobierz_nowe.py p74 p75    # wybrane
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.robotparser

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pobierz_zdjecia import UA, get, log, norm, save  # noqa: E402

# id: (sklep, nazwa do znalezienia, słowa wykluczające)
SHOPIFY = {
    'p72': ('https://carnerbarcelona.com', 'Cuirs', ['set', 'sample', 'travel', 'candle', 'body', 'kit']),
    'p74': ('https://www.xerjoff.com/en-us', 'Opera', ['deodorant', 'set', 'kit', 'gift', 'sample']),
    'p75': ('https://parfums-de-marly.com', 'Layton', ['exclusif', 'set', 'sample', 'travel', 'deodorant', 'shower', 'gift', 'kit', 'body']),
    'p76': ('https://parfums-de-marly.com', 'Pegasus Exclusif', ['set', 'sample', 'travel', 'gift', 'kit']),
    'p77': ('https://parfums-de-marly.com', 'Sedley', ['set', 'sample', 'travel', 'deodorant', 'shower', 'gift', 'kit', 'body']),
    'p78': ('https://amouage.com/en-eu', 'Guidance', ['sample', 'set', 'gift', '46', 'body', 'candle']),
    'p79': ('https://creedboutique.com', 'Delphinus', ['set', 'sample', 'gift', 'travel', 'body']),
    'p80': ('https://essentialparfums.com', 'Velvet Iris', ['set', 'sample', 'refill', 'discovery', 'candle', 'body']),
    'p81': ('https://essentialparfums.com', 'Ambre Latte', ['set', 'sample', 'refill', 'discovery', 'candle', 'body']),
    'p82': ('https://www.ormondejayne.com', 'Kashmir', ['set', 'sample', 'travel', 'candle', 'body', 'discovery', 'intensivo']),
    'p85': ('https://sospirointernational.com', 'Basso', ['set', 'sample', 'travel', 'discovery']),
    'p86': ('https://www.tomfordbeauty.com', 'Velvet Orchid', ['set', 'body', 'mini', 'travel', 'candle', 'lumiere', 'lip']),
    'p87': ('https://www.tomfordbeauty.com', 'Black Orchid', ['set', 'body', 'mini', 'travel', 'candle', 'lip', 'voile', 'velvet', 'toilette', 'parfum black', 'fleur']),
    'p88': ('https://www.tomfordbeauty.com', 'Oud Voyager', ['set', 'body', 'mini', 'travel', 'candle']),
    'p95': ('https://www.atkinsons1799.com', 'Shine Despite Everything', ['set', 'sample', 'travel', 'candle']),
    'p96': ('https://www.atkinsons1799.com', 'Oud Save The King', ['set', 'sample', 'travel', 'candle']),
    'p97': ('https://www.atkinsons1799.com', 'Mint & Tonic', ['set', 'sample', 'travel', 'candle']),
}

# id: (domena z mapą strony, ostatni człon adresu strony produktu) dla sklepów spoza Shopify; człon musi się
# zgadzać dokładnie, bo w mapie są też olejki, mgiełki i zestawy z tą samą nazwą
SITEMAP_HTML = {
    'p84': ('https://nishane.com', ['wulong-cha']),
    'p99': ('https://www.sisley-paris.com', ['soir-d-orient', 'soir-dorient']),
}

_robots = {}


def allowed(url):
    p = urllib.parse.urlparse(url)
    base = f'{p.scheme}://{p.netloc}'
    if base not in _robots:
        rp = urllib.robotparser.RobotFileParser()
        try:
            rp.parse(get(base + '/robots.txt').splitlines())
        except Exception:
            rp = None  # brak robots.txt albo błąd: zachowujemy się ostrożnie i nie pobieramy
        _robots[base] = rp
    rp = _robots[base]
    return bool(rp) and rp.can_fetch('*', url)


def fetch(url, binary=False):
    if not allowed(url):
        raise PermissionError('robots.txt nie pozwala: ' + url)
    return get(url, binary)


def sitemap_urls(root, want, limit=40):
    """Adresy z mapy strony (rekurencyjnie po indeksach), które zawierają wszystkie słowa z want."""
    out, todo, seen = [], [root], set()
    while todo and len(seen) < limit:
        sm = todo.pop(0)
        if sm in seen:
            continue
        seen.add(sm)
        try:
            xml = fetch(sm)
        except Exception as e:
            print('   mapa', sm, str(e)[:80])
            continue
        locs = re.findall(r'<loc>\s*([^<\s]+)\s*</loc>', xml)
        for loc in locs:
            loc = loc.replace('&amp;', '&')
            if loc.endswith('.xml') or 'sitemap' in loc.split('/')[-1]:
                if any(k in loc for k in ('product', 'sitemap_index', 'sitemap.xml', 'en', 'pl')) and loc not in seen:
                    todo.append(loc)
            elif all(w in loc.lower() for w in want):
                out.append(loc)
    return list(dict.fromkeys(out))


def shopify_handle(base, name, exclude):
    q = urllib.parse.quote(name)
    sug = f'{base}/search/suggest.json?q={q}&resources%5Btype%5D=product&resources%5Blimit%5D=10'
    want = norm(name)
    if allowed(sug):
        data = json.loads(fetch(sug))
        for p in data['resources']['results']['products']:
            t = norm(p['title'])
            if want in t and not any(x in t for x in exclude):
                return p['title'], p['url'].split('/products/')[1].split('?')[0]
        return None, None
    # wyszukiwarka zablokowana w robots.txt: mapa strony produktów
    root = urllib.parse.urlparse(base)
    slug = want.replace(' ', '-')
    for loc in sitemap_urls(f'{root.scheme}://{root.netloc}/sitemap.xml', ['/products/']):
        h = loc.split('/products/')[1].split('?')[0].strip('/')
        if slug.split('-')[0] in h and all(w in h for w in slug.split('-')) and not any(x in h for x in exclude):
            return h, h
    return None, None


def run_shopify(ids):
    rows = []
    for pid, (base, name, exclude) in SHOPIFY.items():
        if ids and pid not in ids:
            continue
        try:
            title, handle = shopify_handle(base, name, exclude)
            if not handle:
                print(pid, name, 'NIE ZNALEZIONO'); continue
            product = json.loads(fetch(f'{base}/products/{handle}.json'))['product']
            for n, img in enumerate(product['images'][:3]):
                src = img['src'].split('?')[0]
                if not allowed(src):
                    continue
                path = save(pid, src, n)
                rows.append({'id': pid, 'wariant': n, 'tytul': product['title'], 'strona': f'{base}/products/{handle}',
                             'obraz': src, 'wymiary': f"{img['width']}x{img['height']}", 'plik': os.path.basename(path)})
            print(pid, product['title'], '|', len(product['images']), 'zdjęć')
        except Exception as e:  # jedna marka nie może zatrzymać reszty
            print(pid, name, 'BŁĄD', str(e)[:140])
    log(rows)


def run_html(ids):
    rows = []
    for pid, (domain, words) in SITEMAP_HTML.items():
        if ids and pid not in ids:
            continue
        try:
            robots = get(domain + '/robots.txt')
            maps = [l.split(':', 1)[1].strip() for l in robots.splitlines() if l.lower().startswith('sitemap:')]
            pages = []
            for m in maps:
                for w in words:
                    pages += sitemap_urls(m, [w])
                if pages:
                    break
            pages = [p for p in dict.fromkeys(pages) if p.rstrip('/').split('/')[-1] in words or
                     any(p.rstrip('/').split('/')[-1].startswith(w + '-') and p.rstrip('/').split('/')[-1][len(w) + 1:].isdigit() for w in words)]
            pages = [p for p in pages if '/fr/' not in p and '/fr-' not in p] or pages
            if not pages:
                print(pid, 'brak strony produktu w mapie'); continue
            page = pages[0]
            html = fetch(page)
            found = re.findall(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', html) + \
                re.findall(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', html)
            srcs = list(dict.fromkeys(urllib.parse.urljoin(page, u.replace('&amp;', '&')) for u in found))
            if not srcs:
                print(pid, page, 'brak og:image'); continue
            for n, src in enumerate(srcs[:2]):
                path = save(pid, src, n)
                rows.append({'id': pid, 'wariant': n, 'tytul': '', 'strona': page, 'obraz': src, 'wymiary': '', 'plik': os.path.basename(path)})
            print(pid, page, len(srcs), 'og:image')
        except Exception as e:
            print(pid, 'BŁĄD', str(e)[:140])
    log(rows)


if __name__ == '__main__':
    ids = set(sys.argv[1:])
    run_shopify(ids)
    run_html(ids)
