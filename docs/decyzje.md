# Rejestr decyzji

## 23.09.2026, po etapie 1

| # | Temat | Decyzja | Skąd |
|---|---|---|---|
| 1 | Backend | `apps-script/Code.gs` powstaje w tym repozytorium, zgodnie z README i kontraktem `nicci-api.js`. | właściciel |
| 2 | Dane | Skrypt `dev/konwersja_arkusza.py` zamienia bazę wiedzy na zakładki Produkty i Zestawy. Mapowania są propozycją do akceptacji, lista w `dev/dane/do-weryfikacji.csv`. | właściciel |
| 3 | Repozytorium | `VincentPittos/Nicci-Fragrance`. Jest publiczne, więc surowy arkusz z notatkami doradcy leży w `refs/prywatne/` poza gitem. | właściciel, wniosek |
| 4a | Sekcja 2 | Licznik „23:59:59” usunięty. | właściciel |
| 4b | Sekcja 2 | Zdjęcie osadzone w base64 można usunąć i zastąpić grafiką lepiej pasującą. | właściciel |
| 4c | Kolory sekcji | Sekcja 2 w ciemnym graficie (`#272727`), sekcje 3, 4 i 5 w jasnym kremie. Sekcje 6 i 7 zostają kremowe zgodnie z promptem, stopka czarna. | właściciel, prompt |
| 5 | Próg dopasowania | Wynik quizu jest „częściowy”, gdy żaden z trzech produktów nie należy do rodzin zwróconych przez `recommend().rodziny`. | właściciel |
| 6 | Filtr profilu | Dokładany w warstwie strony, bo `filterProducts` go nie obsługuje. | właściciel |
| 7 | Kadr hero | `refs/hero-czysty.webp` (2000×1116) używany w całości, bez kadrowania i retuszu. Desktop: proporcje obrazu zachowane, tekst na ciemnej lewej części. Telefon: cały kadr pod tekstem. | właściciel |
| 8 | Ikona quizu | „Świeżo i czysto” rysujemy jako przekrojony cytrus, nie listek z kroplą. | właściciel |
| 9 | Typografia | Cormorant Garamond w nagłówkach, Jost w treści, tak jak w artifakcie sekcji 2. | wniosek z artifactu |
| 10 | Link `#quiz` | Strona główna przekierowuje `/#quiz` na `/quiz` z zachowaniem `src`. Artifact sekcji 2 i stare linki z InstantDM działają bez zmian. | wniosek |

## 23.09.2026, po etapie 2

| # | Temat | Decyzja | Skąd |
|---|---|---|---|
| 11 | Karta produktu | Wariant B: grafitowy pasek, złota marka, biała nazwa, wyśrodkowanie. Szczegóły produktu też w graficie (referencja LV nr 2). | właściciel |
| 12 | Tło sekcji 3 do 5 | Jasny krem #F3EADF. Krem marki #E8D7C3 na panelach. | właściciel |
| 13 | Telefon | Dwie kolumny kompaktowe (zdjęcie, marka, nazwa, niedobór, pojemność, cena, przycisk). Pełna karta od ~17rem szerokości karty, przez container queries. Zdjęcie otwiera szczegóły. | właściciel |
| 15 | Nazwa marki | „Nicci Fragrance”, jak w logo. Wyjątek: komentarz w nicci-api.js zostaje, bo modułu nie zmieniamy. | właściciel |
| 14 | Logo | Plik właściciela zwektoryzowany do SVG (`site/img/marka/`), kolor przez CSS, favicon i ikona iOS z tego samego znaku. | właściciel, wniosek |

## 23.09.2026, etap 3

| # | Temat | Decyzja | Skąd |
|---|---|---|---|
| 16 | Budżet OpenArt | Rdzeń 380 i rezerwa do 140 zaakceptowane. | właściciel |
| 17 | Opcje | A (kadr odlewania w sekcji 2, 35) i B (miniatury nut jako zdjęcia, 105) zaakceptowane. Limit łącznie 660, próg zatrzymania 700. | właściciel |
| 18 | Zdjęcia produktów | Szukamy w internecie. Pobieranie wymaga odblokowania sieci środowiska. | właściciel |
| 19 | Model | Nano Banana 2 (30 kredytów za kadr 2K). Sieć odblokowana. | właściciel |
| 20 | Źródło packshotów | Tylko oficjalne strony i sklepy producentów, z zapisem źródła każdego pliku. Nie obchodzimy zabezpieczeń przed botami: marki, które je stosują (LV, MFK, Dior, Versace, YSL, Hermès), zostają z kadrem zastępczym do czasu własnych zdjęć. | wniosek |
| 21 | Nuty bez miniatury | Nuty rzadsze niż 3 wystąpienia bez własnego kafelka (gruszka, fiołek, herbata i 10 pojedynczych) wyświetlamy jako tekst. | wniosek |

