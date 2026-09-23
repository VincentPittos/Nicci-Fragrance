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
| 14 | Logo | Plik właściciela zwektoryzowany do SVG (`site/img/marka/`), kolor przez CSS, favicon i ikona iOS z tego samego znaku. | właściciel, wniosek |

## Otwarte

* Weryfikacja 114 pozycji z `dev/dane/do-weryfikacji.csv`, w tym profil wszystkich zapachów i rodziny z członem spoza listy.
* `ml_dostepne` dla wszystkich aktywnych pozycji (bez tego backend uzna je za niedostępne).
* Opisy zestawów dla klienta i rodziny zestawów (bez rodziny quiz nie zaproponuje zestawu).
* Wartości w `CONFIG` Apps Script: e-mail, BLIK, konto, odbiorca, koszty dostawy, próg darmowej dostawy.
* Trwałość i projekcja: arkusz zastrzega, że to szacunki. Propozycja: paski z podpisem „orientacyjnie”.
* Zdjęcia produktów: sieć środowiska blokuje sklepy i producentów, potrzebne własne zdjęcia, pliki od właściciela albo poszerzenie dostępu (etap 3).
* Nazwa marki w tekstach: logo mówi „Nicci Fragrance”, prompt i README „Nicci Fragrances”.
