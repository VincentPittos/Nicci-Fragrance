# Nicci Fragrance

Strona sprzedażowa odlewek oryginalnych perfum (5, 10, 20 ml) i zestawów odkrywców. Statyczny front na Netlify, backend w Google Apps Script, arkusz Google jako baza danych.

## Struktura

| Katalog | Zawartość |
|---|---|
| `site/` | Strona publikowana na Netlify (`netlify.toml` w katalogu głównym wskazuje `site/`). `nicci-api.js` to moduł integracji, zmienia się w nim tylko `API_URL` i `IG_HANDLE`. |
| `apps-script/` | `Code.gs` i manifest. Wklejasz do projektu Apps Script przy arkuszu. |
| `dev/` | Konwersja arkusza, mock katalogu, testy backendu, podglądy etapów. Nie trafia na produkcję. |
| `docs/` | Raporty etapów, kontrakt API, rejestr decyzji. |
| `refs/` | Materiały wejściowe: prompt, architektura, referencje graficzne, artifact sekcji 2. |

## Praca lokalna

```bash
python3 dev/konwersja_arkusza.py      # arkusz z refs/prywatne → dev/dane (wymaga openpyxl)
node dev/zbuduj_mock.js               # dev/dane/arkusz.json → dev/catalog.mock.json i site/podglad/katalog.json przez Code.gs
node dev/testy_backendu.js            # testy backendu i zgodności z nicci-api.js
python3 dev/serwer.py                 # podgląd na http://127.0.0.1:8766 z atrapą backendu (dev/atrapa_backendu.js)
node dev/testy_readme.js              # testy 1, 2, 3 i 7 z refs/README.md w przeglądarce (Playwright)
python3 dev/ustaw_domene.py https://twoja-domena.pl   # canonical, og:url, sitemap.xml i robots.txt po ustaleniu domeny
```

Dopóki `API_URL` w `nicci-api.js` ma `UZUPELNIJ`, strona na hostingu pokazuje katalog z `site/podglad/katalog.json` i nie przyjmuje zamówień (komunikat „To podgląd sklepu”). Po zmianie danych w arkuszu odśwież ten plik przez `node dev/zbuduj_mock.js`. Po wpisaniu `API_URL` plik jest nieużywany.

`refs/prywatne/` jest poza gitem, bo repozytorium jest publiczne, a arkusz źródłowy zawiera wewnętrzne notatki doradcy. Wrzuć tam plik `Nicci_Fragrance_Katalog_Produktow.xlsx`, żeby odtworzyć konwersję.

## Dokumenty

* `docs/01-rozpoznanie.md`: kontrakt `window.Nicci`, analiza arkusza, struktura plików
* `docs/kontrakt-api.md`: pola katalogu, zamówienia i błędów
* `docs/lista-przed-publikacja.md`: co właściciel wysyła, co wpisuje sam, co uzupełnia w arkuszu
* `docs/uruchomienie-domeny-i-poczty.md`: domena (domeny.pl, Cloudflare, Netlify), poczta Google Workspace i podłączenie arkusza krok po kroku
* `docs/raport-koncowy.md`: lista TODO, wyniki audytu, braki w arkuszu, wdrożenie na Netlify
* `docs/decyzje.md`: decyzje właściciela i sprawy otwarte
* `dev/dane/raport-konwersji.md`: mapowanie danych z arkusza
