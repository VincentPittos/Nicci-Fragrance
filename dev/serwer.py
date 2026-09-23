#!/usr/bin/env python3
"""
Lokalny podgląd strony tak, jak poda ją Cloudflare Pages.

  python3 dev/serwer.py [port]        domyślnie 8766, katalog główny: site/

Różnice wobec zwykłego http.server:
  * ładne adresy jak na Pages: /quiz → quiz.html, /wynik?x=1 → wynik.html
  * /__dev/catalog.mock.json podaje dev/catalog.mock.json. Strona sięga po niego tylko wtedy, gdy
    API_URL w nicci-api.js nadal ma wartość UZUPELNIJ, więc na produkcji ta ścieżka nie istnieje.
"""
import http.server
import os
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
MOCK = os.path.join(ROOT, 'dev', 'catalog.mock.json')


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=SITE, **kw)

    def translate_path(self, path):
        clean = urllib.parse.urlsplit(path).path
        if clean == '/__dev/catalog.mock.json':
            return MOCK
        local = super().translate_path(path)
        if not os.path.splitext(clean)[1] and not os.path.isdir(local) and os.path.exists(local + '.html'):
            return local + '.html'
        return local

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt, *args):
        if '404' in (args[1] if len(args) > 1 else ''):
            super().log_message(fmt, *args)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
    http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
