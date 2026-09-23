# Nicci Fragrances: architektura strony

Strona ma jeden cel: doprowadzić osobę z Instagrama od "nie wiem, co wybrać" do opłaconego zamówienia w jak najmniejszej liczbie kroków. Dlatego quiz i katalog są na jednej stronie, koszyk jest szufladą (nie osobną podstroną), a checkout mieści się na jednym ekranie.

## Mapa strony

| Adres | Zawartość | Cel |
|---|---|---|
| `/` | Hero, Jak to działa, Quiz, Katalog, Zestawy, Gwarancje, FAQ, Stopka | Wybór i dodanie do koszyka |
| `/zamowienie` | Formularz zamówienia z podsumowaniem | Złożenie rezerwacji |
| `/potwierdzenie` | Numer, kwota, dane do płatności, przycisk do IG | Płatność |
| `/regulamin` | Regulamin sklepu | Wymóg prawny |
| `/prywatnosc` | Polityka prywatności | Wymóg prawny (RODO) |

Parametry adresu obsługiwane przez `nicci-api.js`: `?src=reel12` (źródło wejścia, trafia do zamówienia), `?rodzina=drzewna`, `?marka=Xerjoff` (wstępny filtr katalogu), `#quiz` (przewija do quizu). Linki w DM z InstantDM powinny zawsze mieć `src`, bo tylko tak w arkuszu zobaczysz, który Reel sprzedaje.

## Elementy stałe

Nagłówek przyklejony do góry: logo, linki Katalog, Jak to działa, FAQ oraz ikona koszyka z licznikiem (`Nicci.cart.count()`, odświeżanie przez `Nicci.cart.onChange`). Na telefonie linki chowają się do menu, a koszyk zostaje widoczny zawsze.

Pasek darmowej dostawy nad koszykiem pokazuje, ile brakuje do progu (`summary.toFreeShipping`). To najprostszy sposób na podniesienie średniej wartości zamówienia.

## Sekcje strony głównej

### 1. Hero

Zadanie: w 3 sekundy powiedzieć, co to jest, i dać dwie drogi dalej.

Treść (propozycja, do dopasowania):
Nagłówek: "Oryginalne perfumy niszowe w odlewkach 5, 10 i 20 ml"
Podtytuł: "Poznaj zapach, zanim kupisz cały flakon. Odlewamy prosto z oryginałów i wysyłamy w paczkomacie."
Przycisk główny: "Dobierz zapach w minutę" (przewija do quizu)
Przycisk drugi: "Przeglądaj katalog"
Pasek zaufania pod przyciskami: oryginalne flakony, odlewane ręcznie, wysyłka w X dni roboczych (uzupełnij realny czas).

### 2. Jak to działa

Cztery kroki poziomo na desktopie, pionowo na telefonie:
1. Dobierz zapach w quizie albo wybierz z katalogu
2. Złóż zamówienie, rezerwujemy je dla Ciebie na 24 godziny
3. Zapłać BLIKiem na telefon albo przelewem
4. Odlewamy, pakujemy i wysyłamy do paczkomatu

Krok 2 i 3 muszą wprost mówić o BLIKu na telefon i przelewie, żeby klient nie był zaskoczony brakiem bramki płatności.

### 3. Quiz

Pięć pytań z `Nicci.quiz.questions`, jedno na ekran, z paskiem postępu. Pytanie o klimat pozwala wybrać maksymalnie dwie odpowiedzi. Na telefonie przyciski odpowiedzi na całą szerokość.

Wynik (`Nicci.quiz.recommend`): trzy karty zapachów z krótkim uzasadnieniem dopasowania (np. "drzewny, wieczorowy, mocny"), przyciski dodania do koszyka w wariancie 5 ml jako domyślnym (najniższy próg wejścia), pod spodem pasujący zestaw odkrywców, jeśli istnieje. Dwa linki na dole: "Zobacz wszystkie zapachy z tej rodziny" (ustawia filtr katalogu) i "Zacznij od nowa".

Stany: brak dopasowań powyżej progu (pokaż trzy najlepsze mimo to i zaproponuj zestaw), katalog jeszcze się ładuje (szkielet kart).

### 4. Katalog

Przełącznik grupowania: Rodziny zapachowe | Marki (`Nicci.groupProducts(products, 'rodzina' | 'marka')`). Filtry: rodzina (wielokrotny wybór), marka (wielokrotny wybór), pora dnia, sezon, "tylko dostępne" (domyślnie włączone), wyszukiwarka po nazwie i nutach (`Nicci.filterProducts`). Na telefonie filtry w szufladzie otwieranej przyciskiem "Filtry (2)".

