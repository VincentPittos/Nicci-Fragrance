#!/usr/bin/env python3
"""
Wpisuje docelową domenę w miejsca, które muszą mieć adres bezwzględny.

  python3 dev/ustaw_domene.py https://nicci.pl

Co robi (można uruchamiać wielokrotnie, także po zmianie domeny):
  * <link rel="canonical"> na stronach bez noindex: adres bezwzględny,
  * og:url (dopisuje, jeśli go nie ma) i og:image: adres bezwzględny,
  * site/sitemap.xml ze stronami bez noindex (dziś: /, /quiz),
  * linia Sitemap w site/robots.txt.
Strony z <meta name="robots" content="noindex"> (zamówienie, wynik, potwierdzenie, dokumenty w wersji roboczej,
404) nie trafiają do mapy. Gdy regulamin i polityka prywatności będą gotowe, usuń z nich noindex i uruchom
skrypt jeszcze raz.
Dane strukturalne (site/js/dane-strukturalne.js) biorą domenę z przeglądarki i nie wymagają zmian.
"""
import datetime
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')


def page_path(fname):
    name = os.path.splitext(os.path.basename(fname))[0]
    return '/' if name == 'index' else '/' + name


def main():
    if len(sys.argv) != 2 or not re.match(r'^https://[a-z0-9.-]+\.[a-z]{2,}$', sys.argv[1].rstrip('/')):
        sys.exit('Użycie: python3 dev/ustaw_domene.py https://twoja-domena.pl')
    base = sys.argv[1].rstrip('/')
    today = datetime.date.today().isoformat()
    indexed = []

    for f in sorted(glob.glob(os.path.join(SITE, '*.html'))):
        html = open(f, encoding='utf-8').read()
        orig = html
        path = page_path(f)
        noindex = re.search(r'<meta name="robots" content="[^"]*noindex', html)
        abs_url = base + path

        # og:image: względny albo z poprzedniej domeny
        html = re.sub(r'(<meta property="og:image" content=")(?:https?://[^/"]+)?(/[^"]*")', lambda m: m.group(1) + base + m.group(2), html)
        if not noindex:
            indexed.append(path)
            if '<link rel="canonical"' in html:
                html = re.sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="%s">' % abs_url, html)
            else:
                html = html.replace('<meta name="theme-color"', '<link rel="canonical" href="%s">\n<meta name="theme-color"' % abs_url, 1)
            if '<meta property="og:type"' in html:
                if '<meta property="og:url"' in html:
                    html = re.sub(r'<meta property="og:url" content="[^"]*">', '<meta property="og:url" content="%s">' % abs_url, html)
                else:
                    html = html.replace('<meta property="og:type"', '<meta property="og:url" content="%s">\n<meta property="og:type"' % abs_url, 1)
        if html != orig:
            open(f, 'w', encoding='utf-8').write(html)
            print('zaktualizowano', os.path.relpath(f, ROOT))

    urls = ''.join('  <url><loc>%s%s</loc><lastmod>%s</lastmod></url>\n' % (base, p, today) for p in sorted(indexed))
    open(os.path.join(SITE, 'sitemap.xml'), 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '</urlset>\n')
    print('site/sitemap.xml:', ', '.join(sorted(indexed)))

    robots_f = os.path.join(SITE, 'robots.txt')
    robots = open(robots_f, encoding='utf-8').read()
    robots = re.sub(r'\n?Sitemap: .*\n?', '\n', robots).rstrip('\n') + '\n\nSitemap: %s/sitemap.xml\n' % base
    open(robots_f, 'w', encoding='utf-8').write(robots)
    print('site/robots.txt: Sitemap: %s/sitemap.xml' % base)


if __name__ == '__main__':
    main()
