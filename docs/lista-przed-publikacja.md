# Co przygotować przed publikacją

Stan na 24.09.2026. Lista ma trzy części, bo nie wszystko powinno przejść przez mnie:

* **Część 1: wyślij mi.** Odpowiedzi i materiały, które wpiszę na stronę. Najwygodniej skopiuj formularz, uzupełnij i odeślij w jednej wiadomości.
* **Część 2: wpisujesz sam.** Dane do płatności i e-mail wpisujesz bezpośrednio w Apps Script. Repozytorium jest publiczne, więc te dane nie powinny w nim leżeć.
* **Część 3: arkusz Google.** Stany, ceny i zestawy uzupełniasz w arkuszu, strona czyta je na bieżąco.

★ oznacza rzecz, bez której sprzedaży nie da się uruchomić.

---

## Część 1. Wyślij mi

### A. Sprzedawca i kontakt

```
1. ★ Imię i nazwisko albo nazwa firmy:
2. ★ Adres kontaktowy (do stopki i regulaminu):
3. ★ E-mail kontaktowy dla klientów:
4. NIP (jeśli jest):
5. ★ Nazwa konta na Instagramie, bez @:
6. ★ Domena strony (np. niccifragrance.pl), jeśli już kupiona:
```

### B. Wysyłka i płatności (teksty na stronie)

```
7.  ★ Po ilu dniach roboczych od zaksięgowania wpłaty nadajesz paczkę:
8.  ★ Jak często sprawdzasz wpłaty (np. rano i wieczorem):
9.  ★ Kraje dostawy (np. tylko Polska):
10. ★ Kurier: jaka firma (InPost, DPD, inna)?
```

Punkt 10 jest ważny technicznie: mail „Zamówienie jest w drodze” ma dziś link śledzenia InPostu. Przy innym kurierze podmienię go na właściwy.

### C. Produkt, gwarancje i FAQ

```
11. ★ Skąd pochodzą flakony (jedno, dwa zdania):
12. Czy na prośbę pokazujesz zdjęcie flakonu przed wysyłką (tak / nie):
13. Atomizer: z czego jest i czy ma etykietę z nazwą zapachu:
14. Jak długo zapach utrzymuje się w odlewce (Twoja praktyka):
15. ★ Co się dzieje, gdy zapach nie pasuje:
16. ★ Czy można zwrócić odlewkę:
17. ★ Wpłata po terminie rezerwacji: realizujesz, jeśli zapach jest, czy zwracasz pieniądze? Zwrot w ile dni?
```

Odpowiedzi 15 do 17 muszą zgadzać się z regulaminem (punkt D).

### D. ★ Regulamin i polityka prywatności

Najlepiej gotowe teksty od prawnika. Szkielety są na stronie pod `/regulamin` i `/prywatnosc`, wszystkie brakujące miejsca są oznaczone. Prawnik powinien rozstrzygnąć:

* **Regulamin:** status sprzedaży odlewek; moment zawarcia umowy (złożenie zamówienia czy wpłata); prawo odstąpienia, w tym czy odlewki podlegają wyłączeniu z art. 38 ustawy o prawach konsumenta; formularz odstąpienia; reklamacje (jak zgłosić, termin odpowiedzi, zwrot pieniędzy); prawo właściwe i pozasądowe rozwiązywanie sporów; data wejścia w życie.
* **Polityka prywatności:** administrator danych i kontakt w sprawach danych; podstawy prawne (rejestr wpłat, źródło wejścia i quiz); umowy powierzenia (Google, Cloudflare, InPost lub kurier, Meta) i przekazywanie danych poza EOG; okresy przechowywania.

Obecnie obie strony mają `noindex` i dopisek „nie publikować w tej postaci”. Po wstawieniu zatwierdzonych tekstów zdejmę jedno i drugie.

### E. Zdjęcia 15 flakonów

Strony tych marek blokują pobieranie, więc karty pokazują dziś kadr z inicjałami:

| id | Zapach |
|---|---|
| p01 | Louis Vuitton Imagination |
| p02 | Louis Vuitton Pacific Chill |
| p03 | Louis Vuitton Afternoon Swim |
| p04 | Louis Vuitton Nouveau Monde |
| p05 | Louis Vuitton Ombre Nomade |
| p42 | Maison Francis Kurkdjian Grand Soir |
| p43 | Maison Francis Kurkdjian Baccarat Rouge 540 |
| p51 | Dior Homme Cologne |
| p52 | Dior Sauvage Parfum |
| p53 | Dior Sauvage Elixir |
| p54 | Dior Sauvage Extrait |
| p55 | Versace Eros Parfum |
| p63 | YSL Y Parfum |
| p64 | YSL MYSLF Parfum |
| p65 | Hermès Terre d'Hermès Eau Intense Vétiver |

Jak zrobić zdjęcie, żeby pasowało do reszty:

* flakon od frontu, cały w kadrze, etykieta czytelna,
* jednolite jasne tło (kartka, ściana), bez innych przedmiotów,
* rozproszone światło, bez ostrych odbić,
* co najmniej 1500 px wysokości, JPG albo PNG,
* nazwa pliku to id produktu, np. `p43.jpg`.

Tło, kadr i cień ujednolicę tym samym skryptem co pozostałe 49 zdjęć. Materiały prasowe od dystrybutora też się nadają.

### F. Decyzje

```
18. Hero na telefonie: wdrożyć podgląd C (tak / zostaw obecne / poprawki):
19. Zdjęcia producentów przy 49 zapachach: zostają / zastąpisz własnymi:
20. „Dla niej” w quizie: w arkuszu nie ma zapachów damskich, więc ta odpowiedź pokazuje zapachy unisex. Tak zostaje / dodasz damskie:
21. Z makiety desktopowej: przycisk „Wybierz swój zapach” w nagłówku i krój kursywy z makiety (tak / nie):
22. Nazwa marki w tekstach: „Nicci Fragrance” (tak jest na stronie) czy „Nicci Fragrances” (tak jest w README i szablonach Instagrama):
```

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
   * `SELLER_INFO`: dane sprzedawcy do stopki maili,
   * `IG_HANDLE`: nazwa konta bez @,
   * `SITE_URL`: adres strony, bez ukośnika na końcu,
   * `SHIPPING`: koszt paczkomatu i kuriera w zł, np. `{ paczkomat: 14.99, kurier: 19.99 }`,
   * `FREE_SHIPPING_FROM`: próg darmowej dostawy w zł albo `0`, jeśli jej nie ma.
3. Uruchom `setup`, potem `diagnostyka`. Zakładka Log nie może mieć wpisów „nie jest uzupełnione” ani „nie ma żadnej ceny”.
4. Wdróż jako aplikację internetową (Wykonaj jako: Ja, dostęp: Każdy).
5. **Wyślij mi tylko adres kończący się na `/exec`.** Ten adres i tak jest widoczny w przeglądarce każdego klienta, więc może trafić do repozytorium.

### H. Bank i Instagram

* ★ Włącz przelewy BLIK na telefon dla numeru z `BLIK_PHONE` i zrób próbny przelew z innego konta.
* Automatyzacje na Instagramie według `refs/README.md`, punkt 4. **Popraw link:** zamiast `https://TWOJASTRONA/?src=reel12#quiz` użyj `https://TWOJASTRONA/quiz?src=reel12`, bo quiz jest osobną podstroną.

### I. ★ Cloudflare Pages

Nie mam dostępu do Twojego konta Cloudflare. Połącz repozytorium według `docs/raport-koncowy.md`, punkt 6 (katalog `site`, bez polecenia budowania) i dodaj domenę. Daj znać, z której gałęzi ma publikować. Na Twoje hasło połączę zmiany do gałęzi głównej.

---

## Część 3. Arkusz Google

```
23. ★ ml_dostepne: puste w 62 z 64 aktywnych produktów. Pusty stan = zero, więc bez tego prawie cały katalog pokaże się jako wyprzedany.
24. Brakujące ceny: potwierdź, że te pojemności celowo nie są w sprzedaży:
    • bez 5 ml: p12, p21 do p25, p27 do p33, p36, p40, p44, p46 do p53, p55, p59, p61 do p65, p70, p71
    • bez 5 i 10 ml: p66, p67, p68, p69
    • bez 10 ml: p39
    • bez 20 ml: p45
    • bez żadnej ceny: p34, p37 (mają 0 ml, na stronie są wyprzedane)
25. Opisy zestawów dla klienta: żaden z 6 aktywnych nie ma (arkusz ma tylko opis dla doradcy). Możesz przysłać fakty, a ja napiszę teksty.
26. Rodziny zestawów: ma ją tylko z04, więc quiz nie proponuje zestawu z innych rodzin.
27. Zestaw z07 zawiera p60, który jest nieaktywny, więc zestaw jest niedostępny. Aktywować p60 czy zmienić skład?
28. Plik do weryfikacji: dev/dane/do-weryfikacji.csv, 133 wiersze dla 65 pozycji; najwięcej dotyczy rodziny (28), zdjęcia (19), sezonu (19), nut i osiągów (17). Każdy wiersz ma powód. Popraw w arkuszu albo odeślij mi decyzje.
```

Po uzupełnieniu uruchom `diagnostyka` w Apps Script, wypisze to, co jeszcze się nie zgadza.

---

## Po wdrożeniu, razem

1. Wpiszę `API_URL`, `IG_HANDLE` i domenę (`dev/ustaw_domene.py`), a potem wypchnę zmiany.
2. Ty składasz prawdziwe zamówienie BLIK na własny e-mail i przechodzisz testy 1 do 9 z `refs/README.md`.
3. Po zatwierdzeniu dokumentów zdejmuję `noindex` z regulaminu i polityki prywatności.
