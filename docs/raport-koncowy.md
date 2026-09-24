# Raport końcowy

Stan na 23.09.2026, gałąź `claude/serene-cray-umqpzo`. Strona jest kompletna technicznie: wszystkie podstrony z promptu działają na atrapie backendu z funkcjami `Code.gs`, przechodzą testy dostępności, wydajności i ścieżki zamówienia. Do startu sprzedaży brakuje danych, których nie wolno nam zgadywać: konfiguracji płatności, stanów w arkuszu, terminów wysyłki i tekstów prawnych. Wszystkie są wypisane niżej, z informacją, od kogo są potrzebne.

## 0. Najpierw to: blokady startu

Aktualizacja 24.09.2026: odpowiedzi właściciela z `docs/lista-przed-publikacja.md` są wpisane (decyzje 46 do 58). Zostały te blokady:

| # | Co | Dlaczego blokuje | Kto |
|---|---|---|---|
| 1 | `CONFIG` w `apps-script/Code.gs`: e-mail właściciela, BLIK, konto, odbiorca, koszty dostawy | Bez tego nie ma danych do płatności w mailu i na stronie potwierdzenia, a zamówienie kończy się błędem `server_error` (brak kosztu dostawy). `SELLER_INFO`, `IG_HANDLE` i `SITE_URL` są już wpisane. | właściciel |
| 2 | `API_URL` w `site/nicci-api.js` | Bez adresu `/exec` strona nie pobierze katalogu. `IG_HANDLE` jest wpisany (`nicci_fragrance`). | właściciel po wdrożeniu Apps Script |
| 3 | Regulamin i polityka prywatności | Szkielety z `{TODO}`, oznaczone „nie publikować w tej postaci”, na razie z `noindex`. Prawnik musi też ocenić zasadę „odlewek nie przyjmujemy z powrotem” wobec prawa odstąpienia. | właściciel i prawnik |
| 4 | Dane sprzedawcy | Stopka i maile mają „Nicci Fragrance, działalność nierejestrowana” i `kontakt@niccifragrance.pl`. Imię, nazwisko i adres w dokumentach czekają na prawnika. Skrzynka ruszy po zakupie domeny i musi działać przed startem. | właściciel |

## 1. Lista `{TODO}` i `UZUPELNIJ`, od kogo potrzebne są dane

Każdy `{TODO}` na stronie ma przerywaną ramkę (`[data-todo]`), więc widać go na podglądzie. Pytania FAQ z TODO nie trafiają do danych strukturalnych, dopóki odpowiedź nie jest uzupełniona.

### Konfiguracja (właściciel)

| Plik i miejsce | Pole | Uwagi |
|---|---|---|
| `site/nicci-api.js:17` | `API_URL` | adres wdrożenia Apps Script kończący się na `/exec` |
| `apps-script/Code.gs`, `CONFIG` | `OWNER_EMAIL`, `BLIK_PHONE`, `BANK_ACCOUNT`, `RECIPIENT` | mają dziś `UZUPELNIJ`; `diagnostyka` w Apps Script wypisze brakujące |
| `apps-script/Code.gs`, `CONFIG.SHIPPING` | `paczkomat`, `kurier` | dziś `null`; bez nich zamówienie nie przejdzie |
| `apps-script/Code.gs`, `CONFIG.FREE_SHIPPING_FROM` | próg darmowej dostawy w zł | dziś `0`, czyli wyłączony; pasek „brakuje X zł do darmowej dostawy” pojawi się po ustawieniu |
| `apps-script/Code.gs`, `CONFIG.TRACKING_URLS` | linki śledzenia InPost, DPD, DHL | automatycznie odpowiedział tylko DPD; sprawdzić każdy na pierwszej przesyłce |

### Treści na stronie (właściciel z prawnikiem)

| Miejsce | Czego brakuje |
|---|---|
| `index.html:285` gwarancje | potwierdzenie zgodności z regulaminem od prawnika |
| `index.html:319` FAQ „Czy mogę zwrócić odlewkę?” | ocena zasady właściciela wobec prawa odstąpienia (art. 38 ustawy o prawach konsumenta) |

### Dokumenty prawne (właściciel z prawnikiem)

