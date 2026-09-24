# Jak działa sklep Nicci Fragrance

Wersja dla właściciela, bez technicznych szczegółów. Sklep to trzy elementy: strona, na której klient wybiera zapachy i składa zamówienie; arkusz Google, w którym są zapachy, ceny i zamówienia; oraz skrypt przy arkuszu, który sam wysyła maile i pilnuje terminów.

Nicci robi w arkuszu tylko trzy rzeczy: zmienia status na OPŁACONE, wpisuje numer przesyłki (przy kurierze także przewoźnika) i wpisuje 0, gdy zapach się skończy. Resztę robi system.

## Droga jednego zamówienia

**1. Klient składa zamówienie na stronie.** Wybiera zapachy, wpisuje dane, paczkomat albo adres dla kuriera i sposób płatności (BLIK na telefon albo przelew). Od razu widzi dane do wpłaty z numerem zamówienia, np. NF0101, który jest tytułem przelewu.

- Klient dostaje maila z danymi do płatności.
- Nicci dostaje maila „Nowe zamówienie NF0101”.
- W arkuszu pojawia się nowy wiersz ze statusem NOWE.

**2. Czekamy na wpłatę (24 godziny).** Zamówienie jest zarezerwowane przez dobę.

- Po 12 godzinach bez wpłaty system sam wysyła klientowi przypomnienie.
- Po 24 godzinach rezerwacja wygasa (status WYGASŁE) i klient dostaje o tym maila. Jeśli pieniądze przyjdą później, zamówienie i tak realizujemy: wystarczy zmienić status na OPŁACONE.

**3. Nicci sprawdza bank rano i wieczorem.** Gdy widzi przelew z tytułem NF0101, w arkuszu zmienia status tego zamówienia na OPŁACONE.

- Klient dostaje maila „Mamy Twoją wpłatę”.
- Wpłata trafia do zakładki Ewidencja.
- Od tej chwili liczy się termin 7 dni roboczych.

**4. Nicci odlewa, pakuje i nadaje paczkę.** W arkuszu przy kurierze wybiera przewoźnika (InPost, DPD albo DHL) i wkleja numer przesyłki. Przy paczkomacie wystarczy sam numer.

- Status zmienia się sam na WYSŁANE.
- Klient dostaje maila z numerem przesyłki i linkiem do śledzenia.

**5. Jeśli paczka nie wyjdzie w 7 dni roboczych od wpłaty,** system sam wysyła klientowi bon na 50 zł (ważny 90 dni, działa przy zapachach za co najmniej 199 zł), a Nicciemu powiadomienie. Dlatego numer przesyłki trzeba wpisać od razu po nadaniu.

## Sytuacje szczególne

- **Zapach się skończył:** wpisz 0 w kolumnie `ml_dostepne`. Na stronie pokaże się „Wyprzedane”. Puste pole oznacza, że zapach jest w sprzedaży bez limitu.
- **Klient rezygnuje albo trzeba oddać pieniądze:** ustaw status ANULOWANE. W Ewidencji pojawi się korekta, a przelew zwrotny robisz ręcznie w banku.
- **Klient zwraca odlewkę (14 dni):** klient ma 14 dni od odebrania paczki, żeby napisać, że rezygnuje, i kolejne 14 dni na odesłanie odlewki na swój koszt. Przyjmujesz tylko odlewki z nienaruszoną plombą, dlatego każda wysłana odlewka musi mieć plombę. Pieniądze oddajesz najpóźniej 14 dni od jego wiadomości, tą samą drogą, którą zapłacił; możesz poczekać, aż paczka wróci albo klient pokaże potwierdzenie nadania.
- **Klient pisze na Instagramie:** na stronie potwierdzenia ma przycisk, który kopiuje treść zamówienia i otwiera wiadomość do @nicci_fragrance.
- **Klient ma bon:** wpisuje kod w polu „Kod bonu” przy zamówieniu, a system sam odejmuje 50 zł i pilnuje, żeby bon zadziałał tylko raz.

## Skąd wychodzą maile

Maile do klientów wysyła firmowe konto `kontakt@niccifragrance.pl` (Google Workspace), bo na nim działa skrypt. Nadawca ma nazwę „Nicci Fragrance”, a odpowiedzi klientów i powiadomienia o nowych zamówieniach trafiają na tę samą skrzynkę. Konto Google Workspace może wysłać ze skryptu maile do 1500 odbiorców dziennie. Jedno zamówienie to zwykle 4 do 5 maili, więc limit wystarcza na około 300 zamówień dziennie.
