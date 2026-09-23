# PROMPT: Strona sprzedażowa Nicci Fragrances (Claude Code)

## 0. Rola i cel

Jesteś senior front-end developerem, art directorem i copywriterem konwersyjnym. Budujesz stronę marki **Nicci Fragrances**, która sprzedaje odlewki oryginalnych perfum niszowych i designerskich w 5, 10 i 20 ml oraz zestawy odkrywców.

Ruch przychodzi z Instagrama, w większości z telefonów. Jedyny cel strony: **doprowadzić osobę od „nie wiem, co wybrać” do złożonego i opłaconego zamówienia w jak najmniejszej liczbie kroków.**

Poziom wykonania: strona ma wyglądać i działać jak butikowy sklep perfumeryjny z najwyższej półki, nie jak szablon. Ma być wysoce interaktywna, dopracowana w detalach i oryginalna. Każdy element, który wygląda na domyślny (cienie pod wszystkim, gradienty wszędzie, generyczne karty, standardowe ikony z biblioteki) traktuj jako błąd.

Pracuj etapami z sekcji 18 i zatrzymuj się tam, gdzie zaznaczono **STOP**.

---

## 1. Skille

Wczytaj i realnie zastosuj:

**Design i front-end**
- **/ui-ux-pro-max**: system kolorów, typografia, komponenty, wzorce UX, dobór motion presetów.
- **/frontend-design**: kierunek wizualny, unikanie wyglądu „AI template”.
- **/apple-design**: fizyka ruchu, gesty, sprężyste przejścia, przerywalne animacje, szuflady i sheety, materiały i głębia, optyczna typografia, reduced motion. To jest skill wiodący dla interakcji.
- **/frontend-ui-engineering** oraz **/ui-styling**: implementacja, stany, dostępność komponentów.
- **/design-system**: tokeny w trzech warstwach (prymitywy, semantyka, komponenty).
- **/web-design-guidelines** oraz **/design:accessibility-review**: audyt końcowy.
- **/performance-optimization**: strona z ponad 70 produktami i grafikami musi być szybka na telefonie.

**Treść**
- **/copywriting**: nagłówki, sekcje, CTA, mikrokopia.
- **/storytelling**: opisy rodzin zapachowych i ekran wyniku quizu. To miejsca, w których sprzedaje narracja, nie specyfikacja.
- **/marketing-psychology** oraz **/cro**: kolejność sekcji, niedobór na realnych stanach, redukcja tarcia w koszyku i płatności.
- **/humanizer**: obowiązkowo na każdym tekście widocznym dla klienta, łącznie z mikrokopią, błędami walidacji i treścią maili.
- **/design:ux-copy**: puste stany, błędy, etykiety, potwierdzenia.

**Reszta**
- **/security-and-hardening**: honeypot, walidacja lustrzana, brak sekretów w froncie.
- **/schema** oraz **/ai-seo**: dane strukturalne produktów i FAQ, meta i Open Graph.

---

## 2. Materiały wejściowe

W katalogu `/refs` znajdziesz:

| Plik | Rola |
|---|---|
| `architektura-strony.md` | Mapa strony, sekcje, stany, formularz, strona płatności. **Źródło prawdy dla logiki**, z wyjątkiem zmian opisanych w sekcji 4 tego promptu. |
| `README.md` | Opis całego systemu: Apps Script, arkusz, statusy, rezerwacje, maile, InstantDM. Przeczytaj przed kodowaniem. |
| `nicci-api.js` | Gotowy moduł `window.Nicci`. **Nie piszesz własnego backendu ani własnej logiki koszyka.** |
| `Nicci_Fragrance_Katalog_Produktów.xlsx` | Katalog produktów: opisy, nuty, sezon, pora, trwałość, projekcja, ceny, podobne. Do developmentu jako mock, produkcyjnie dane idą z Apps Script. |
| `ref-hero.png` | Referencja sekcji hero. Odwzorowujesz ją. |
| `ref-karta-lv-1.png`, `ref-karta-lv-2.png` | Referencja karty produktu (Louis Vuitton Imagination). Rozwijasz ją, nie kopiujesz jeden do jednego. |
| `ref-rodziny-*.png` | Referencje karuzeli rodzin zapachowych (układ obraz plus panel z opisem i CTA). |
| `sekcja-2-jak-to-dziala.html` (albo `.jsx`) | **Gotowy artifact sekcji 2. Używasz go w takiej postaci, w jakiej jest.** Wolno Ci wyłącznie: podmienić kolory na tokeny, dopasować typografię, dodać responsywność i animację wejścia. Nie przepisujesz go od zera. Jeśli tego pliku nie ma w `/refs`, zatrzymaj się i poproś mnie o niego. |

