# Newsletter, kod −99% na NICCI ESSENTIALS i GHL (decyzja 101)

## Jak to działa

1. Klient wpisuje imię i e-mail w popupie na stronie i zaznacza zgodę.
2. Strona wysyła zapis do backendu sklepu w Apps Script (ten sam adres co katalog i zamówienia).
3. Backend:
   * zapisuje zgodę w nowej zakładce **Newsletter** (data i godzina zgody, strona, kod, wynik przekazania do GHL);
   * wystawia jednorazowy kod `NICCI-XXXXXX` w zakładce **Bony** (powód `newsletter-essentials`, ważny 30 dni). Ten sam adres e-mail przy ponownym zapisie dostaje ten sam kod;
   * tworzy albo aktualizuje kontakt w GHL (imię, e-mail, pole **Kod Essentials**) i dodaje mu tag **newsletter-essentials**.
4. Tag uruchamia workflow w GHL, który wysyła mail z kodem (szablon `dev/maile/kod-essentials.html`).
5. Przy zamówieniu klient wpisuje kod w polu „Kod bonu”. Kod działa, gdy w koszyku jest zestaw NICCI ESSENTIALS i dowolna odlewka 20 ml: zestaw kosztuje wtedy 1 zł (rabat na jeden zestaw). Kod działa raz.

Strona nigdy nie dostaje kodu w odpowiedzi: kod trafia tylko do skrzynki, na którą przyszedł zapis.

## Krok 1. GHL (konto Nicci)

1. **Pole kontaktu na kod.** Ustawienia, Custom Fields, nowe pole kontaktu typu tekst (jedna linia).
   * Nazwa: `Kod Essentials`.
   * Klucz pola: `contact.kod_essentials`. W mailu to `{{contact.kod_essentials}}`.
2. **Private Integration (token dla strony).** Ustawienia, Private Integrations, nowa integracja „Strona Nicci” z uprawnieniami:
   * edycja i odczyt kontaktów (`contacts.write`, `contacts.readonly`);
   * odczyt pól (`locations/customFields.readonly`).

   Token pokazuje się raz. **Nie wklejaj go do czatu ani do repozytorium**, tylko do Apps Script (krok 2).
3. **Location ID.** Ustawienia, Business Profile (albo adres panelu: `.../location/<ID>/...`).
4. **Szablon maila.** Marketing, Emails, Templates, nowy szablon w edytorze kodu HTML: wklej cały plik `dev/maile/kod-essentials.html`.
   * Temat: `{{contact.first_name}}, Twój kod −99% na Siedem Legend`.
   * Nadawca: Nicci Fragrance. Adres nadawcy z domeny podpiętej w GHL (np. kontakt@niccifragrance.pl).
   * Zostaw włączoną domyślną stopkę GHL z linkiem do wypisania się: szablon nie ma własnego.
5. **Workflow.**
   * Wyzwalacz: Contact Tag, tag dodany: `newsletter-essentials`.
   * Akcja: Send Email z szablonem z punktu 4.
   * Opublikuj.

## Krok 2. Apps Script (arkusz sklepu)

1. Wgraj nowy `apps-script/Code.gs` (zastąp całość).
2. Ustawienia projektu, Właściwości skryptu (Script Properties), dodaj:
   * `GHL_TOKEN`: token z kroku 1.2;
   * `GHL_LOCATION_ID`: ID z kroku 1.3.
3. Uruchom funkcję `ghl_test` i przyjmij uprawnienia (połączenia zewnętrzne). W zakładce Log powinno być „GHL działa: pole contact.kod_essentials ma id …”.
4. Wdrożenie, Zarządzaj wdrożeniami, edytuj obecne wdrożenie, **nowa wersja**. Adres zostaje ten sam, więc strona nie wymaga zmian.
5. Uruchom `setup`. Dopisze zakładkę Newsletter (zrobi to też pierwszy zapis).

## Krok 3. Test i włączenie

1. Daj znać, że kroki 1 i 2 są gotowe. Włączymy popup na stronie (`AKTYWNY = true` w `site/js/newsletter.js`, skrypt na stronach).
2. Zapisz się własnym adresem. Sprawdź:
   * wiersz w zakładce Newsletter ze statusem „przekazany do GHL”;
   * kontakt z tagiem w GHL;
   * mail z kodem w skrzynce.
3. Jeśli GHL nie działał w chwili zapisu (status „czeka na GHL” albo „błąd GHL” w kolumnie ghl), po naprawie uruchom `ghl_wyslij_zalegle`: dośle zaległe kontakty.

## Do decyzji właściciela

* Ważność kodu: 30 dni (`CONFIG.NEWSLETTER.WAZNOSC_DNI`, 0 = bez terminu).
* Polityka prywatności: newsletter i GHL jako podmiot przetwarzający dane (do uzupełnienia z prawnikiem przed włączeniem).