Karta produktu:
marka (mała, wersaliki), nazwa, etykieta rodziny, trzy pierwsze nuty, przełącznik 5 / 10 / 20 ml z ceną, przycisk "Dodaj". Gdy `malo = true`, etykieta "Zostało X ml z tego flakonu". To jest mechanizm niedoboru z oferty i działa na prawdziwym stanie z arkusza. Warianty niedostępne są wyszarzone, a gdy produkt jest całkiem wyprzedany, karta pokazuje "Wyprzedane" i link do podobnych.

Szczegóły produktu (szuflada z boku, bez przeładowania strony): piramida nut (głowa, serce, baza), opis, sezon, pora dnia, trwałość, projekcja, wybór wariantu, sekcja "Podobne w naszym katalogu" z pola `podobne`. Przycisk "Zapytaj nas na Instagramie" otwiera `https://ig.me/m/HANDLE` dla osób, które przed zakupem chcą porozmawiać.

### 5. Zestawy odkrywców

Osobny rząd kart z nazwą, składem (`sklad[].nazwa` i ml), ceną i przyciskiem dodania. Zestaw jest niedostępny, gdy brakuje któregokolwiek składnika.

### 6. Gwarancje

Trzy bloki zgodne z pozycjonowaniem oferty: oryginalność (skąd pochodzą flakony, odlewanie z oryginału), dopasowanie (opisz konkretny mechanizm, zanim go obiecasz, np. co się dzieje, gdy zapach nie pasuje), czas wysyłki (realna liczba dni). Każda gwarancja musi być zgodna z regulaminem.

### 7. FAQ

Minimum: czy perfumy są oryginalne, jak wygląda odlewka i atomizer, jak zapłacić BLIKiem na telefon, ile trwa wysyłka, co jeśli zapłacę po terminie rezerwacji, czy mogę zwrócić odlewkę (odpowiedź zgodna z regulaminem), jak długo zapach utrzymuje się w odlewce. Rozwijane pytania, pierwsze otwarte.

### 8. Stopka

Dane sprzedawcy (imię i nazwisko, adres kontaktowy, e-mail), linki do regulaminu i polityki prywatności, Instagram, informacja o metodach płatności i dostawy.

## Koszyk (szuflada)

Lista pozycji z `Nicci.cart.summary(catalog)`: nazwa, wariant, ilość (plus i minus, maksymalnie 5), cena, usuń. Pozycja, której nie ma już na stanie (`available = false`), jest oznaczona i blokuje przejście dalej, dopóki klient jej nie usunie. Na dole: suma produktów, pasek do darmowej dostawy, przycisk "Przejdź do zamówienia". Pusty koszyk: link do quizu.

## Strona `/zamowienie`

Jeden ekran, dwie kolumny na desktopie (formularz i podsumowanie), jedna na telefonie (podsumowanie zwinięte na górze).

Pola i walidacja (lustrzana do backendu):

| Pole | Wymagane | Walidacja |
|---|---|---|
| Imię i nazwisko | tak | min. 3 znaki |
| E-mail | tak | format adresu, tu trafia instrukcja płatności |
| Telefon | tak | min. 9 cyfr, potrzebny do paczkomatu |
| Instagram | nie | bez @ |
| Dostawa | tak | Paczkomat InPost albo Kurier |
| Kod paczkomatu | przy paczkomacie | 4 do 12 znaków, link "Znajdź paczkomat" do mapy InPost w nowej karcie |
| Ulica, kod, miasto | przy kurierze | kod w formacie 00-000 |
| Płatność | tak | BLIK na telefon (domyślnie) albo przelew |
| Uwagi | nie | do 300 znaków |
| Akceptuję regulamin | tak | checkbox z linkiem |
| Potwierdzam zapoznanie się z polityką prywatności | tak | checkbox z linkiem |
| `website` | ukryte | honeypot, zostaw puste i niewidoczne |

Tekst przycisku: "Zamawiam i rezerwuję". Pod przyciskiem jedno zdanie: "Po kliknięciu pokażemy dane do płatności. Rezerwację trzymamy 24 godziny."

Obsługa odpowiedzi `Nicci.createOrder`:
`ok` przekierowuje na `/potwierdzenie`. `validation` podświetla pola z `fields`. `out_of_stock` pokazuje listę z `shortages` (nazwa, ile zostało, linki do `podobne`) i odświeża katalog. Pozostałe błędy pokazują `res.message`. Przycisk jest zablokowany na czas wysyłki, żeby nie powstały dwa zamówienia.