| Miejsce | Czego brakuje |
|---|---|
| `regulamin.html:66`, `prywatnosc.html:66` | imię i nazwisko oraz adres sprzedawcy i administratora danych |
| `regulamin.html:70` | sformułowanie i status sprzedaży odlewek |
| `regulamin.html:75` | moment zawarcia umowy: złożenie zamówienia czy zaksięgowanie wpłaty |
| `regulamin.html:88` | prawo odstąpienia, formularz odstąpienia; zasady właściciela są wpisane w TODO do oceny |
| `regulamin.html:92` | reklamacje: jak zgłosić, termin odpowiedzi, zwrot pieniędzy |
| `regulamin.html:100` | prawo właściwe, pozasądowe rozwiązywanie sporów, data wejścia w życie |
| `prywatnosc.html:74` | podstawy prawne: rejestr wpłat (obowiązek prawny), źródło wejścia i quiz (uzasadniony interes) |
| `prywatnosc.html:78` | umowy powierzenia, przekazywanie danych poza EOG |
| `prywatnosc.html:82` | okresy przechowywania |
| `prywatnosc.html:90` | aktualizacja, jeśli dojdzie analityka albo piksel reklamowy |

Po zatwierdzeniu dokumentów usuń z nich `<meta name="robots" content="noindex">` i uruchom `python3 dev/ustaw_domene.py https://niccifragrance.pl` jeszcze raz, żeby trafiły do mapy strony.

## 2. OpenArt: zużycie i kadry

Model Nano Banana 2, 2K. **Zużyte 515 z limitu 660, saldo konta 385** (potwierdzone `openart_account_get`). 17 generacji: 14 przyjętych i 3 odrzucone (powtórki orientalnej i słodkiej oraz test modelu GPT Image, który przegrał z Nano Banana 2). Pełny dziennik z identyfikatorami `historyId` i promptami: `docs/03-plan-grafik.md`.

| Kadr | Pliki na stronie |
|---|---|
| 10 rodzin: cytrusowa, drzewna, gourmand, orientalna, aromatyczna, ambrowa, skórzana, świeża, kwiatowa, słodka | `site/img/rodziny/{rodzina}-45-640/1280.webp`, `-43-800/1200.webp` |
| Opcja A: odlewanie z flakonu do atomizera (sekcja 2, karta 3) | `site/img/sekcja2/odlewanie-300/600/1200.webp` |
| Opcja B: 3 arkusze nut 4×4, pocięte na 48 miniatur | `site/img/nuty/{slug}.webp` |

Hero i grafika Open Graph powstały z materiału właściciela (`refs/hero-czysty.webp`), bez generowania.

## 3. Źródła zdjęć produktów

Wszystkie 64 aktywne produkty mają zdjęcie: 49 ze stron producentów (tabela niżej) i 15 od właściciela (akapit pod tabelą). Źródło tych 49: oficjalne strony i sklepy producentów. `robots.txt` każdej domeny był sprawdzony i przestrzegany, Fragrantiki nie pobieraliśmy, a zabezpieczeń przed botami (403, Cloudflare) nie obchodziliśmy. Pełne adresy obrazów: `dev/zdjecia/zrodla-wybrane.csv` (użyte) i `dev/zdjecia/zrodla.csv` (wszyscy kandydaci). Obróbka: tło #F1EFEC, kadr 4:5, flakon bez zmian (`dev/zdjecia/ujednolic_zdjecia.py`).

To materiały marek. Przed startem warto potwierdzić prawo do ich użycia albo zastąpić je własnymi zdjęciami flakonów i atomizerów Nicci.