## 23.09.2026, etap 4

| # | Temat | Decyzja | Skąd |
|---|---|---|---|
| 22 | Hero | Układ z referencji (tekst na pustej ścianie zdjęcia) od 80rem. Węższe ekrany: tekst, pod nim zdjęcie w całości. Pusta część kadru jest za wąska na tekst przy 1024 px, a zdjęcia nie przycinamy. | wniosek |
| 23 | Sekcja 2 | Znaczniki artifactu bez zmian. Kolory na tokenach, tło grafit, zdjęcie karty 3 z kadru odlewania, licznik 23:59:59 zamieniony na stałe „24 h”. Dwa odcienie tekstu z 3,0:1 podniesione do tokenu tekstu drugorzędnego (5,3:1). | właściciel, wniosek |
| 24 | Pasek zaufania | Zamiast „Ponad 70 zapachów” dokładna liczba z katalogu z odmianą („64 zapachy”), bo aktywnych jest 64. | wniosek |
| 25 | Szuflady | Głębia strony pod szufladą liczona od środka widocznego ekranu (wcześniej od góry dokumentu, co przesuwało przewiniętą stronę). | wniosek |

## 23.09.2026, etap 5

| # | Temat | Decyzja | Skąd |
|---|---|---|---|
| 26 | Kolejność w grupie katalogu | Zapachy ze zdjęciem na początku grupy, potem `kolejnosc` z arkusza. Tymczasowe, dopóki 15 flakonów nie ma zdjęć; po ich dodaniu decyduje sama `kolejnosc`. | wniosek |
| 27 | Filtry | Komputer: panel z boku, zmiany od razu. Telefon i tablet: szuflada z przyciskiem „Pokaż N zapachów”. Profil pokazuje tylko wartości obecne w danych (męski, unisex). | wniosek |
| 28 | Trwałość i projekcja | Paski w skali 1 do 5 z podpisem „Orientacyjnie. Na każdej skórze zapach zachowuje się trochę inaczej.” Wartość spoza skali: sam tekst. | propozycja do akceptacji |
| 29 | Gwarancje i FAQ | Tylko fakty z README (rezerwacja 24 h, przypomnienie po 12 h, ręczne potwierdzanie wpłat, mail z numerem przesyłki). Resztę oznaczono `{TODO}` do potwierdzenia z regulaminem. | wniosek |

## 23.09.2026, etapy 6 do 8

| # | Temat | Decyzja | Skąd |
|---|---|---|---|
| 30 | Ikony quizu i paski trwałości | Mapa ikon i paski 1 do 5 przyjęte bez uwag po STOP 6. | akceptacja właściciela |
| 31 | Tekst sekcji 2 | Treść artifactu właściciela zostaje bez zmian. Poprawki etapu 8 dotyczą tylko tekstów pisanych przez nas. | prompt, sekcja 7 |
| 32 | Opisy rodzin | Przepisane pod realne nuty każdej rodziny w katalogu: jeden obraz, najwyżej jedna krótka lista surowców, zakończenie „dla kogo”. Opis drzewny zostaje słowo w słowo z promptu. | prompt, sekcja 8 |
| 33 | Uzasadnienie na /wynik | Jedno zdanie z pól produktu: dwie nuty, rodzina, pora i intensywność, np. „Szafran i róża w ciepłym zapachu orientalnym na wieczór, który zostawia wyraźny ślad.” Bez pola nie ma jego części zdania. | prompt, sekcja 12 |
| 34 | Usunięte obietnice bez pokrycia | „Odpisujemy w godzinach pracy”, „odlewamy z jednego flakonu”, „potwierdzenie może przyjść po kilku godzinach” i „ml z tego flakonu” zastąpione zdaniami, które nie zakładają nieznanych faktów. | humanizer, zasada braku zmyśleń |
| 35 | Komunikaty z `nicci-api.js` | Teksty błędów w module (np. „Coś poszło nie tak po naszej stronie…”) są zgodne z głosem marki. Moduł zostaje bez zmian, więc ich nie ruszamy. | kontrakt modułu |

## 23.09.2026, etap 9

