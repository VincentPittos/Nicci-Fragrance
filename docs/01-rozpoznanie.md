# Etap 1: Rozpoznanie

Stan na 23.09.2026. Źródła: `refs/nicci-api.js`, `refs/prywatne/Nicci_Fragrance_Katalog_Produktow.xlsx` (poza gitem, repo jest publiczne), `refs/README.md`, `refs/architektura-strony.md`, `refs/sekcja-2-jak-to-dziala.html` (pobrany z artifactu), zrzuty `refs/ref-*.webp|png`.

Oznaczenia: **[kod]** potwierdzone w `nicci-api.js`, **[dok]** tylko w README lub architekturze, **[arkusz]** z pliku xlsx, **[wniosek]** moja interpretacja do potwierdzenia.

---

## 1. Kontrakt `window.Nicci`

| Funkcja | Sygnatura i wynik | Uwagi do budowy UI |
|---|---|---|
| `CONFIG` | `API_URL`, `IG_HANDLE`, `CART_KEY`, `ORDER_KEY`, `SRC_KEY`, `QUIZ_KEY` | Uzupełniam tylko `API_URL` i `IG_HANDLE`. |
| `pln(grosze)` | `11000` → `"110,00 zł"` | Ceny w API są w **groszach** [kod]. |
| `readUrlParams()` | → `{src, rodzina, marka}` | Zapisuje `src` w **localStorage** [kod]. |
| `fetchCatalog(force)` | → `Promise<{products, sets, freeShippingFrom, shipping}>` | Cache tylko w pamięci jednej strony. Cache w `sessionStorage` robię w warstwie strony. |
| `findProduct(catalog, id)`, `findSet(catalog, id)` | → obiekt albo `null` | |
| `groupProducts(products, 'rodzina'\|'marka')` | → `[{key, items}]`, sortowanie `pl` | Produkt bez rodziny trafia do grupy `inne`. |
| `filterProducts(products, f)` | `f = {rodzina[], marka[], pora, sezon, tylkoDostepne, szukaj}` | **Brak filtra `profil`**, którego wymaga prompt. `pora`: produkty `uniwersalna` przechodzą zawsze. Szukanie po marce, nazwie, rodzinie i nutach. |
| `cart.items()`, `save()`, `onChange(fn)` | pozycje `{type:'decant', id, ml, qty}` albo `{type:'set', id, qty}` | Koszyk w **localStorage**. `onChange` działa w obrębie jednej karty. |
| `cart.addDecant(id, ml, qty)`, `addSet(id, qty)` | limit 5 sztuk na pozycję | |
| `cart.setQty(index, qty)`, `remove(index)`, `clear()`, `count()` | operacje po indeksie | |
| `cart.summary(catalog, delivery)` | → `{lines[{item, nazwa, opis, price, total, available}], subtotal, shipping, total, toFreeShipping}` | Pozycje nieznalezione w katalogu są po cichu pomijane. |
| `quiz.questions` | 5 pytań, niżej | |
| `quiz.recommend(catalog, answers, n=3)` | → `{top[3], set\|null, rodziny[]}` | Tylko pozycje dostępne. Zapisuje odpowiedzi w localStorage. **Nie zwraca punktacji**, więc nie ma progu dopasowania. |
| `createOrder(payload)` | → `res`; `ok`+`numer`: zapis zamówienia, czyszczenie koszyka | Błędy: `validation`, `out_of_stock`, `rate_limited`, `busy`, `invalid_item`, `server_error`, `network`, tekst w `res.message`. |
| `lastOrder()` | → ostatnia odpowiedź `createOrder` | |
| `sendOrderToInstagram(order)` | kopiuje `order.igMessage`, otwiera `ig.me/m/{handle}` | |
| `copy(text)` | → `Promise<bool>` | |

## 2. Pola danych

### Produkt (`catalog.products[]`)

| Pole | Źródło | Uwagi |
|---|---|---|
| `id`, `marka`, `nazwa`, `rodzina`, `profil`, `pora`, `intensywnosc`, `kolejnosc` | [kod] | |
| `sezon` | [kod] | **tablica** (`p.sezon.map`) |
| `nuty.glowy`, `nuty.serca`, `nuty.bazy` | [kod] | tablice |
| `variants[]` = `{ml, price, available}` | [kod] | `price` w groszach |
| `opis`, `trwalosc`, `projekcja`, `podobne`, `zdjecie_url` | [dok] | nazwy kluczy w JSON niepotwierdzone |
| `malo`, liczba pozostałych ml | [dok] | nazwa klucza z liczbą ml **nieznana** |
| `okazja` | [arkusz] | nie ma jej w schemacie z README |

