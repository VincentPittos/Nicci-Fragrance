# Nicci Fragrances

Strona sprzedażowa odlewek oryginalnych perfum (5, 10, 20 ml) i zestawów odkrywców. Statyczny front na Cloudflare Pages, backend w Google Apps Script, arkusz Google jako baza danych.

## Struktura

| Katalog | Zawartość |
|---|---|
| `site/` | Strona publikowana na Cloudflare Pages. `nicci-api.js` to moduł integracji, zmienia się w nim tylko `API_URL` i `IG_HANDLE`. |
| `apps-script/` | `Code.gs` i manifest. Wklejasz do projektu Apps Script przy arkuszu. |
| `dev/` | Konwersja arkusza, mock katalogu, testy backendu, podglądy etapów. Nie trafia na produkcję. |
| `docs/` | Raporty etapów, kontrakt API, rejestr decyzji. |
| `refs/` | Materiały wejściowe: prompt, architektura, referencje graficzne, artifact sekcji 2. |

## Praca lokalna

```bash
python3 dev/konwersja_arkusza.py      # arkusz z refs/prywatne → dev/dane (wymaga openpyxl)
node dev/zbuduj_mock.js               # dev/dane/arkusz.json → dev/catalog.mock.json przez Code.gs
node dev/testy_backendu.js            # testy backendu i zgodności z nicci-api.js
```

`refs/prywatne/` jest poza gitem, bo repozytorium jest publiczne, a arkusz źródłowy zawiera wewnętrzne notatki doradcy. Wrzuć tam plik `Nicci_Fragrance_Katalog_Produktow.xlsx`, żeby odtworzyć konwersję.

## Dokumenty

* `docs/01-rozpoznanie.md`: kontrakt `window.Nicci`, analiza arkusza, struktura plików
* `docs/kontrakt-api.md`: pola katalogu, zamówienia i błędów
* `docs/decyzje.md`: decyzje właściciela i sprawy otwarte
* `dev/dane/raport-konwersji.md`: mapowanie danych z arkusza