| # | Temat | Decyzja | Skąd |
|---|---|---|---|
| 36 | Wydajność katalogu | `content-visibility: auto` na grupach katalogu, wysokość szacowana z liczby rzędów kart (±5%). Strona główna na telefonie: 91 → 97 w Lighthouse, LCP 2,7 → 2,5 s. Bez łączenia plików, bo to wymaga kroku budowania. | pomiar, prompt sekcja 16 |
| 37 | Nagłówki hostingu | `site/_headers`: CSP tylko z własną domeną i Apps Script, fonty w cache na rok, zdjęcia na tydzień (nazwy bez skrótu zawartości). | security-and-hardening |
| 38 | Strona 404 | `site/404.html` ze statusem 404. Bez niej Cloudflare Pages podaje stronę główną pod każdym błędnym adresem. | wniosek |
| 39 | Świeżość katalogu | Zapis w przeglądarce odświeżany w tle po 2 minutach (było 10), `/zamowienie` zawsze dociąga świeże ceny i stany. Razem z 5 minutami cache backendu daje to test 1 z README. | README, test 1 |
| 40 | Produkt bez cen | Produkt ze stanem, ale bez żadnej ceny, nie trafia na listę ani do „podobnych” (etykieta „Wyprzedane” byłaby nieprawdą). Wyprzedany (0 ml) bez cen zostaje jako wyprzedany. | zasada: niedobór tylko z realnych stanów |
| 41 | Dane strukturalne | JSON-LD z przeglądarki: OnlineStore, WebSite, ItemList z Product i ofertą na każdą pojemność, FAQPage tylko z pytań bez `{TODO}`. Bez ocen. Canonical, `og:url`, mapa strony i Sitemap w robots po uruchomieniu `dev/ustaw_domene.py`. | schema, ai-seo |
| 42 | Dokumenty w wersji roboczej | Regulamin i polityka prywatności zostają z `noindex`, dopóki nie zatwierdzi ich prawnik. | wniosek |

## 24.09.2026, po raporcie końcowym

| # | Temat | Decyzja | Skąd |
|---|---|---|---|
| 43 | Hero według makiety właściciela | Nagłówek w dwóch liniach: „Zapach z najwyższej półki” i pod nim większa (×1,28 na telefonie, ×1,36 na komputerze), złota kursywa „Za ułamek ceny”, podciągnięta pod pierwszą linię. Opis z makiety w całości, z drugą częścią o quizie. Bez nadtytułu i bez notki „5 pytań, około minuty”, bo opis mówi to samo. Od 80rem tekst przy lewej krawędzi, a jego wymiary i przyciski są w vw, więc kompozycja ze zdjęciem jest ta sama od 1280 do 2560 px (sprawdzone pomiarem kolizji z flakonami i magnolią). Pasek nagłówka na pełną szerokość, żeby logo stało w linii z tekstem hero. Fonty i przyciski zostają z systemu wizualnego. | makieta właściciela |
| 44 | Wyprzedane karty | Zamiast przezroczystości tekst w kolorze drugorzędnym (kontrast AA), przyciemnione tylko zdjęcia i miniatury; niedostępny zestaw ma przerywaną ramkę. | audyt axe na 1920 px |
| 45 | Hero na telefonie, wariant C | Nagłówek na górze, opis na zdjęciu z lekkim cieniem (każda linia co najmniej 7,3:1), atomizery Nicci w całości pod opisem, przyciski na kamieniu u dołu, wszystko na pierwszym ekranie. Osobny, wyostrzony kadr prawych 70% zdjęcia w trzech szerokościach (1000, 1400 i 2100 px z EDSR ×2) i `sizes` zależne od wysokości ekranu. Paralaksa na telefonie wyłączona, żeby zdjęcie nie zbliżało atomizerów do przycisków. | akceptacja właściciela, prośba o ostrzejsze zdjęcie |

## 24.09.2026, odpowiedzi właściciela z listy przed publikacją