| id | Marka | Zapach | Strona producenta | Poprawki |
|---|---|---|---|---|
| p06 | Xerjoff | Torino21 | https://www.xerjoff.com/en-us/products/torino21-eau-de-parfum |  |
| p07 | Xerjoff | Renaissance (XJ 1861) | https://www.xerjoff.com/en-us/products/renaissance-eau-de-parfum |  |
| p08 | Xerjoff | Erba Pura | https://www.xerjoff.com/en-us/products/erba-pura-eau-de-parfum |  |
| p09 | Xerjoff | Uden | https://www.xerjoff.com/en-us/products/uden-parfum |  |
| p10 | Xerjoff | Naxos | https://www.xerjoff.com/en-us/products/naxos-eau-de-parfum |  |
| p11 | Creed | Aventus | https://creedboutique.com/products/aventus |  |
| p12 | Creed | Absolu Aventus | https://creedboutique.com/products/absolu-aventus |  |
| p14 | Creed | Silver Mountain Water | https://creedboutique.com/products/silver-mountain-water |  |
| p15 | Amouage | Search | https://amouage.com/en-eu/products/100ml-search |  |
| p16 | Amouage | Reflection Man | https://amouage.com/en-eu/products/reflection-man-100ml |  |
| p17 | Amouage | Outlands | https://amouage.com/en-eu/products/new-outlands |  |
| p19 | Amouage | Interlude Man | https://amouage.com/en-eu/products/interlude-man-100ml |  |
| p20 | Amouage | Enclave | https://amouage.com/en-eu/products/enclave |  |
| p21 | Mancera | Lemon Line | https://www.manceraparfums.com/en/fruity/30-lemon-line.html |  |
| p22 | Mancera | Cedrat Boise | https://www.manceraparfums.com/en/woody/16-cedrat-boise.html |  |
| p23 | Mancera | French Riviera | https://www.manceraparfums.com/en/marine/106-french-riviera.html |  |
| p24 | Mancera | Tonka Cola | https://www.manceraparfums.com/en/gourmand/110-tonka-cola.html |  |
| p25 | Mancera | Red Tobacco | https://www.manceraparfums.com/en/oriental/67-red-tobacco.html |  |
| p27 | Montale | Intense Café | https://www.montaleparfums.com/en/gourmand/176-intense-cafe.html |  |
| p28 | Montale | Arabians Tonka | https://www.montaleparfums.com/en/gourmand/282-484-arabians-tonka.html |  |
| p29 | Montale | Chocolate Greedy | https://www.montaleparfums.com/en/gourmand/35-24-chocolate-greedy-argent.html |  |
| p30 | Montale | Honey Aoud | https://www.montaleparfums.com/en/gourmand/203-honey-aoud.html |  |
| p31 | Montale | Intense Pepper | https://www.montaleparfums.com/en/spices/194-146-intense-pepper.html |  |
| p32 | Tom Ford | Ombré Leather | https://www.tomfordbeauty.com/products/ombre-leather-eau-de-parfum |  |
| p33 | Tom Ford | Noir Extreme | https://www.tomfordbeauty.com/products/noir-extreme-eau-de-parfum |  |
| p34 | Tom Ford | Lost Cherry | https://www.tomfordbeauty.com/products/lost-cherry-eau-de-parfum |  |
| p35 | Tom Ford | Tobacco Vanille | https://www.tomfordbeauty.com/products/tobacco-vanille-eau-de-parfum |  |
| p36 | Tom Ford | Bois Pacifique | https://www.tomfordbeauty.com/products/bois-pacifique-eau-de-parfum | usunięta plakietka nagrody |
| p37 | Tom Ford | Oud Wood | https://www.tomfordbeauty.com/products/oud-wood-eau-de-parfum |  |
| p38 | Tom Ford | Ébène Fumé | https://www.tomfordbeauty.com/products/ebene-fume-eau-de-parfum |  |
| p39 | Marc-Antoine Barrois | Ganymede | https://www.marcantoinebarrois.com/products/ganymede |  |
| p40 | Tiziana Terenzi | Kirke | https://terenziboutique.us/products/engf |  |
| p41 | Maison Crivelli | Oud Maracujá | https://maisoncrivelli.com/products/oud-maracuja |  |
| p44 | Essential Parfums | Bois Impérial | https://essentialparfums.com/products/bois-imperial-eau-de-parfum-vaporisateur-rechargeable-100-ml |  |
| p45 | Sospiro | Vibrato | https://sospirointernational.com/products/vibrato |  |
| p46 | Nous Tous | Casa di Capri | https://nutu.store/products/nous-tous-casa-di-capri-elixir-de-parfum |  |
| p47 | Nous Tous | Secco di Como | https://nutu.store/products/nous-tous-secco-di-como-elixir-de-parfum |  |
| p48 | Nous Tous | Aurora Siciliana | https://nutu.store/products/nous-tous-aurora-siciliana-elixir-de-parfum |  |
| p49 | Nous Tous | Safrano Absolu | https://nutu.store/products/nous-tous-safrano-absolu-elixir-de-parfum |  |
| p50 | Nous Tous | Milano 3AM | https://nutu.store/products/nous-tous-milano-3am-elixir-de-parfum |  |
| p59 | Hugo Boss | Bottled Elixir | https://www.hugoboss.com/us/boss-bottled-elixir-eau-de-toilette-100ml/hbna58129503_999.html |  |
| p61 | Hugo Boss | Bottled Beyond | https://www.hugoboss.com/us/boss-bottled-beyond-eau-de-parfum-100-ml-%E2%80%93-3.38-fl.-oz./hbna58604808_999.html |  |
| p62 | Hugo Boss | Bottled Bold Citrus | https://www.hugoboss.com/us/boss-bottled-bold-citrus-eau-de-parfum-100ml/hbna58228597_999.html |  |
| p66 | Rabanne | Black XS | https://www.rabanne.com/ww/en/fragrance/p/black-xs--000000000065150134 |  |
| p67 | Rabanne | Invictus | https://www.rabanne.com/us/en_US/fragrance/p/invictus--000000000065055742 |  |
| p68 | Rabanne | One Million | https://www.rabanne.com/us/en_US/fragrance/p/1-million--000000000065051844 | usunięta plakietka nagrody |
| p69 | Azzaro | Chrome | https://www.azzaro.com/en/fragrances/azzaro-chrome/eau-de-parfum |  |
| p70 | Azzaro | Forever Wanted Elixir | https://www.azzaro.com/en/fragrances/azzaro-forever-wanted-elixir/eau-de-parfum |  |
| p71 | Azzaro | The Most Wanted Parfum | https://www.azzaro.com/en/fragrances/azzaro-the-most-wanted/parfum |  |