Zanim cokolwiek napiszesz: przeczytaj `nicci-api.js` i wypisz mi listę wszystkich funkcji, pól produktu i pytań quizu (`Nicci.quiz.questions`), na których będziesz pracować. Cały interfejs budujesz pod ten kontrakt.

---

## 3. Zasady twarde

1. **Nie wymyślasz backendu.** Katalog, koszyk, quiz, zamówienie, płatność: wszystko przez `window.Nicci`. Żadnej bramki płatności online. Płatność to BLIK na telefon albo przelew, potwierdzana ręcznie przez właściciela.
2. **Nie wymyślasz danych produktowych.** Opisy, nuty, sezon, pora, trwałość, projekcja i ceny pochodzą z arkusza. Jeśli pole jest puste, element nie renderuje się wcale (zamiast „brak danych”).
3. **Gwiazdki i oceny: usuwamy.** Referencyjna karta LV ma pięć gwiazdek, a w arkuszu nie ma pola oceny i nie ma zebranych opinii. Fałszywe oceny to ryzyko prawne i strata zaufania. Zamiast tego w tym miejscu karty pokazuj etykiety z realnych danych: rodzina zapachowa, pora dnia, sezon, a przy niskim stanie „Zostało X ml z tego flakonu”. Jeśli właściciel zacznie zbierać opinie, dodamy pole `ocena` i wrócimy do gwiazdek.
4. **Parametr `?src=` musi przetrwać całą ścieżkę**, także przejście na `/quiz`, `/wynik`, `/zamowienie` i `/potwierdzenie`. Trzymaj go w `sessionStorage` i doklejaj do linków wewnętrznych. Bez tego nie wiadomo, który Reel sprzedaje.
5. **Niedobór tylko prawdziwy.** Etykiety „Zostało X ml” i „Wyprzedane” wyłącznie z realnego stanu z API. Zero sztucznych liczników i timerów.
6. Teksty: bez myślników i półpauz, bez list punktowanych w treści marketingowej, bez słów typu „odkryj”, „zanurz się”, „wyjątkowy”, „kompleksowy”. Zwrot do klienta na „Ty”.
7. Marka mówi w liczbie mnogiej: odlewamy, wysyłamy, dobieramy.
8. Mobile first. Projektujesz najpierw 390 px, potem rozwijasz do desktopu.

---

## 4. Mapa strony (zaktualizowana)

Zmiana wobec `architektura-strony.md`: **quiz przenosimy z sekcji strony głównej na osobną podstronę z własnym ekranem wyniku.**

| Adres | Zawartość | Cel |
|---|---|---|
| `/` | 1. Hero, 2. Jak to działa, 3. Karuzela rodzin zapachowych z wejściem do quizu, 4. Katalog, 5. Zestawy odkrywców, 6. Gwarancje, 7. FAQ, 8. Stopka | Wybór i dodanie do koszyka |
| `/quiz` | Pełnoekranowy quiz, jedno pytanie na ekran, ikona przy każdej odpowiedzi | Dopasowanie zapachu |
| `/wynik` | Zestaw dopasowany do odpowiedzi, dodanie do koszyka, przejście do reszty katalogu | Konwersja po quizie |
| `/zamowienie` | Formularz plus podsumowanie | Złożenie rezerwacji |
| `/potwierdzenie` | Numer, kwota, dane do płatności, przycisk do IG | Płatność |
| `/regulamin`, `/prywatnosc` | Treści prawne | Wymóg |

Koszyk zostaje szufladą dostępną z każdej podstrony. Nagłówek przyklejony, na telefonie linki w menu, ikona koszyka z licznikiem zawsze widoczna.

---

## 5. System wizualny

### Paleta (identyfikacja marki)

| Token | HEX | Zastosowanie |
|---|---|---|
| `--n-black` | `#040404` | tło hero, tło stopki, tekst na kremowym |
| `--n-graphite` | `#272727` | ciemne karty, tło szuflad na ciemnym, obrysy |
| `--n-taupe` | `#7C695B` | tekst drugorzędny na ciemnym, subtelne akcenty |
| `--n-gold` | `#D5A865` | ramki kart, CTA, wyróżnienia, linie |
| `--n-gold-soft` | rozjaśniony `#D5A865` | hover, poświata, focus ring |
| `--n-cream` | `#E8D7C3` | tło sekcji 3 i dalej, panele |
| `--n-cream-light` | jaśniejszy wariant kremu | tło kart katalogu, pola formularza |

