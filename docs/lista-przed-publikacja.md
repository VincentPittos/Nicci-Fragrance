# Co przygotować przed publikacją

Stan na 24.09.2026, po Twoich odpowiedziach. Odpowiedzi A, B, C, E i F są już na stronie, w mailach i w Apps Script (szczegóły w `docs/decyzje.md`, punkty 46 do 58). E-mail `kontakt@niccifragrance.pl` i termin 7 dni roboczych potwierdziłeś. Bon 50 zł za opóźnienie działa według Twoich zasad (90 dni, próg 199 zł za same zapachy): wystawia się sam i klient wpisuje go w polu „Kod bonu”. Zostało to, co poniżej.

* **Część 1: wyślij mi.** Materiały i potwierdzenia, które wpiszę na stronę.
* **Część 2: wpisujesz sam.** Dane do płatności i e-mail wpisujesz bezpośrednio w Apps Script. Repozytorium jest publiczne, więc te dane nie powinny w nim leżeć.
* **Część 3: arkusz Google.** Stany, ceny i zestawy uzupełniasz w arkuszu, strona czyta je na bieżąco.

★ oznacza rzecz, bez której sprzedaży nie da się uruchomić.

---

## Część 1. Wyślij mi

### D. ★ Regulamin i polityka prywatności (wyślesz później)

Najlepiej gotowe teksty od prawnika. Szkielety są pod `/regulamin` i `/prywatnosc`, wszystkie brakujące miejsca są oznaczone `{TODO}`. Twoje zasady (wysyłka, wpłaty, wymiana po konsultacji) są już w szkieletach, żeby prawnik miał je przed oczami. Prawnik powinien rozstrzygnąć:

* **Dane sprzedawcy.** W stopce strony i maili jest samo „Nicci Fragrance” i e-mail (decyzja 63); forma działalności nierejestrowanej zostaje tylko w szkicach regulaminu i polityki prywatności. Ustawa o prawach konsumenta wymaga podania klientowi danych, które identyfikują sprzedawcę, i adresu; prawnik powie, czy wystarczy imię, nazwisko i adres do doręczeń.
* **Zwroty (zrobione, decyzja 67).** Gwarancje, FAQ i regulamin (punkt 6) mówią teraz: 14 dni na odstąpienie od umowy od odebrania paczki, zwrot tylko odlewek z nienaruszoną plombą (wyjątek higieniczny, art. 38 ust. 1 pkt 5 ustawy o prawach konsumenta), odesłanie na koszt klienta, pieniądze w 14 dni. Prawnik sprawdza punkt 6 regulaminu, dopisuje formularz odstąpienia jako załącznik i rozstrzyga zwrot kosztu dostawy przy zwrocie części zamówienia.
* ★ **Plomba na każdym atomizerze.** Wyjątek higieniczny działa tylko dla towaru w zapieczętowanym opakowaniu. Bez plomby (np. naklejki zabezpieczającej na nakrętce albo zgrzanej folii) klient może odstąpić od umowy także po otwarciu odlewki, a tekst na stronie przestaje być prawdziwy. Plomba musi być na każdej wysłanej odlewce od pierwszego zamówienia.
* **Regulamin:** status sprzedaży odlewek; moment zawarcia umowy (złożenie zamówienia czy wpłata); formularz odstąpienia; reklamacje (jak zgłosić, termin odpowiedzi, zwrot pieniędzy); prawo właściwe i pozasądowe rozwiązywanie sporów; data wejścia w życie.
* **Polityka prywatności:** podstawy prawne (rejestr wpłat, źródło wejścia i quiz); umowy powierzenia (Google, Netlify, InPost, DPD, DHL, Meta) i przekazywanie danych poza EOG; okresy przechowywania.

Obie strony mają dziś `noindex` i dopisek „nie publikować w tej postaci”. Po wstawieniu zatwierdzonych tekstów zdejmę jedno i drugie.

### E. Zdjęcia: gotowe