**Zdjęcia od właściciela (24.09.2026):** wszystkie 15 produktów, których strony producentów blokują pobieranie (p01 do p05, p42, p43, p51 do p55, p63 do p65), ma zdjęcie od właściciela: 13 z folderu „Nicci Fragrance” na Dysku, p51 i p52 z plików przysłanych w rozmowie. Pliki i rozmiary źródeł: `dev/zdjecia/zrodla-wlasciciel.csv`, obróbka opisana w `docs/03-plan-grafik.md`.

## 4. Wyniki audytu

### Kontrast (WCAG 2.2, tokeny z `site/css/tokens.css`)

| Para | Kolory | Kontrast | AA tekst (4,5) |
|---|---|---|---|
| Tekst na czarnym tle | #E8D7C3 na #040404 | 14,59:1 | tak |
| Tekst wyróżniony na czarnym | #FFFFFF na #040404 | 20,5:1 | tak |
| Tekst drugorzędny na czarnym | #A99789 na #040404 | 7,3:1 | tak |
| Złoto na czarnym (nadtytuły, akcenty) | #D5A865 na #040404 | 9,39:1 | tak |
| Tekst na grafitowym | #E8D7C3 na #272727 | 10,63:1 | tak |
| Tekst drugorzędny na grafitowym | #A99789 na #272727 | 5,32:1 | tak |
| Złoto na grafitowym | #D5A865 na #272727 | 6,84:1 | tak |
| Tekst na kremowym tle | #272727 na #F3EADF | 12,55:1 | tak |
| Tekst drugorzędny na kremowym | #645549 na #F3EADF | 6,01:1 | tak |
| Złoty tekst na kremowym | #75582F na #F3EADF | 5,53:1 | tak |
| Tekst na karcie (jasny krem) | #272727 na #FAF6F0 | 13,88:1 | tak |
| Tekst drugorzędny na karcie | #645549 na #FAF6F0 | 6,64:1 | tak |
| Błąd na jasnym | #9B2C1C na #FAF6F0 | 7,04:1 | tak |
| Błąd na ciemnym | #EFA08F na #1A1918 | 8,44:1 | tak |
| Czarny tekst na złotym przycisku | #040404 na #D5A865 | 9,39:1 | tak |
| Tekst na panelu kremowym | #272727 na #E8D7C3 | 10,63:1 | tak |
| Tekst drugorzędny na panelu kremowym | #645549 na #E8D7C3 | 5,09:1 | tak |