### Zestaw (`catalog.sets[]`)
`id`, `nazwa`, `rodzina`, `price`, `available` [kod]; `opis`, `sklad[]` z `nazwa` i `ml` [dok]. Nie wiadomo, czy API podaje, **który** składnik jest niedostępny.

### Katalog i zamówienie
`freeShippingFrom`, `shipping.paczkomat`, `shipping.kurier` [kod]. Odpowiedź zamówienia: `ok`, `numer`, `error`, `igHandle`, `igMessage` [kod]; `fields`, `shortages`, `terminTxt` [dok]; dane do płatności (numer BLIK, konto, odbiorca, kwota) mają **nieznane nazwy kluczy**.

**Blokada:** brakuje `apps-script/Code.gs` albo przykładowej odpowiedzi `?action=catalog` i `createOrder`. Bez tego nazwy pól z tabel [dok] są założeniem.

## 3. Pytania quizu i proponowana mapa ikon

Każda ikona: line art, obrys 1,5 px, zaokrąglone końce, siatka 32×32, `--n-gold`, bez wypełnień, `aria-hidden`.

| # | `id` | Pytanie | Typ | `v` → etykieta | Ikona |
|---|---|---|---|---|---|
| 1 | `profil` | Dla kogo szukasz zapachu? | jeden | `meski` → Dla niego | flakon o kanciastych ramionach |
| | | | | `damski` → Dla niej | flakon o miękkim, owalnym obrysie |
| | | | | `unisex` → Bez znaczenia | dwa flakony zachodzące na siebie |
| 2 | `klimat` | Który klimat jest Ci najbliższy? | **maks. 2** | `swiezy` → Świeżo i czysto (świeża, cytrusowa, aromatyczna, wodna) | listek z kroplą |
| | | | | `drzewny` → Drzewnie i elegancko (drzewna, skórzana, szyprowa) | słój drewna |
| | | | | `slodki` → Słodko i otulająco (słodka, orientalna, ambrowa, gourmand) | kropla karmelu |
| | | | | `kwiatowy` → Kwiatowo (kwiatowa) | kwiat z profilu |
| 3 | `pora` | Kiedy chcesz go nosić? | jeden | `dzień` → Na co dzień | słońce w zenicie |
| | | | | `wieczór` → Wieczorem i na wyjścia | półksiężyc |
| | | | | `uniwersalna` → Do wszystkiego | słońce i księżyc razem |
| 4 | `sezon` | W jakiej porze roku? | jeden | `cieplo` → Ciepłe miesiące | słońce nad wodą |
| | | | | `chlodno` → Chłodne miesiące | płatek śniegu |
| | | | | `caly` → Cały rok | pąk, słońce, liść i płatek na jednym okręgu |
| 5 | `intensywnosc` | Jak mocny ma być? | jeden | `1` → Blisko skóry | punkt i jeden łuk |
| | | | | `2` → Wyczuwalny | dwa łuki |
| | | | | `3` → Zostawia ślad | trzy łuki |

Razem 16 ikon. Kierunki z promptu dla 10 rodzin i 4 pór roku nie pasują 1:1, bo API grupuje rodziny w 4 klimaty i pory roku w 3 odpowiedzi. API ma tylko etykietę `t`, więc linię doprecyzowania pod etykietą piszę w warstwie strony. Dla pytania o klimat buduję ją z `opcje[].rodziny`.

## 4. Arkusz a kontrakt API

Arkusz jest **bazą wiedzy doradcy**, a nie zakładką `Produkty` z README. 71 wierszy, 3 zakładki: katalog, 7 zestawów, instrukcja.