## Strona `/potwierdzenie`

Dane z `Nicci.lastOrder()` (przetrwają odświeżenie strony).

Układ od góry: numer zamówienia i komunikat "Zarezerwowaliśmy Twoje zapachy do {terminTxt}". Następnie karta płatności dla wybranej metody z przyciskami "Kopiuj" przy każdym polu:

BLIK na telefon: numer telefonu, kwota, tytuł (numer zamówienia), odbiorca, krótka instrukcja "W aplikacji banku wybierz przelew na telefon BLIK".
Przelew: numer konta, odbiorca, kwota, tytuł.

Pod spodem druga metoda zwinięta jako alternatywa. Dalej informacja, że to samo wysłaliśmy mailem (z prośbą o sprawdzenie folderu Oferty i Spam), oraz przycisk "Wyślij zamówienie do nas na Instagramie" (`Nicci.sendOrderToInstagram(order)`), który kopiuje treść i otwiera DM. Pod przyciskiem podpowiedź: "Treść zamówienia jest już skopiowana, wystarczy ją wkleić i wysłać." Ten krok jest opcjonalny i nie blokuje płatności.

## Kierunek wizualny

Zgodny z identyfikacją: nowoczesnie, elegancko, ekskluzywnie, z nutą abstrakcji. Paleta oparta na czerni i bieli logo, jeden akcent (np. ciepłe złoto lub głęboki burgund, do wyboru przy identyfikacji). Szeryfowy krój w nagłówkach, bezszeryfowy w treści. Dużo światła, zdjęcia flakonów i odlewek na jednolitym tle, bez stockowych zdjęć ludzi. Karty produktów minimalistyczne, bez cieni i gradientów na wszystkim.

## Technika

Hosting statyczny (Cloudflare Pages), cały frontend w HTML, CSS i JS plus `nicci-api.js`. Katalog ładuje się jednym zapytaniem do Apps Script (1 do 3 sekund przy pierwszym wejściu, potem z cache serwera), więc od razu pokazuj szkielet kart. Zdjęcia w formacie WebP, szerokość do 800 px, `loading="lazy"`. Meta tagi Open Graph z grafiką marki, bo link często ląduje w DM i relacjach. Kontrast tekstu minimum 4,5:1, wszystkie przyciski osiągalne klawiaturą, etykiety pól formularza zawsze widoczne (nie tylko placeholder).

## Brief do Claude Design

Skopiuj poniższy tekst jako prompt przy tworzeniu strony.

```
Zaprojektuj jednostronicowy sklep katalogowy dla marki Nicci Fragrances, która sprzedaje odlewki oryginalnych perfum niszowych (5, 10, 20 ml) i zestawy odkrywców. Ruch przychodzi głównie z Instagrama na telefonach, więc projektuj mobile first.

Styl: nowoczesny, elegancki, ekskluzywny, z nutą abstrakcji. Czerń i biel jako baza, jeden akcent kolorystyczny. Szeryf w nagłówkach, bezszeryf w treści. Dużo przestrzeni, minimalistyczne karty.

Struktura strony głównej: przyklejony nagłówek z koszykiem, hero z dwoma przyciskami (quiz i katalog), sekcja "Jak to działa" w 4 krokach, quiz 5 pytań jedno na ekran z paskiem postępu i wynikiem w postaci 3 kart, katalog z przełącznikiem grupowania (rodziny zapachowe lub marki), filtrami w szufladzie na telefonie i kartami produktów z przełącznikiem 5/10/20 ml, szuflada szczegółów produktu z piramidą nut i sekcją podobnych zapachów, rząd zestawów odkrywców, trzy gwarancje, FAQ z rozwijanymi pytaniami, stopka.

Dodatkowo: koszyk jako szuflada z paskiem do darmowej dostawy, strona /zamowienie z formularzem w jednej kolumnie na telefonie, strona /potwierdzenie z kartą płatności BLIK na telefon lub przelew i przyciskami kopiowania przy każdym polu.

Dane i logika pochodzą z gotowego pliku nicci-api.js (window.Nicci): fetchCatalog, filterProducts, groupProducts, cart, quiz.recommend, createOrder, lastOrder, sendOrderToInstagram. Nie wymyślaj własnego backendu ani płatności online. Pokaż stany ładowania (szkielety kart), pusty koszyk, produkt wyprzedany i etykietę "Zostało X ml z tego flakonu".
```