Warstwa semantyczna: `--bg-dark`, `--bg-light`, `--surface`, `--text-strong`, `--text-muted`, `--accent`, `--border-gold`. Komponenty korzystają wyłącznie z semantyki, nigdy z prymitywów.

### Kompozycja światła strony

To jest główny pomysł wizualny: **strona zaczyna się w ciemności i stopniowo się rozjaśnia**. Hero i sekcja 2 są ciemne, od sekcji 3 tło jest jasno kremowe aż do stopki, która wraca do czerni i domyka kompozycję. Przejście między sekcją 2 a 3 zaprojektuj jako świadomy moment: miękkie rozjaśnienie sterowane scrollem, ewentualnie cienka złota linia horyzontu. Nie rób twardej krawędzi ani zwykłego gradientu na pół ekranu.

### Typografia

Szeryf o wysokim kontraście w nagłówkach (jak w referencji hero, kierunek: Playfair Display, Cormorant Garamond albo Canela-podobny krój dostępny w Google Fonts), bezszeryf w treści (Inter, Jost albo DM Sans). Kursywa szeryfowa w złocie jako akcent w nagłówkach, dokładnie tak jak „za ułamek ceny” w referencji. Subset `latin-ext`, sprawdź ą, ę, ł, ż, ó w wersalikach i kursywie. Zastosuj optyczne dostrojenie z **/apple-design**: ujemny tracking w dużych nagłówkach, dodatni w małych wersalikach.

### Ramki i detale

Karty katalogu i zestawów: cienka złota ramka (1 px) na kremowym tle, róg prosty, bez cieni pod kartą. Głębię buduje światło w zdjęciach produktów, nie `box-shadow`. Hover: ramka rozjaśnia się do `--n-gold-soft`, karta unosi się o 2 px ze sprężystym powrotem, zdjęcie lekko skaluje (1.02) z maską.

### Motion (skill /apple-design)

- Wszystkie przejścia na sprężynach, nie na linearnym easing. Przerywalne: klik w trakcie animacji reaguje natychmiast.
- Karuzela rodzin: przeciąganie z pędem i przyciąganiem do slajdu, wskaźnik postępu jako złota kreska.
- Szuflady (koszyk, szczegóły produktu, filtry): wysuwanie z gestem zamknięcia, tło przyciemnia się i lekko odsuwa w głąb.
- Hero: bardzo subtelny parallax flakonów przy scrollu, maksymalnie kilkanaście pikseli. Bez efektu 3D i bez tiltu za myszką.
- Wejścia sekcji: pojedyncze, delikatne, tylko raz. Zero „animowania wszystkiego”.
- `prefers-reduced-motion` wyłącza ruch, zostawia zmiany opacity.

---

## 6. Sekcja 1: Hero

**Odwzoruj referencję `ref-hero.png` co do układu.** Elementy:

- Przyklejony nagłówek na przezroczystym tle, który po scrollu zmienia się w ciemny z rozmyciem tła: logo w złotej ramce po lewej, linki JAK TO DZIAŁA, QUIZ, KATALOG, ZESTAWY ODKRYWCÓW, GWARANCJE, FAQ w wersalikach z szerokim trackingiem, ikona koszyka z licznikiem po prawej. Cienka złota linia pod nagłówkiem.
- Lewa kolumna: nadtytuł ze złotą kreską „ODLEWKI ORYGINALNYCH PERFUM”, nagłówek szeryfowy w bieli plus druga linia złotą kursywą, podtytuł, dwa przyciski (złoty wypełniony „Znajdź zapach dla siebie” prowadzący do `/quiz`, obrysowany „Zobacz wszystkie zapachy” przewijający do katalogu), pod nimi mikrokopia „5 pytań, około minuty”.
- Prawa strona: kompozycja flakonów i atomizerów Nicci na kamiennej płycie, ciepłe światło z góry po prawej.
- Dolny pasek zaufania na czarnym tle, cztery pozycje ze złotymi ikonami: TYLKO ORYGINAŁY, PONAD 70 ZAPACHÓW, JUŻ OD 5 ML, SZYBKA WYSYŁKA, każda z jedną linią opisu.

Copy hero (do dopracowania przez /copywriting i /humanizer, kierunek zgodny z referencją):
- Nagłówek: „Zapach z najwyższej półki” + kursywą „za ułamek ceny”
- Podtytuł: „Oryginalne perfumy niszowe i designerskie w odlewkach 5, 10 i 20 ml. Płacisz tylko za tyle, ile chcesz nosić.”
- Pasek zaufania: liczbę zapachów pobierz dynamicznie z katalogu, czas wysyłki wstaw jako `{TODO: realna liczba dni}`.

