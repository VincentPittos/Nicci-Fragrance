#!/usr/bin/env python3
"""
Lokalny podgląd strony tak, jak poda ją Netlify (i Cloudflare Pages, ten sam układ plików).

  python3 dev/serwer.py [port]        domyślnie 8766, katalog główny: site/

Różnice wobec zwykłego http.server:
  * ładne adresy jak na Pages: /quiz → quiz.html, /wynik?x=1 → wynik.html
  * /__dev/api: atrapa backendu (dev/atrapa_backendu.js) na funkcjach z apps-script/Code.gs. Strona
    kieruje tu zapytania tylko wtedy, gdy API_URL w nicci-api.js ma wartość UZUPELNIJ, więc na produkcji
    ta ścieżka nie istnieje. Zamówienia z podglądu trafiają do dev/zamowienia-dev.json (poza gitem).
  * /__dev/catalog.mock.json: statyczny mock katalogu (zapas, gdy Node nie jest dostępny).
  * nieistniejący adres: 404.html ze statusem 404, tak jak na Pages.
"""
import http.server
import json
import os
import subprocess
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
MOCK = os.path.join(ROOT, 'dev', 'catalog.mock.json')
ATRAPA = os.path.join(ROOT, 'dev', 'atrapa_backendu.js')


def atrapa(req):
    out = subprocess.run(['node', ATRAPA], input=json.dumps(req), capture_output=True, text=True, timeout=30)
    return out.stdout or json.dumps({'ok': False, 'error': 'server_error', 'dev': out.stderr[-500:]})


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

    def _json(self, text):
        data = text.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        u = urllib.parse.urlsplit(self.path)
        if u.path == '/__dev/api':
            return self._json(atrapa({'method': 'GET', 'query': u.query}))
        if not os.path.exists(self.translate_path(self.path)):
            # jak Netlify i Cloudflare Pages: nieistniejący adres dostaje 404.html ze statusem 404
            data = open(os.path.join(SITE, '404.html'), 'rb').read()
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        return super().do_GET()

    def do_POST(self):
        u = urllib.parse.urlsplit(self.path)
        if u.path != '/__dev/api':
            self.send_error(404)
            return
        n = int(self.headers.get('Content-Length') or 0)
        body = self.rfile.read(n).decode('utf-8', 'replace') if n else ''
        return self._json(atrapa({'method': 'POST', 'body': body}))

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt, *args):
        if '404' in (args[1] if len(args) > 1 else ''):
            super().log_message(fmt, *args)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
    http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