Wszystkie pary spełniają AA dla zwykłego tekstu (4,5:1). axe-core liczy kontrast także na wyrenderowanych stronach i nie zgłasza naruszeń.

### Dostępność (axe-core 4.13, reguły WCAG 2.0, 2.1, 2.2 AA i best practice)

**0 naruszeń w 19 stanach** (telefon 390 px i komputer 1440 px): strona główna, szuflada produktu, koszyk, filtry na telefonie, quiz, wynik, zamówienie z błędami walidacji, potwierdzenie, regulamin, polityka prywatności. Test klawiatury: Tab przez stronę główną, quiz i formularz. Fokus jest widoczny na każdym elemencie i nie chowa się pod przyklejonym nagłówkiem.

Poprawione w tym etapie: nazwy zapachów na `/wynik` są nagłówkami drugiego poziomu (wcześniej brakowało poziomu między `h1` a `h3`); przewijany pasek zaufania na telefonie dostaje fokus z klawiatury; zapas pod nagłówkiem przy przewijaniu do fokusu (84 px nagłówka, było 80 px zapasu); kadr zastępczy karty nie rozjeżdża się z nazwą przycisku; spinner na przycisku „Zamawiam i rezerwuję” w trakcie wysyłki; `color-scheme` dla ciemnych motywów; wielokropek w stanach ładowania; wyprzedane karty zapachów i zestawów bez przezroczystości tekstu (wcześniej 3,5:1 do 4,2:1, teraz kolor drugorzędny powyżej 4,5:1). Złota kursywa w hero leży na zdjęciu, więc jej kontrast policzyliśmy z pikseli: najgorszy punkt 4,39:1, dla dużego tekstu próg AA to 3:1.

### Lighthouse 13.5 (pomiar lokalny)

Serwer pomiarowy odtwarza Cloudflare Pages: HTTP/2, kompresja Brotli, cache obrazów i fontów. Jeden przebieg na stronę, więc wynik może się wahać o kilka punktów.

| Strona | Urządzenie | Wydajność | Dostępność | Dobre praktyki | SEO | LCP | TBT | CLS | Waga |
|---|---|---|---|---|---|---|---|---|---|
| `/` | telefon | 91 do 94 | 100 | 100 | 92 | 2,8 do 3,0 s | 30 do 150 ms | 0 | 378 KB |
| `/quiz` | telefon | 100 | 100 | 100 | 92 | 1,4 s | 0 ms | 0 | 115 KB |
| `/zamowienie` | telefon | 99 | 100 | 100 | 66 | 2,0 s | 0 ms | 0 | 200 KB |
| `/regulamin` | telefon | 99 | 100 | 100 | 66 | 2,0 s | 20 ms | 0 | 166 KB |
| `/` | komputer | 100 | 100 | 100 | 92 | 0,5 s | 0 ms | 0 | 333 KB |
| `/quiz` | komputer | 100 | 100 | 100 | 92 | 0,4 s | 0 ms | 0 | 115 KB |

SEO 92: canonical jest dziś względny, bo nie znamy domeny. `dev/ustaw_domene.py` wpisze adres bezwzględny. SEO 66 na zamówieniu i regulaminie to zamierzony `noindex`.

Wiersze strony głównej zmierzone po przebudowie hero według makiety (24.09); telefon po wdrożeniu wariantu C z ostrym kadrem (trzy przebiegi). Ostry kadr waży 100 KB zamiast 29 KB, dlatego LCP na telefonie wzrósł z 2,6 do około 2,9 s w teście z dławieniem łącza. Strona główna przed optymalizacją miała 91 punktów (LCP 2,7 s, TBT 160 ms). Zmiany: grupy katalogu poza ekranem nie są układane (`content-visibility: auto` z wysokością szacowaną z liczby kart, trafność ±5%), obraz hero bez `decoding="async"`, wariant 300 px kadru z sekcji 2. Pliki CSS i JS zostały osobne: ich łączenie wymagałoby kroku budowania, którego prompt nie chce, a po tych zmianach wynik 97 go nie uzasadnia. Łączenia nie mierzyliśmy.

### Testy ścieżki zamówienia