Na telefonie: kompozycja flakonów pod tekstem albo jako przyciemnione tło, nagłówek musi zostać czytelny, przyciski na całą szerokość, pasek zaufania jako przewijany poziomo rząd.

---

## 7. Sekcja 2: Jak to działa

Używasz mojego artifactu z `/refs`. Zmieniasz tylko kolory na tokeny, typografię i responsywność. Sekcja zostaje na ciemnym tle jako domknięcie ciemnej części strony.

Wymóg treściowy, który musi tam być widoczny, bo inaczej klient jest zaskoczony na końcu: **rezerwacja trzymana 24 godziny oraz płatność BLIKiem na telefon lub przelewem.**

---

## 8. Sekcja 3: Rodziny zapachowe i wejście do quizu

Tło kremowe. Układ karuzeli jak w referencjach `ref-rodziny-*.png`: duży kadr fotograficzny po lewej (surowce zapachowe w mocnym, ciepłym świetle), po prawej panel w jaśniejszym kremie z nadtytułem „RODZINA ZAPACHOWA”, nazwą rodziny, rzędem miniatur nut, opisem i przyciskiem.

Zmiany wobec referencji:

- Przycisk w panelu: **„Dobierz zapach w minutę”** prowadzi do `/quiz?rodzina={slug}` i ustawia tę rodzinę jako wstępną odpowiedź. Drugi link tekstowy: „Zobacz zapachy z tej rodziny”, ustawia filtr katalogu na stronie głównej.
- Slajdy generuj z rodzin obecnych w katalogu (`Nicci.groupProducts(products, 'rodzina')`), a nie z listy na sztywno. Rodzina bez produktów nie pojawia się w karuzeli. Pod nazwą rodziny pokaż realną liczbę zapachów.
- Ostatni slajd: „Nie wiesz, do której należysz?” z jednym CTA do quizu.
- Nawigacja: przeciąganie, strzałki na desktopie, kropki w złocie, klawiatura (strzałki lewo, prawo), `aria-roledescription="carousel"`.

Opisy rodzin pisze **/storytelling**: dwa do trzech zdań, obraz zamiast listy nut, język zmysłowy, zero encyklopedii. Przykład kierunku dla rodziny drzewnej: „Ciepłe drewno, szczypta pieprzu i coś żywicznego pod spodem. Ten zapach nie wchodzi pierwszy do pokoju, ale zostaje w nim najdłużej. Dla osób, które lubią, gdy ktoś pyta, czym pachną, dopiero po godzinie rozmowy.” Każdy opis kończ podpowiedzią, dla kogo ta rodzina jest.

---

## 9. Sekcja 4: Katalog

### Układ

Siatka kart: 1 kolumna na telefonie, 2 na tablecie, 3 do 4 na desktopie. Nad siatką: przełącznik grupowania **Rodziny zapachowe | Marki**, wyszukiwarka po nazwie i nutach, filtry (rodzina, marka, pora dnia, sezon, profil, „tylko dostępne” domyślnie włączone). Na telefonie filtry w szufladzie z przyciskiem „Filtry (2)”. Aktywne filtry jako usuwalne chipy nad siatką. Licznik wyników. Stan pusty z propozycją wyczyszczenia filtrów i linkiem do quizu.

Przy grupowaniu po rodzinach: nagłówki grup ze złotą linią i liczbą pozycji, przyklejone przy scrollu.

Ładowanie: szkielety kart o docelowych proporcjach, żeby nie skakał layout.

### Karta produktu w siatce (rozwinięcie referencji LV)

Struktura od góry:

1. **Zdjęcie flakonu** na jasnym tle, wewnątrz złotej ramki karty, z naturalnym cieniem padającym z góry (patrz sekcja 13).
2. **Marka** złotym szeryfem, **nazwa** bielą, tu na ciemnym pasku karty albo na kremie, zależnie od wariantu, który wybierzesz w kroku designu. Zaproponuj mi dwa warianty karty i wybierz jeden po ocenie na siatce, bo referencja LV była projektowana jako pojedynczy kadr, a nie jako element siatki.
3. **Zamiast gwiazdek**: rząd etykiet z realnych danych (rodzina, pora dnia, profil). Etykieta niedoboru „Zostało X ml z tego flakonu” w złocie, gdy `malo = true`.
4. **Cztery kluczowe nuty** jako miniatury z podpisami, dokładnie jak w referencji. Miniatury z jednej spójnej biblioteki (sekcja 13).
5. **Skrót opisu**, dwie linie z wygaszeniem, link „Rozwiń opis” otwiera szufladę szczegółów.
6. **Przełącznik 5 / 10 / 20 ml**, warianty bez ceny w arkuszu w ogóle się nie pokazują, warianty niedostępne są wyszarzone z tooltipem.
7. **Cena** aktualizowana przy zmianie wariantu z krótką animacją liczby.
8. **Dodaj do koszyka**: złoty przycisk, po kliknięciu zmienia się w stan potwierdzenia z licznikiem sztuk i nie przenosi nigdzie użytkownika. Koszyk sygnalizuje dodanie subtelnym ruchem ikony.

