# Co przygotować przed publikacją

Stan na 24.09.2026, po Twoich odpowiedziach. Odpowiedzi A, B, C, E i F są już na stronie, w mailach i w Apps Script (szczegóły w `docs/decyzje.md`, punkty 46 do 56). E-mail `kontakt@niccifragrance.pl` i termin 7 dni roboczych potwierdziłeś. Zostało to, co poniżej.

* **Część 1: wyślij mi.** Materiały i potwierdzenia, które wpiszę na stronę.
* **Część 2: wpisujesz sam.** Dane do płatności i e-mail wpisujesz bezpośrednio w Apps Script. Repozytorium jest publiczne, więc te dane nie powinny w nim leżeć.
* **Część 3: arkusz Google.** Stany, ceny i zestawy uzupełniasz w arkuszu, strona czyta je na bieżąco.

★ oznacza rzecz, bez której sprzedaży nie da się uruchomić.

---

## Część 1. Wyślij mi

### Bon 50 zł za opóźnienie

Na stronie i w regulaminie jest już Twoja zasada: jeśli realizacja potrwa dłużej niż 7 dni roboczych, klient dostaje bon na 50 zł na kolejne zakupy za co najmniej 199 zł. Brakuje ustaleń, bez których klient nie ma jak z bonu skorzystać:

```
1. Jak klient ma użyć bonu? Formularz zamówienia nie ma dziś pola na kod.
   Propozycja: pole „Kod bonu” w zamówieniu i zakładka Bony w arkuszu (kod, kwota, próg, data ważności,
   wykorzystany); backend sprawdza kod i odejmuje 50 zł od kwoty do zapłaty.
2. Termin ważności bonu:
3. Czy próg 199 zł liczymy z kosztem dostawy, czy tylko za zapachy:
```

### D. ★ Regulamin i polityka prywatności (wyślesz później)

Najlepiej gotowe teksty od prawnika. Szkielety są pod `/regulamin` i `/prywatnosc`, wszystkie brakujące miejsca są oznaczone `{TODO}`. Twoje zasady (wysyłka, wpłaty, wymiana po konsultacji) są już w szkieletach, żeby prawnik miał je przed oczami. Prawnik powinien rozstrzygnąć:

* **Dane sprzedawcy.** Na stronie jest „Nicci Fragrance, działalność nierejestrowana” i e-mail. Ustawa o prawach konsumenta wymaga podania klientowi danych, które identyfikują sprzedawcę, i adresu; prawnik powie, czy wystarczy imię, nazwisko i adres do doręczeń.
* **Zwroty.** W FAQ jest Twoja zasada: odlewek nie przyjmujemy z powrotem, wymiana tylko po wspólnym doborze na Instagramie. Konsument kupujący przez internet ma co do zasady 14 dni na odstąpienie od umowy. Prawnik musi ocenić, czy odlewki mieszczą się w wyjątkach z art. 38 ustawy o prawach konsumenta. Do tego czasu przy odpowiedzi w FAQ stoi `{TODO}`.
* **Regulamin:** status sprzedaży odlewek; moment zawarcia umowy (złożenie zamówienia czy wpłata); formularz odstąpienia; reklamacje (jak zgłosić, termin odpowiedzi, zwrot pieniędzy); prawo właściwe i pozasądowe rozwiązywanie sporów; data wejścia w życie.
* **Polityka prywatności:** podstawy prawne (rejestr wpłat, źródło wejścia i quiz); umowy powierzenia (Google, Cloudflare, InPost, DPD, DHL, Meta) i przekazywanie danych poza EOG; okresy przechowywania.

Obie strony mają dziś `noindex` i dopisek „nie publikować w tej postaci”. Po wstawieniu zatwierdzonych tekstów zdejmę jedno i drugie.

### E. Zdjęcia: gotowe