| Zestaw | Wynik | Co sprawdza |
|---|---|---|
| `node dev/testy_backendu.js` | 29/29 | katalog, rezerwacje, walidacja, wycena, braki stanu, numeracja, maile, przewoźnicy, bony i dni robocze, stan bez liczenia ml, odpowiedź zamówienia, zgodność z `nicci-api.js` |
| `node dev/testy_readme.js` | 22/22 | testy 1, 2, 3 i 7 z README na całej ścieżce: przeglądarka, formularz, atrapa backendu; od 24.09 także kod bonu (rabat, drugie użycie, próg, termin, nieznany kod) |

Test 1: katalog z `?action=catalog`; zapisany w przeglądarce katalog starszy niż 2 minuty odświeża się w tle, więc zmiana ceny dociera na stronę w czasie cache backendu (5 minut). Próba kontrolna potwierdza, że test umie wykryć starą cenę.
Test 2: zamówienie BLIK z `?src=`, wiersz ze statusem NOWE i źródłem, dane BLIK do kopiowania, dostępność spada o zarezerwowane 10 ml (z 40 na 30 ml, backend oznacza niski stan, więc karta pokaże „Zostało 30 ml tego zapachu”).
Test 3: 2 × 20 ml przy 30 ml dostępnych: komunikat z ilością i podobnymi zapachami, zamówienie nie powstaje.
Test 7: błędny kod pocztowy i brak zgody dają błędy przy polach i w podsumowaniu; wypełnione ukryte pole `website` blokuje zamówienie; pole jest poza tabulacją i czytnikiem ekranu.

Czego nie da się sprawdzić lokalnie: wysyłki maili (test 2, 4, 5, 6), triggerów Apps Script (test 6), Instagrama (test 8) i dostarczalności maili (test 9). Te testy trzeba przejść po wdrożeniu, według `refs/README.md`.

## 5. Produkty z brakującymi danymi w arkuszu

Opisy, nuty, sezon, pora, trwałość, projekcja i intensywność są uzupełnione we wszystkich 64 aktywnych produktach. Brakuje:

**Stanów:** `ml_dostepne` puste w 62 produktach. Od 24.09 to nie blokada: puste pole znaczy sprzedaż bez limitu (decyzja 58). Wypełnione tylko p34 i p37, oba 0 ml, więc są wyprzedane.

**Zdjęć:** brak braków, wszystkie 64 aktywne produkty mają zdjęcie (punkt 3).

**Cen:** strona pokazuje tylko pojemności z ceną, więc te warianty są ukryte. p34 i p37 nie mają żadnej ceny i mają 0 ml, więc są wyprzedane (widać je po wyłączeniu filtra „Tylko dostępne”). Produkt ze stanem, ale bez żadnej ceny, backend teraz pomija, a diagnostyka zgłasza go jako błąd.

| Brak ceny | Produkty |
|---|---|
| 10 ml | p39 Marc-Antoine Barrois Ganymede |
| 20 ml | p45 Sospiro Vibrato |
| 5 ml | p12 Creed Absolu Aventus; p21 Mancera Lemon Line; p22 Mancera Cedrat Boise; p23 Mancera French Riviera; p24 Mancera Tonka Cola; p25 Mancera Red Tobacco; p27 Montale Intense Café; p28 Montale Arabians Tonka; p29 Montale Chocolate Greedy; p30 Montale Honey Aoud; p31 Montale Intense Pepper; p32 Tom Ford Ombré Leather; p33 Tom Ford Noir Extreme; p36 Tom Ford Bois Pacifique; p40 Tiziana Terenzi Kirke; p44 Essential Parfums Bois Impérial; p46 Nous Tous Casa di Capri; p47 Nous Tous Secco di Como; p48 Nous Tous Aurora Siciliana; p49 Nous Tous Safrano Absolu; p50 Nous Tous Milano 3AM; p51 Dior Homme Cologne; p52 Dior Sauvage Parfum; p53 Dior Sauvage Elixir; p55 Versace Eros Parfum; p59 Hugo Boss Bottled Elixir; p61 Hugo Boss Bottled Beyond; p62 Hugo Boss Bottled Bold Citrus; p63 YSL Y Parfum; p64 YSL MYSLF Parfum; p65 Hermès Terre d'Hermès Eau Intense Vétiver; p70 Azzaro Forever Wanted Elixir; p71 Azzaro The Most Wanted Parfum |
| 5 ml, 10 ml | p66 Rabanne Black XS; p67 Rabanne Invictus; p68 Rabanne One Million; p69 Azzaro Chrome |
| 5 ml, 10 ml, 20 ml | p34 Tom Ford Lost Cherry; p37 Tom Ford Oud Wood |