Produkt wyprzedany: karta w stanie stonowanym, etykieta „Wyprzedane”, przycisk zamienia się w „Zobacz podobne” i otwiera szufladę z pozycjami z pola `podobne`.

### Szuflada szczegółów produktu

Otwiera się z boku na desktopie, jako sheet od dołu na telefonie, bez przeładowania strony, z aktualizacją adresu (`?produkt=id`), żeby dało się wysłać link w DM. Zawartość zgodna z Twoją referencją `ref-karta-lv-2.png`:

- duże zdjęcie, marka, nazwa, etykiety,
- pełny opis (z arkusza, bez zmian),
- **piramida nut**: głowa, serce, baza, każda grupa z ikoną i nutami rozdzielonymi na chipy,
- **pora roku** i **pora dnia** jako rząd ikon z podświetleniem tych aktywnych,
- **trwałość i projekcja** jako paski. Dane w arkuszu są tekstowe, więc paski rysuj tylko wtedy, gdy da się je jednoznacznie zmapować (np. słaba, umiarkowana, mocna na 3 poziomy). Jeśli wartość jest nietypowa, pokaż sam tekst zamiast paska. Nie zgaduj liczb,
- wybór wariantu, cena, dodanie do koszyka przyklejone na dole szuflady,
- **„Podobne w naszym katalogu”** z pola `podobne`, jako mały poziomy rząd kart,
- przycisk „Zapytaj nas na Instagramie” (`https://ig.me/m/HANDLE`) dla osób, które przed zakupem chcą dopytać.

Nawigacja klawiaturą, focus trap, zamykanie Esc i gestem, przywrócenie focusu na kartę po zamknięciu.

---

## 10. Sekcje 5 do 8

**Zestawy odkrywców**: poziomy rząd kart na kremowym tle, w każdej nazwa, skład z ml, cena, oszczędność wobec zakupu osobno (policz z cen wariantów, jeśli da się to zrobić bez zgadywania), przycisk dodania. Zestaw niedostępny, gdy brakuje któregokolwiek składnika, z informacją którego.

**Gwarancje**: trzy bloki, oryginalność, dopasowanie, czas wysyłki. Każda gwarancja musi opisywać konkretny mechanizm, a nie obietnicę. Treść oznacz jako `{TODO: potwierdzić z właścicielem i z regulaminem}`, bo gwarancja niezgodna z regulaminem to realny problem.

**FAQ**: akordeon, pierwsze pytanie otwarte, pytania zgodne z listą z `architektura-strony.md`. Dodaj pytanie „Kiedy potwierdzicie moją wpłatę”, bo płatność weryfikuje człowiek.

**Stopka**: czarna, logo, dane sprzedawcy `{TODO}`, linki prawne, Instagram, metody płatności i dostawy.

---

## 11. Podstrona `/quiz`

### Mechanika

- Pytania i logika z `Nicci.quiz.questions` oraz `Nicci.quiz.recommend`. Nie wymyślasz własnych pytań. Jeśli w API są 5 pytań, ekranów jest 5.
- Jedno pytanie na ekran, pełna wysokość, pasek postępu w złocie u góry plus licznik „2 z 5”.
- Odpowiedzi jako duże kafle: **ikona, nazwa odpowiedzi, jedna linia doprecyzowania**. Na telefonie kafle na całą szerokość, minimum 56 px wysokości.
- Pytanie wielokrotnego wyboru (klimat, maksymalnie dwie odpowiedzi) pokazuje licznik wyboru i blokuje trzeci kafel z czytelnym komunikatem.
- Wybór pojedynczy przechodzi dalej automatycznie po krótkiej pauzie, z możliwością cofnięcia (przycisk „Wstecz” zawsze widoczny). Wybór wielokrotny wymaga przycisku „Dalej”.
- Przejścia między pytaniami: poziome przesunięcie ze sprężyną, treść nie miga.
- Odpowiedzi trzymane w `sessionStorage`, powrót ze strony wyniku przywraca stan.
- Wejście z `?rodzina=` z karuzeli zaznacza tę rodzinę z góry i pokazuje to na pierwszym ekranie.
- Ekran przejściowy przed wynikiem: krótka animacja dobierania (maksymalnie 1,5 s), z tekstem w stylu „Sprawdzamy, co z ponad 70 zapachów pasuje do Twoich odpowiedzi”. Nie udawaj dłuższego liczenia niż potrzeba.