Wszystkie 15 flakonów ma na stronie Twoje zdjęcie, więc zdjęcie ma teraz każdy z 64 aktywnych zapachów. p51 Dior Homme Cologne i p52 Dior Sauvage Parfum są z plików przysłanych w rozmowie 24.09. Przezroczyste i białe tła dostały ten sam jasny, ciepły kolor co pozostałe karty (#F1EFEC), a nie czystą biel, żeby siatka katalogu była równa. Jeśli wolisz biel, mogę ją ustawić na wszystkich kartach.

Przy kolejnych zdjęciach najlepiej: flakon od frontu, cały w kadrze, co najmniej 1500 px wysokości. Tło może być przezroczyste albo jasne, resztę ujednolicę.

---

## Część 2. Wpisujesz sam (tych danych mi nie wysyłaj)

### G. ★ Apps Script

Pełna kolejność razem z domeną i pocztą: `docs/uruchomienie-domeny-i-poczty.md` (skrypt uruchamiasz na koncie `kontakt@niccifragrance.pl` w Google Workspace). Kroki są też w `refs/README.md`, punkt 1. W skrócie:

0. Arkusz z perfumami jest już na Dysku Google: folder „Nicci Fragrance”, plik „Nicci Fragrance: katalog i zamówienia”, z zakładkami Produkty (71 pozycji, 64 aktywne, z opisami, cenami i adresami zdjęć) i Zestawy, sprawdzony komórka po komórce z plikiem `dev/dane/import-do-arkusza.xlsx`. Zakładki Do weryfikacji w nim nie ma, lista jest w `dev/dane/do-weryfikacji.csv`. Stanów (`ml_dostepne`) nie musisz wpisywać (część 3). ★ Maile do klientów wychodzą z konta Google, na którym uruchomisz skrypt. Arkusz leży dziś na koncie kontakt@skalentra.pl: udostępnię go na `kontakt@niccifragrance.pl`, a tam zrobisz kopię (Plik, Utwórz kopię) i na niej uruchomisz skrypt.
1. Wklej `apps-script/Code.gs` do projektu Apps Script przy tym arkuszu (Rozszerzenia, Apps Script).
2. W `CONFIG` na górze pliku wpisz:
   * `OWNER_EMAIL`: e-mail, na który mają przychodzić zamówienia,
   * `BLIK_PHONE`: numer telefonu do przelewów BLIK,
   * `BANK_ACCOUNT`: numer konta, 26 cyfr,
   * `RECIPIENT`: odbiorca przelewu,
   * `SHIPPING`: koszt paczkomatu i kuriera w zł, np. `{ paczkomat: 14.99, kurier: 19.99 }`,
   * `FREE_SHIPPING_FROM`: próg darmowej dostawy w zł albo `0`, jeśli jej nie ma.

   `SELLER_INFO`, `IG_HANDLE` i `SITE_URL` są już wpisane (Nicci Fragrance, `nicci_fragrance`, `https://niccifragrance.pl`).
3. Uruchom `setup`, potem `diagnostyka`. Zakładka Log nie może mieć wpisów „nie jest uzupełnione” ani „nie ma żadnej ceny”. `setup` dopisze zakładki Zamowienia (z listą przewoźników InPost, DPD i DHL), Ewidencja, Bony, Log i Statusy, a Produktów i Zestawów nie zmieni.
4. Wdróż jako aplikację internetową (Wykonaj jako: Ja, dostęp: Każdy).
5. **Wyślij mi tylko adres kończący się na `/exec`.** Ten adres i tak jest widoczny w przeglądarce każdego klienta, więc może trafić do repozytorium.

### H. Bank, poczta i Instagram

* ★ Włącz przelewy BLIK na telefon dla numeru z `BLIK_PHONE` i zrób próbny przelew z innego konta.
* ★ Skrzynka `kontakt@niccifragrance.pl` w Google Workspace (zakładasz Ty, kartę dodaje Nicci): `docs/uruchomienie-domeny-i-poczty.md`, punkt 4. Adres jest w stopce, regulaminie, polityce prywatności i w mailach do klientów, więc musi działać przed startem. Z tego samego konta skrypt wysyła maile sklepu.
* Automatyzacje na Instagramie według `refs/README.md`, punkt 4. Szablony mają już właściwe linki (`https://niccifragrance.pl/quiz?src=reel12`) i nazwę marki.

### I. ★ Netlify i domena

Strona jest na Netlify (`niccifragrance.netlify.app`). Plik `netlify.toml` w repozytorium mówi Netlify, że strona leży w katalogu `site` i nie wymaga budowania; te ustawienia mają pierwszeństwo przed panelem Netlify. Pole Base directory w panelu (Site configuration, Build & deploy) ma zostać puste, inaczej Netlify nie znajdzie tego pliku. Repozytorium ma jedną gałąź, `claude/serene-cray-umqpzo`, i z niej Netlify publikuje; na Twoje hasło połączę ją z gałęzią główną i wtedy zmienisz gałąź produkcyjną w Site configuration, Build & deploy, Branches. Domena `niccifragrance.pl` (kupiona w domeny.pl) jest podłączona od 24.09.2026: DNS w Cloudflare z rekordami „DNS only”, certyfikat HTTPS z Netlify, `www` przekierowuje na adres bez `www` (`docs/uruchomienie-domeny-i-poczty.md`, punkty 1 do 3). Adresy kanoniczne, mapa strony i `robots.txt` wskazują już na tę domenę, więc wyszukiwarki nie powinny indeksować adresu `*.netlify.app`.

Dopóki nie wpiszę adresu `/exec` z punktu G, strona działa jako podgląd: katalog, quiz i koszyk działają na danych z pliku importu, a przy składaniu zamówienia klient widzi komunikat „To podgląd sklepu” i nic nie jest wysyłane.

---

## Część 3. Arkusz Google

```
3. ml_dostepne: nie musisz go wypełniać. Puste pole = zapach w sprzedaży bez limitu. Gdy zapach się skończy, wpisz 0 (karta pokaże „Wyprzedane”). Liczbę ml wpisuj tylko tam, gdzie chcesz, żeby system sam pilnował stanu i pokazywał „Zostało X ml”.
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
9. zdjecie_url: jeśli arkusz powstaje z pliku importu, adresy wszystkich zdjęć już w nim są. Jeśli zakładkę Produkty wypełniłeś wcześniej inaczej, wpisz dla p01 do p05, p42, p43 i p51 do p55, p63, p64 i p65 adres /img/produkty/ID-800.webp (np. /img/produkty/p43-800.webp).
```

Po uzupełnieniu uruchom `diagnostyka` w Apps Script, wypisze to, co jeszcze się nie zgadza.

---

## Po wdrożeniu, razem

1. ~~Wpiszę `API_URL` w `nicci-api.js` i wypchnę zmiany.~~ Zrobione 25.09.2026.
2. Ty składasz prawdziwe zamówienie BLIK na własny e-mail i przechodzisz testy 1 do 9 z `refs/README.md`.
3. Przy pierwszej paczce każdego przewoźnika sprawdź, czy link śledzenia w mailu otwiera właściwą przesyłkę. Z mojego środowiska odpowiedziała tylko strona DPD; InPost odrzuca automatyczne zapytania, a DHL nie odpowiadał. Adresy są w `CONFIG.TRACKING_URLS`.
4. Po zatwierdzeniu dokumentów zdejmuję `noindex` z regulaminu i polityki prywatności.
