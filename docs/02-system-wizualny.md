# Etap 2: System wizualny

Podgląd: `dev/etap-2/index.html` (lokalnie: `python3 -m http.server` w katalogu repo, potem `/dev/etap-2/`). Wersja jednoplikowa do publikacji: `node dev/etap-2/zbuduj_podglad.js <plik>`.

## Pliki

| Plik | Zawartość |
|---|---|
| `site/css/fonts.css`, `site/fonts/` | Cormorant Garamond i Jost hostowane lokalnie, tylko `latin` i `latin-ext`, 172 KB razem |
| `site/css/tokens.css` | prymitywy `--n-*`, semantyka (zależna od `.theme-dark`, `.theme-graphite`, `.theme-light`), tokeny komponentów deklarowane na komponentach |
| `site/css/base.css` | reset, skala typograficzna z trackingiem zależnym od rozmiaru, fokus, ograniczenie ruchu |
| `site/css/components.css` | przyciski, link, etykiety, niedobór, przełącznik pojemności z podpowiedzią, licznik sztuk, cena, pola, ikona koszyka, miniatury nut, karta A i B, szkielet, siatka, szuflada |
| `site/js/motion.js` | sprężyny (damping, response), przerywalne, z przejęciem prędkości, rzut, opór na krawędzi, wejścia sekcji |
| `site/js/ui.js` | formatowanie ceny, etykiety z danych, kluczowe nuty, stan koszyka, komunikaty `aria-live`, ruch ikony koszyka |
| `site/js/card.js` | render i zachowanie karty |
| `site/js/drawer.js` | szuflada i sheet: gest, pułapka fokusu, Esc, powrót fokusu, tło w głąb |

## Dlaczego tokeny komponentów są na komponentach

`var()` w zmiennej CSS rozwiązuje się na elemencie, na którym zmienną zadeklarowano. Token komponentu zadeklarowany na `:root` przyjąłby więc raz na zawsze kolory jasnego kontekstu. Dlatego `.btn`, `.card`, `.seg`, `.chip` i `.field` deklarują swoje tokeny same, a klasa `theme-dark` albo `theme-graphite` przełącza tylko semantykę. Ten sam przycisk i ta sama karta działają na czerni i na kremie bez osobnych wariantów w CSS.

## Kontrast (WCAG 2.2, liczony skryptem)

| Para | Kontrast | Wniosek |
|---|---|---|
| złoto #D5A865 na kremie #E8D7C3 / #F3EADF / #FAF6F0 | 1,55 / 1,83 / 2,03 | złoto na jasnym tylko jako dekoracja |
| czerń na złocie (przycisk) | 9,39 | tekst przycisku czarny |
| złoto na graficie #272727 | 6,84 | złota marka na pasku B przechodzi |
| taupe #7C695B na czerni / graficie | 3,93 / 2,87 | za mało na tekst, dodany #A99789 (7,30 / 5,32) |
| taupe #7C695B na kremie #E8D7C3 | 3,71 | na jasnym tekst drugorzędny #645549 (5,09) |
| złoto głębokie #75582F na kremie / jasnym kremie | 4,68 / 5,53 | złoty tekst na jasnym |
| błąd #9B2C1C na kremie | 5,39 | komunikaty błędów |

## Presety ruchu

| Preset | Tłumienie | Odpowiedź | Użycie |
|---|---|---|---|
| ui | 1,0 | 0,35 s | wejścia, cena |
| snappy | 1,0 | 0,24 s | przyciski, koszyk |
| press | 1,0 | 0,16 s | wciśnięcie |
| lift | 0,72 | 0,34 s | uniesienie karty o 2 px |
| sheet | 0,86 | 0,32 s | szuflady |
| momentum | 0,8 | 0,40 s | po rzucie |

Proste przejścia w CSS korzystają z tych samych sprężyn zapisanych jako `linear()` (wygenerowane z `motion.js`, funkcja `curve`). Gesty i wszystko, co da się złapać w trakcie ruchu, idzie przez `motion.js`.

## Warianty karty

* **A, kremowy:** karta na #FAF6F0 ze złotą ramką 1 px, marka w złocie głębokim, treść do lewej.
* **B, grafitowy pasek:** zdjęcie na jasnym, pod nim grafit, złota marka, biała nazwa, wyśrodkowanie jak w referencji LV.

Po ocenie na siatce: w B zaznaczona pojemność była złota i konkurowała z przyciskiem, więc na ciemnym tle zaznaczenie jest teraz kremowe.

**Rekomendacja:** A w siatce, grafit w szuflady szczegółów produktu. Uzasadnienie w podglądzie.

## Do decyzji właściciela

1. Wariant karty A albo B, i czy grafit w szczegółach produktu.
2. Tło sekcji 3 do 5: jasny krem #F3EADF (propozycja) albo krem marki #E8D7C3.
3. Wysokość karty na telefonie: około 1000 px, więc 63 zapachy w jednej kolumnie to długie przewijanie. Opcje: zostawić jedną kolumnę (tak mówi prompt) albo na telefonie dwie kolumny w wersji kompaktowej (zdjęcie, marka, nazwa, cena, przycisk), a nuty i opis w szufladzie.
4. Logo: w podglądzie jest zastępcze. Potrzebny plik logo (SVG albo PNG w wysokiej rozdzielczości).

## Źródło rekomendacji skilli

Katalog skryptów i referencji `ui-ux-pro-max` jest w tej instalacji pusty (jest tylko SKILL.md). Zastosowane zostały reguły z jego tabeli priorytetów: kontrast 4,5:1, cele dotyku min. 44 px, zero skoku układu, etykiety pól zawsze widoczne, ograniczenie ruchu. Nie pochodzą z wyszukiwania w bazie skilla.