### Ikony odpowiedzi

Dla **każdej odpowiedzi** własna ikona SVG, jeden spójny zestaw: line art, stroke 1,5 px, zaokrąglone końce, siatka 32×32, kolor `--n-gold` na ciemnym tle kafla, brak wypełnień. Zero ikon z bibliotek typu Lucide czy Font Awesome, mają być rysowane pod tę markę.

Najpierw odczytaj realne odpowiedzi z `nicci-api.js` i przedstaw mi mapę „odpowiedź → ikona”. Kierunek rysunku:

- rodziny: cytrusowa (przekrojony cytrus), drzewna (słój drewna), kwiatowa (pojedynczy kwiat z profilu), słodka i gourmand (kropla karmelu), orientalna i ambrowa (bryłka żywicy), skórzana (fragment skóry z przeszyciem), wodna (fala), aromatyczna (gałązka), szyprowa (mech i liść), świeża (listek z kroplą),
- pora dnia: słońce w zenicie, półksiężyc, słońce i księżyc razem dla uniwersalnej,
- sezon: pąk, słońce nad wodą, liść, płatek śniegu,
- intensywność: jeden łuk blisko punktu, dwa łuki, trzy łuki,
- okazja i klimat: krzesło biurowe, kieliszki, serce, walizka, w zależności od tego, co faktycznie jest w API.

Każda ikona ma `aria-hidden`, a kafel czytelną etykietę tekstową.

---

## 12. Podstrona `/wynik`

Najważniejszy ekran strony, bo tu zapada decyzja. Tło kremowe, kompozycja spokojna, jeden mocny akcent.

1. **Nagłówek personalizowany**: „Twój zestaw dopasowany” z jedną linią podsumowującą odpowiedzi, np. „Drzewne, wieczorowe, zostawiające ślad”. Buduj ją z wybranych odpowiedzi, nie z szablonu.
2. **Trzy karty zapachów** z `Nicci.quiz.recommend`, ułożone jako pierwsza wyróżniona (większa, ze złotą ramką i etykietą „Najlepsze dopasowanie”) i dwie mniejsze obok. W każdej: zdjęcie, marka, nazwa, **jedno zdanie uzasadnienia dopasowania napisane przez /storytelling na podstawie realnych pól** (rodzina, pora, intensywność, nuty), wariant 5 ml jako domyślny, cena, przycisk dodania.
3. **Zestaw odkrywców z tej rodziny**, jeśli istnieje, jako alternatywa „chcę przetestować kilka”.
4. **Dwa wyjścia**: „Dodaj wszystkie trzy do koszyka” z policzoną sumą oraz „Zobacz wszystkie zapachy z tej rodziny” prowadzące do katalogu z ustawionym filtrem.
5. Pod spodem: „Zacznij quiz od nowa” oraz „Zapytaj nas na Instagramie”, oba jako linki tekstowe, nie przyciski.
6. Stan brzegowy: brak dopasowań powyżej progu. Wtedy pokaż trzy najbliższe z uczciwym komunikatem, że pasują częściowo, i wyeksponuj zestaw odkrywców.
7. Po dodaniu do koszyka na tym ekranie pokaż pasek z podsumowaniem i przyciskiem „Przejdź do zamówienia”, żeby ścieżka nie urwała się na sukcesie.

---

## 13. Grafiki

### Zdjęcia produktów (flakony)

- Pozyskaj z sieci **packshoty na jasnym, jednolitym tle, z naturalnym cieniem padającym z góry**, tak jak referencyjne zdjęcie LV Imagination. Preferuj materiały prasowe producenta i zdjęcia bez obcych znaków wodnych.
- Ujednolić: przytnij do jednej proporcji (4:5), wyrównaj wielkość flakonu w kadrze, ustaw jednakowe tło i kierunek cienia. Bez tego siatka rozjedzie się wizualnie i to jest najczęstszy powód, dla którego takie katalogi wyglądają amatorsko.
- Eksport WebP, szerokość do 800 px, `loading="lazy"`, `width` i `height` w HTML, `srcset` dla 400 i 800 px.
- Zapisuj lokalnie w `/site/img/produkty/{id}.webp` i uzupełnij kolumnę `zdjecie_url` w arkuszu.
- **Uwaga, którą mam znać**: zdjęcia i nazwy marek są chronione, a sprzedaż odlewek to i tak wrażliwy obszar. Docelowo najbezpieczniejsze są własne zdjęcia flakonów i atomizerów Nicci. Wypisz mi w raporcie źródło każdego użytego zdjęcia, żebym mógł to ocenić.