| Pole API | W arkuszu | Problem |
|---|---|---|
| `id` | brak | propozycja: `p01`–`p71` według `Lp.` |
| `aktywny` / stan | `Status`: Dostępny 65, NIEDOSTĘPNY 5, Dostępny (promocja) 1 | brak `ml_dostepne`, więc nie ma „Zostało X ml” |
| `rodzina` | **55 różnych opisów** („Korzenno-drzewna”, „Agarowo-różana”…) | quiz i karuzela wymagają jednej z 12 nazw kanonicznych. Bez mapowania quiz nie daje nikomu punktów za rodzinę |
| `profil` | brak | pytanie 1 quizu nie działa |
| `intensywnosc` | brak | pytanie 5: każdy produkt dostaje domyślne 2 |
| `sezon` | 19 wariantów tekstu („Cały rok, najlepiej wiosna i jesień”, „Lato (upały), późna wiosna”) | wymaga listy z: wiosna, lato, jesień, zima |
| `pora` | 6 wariantów (Dzień i wieczór, Wieczór, noc…) | wymaga: dzień, wieczór, uniwersalna |
| `trwalosc`, `projekcja` | **liczby 1–5** z połówkami (README: tekst) | paski dają się zmapować jednoznacznie, ale instrukcja arkusza mówi: „szacunki, nie obietnica wobec klienta” |
| `cena_5/10/20` | jedna kolumna tekstowa | 36 produktów bez 5 ml, 4 tylko 20 ml, Ganymede 10 ml z „(?)”, Amouage Search „(promocja)” bez pola na promocję |
| `podobne` | nazwy, nie `id` | 5 nazw nie trafia w katalog: Xerjoff Renaissance (×5, w katalogu „Renaissance (XJ 1861)”), Amouage Otlands, Amouage Reflection, LV Nouvau Monde (×2), Nous Tous Saffrano Absolu |
| `zdjecie_url`, `kolejnosc` | brak | etap 3 / `Lp.` |
| `okazja` | jest, poza schematem API | Lp. 1 ma wartość `11` |
| nie publikować | Notatka doradcy, Pewność danych, Uwagi | |

### Produkty wymagające decyzji właściciela

* **Wiersze 56, 57, 58: brak marki i nazwy**, brak pory roku, pory dnia, okazji, trwałości i projekcji; wiersz 58 bez ceny i podobnych. Z notatek i źródeł [wniosek, niepotwierdzone]: 56 to prawdopodobnie Versace Eros Energy, 57 Versace Eros Najim (wprost w uwagach), 58 być może Versace Eros Flame.
* **Pewność „Niska”** (arkusz: nie publikować bez sprawdzenia): 18 Amouage Interlude Black Iris, 26 Mancera Instant Crush, 60 Hugo Boss Bottled Absolu; 39 Ganymede ma niską pewność ceny 10 ml.
* **Pewność „Średnia”**: 18 pozycji (3, 12, 13, 21, 24, 25, 30, 38, 55, 59, 61, 63, 64, 65, 66, 69, 70, 71).
* **Niedostępne**: 13 Creed Virgin Island Water (nazwa do potwierdzenia), 18, 26, 34 Tom Ford Lost Cherry, 37 Tom Ford Oud Wood.
* **Opisy**: wszystkie 71 są wypełnione (31–78 słów). Trzy zawierają „ - ” w roli myślnika, co łamie regułę 6: 9 Xerjoff Uden, 28 Montale Arabians Tonka, 44 Essential Parfums Bois Impérial. Opisów nie przepisuję, poprawka należy do arkusza.
* **Liczba zapachów**: dostępnych, nazwanych i z ceną jest **63**. Hasło „PONAD 70 ZAPACHÓW” z referencji byłoby dziś nieprawdziwe, dlatego liczba w pasku zaufania i na ekranie przejściowym quizu będzie dynamiczna.

### Zestawy (7)

| Zestaw | Cena | Problem |
|---|---|---|
| LV Discovery | 550 | jedyny z policzalną oszczędnością: 5 ml z katalogu = 630, czyli 80 zł |
| Xerjoff Discovery | 290 | skład „do ustalenia”; Renaissance zapisany inną nazwą |
| Nous Tous Discovery | „350 zł” (tekst) | brak cen 5 ml w katalogu |
| Sweet & Spicy | 480 | zawiera **Lost Cherry (niedostępny)**, więc zestaw będzie niedostępny |
| Entry | 320 | „Amouage Reflection” nie ma w katalogu (jest Reflection Man?) |
| Autumn Discovery | 250 | „YSL Y le Parfum” ≠ „Y Parfum”; ceny 5 ml nie ma w katalogu |
| Winter Discovery | 540 | 5 składników i 6 cen; „5x ml” |