**Zestawów:** żaden z 6 aktywnych nie ma opisu dla klienta (arkusz ma tylko opis dla doradcy). Rodzinę ma tylko z04, więc quiz nie proponuje zestawu z innych rodzin. z04 jest niedostępny, bo zawiera p34 (0 ml); z07 zawiera p60, który jest nieaktywny.

**Pola do weryfikacji:** `dev/dane/do-weryfikacji.csv`, 118 wierszy dla 60 pozycji (najwięcej: rodzina 28, sezon 19, nuty i osiągi 17, podobne 10; stan na 24.09.2026, po dodaniu zdjęć właściciela). Okazja p01 w źródle to liczba 11, więc w imporcie jest pusta.

**Profil:** w arkuszu są tylko zapachy męskie (25) i unisex (39). Odpowiedź „Dla niej” w quizie pokazuje zapachy unisex.

## 6. Wdrożenie na Cloudflare Pages

1. **Apps Script:** kroki z `refs/README.md`, punkt „1. Arkusz i backend”. W `CONFIG` wpisz `SITE_URL` (adres strony bez ukośnika na końcu). Po wdrożeniu skopiuj adres kończący się na `/exec` i sprawdź `ADRES/exec?action=catalog`.
2. **Strona:** w `site/nicci-api.js` wpisz `API_URL` (linia 17, adres `/exec`). `IG_HANDLE` (linia 18) jest już wpisany. Nic więcej w tym pliku się nie zmienia.
3. **Domena:** zrobione dla `niccifragrance.pl` (`python3 dev/ustaw_domene.py https://niccifragrance.pl`). Skrypt wpisuje adres bezwzględny w canonical, `og:url` i `og:image`, zbuduje `site/sitemap.xml` i dopisze linię Sitemap do `site/robots.txt`. Można go uruchomić ponownie po zmianie domeny.
4. **Cloudflare Pages:** Workers & Pages, Create, Pages, połącz repozytorium z GitHuba. Framework preset: None. Build command: puste. Build output directory: `site`. Gałąź produkcyjna: ta, do której trafi ten kod. Alternatywnie Direct Upload folderu `site`.
5. **Własna domena:** w projekcie Pages, Custom domains. Potem, jeśli adres się zmienił, popraw `CONFIG.SITE_URL` w Apps Script i wdróż nową wersję.
6. **Nagłówki:** `site/_headers` ustawia politykę CSP (skrypty tylko z własnej domeny, zapytania do `script.google.com` i `script.googleusercontent.com`), cache fontów na rok i zdjęć na tydzień. Jeśli włączysz Cloudflare Web Analytics albo inny skrypt zewnętrzny, dopisz jego domenę do CSP, inaczej przeglądarka go zablokuje.
7. **Strona 404:** `site/404.html`. Bez niej Pages podawałoby stronę główną pod każdym błędnym adresem.
8. **Po wdrożeniu:** przejdź wszystkie 9 testów z `refs/README.md`, w tym prawdziwe zamówienie BLIK na własny e-mail.

Praca lokalna: `python3 dev/serwer.py` (podgląd na http://127.0.0.1:8766 z atrapą backendu, dopóki `API_URL` ma `UZUPELNIJ`), `node dev/testy_backendu.js`, `node dev/testy_readme.js`.

## 7. Co jeszcze zmieniło się w etapie 9

* Dane strukturalne (`site/js/dane-strukturalne.js`): OnlineStore i WebSite, FAQPage z pytań bez TODO, ItemList z 64 produktami i ofertą dla każdej pojemności. Bez ocen i gwiazdek.
* `robots.txt`, `_headers`, `404.html`, opisy meta regulaminu i polityki prywatności.
* Katalog w przeglądarce odświeża się w tle po 2 minutach (było 10), a `/zamowienie` zawsze dociąga świeże ceny i stany.
* Backend: produkt ze stanem, ale bez żadnej ceny, nie trafia na listę ani do „podobnych”.
* Decyzje z uzasadnieniem: `docs/decyzje.md`, pozycje 36 do 42.