Wszystkie 15 flakonów ma na stronie Twoje zdjęcie, więc zdjęcie ma teraz każdy z 64 aktywnych zapachów. p51 Dior Homme Cologne i p52 Dior Sauvage Parfum są z plików przysłanych w rozmowie 24.09. Przezroczyste i białe tła dostały ten sam jasny, ciepły kolor co pozostałe karty (#F1EFEC), a nie czystą biel, żeby siatka katalogu była równa. Jeśli wolisz biel, mogę ją ustawić na wszystkich kartach.

---|---|---|
| p52 | Dior Sauvage Parfum | Plik z Dysku to Sauvage Eau de Parfum, inne stężenie i inna etykieta. Karta pokazuje kadr z inicjałami. |
| p51 | Dior Homme Cologne | Jest na stronie, ale źródło ma 640 × 335 px i flakon zajmuje mały fragment. Powiększyłem je, ale ostrość jest słabsza niż przy innych kartach. Lepsze zdjęcie się przyda. |

Najlepiej: flakon od frontu, cały w kadrze, co najmniej 1500 px wysokości. Tło może być przezroczyste albo jasne, resztę ujednolicę.

---

## Część 2. Wpisujesz sam (tych danych mi nie wysyłaj)

### G. ★ Apps Script

Kroki są w `refs/README.md`, punkt 1. W skrócie:

1. Wklej `apps-script/Code.gs` do projektu Apps Script przy arkuszu.
2. W `CONFIG` na górze pliku wpisz:
   * `OWNER_EMAIL`: e-mail, na który mają przychodzić zamówienia,
   * `BLIK_PHONE`: numer telefonu do przelewów BLIK,
   * `BANK_ACCOUNT`: numer konta, 26 cyfr,
   * `RECIPIENT`: odbiorca przelewu,
   * `SHIPPING`: koszt paczkomatu i kuriera w zł, np. `{ paczkomat: 14.99, kurier: 19.99 }`,
   * `FREE_SHIPPING_FROM`: próg darmowej dostawy w zł albo `0`, jeśli jej nie ma.

   `SELLER_INFO`, `IG_HANDLE` i `SITE_URL` są już wpisane (Nicci Fragrance, `nicci_fragrance`, `https://niccifragrance.pl`).
3. Uruchom `setup`, potem `diagnostyka`. Zakładka Log nie może mieć wpisów „nie jest uzupełnione” ani „nie ma żadnej ceny”. `setup` doda w zakładce Zamowienia kolumnę `przewoznik` z listą InPost, DPD i DHL.
4. Wdróż jako aplikację internetową (Wykonaj jako: Ja, dostęp: Każdy).
5. **Wyślij mi tylko adres kończący się na `/exec`.** Ten adres i tak jest widoczny w przeglądarce każdego klienta, więc może trafić do repozytorium.

### H. Bank, poczta i Instagram

* ★ Włącz przelewy BLIK na telefon dla numeru z `BLIK_PHONE` i zrób próbny przelew z innego konta.
* ★ Po zakupie domeny uruchom skrzynkę `kontakt@niccifragrance.pl`. Adres jest w stopce, regulaminie, polityce prywatności i w mailach do klientów, więc musi działać przed startem.
* Automatyzacje na Instagramie według `refs/README.md`, punkt 4. Szablony mają już właściwe linki (`https://niccifragrance.pl/quiz?src=reel12`) i nazwę marki.

### I. ★ Cloudflare Pages i domena

Nie mam dostępu do Twojego konta Cloudflare. Połącz repozytorium według `docs/raport-koncowy.md`, punkt 6 (katalog `site`, bez polecenia budowania) i podłącz domenę `niccifragrance.pl`. Adresy kanoniczne, mapa strony i `robots.txt` wskazują już na tę domenę, więc do jej podłączenia wyszukiwarki nie powinny indeksować adresu `*.pages.dev`. Daj znać, z której gałęzi ma publikować. Na Twoje hasło połączę zmiany do gałęzi głównej.

---

## Część 3. Arkusz Google

```
3. ★ ml_dostepne: puste w 62 z 64 aktywnych produktów. Pusty stan = zero, więc bez tego prawie cały katalog pokaże się jako wyprzedany.
4. Brakujące ceny: potwierdź, że te pojemności celowo nie są w sprzedaży:
   • bez 5 ml: p12, p21 do p25, p27 do p33, p36, p40, p44, p46 do p53, p55, p59, p61 do p65, p70, p71
   • bez 5 i 10 ml: p66, p67, p68, p69
   • bez 10 ml: p39
   • bez 20 ml: p45
   • bez żadnej ceny: p34, p37 (mają 0 ml, na stronie są wyprzedane)
5. Opisy zestawów dla klienta: żaden z 6 aktywnych nie ma (arkusz ma tylko opis dla doradcy). Możesz przysłać fakty, a ja napiszę teksty.
6. Rodziny zestawów: ma ją tylko z04, więc quiz nie proponuje zestawu z innych rodzin.
7. Zestaw z07 zawiera p60, który jest nieaktywny, więc zestaw jest niedostępny. Aktywować p60 czy zmienić skład?
8. Plik do weryfikacji: dev/dane/do-weryfikacji.csv, 118 wierszy dla 60 pozycji; najwięcej dotyczy rodziny (28), sezonu (19), nut i osiągów (17) oraz podobnych zapachów (10). Każdy wiersz ma powód. Popraw w arkuszu albo odeślij mi decyzje.
9. zdjecie_url: 15 zapachów z Twoimi zdjęciami ma adres w pliku importu dev/dane/import-do-arkusza.xlsx. Jeśli zakładkę Produkty wypełniłeś wcześniej, wpisz dla p01 do p05, p42, p43 i p51 do p55, p63, p64 i p65 adres /img/produkty/ID-800.webp (np. /img/produkty/p43-800.webp).
```

Po uzupełnieniu uruchom `diagnostyka` w Apps Script, wypisze to, co jeszcze się nie zgadza.

---

## Po wdrożeniu, razem

1. Wpiszę `API_URL` w `nicci-api.js` i wypchnę zmiany.
2. Ty składasz prawdziwe zamówienie BLIK na własny e-mail i przechodzisz testy 1 do 9 z `refs/README.md`.
3. Przy pierwszej paczce każdego przewoźnika sprawdź, czy link śledzenia w mailu otwiera właściwą przesyłkę. Z mojego środowiska odpowiedziała tylko strona DPD; InPost odrzuca automatyczne zapytania, a DHL nie odpowiadał. Adresy są w `CONFIG.TRACKING_URLS`.
4. Po zatwierdzeniu dokumentów zdejmuję `noindex` z regulaminu i polityki prywatności.