### Miniatury nut

Jedna spójna biblioteka małych ikon lub zdjęć surowców (cytrus, drewno, wanilia, pieprz, ambra, mech, róża i tak dalej), używana zarówno w kartach produktów, jak i w panelach rodzin. Zmapuj nuty z arkusza na tę bibliotekę słownikiem, a nuty bez dopasowania pokazuj jako sam tekst. Nie generuj osobnej grafiki do każdej nuty z osobna.

### OpenArt MCP (budżet 900 tokenów)

Używasz **wyłącznie** do kadrów, których nie da się pozyskać inaczej. Procedura obowiązkowa:

1. Sprawdź koszt przez `openart_model_cost` **zanim** cokolwiek wygenerujesz.
2. Przedstaw mi plan: lista kadrów, model, liczba wariantów, szacowany koszt, suma. **STOP, czekasz na moją zgodę.**
3. Generuj pojedynczo, po każdym raportuj zużycie. Przy 700 zużytych tokenach zatrzymaj się i zapytaj.

Priorytety, od najważniejszego:

1. **Kompozycja hero** (1 kadr, jeśli nie mam gotowego pliku): flakony i złote atomizery Nicci na ciemnej kamiennej płycie, ciepłe boczne światło, magnolia, dużo wolnej przestrzeni po lewej pod tekst.
2. **Kadry rodzin zapachowych** (po jednym na rodzinę, zacznij od 4 najliczniejszych): surowce w mocnym, kierunkowym świetle na ciepłym tle, w stylu referencji, bez ludzi i bez tekstu.
3. **Grafika Open Graph** (1 kadr), bo link ląduje w DM i relacjach.

Wszystko poza tą listą: ikony rysujesz jako SVG, tła buduj kolorem i typografią, nie generuj obrazków dekoracyjnych.

Prompt bazowy dla OpenArt:

```
Luxury still life product photography, dramatic directional warm light from top right, deep shadows, dark stone and warm cream surfaces, gold accents, shallow depth of field, 85mm lens, hyperrealistic textures, editorial perfume campaign aesthetic, generous empty space for text, no people, no text, no logos, no watermark.
```

---

## 14. Koszyk, zamówienie, potwierdzenie

Zgodnie z `architektura-strony.md`, z dopracowaniem UX:

- **Szuflada koszyka**: pozycje z `Nicci.cart.summary(catalog)`, zmiana ilości bez przeładowania listy, pasek postępu do darmowej dostawy ze zmianą tekstu po przekroczeniu progu, pozycja niedostępna wyraźnie oznaczona i blokująca dalszy krok do czasu usunięcia. Pusty koszyk: krótkie zdanie i przycisk do quizu.
- **`/zamowienie`**: jeden ekran, na desktopie formularz i podsumowanie obok siebie, na telefonie podsumowanie zwinięte u góry. Pola i walidacja dokładnie jak w tabeli z `architektura-strony.md`, walidacja lustrzana do backendu, walidacja na blur a nie na każdym znaku, błędy przy polach i jedno podsumowanie u góry. Honeypot `website` ukryty poprawnie (nie `display:none` w stylu łatwym do wykrycia przez wypełniacze, użyj techniki opisanej przez /security-and-hardening). Przycisk „Zamawiam i rezerwuję” blokowany na czas wysyłki, obsługa odpowiedzi `ok`, `validation`, `out_of_stock` i błędu ogólnego zgodnie z dokumentem.
- **`/potwierdzenie`**: dane z `Nicci.lastOrder()`, karta płatności dla wybranej metody z przyciskami kopiowania przy każdym polu i potwierdzeniem skopiowania, druga metoda zwinięta niżej, informacja o mailu z prośbą o sprawdzenie folderu Oferty i Spam, opcjonalny przycisk wysłania zamówienia na Instagram. Licznik czasu rezerwacji pokazuj jako datę i godzinę, nie jako odliczanie sekund, bo to podbija stres bez powodu.

---

## 15. Treści

Głos marki: pewny siebie, konkretny, bez nadęcia. Sprzedajemy dostęp do zapachów, na które normalnie trzeba wydać kilkaset złotych za flakon. Klient ma poczuć, że rozmawia z kimś, kto zna się na perfumach i nie robi z niego laika.