| # | Temat | Decyzja | Skąd |
|---|---|---|---|
| 46 | Sprzedawca i kontakt | Nicci Fragrance, działalność nierejestrowana, bez NIP. Kontakt: `kontakt@niccifragrance.pl` (skrzynka ruszy po zakupie domeny) i Instagram `nicci_fragrance`. Domena `niccifragrance.pl` wpisana skryptem `dev/ustaw_domene.py` (canonical, `og:url`, `og:image`, sitemap, robots) i w `CONFIG.SITE_URL`. Imię, nazwisko i adres w regulaminie i polityce prywatności czekają na teksty od prawnika. | właściciel |
| 47 | Wysyłka | Tylko Polska. Paczkomat InPost, kurier InPost, DPD albo DHL. Nadanie zwykle w ciągu 1 dnia roboczego od zaksięgowania wpłaty, do 5 dni roboczych, gdy zapach trzeba sprowadzić, najpóźniej 7 dni roboczych („realizacja do 7” odczytana jako dni robocze). Wpłaty sprawdzane rano i wieczorem. | właściciel |
| 48 | Przewoźnik w arkuszu | Nowa kolumna `przewoznik` w Zamowienia z listą InPost, DPD, DHL. Paczkomat to zawsze InPost. Mail „w drodze” podaje przewoźnika i jego link śledzenia; bez przewoźnika przy kurierze mail czeka, a w `uwagi` pojawia się prośba o wybór. Adres śledzenia DHL do sprawdzenia przy pierwszej paczce. | wniosek z odpowiedzi 10 |
| 49 | Gwarancje i FAQ | Flakony od sprawdzonych dostawców, perfumerii i hurtowni. Atomizer: szklany flakonik w plastikowej oprawie z etykietą z nazwą zapachu. Wymiana pełnej odlewki na zapach z tej samej półki cenowej tylko po wspólnym doborze na Instagramie (quiz się nie liczy). Odlewek nie przyjmujemy z powrotem: do oceny prawnika wobec prawa odstąpienia, przy tekście zostaje `{TODO}`. Wpłata po terminie: zamówienie realizujemy. Zdjęcia flakonu przed wysyłką nie obiecujemy, bo właściciel woli tego unikać. | właściciel |
| 50 | Zdjęcia 14 flakonów | Z folderu „Nicci Fragrance” na Dysku, przez `dev/zdjecia/zdjecia_wlasciciela.py` (zdjęcia z krótszym bokiem poniżej 1000 px powiększone EDSR, jasne tło źródła wyczyszczone do bieli albo przezroczystości, bez tego na karcie zostawał prostokąt wokół flakonu) i `ujednolic_zdjecia.py` (tło #F1EFEC zamiast przezroczystości i bieli, zgodnie z resztą katalogu). Kolejność „najpierw zapachy ze zdjęciem” (decyzja 26) zostaje, dopóki p52 nie ma zdjęcia. p52 Sauvage Parfum pominięty: przysłany plik to Sauvage Eau de Parfum, inne stężenie. | właściciel |
| 51 | Nagłówek | Przycisk „Wybierz swój zapach” (do `/quiz`, z zachowaniem `src`) w nagłówku od 80rem, jak w makiecie, na stronie głównej, w regulaminie, polityce prywatności i 404. Nie ma go w zamówieniu, potwierdzeniu i wyniku quizu, żeby nie odciągał od bieżącego kroku. Na węższych ekranach quiz jest w menu i w hero. Przyciski zostają prostokątne z systemu wizualnego. | właściciel |
| 52 | Kursywa hero | Carattere (SIL OFL, podzbiór z polskimi znakami, 21 KB, hostowany lokalnie) zamiast pochylonego Cormoranta. Rozmiar ×1,38 na telefonie i ×1,47 od 80rem: szerokość drugiej linii to 0,76 pierwszej, jak w makiecie. Druga linia podciągnięta o 0,34 em, odstępy w hero 1,6vw, więc przyciski nie wchodzą na magnolię od 1280 px. | właściciel, pomiar makiety |
| 53 | Oferta | „Dla niej” w quizie zostaje z zapachami unisex; damskie flakony dojdą z rozwojem oferty. Zdjęcia producentów przy 49 zapachach zostają. | właściciel |
| 54 | Nazwa marki | „Nicci Fragrance” wszędzie, także w `refs/README.md` i szablonach Instagrama (linki poprawione na `/quiz?src=...`). Wyjątek bez zmian: komentarz w nagłówku `nicci-api.js` i pliki briefu. | właściciel |

## Otwarte

* Weryfikacja `dev/dane/do-weryfikacji.csv` (119 wierszy dla 61 pozycji), w tym profil wszystkich zapachów i rodziny z członem spoza listy.
* `ml_dostepne` dla wszystkich aktywnych pozycji: puste w 62 z 64, bez tego backend uzna je za niedostępne. Pełna lista braków: `docs/raport-koncowy.md`.
* Opisy zestawów dla klienta i rodziny zestawów (bez rodziny quiz nie zaproponuje zestawu).
* Wartości w `CONFIG` Apps Script: e-mail właściciela, BLIK, konto, odbiorca, koszty dostawy, próg darmowej dostawy.
* Regulamin i polityka prywatności od prawnika, w tym dane sprzedawcy i ocena zasad zwrotu.
* Zdjęcie p52 Dior Sauvage Parfum (przysłane było Eau de Parfum) i lepsze zdjęcie p51 Dior Homme Cologne (źródło 640 × 335 px).
* Skrzynka `kontakt@niccifragrance.pl` musi działać przed startem: adres jest w stopce, regulaminie, polityce i mailach.
* Prawa do packshotów producentów: to materiały marek. Na dłuższą metę bezpieczniejsze są własne zdjęcia flakonów i atomizerów Nicci (rekomendacja z promptu).