Żaden zestaw nie ma kolumny `rodzina`, więc `recommend()` nigdy nie zaproponuje zestawu po quizie. Skład jest nazwami, a API oczekuje formatu `p01:5, p07:5`.

## 5. Artifact sekcji 2

Pobrany 1:1 do `refs/sekcja-2-jak-to-dziala.html`. Fonty: Cormorant Garamond i Jost, więc tę parę stosuję w całej stronie. Wymóg treściowy jest spełniony: krok 2 mówi o rezerwacji na 24 godziny, krok 4 o BLIKu na telefon i przelewie. Do decyzji:

1. CTA prowadzi do `#quiz`. Nie muszę go zmieniać: strona główna przekieruje `/#quiz` na `/quiz` z zachowaniem `src`. To naprawia też linki z InstantDM w README (`/?src=reel12#quiz`).
2. Karta 2 ma tykający licznik „23:59:59”. To ilustracja rezerwacji, ale reguła 5 i sekcja 14 zakazują sztucznych liczników.
3. Zdjęcie jest osadzone jako base64 (około 50 KB w HTML). Proponuję wyjąć je do pliku WebP bez zmiany znaczników poza `src`.

## 6. Proponowana struktura plików

```
nicci/
  refs/                 materiały wejściowe, bez zmian
  docs/                 raporty etapów i decyzje
  dev/
    xlsx-do-mocka.py    arkusz → JSON w kształcie API (tylko do developmentu)
    catalog.mock.json   {ok:true, data:{products, sets, freeShippingFrom, shipping}}
    serve.sh            lokalny serwer z API_URL wskazującym na mock
  site/                 katalog publikowany na Cloudflare Pages
    index.html  quiz.html  wynik.html  zamowienie.html
    potwierdzenie.html  regulamin.html  prywatnosc.html  404.html
    nicci-api.js        kopia 1:1, zmienione tylko API_URL i IG_HANDLE
    _headers            cache i nagłówki bezpieczeństwa (CSP)
    robots.txt  sitemap.xml
    css/  tokens.css (prymitywy → semantyka → komponenty)  base.css
          components.css  sections.css  how.css  pages.css
    js/   app.js (nagłówek, src, cache katalogu, szuflada koszyka)
          motion.js (sprężyny, gesty, reduced motion)  drawer.js (sheet, focus trap)
          catalog.js  families.js  how.js (skrypt artifactu bez zmian)
          quiz.js  result.js  checkout.js  confirm.js  notes-map.js
    img/  hero/  rodziny/  produkty/{id}-400.webp, {id}-800.webp  nuty/  og/
    icons/ quiz.svg (sprite 16 ikon)  ui.svg
```

Mock działa bez dotykania logiki modułu: `fetchCatalog` wysyła `GET API_URL?action=catalog`, a serwer statyczny ignoruje query, więc w developmencie `API_URL` wskazuje na `catalog.mock.json`. Dla `createOrder` potrzebny jest mały stub tylko w `dev/`.

To repozytorium to projekt Skalentra (Next.js, Netlify). Nicci trzymam w osobnym katalogu `nicci/`, a Cloudflare Pages może publikować podkatalog `nicci/site` bez kroku budowania. `npm run lint` Skalentry obejmie jednak `nicci/**/*.js`, więc trzeba go wykluczyć w `eslint.config.mjs` albo przenieść Nicci do osobnego repozytorium.

## 7. Skille

Dostępne: ui-ux-pro-max, apple-design, frontend-ui-engineering, ui-styling, design-system, web-design-guidelines, performance-optimization, copywriting, storytelling, marketing-psychology, cro, humanizer, security-and-hardening, schema, ai-seo. OpenArt MCP jest podłączony.

Niedostępne w tej sesji: **/frontend-design** (zastępstwo: `design` i `ui-ux-pro-max`), **/design:accessibility-review** (zastępstwo: `web-design-guidelines` i ręczny audyt WCAG 2.2 AA), **/design:ux-copy** (zastępstwo: `copywriting`, `copy-editing`, `writing-guidelines`).

Strona scentbird.com jest zablokowana przez proxy tego środowiska. Referencją są zrzuty `ref-rodziny-1.webp` i `ref-katalog-scentbird.png`.