- Opisy produktów: **z arkusza, bez przepisywania.** Jeśli któryś jest pusty, oznacz go w raporcie, nie dopisuj własnego.
- Nowe teksty piszesz tylko tam, gdzie ich nie ma: hero, „Jak to działa” (jeśli artifact ma placeholdery), opisy rodzin, ekran przejściowy i wynik quizu, gwarancje, FAQ, mikrokopia, puste stany, komunikaty błędów, strona potwierdzenia.
- Każdy tekst przechodzi przez **/humanizer**. Sprawdzian: czy właściciel marki mógłby to napisać sam w DM, nie zmieniając ani słowa.
- Mikrokopia ma rozbrajać obawy dokładnie tam, gdzie powstają: przy przycisku zamówienia, przy wyborze płatności, przy etykiecie niedoboru, przy dodawaniu do koszyka.

---

## 16. Technika

- Hosting statyczny (Cloudflare Pages), czysty HTML, CSS i JS plus `nicci-api.js`. Żadnego frameworka z buildem, chyba że pokażesz mi, że bez niego nie da się utrzymać jakości. Wtedy pytasz, zanim to wprowadzisz.
- Podstrony jako pliki `index.html`, `quiz.html`, `wynik.html`, `zamowienie.html`, `potwierdzenie.html`, `regulamin.html`, `prywatnosc.html`.
- Katalog pobierany raz i cache'owany w `sessionStorage` na czas sesji, żeby przejście na quiz i wynik nie wywoływało kolejnych zapytań. Pierwsze wejście pokazuje szkielety.
- Cel: LCP poniżej 2,5 s na 4G, CLS poniżej 0,1, zero layout shiftu w siatce katalogu. Hero z `fetchpriority="high"`, reszta lazy.
- Dostępność: kontrast minimum 4,5:1 (sprawdź szczególnie złoto na kremie, w małym tekście prawdopodobnie nie przejdzie, wtedy złoto zostaje dekoracją), pełna obsługa klawiatury, widoczny focus, etykiety pól zawsze widoczne, `aria-live` przy zmianach koszyka.
- SEO: meta i Open Graph, `Product` i `FAQPage` w schema.org, `sitemap.xml`, `robots.txt`.
- Zero sekretów w kodzie front-endu. W `nicci-api.js` uzupełniasz tylko `API_URL` i `IG_HANDLE`.

---

## 17. Czego nie robisz

- Nie dodajesz bramki płatności, konta użytkownika, newslettera ani chatbota.
- Nie zmieniasz kontraktu `nicci-api.js` i nie dopisujesz do niego logiki biznesowej.
- Nie wstawiasz zdjęć ludzi ze stocków.
- Nie dodajesz opinii, ocen, liczników „ktoś właśnie kupił” ani odliczania promocji.
- Nie nadpisujesz mojego artifactu sekcji 2.

---

## 18. Etapy pracy

1. **Rozpoznanie**: analiza `nicci-api.js`, arkusza i referencji. Oddajesz mi listę funkcji, pól i pytań quizu plus propozycję struktury plików. **STOP.**
2. **System wizualny**: tokeny, typografia, komponenty bazowe, presety motion, dwa warianty karty produktu na statycznej siatce. **STOP, wybieram wariant.**
3. **Plan grafik i budżet OpenArt** (sekcja 13). **STOP, akceptuję budżet.**
4. Strona główna: hero, integracja sekcji 2, karuzela rodzin.
5. Katalog: siatka, filtry, karta, szuflada szczegółów, stany ładowania i pustki.
6. Quiz i wynik razem z zestawem ikon SVG. **STOP, pokazujesz arkusz ikon.**
7. Koszyk, `/zamowienie`, `/potwierdzenie`, strony prawne jako szkielety.
8. Treści przez /copywriting, /storytelling i /humanizer, na wszystkich ekranach naraz, żeby głos był spójny.
9. Audyt: /web-design-guidelines, /design:accessibility-review, /performance-optimization, testy z listy w `README.md` (punkty 1, 2, 3, 7).

## 19. Raport końcowy

- lista wszystkich `{TODO}` z informacją, od kogo potrzebuję danych,
- zużycie tokenów OpenArt i lista wygenerowanych kadrów,
- źródła wszystkich zdjęć produktów,
- wyniki kontrastu, Lighthouse i testów ścieżki zamówienia,
- lista produktów z brakującymi danymi w arkuszu (opis, zdjęcie, ceny, nuty),
- instrukcja wdrożenia na Cloudflare Pages i miejsca, w których wpisuję `API_URL`, `IG_HANDLE` i `SITE_URL`.
