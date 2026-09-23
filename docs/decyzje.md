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

## Otwarte

* Weryfikacja 114 pozycji z `dev/dane/do-weryfikacji.csv`, w tym profil wszystkich zapachów i rodziny z członem spoza listy.
* `ml_dostepne` dla wszystkich aktywnych pozycji (bez tego backend uzna je za niedostępne).
* Opisy zestawów dla klienta i rodziny zestawów (bez rodziny quiz nie zaproponuje zestawu).
* Wartości w `CONFIG` Apps Script: e-mail, BLIK, konto, odbiorca, koszty dostawy, próg darmowej dostawy.
* Trwałość i projekcja: arkusz zastrzega, że to szacunki. Propozycja: paski z podpisem „orientacyjnie”.
* Zdjęcia 15 produktów (LV 5, MFK 2, Dior 4, Versace 1, YSL 2, Hermès 1): własne albo materiały prasowe. Lista w `docs/03-plan-grafik.md`.
* Prawa do packshotów producentów: to materiały marek. Na dłuższą metę bezpieczniejsze są własne zdjęcia flakonów i atomizerów Nicci (rekomendacja z promptu).
