# Newsletter, kod −99% na NICCI ESSENTIALS i GHL (decyzja 101)

## Jak to działa

1. Klient wpisuje imię i e-mail w popupie na stronie i zaznacza zgodę.
2. Strona wysyła zapis do backendu sklepu w Apps Script (ten sam adres co katalog i zamówienia).
3. Backend:
   * zapisuje zgodę w nowej zakładce **Newsletter** (data i godzina zgody, strona, kod, wynik przekazania do GHL);
   * na razie każdy dostaje ten sam kod **NICCI-LEGEND** (decyzja 109, `CONFIG.NEWSLETTER.KOD_WSPOLNY`). Kod jest wpisany wprost w mail, więc nie trzeba pola w GHL ani wierszy w zakładce Bony. Pusty `KOD_WSPOLNY` przywraca osobny jednorazowy kod `NICCI-XXXXXX` dla każdego adresu (wiersz w Bony, 30 dni, pole **Kod Essentials** w GHL);
   * tworzy albo aktualizuje kontakt w GHL (imię, e-mail; pole **Kod Essentials** tylko przy osobnych kodach) i dodaje mu tag **newsletter-essentials**.
4. Tag uruchamia workflow w GHL, który wysyła mail z kodem (szablon `dev/maile/kod-essentials.html`).
5. Klient podaje kod przy składaniu zamówienia. Kod działa, gdy w zamówieniu jest zestaw NICCI ESSENTIALS i dowolna odlewka 20 ml: zestaw kosztuje wtedy 1 zł (rabat na jeden zestaw). Wspólny kod działa raz na adres e-mail; przy zamówieniu przez stronę pilnuje tego backend, przy zamówieniu w wiadomościach sprawdzasz to sam.

Strona nigdy nie dostaje kodu w odpowiedzi: kod trafia tylko do skrzynki, na którą przyszedł zapis.

## Krok 1. GHL (konto Nicci)

1. **Pole kontaktu na kod (tylko przy osobnych kodach; przy wspólnym kodzie NICCI-LEGEND pomiń).** Ustawienia, Custom Fields, nowe pole kontaktu typu tekst (jedna linia).
   * Nazwa: `Kod Essentials`.
   * Klucz pola: `contact.kod_essentials`. W mailu to `{{contact.kod_essentials}}`.
2. **Private Integration (token dla strony).** Ustawienia, Private Integrations, nowa integracja „Strona Nicci” z uprawnieniami:
   * edycja i odczyt kontaktów (`contacts.write`, `contacts.readonly`);
   * odczyt pól (`locations/customFields.readonly`; `ghl_test` używa go do sprawdzenia połączenia).

   Token pokazuje się raz. **Nie wklejaj go do czatu ani do repozytorium**, tylko do Apps Script (krok 2).
3. **Location ID.** Ustawienia, Business Profile (albo adres panelu: `.../location/<ID>/...`).
4. **Szablon maila.** Marketing, Emails, Templates, nowy szablon w edytorze kodu HTML: wklej cały plik `dev/maile/kod-essentials.html`.
   * Temat: `{{contact.first_name}}, Twój kod −99% na Siedem Legend`.
   * Nadawca: Nicci Fragrance, adres **kontakt@niccifragrance.pl** (wymaganie właściciela z 17.11.2026). Działa dopiero z domeną wysyłkową z punktu 6.
   * Zostaw włączoną domyślną stopkę GHL z linkiem do wypisania się: szablon nie ma własnego.
5. **Workflow.**
   * Wyzwalacz: Contact Tag, tag dodany: `newsletter-essentials`.
   * Akcja: Send Email z szablonem z punktu 4.
   * Opublikuj.
6. **Domena wysyłkowa (żeby mail szedł z kontakt@niccifragrance.pl i nie lądował w spamie).** Ustawienia, Email Services, dodaj domenę wysyłkową. GHL poda rekordy DNS (TXT, CNAME, MX) do wpisania u dostawcy domeny niccifragrance.pl; zwykle na poddomenie, np. `mg.niccifragrance.pl`.
   * Stan DNS z 17.11.2026: poczta domeny jest w Google Workspace (MX Google, SPF tylko `include:_spf.google.com`, DKIM Google), bez rekordu DMARC i bez domeny wysyłkowej GHL.
   * Nie zmieniaj rekordów MX ani SPF domeny głównej: od nich zależy obecna skrzynka kontakt@niccifragrance.pl. Rekordy GHL idą na poddomenę.
   * Poczekaj, aż GHL pokaże domenę jako zweryfikowaną, i dopiero wtedy wybierz ją w szablonie i workflow.

## Krok 2. Apps Script (arkusz sklepu)

1. Wgraj nowy `apps-script/Code.gs` (zastąp całość).
2. Ustawienia projektu, Właściwości skryptu (Script Properties), dodaj:
   * `GHL_TOKEN`: token z kroku 1.2;
   * `GHL_LOCATION_ID`: ID z kroku 1.3.
3. Uruchom funkcję `ghl_test` i przyjmij uprawnienia (połączenia zewnętrzne). W zakładce Log powinno być „GHL działa. Wspólny kod NICCI-LEGEND jest wpisany w mail…” (przy osobnych kodach: „GHL działa: pole contact.kod_essentials ma id …”).
4. Wdrożenie, Zarządzaj wdrożeniami, edytuj obecne wdrożenie, **nowa wersja**. Adres zostaje ten sam, więc strona nie wymaga zmian.
5. Uruchom `setup`. Dopisze zakładkę Newsletter (zrobi to też pierwszy zapis).

## Krok 3. Test i włączenie

1. Daj znać, że kroki 1 i 2 są gotowe. Popup już jest na stronie głównej, w katalogu i na stronie wyniku quizu, ale w trybie `'blokada'`: formularz widać, a wysłanie niczego nie zapisuje (decyzja 105). Zapisy włącza `TRYB = 'zapis'` w `site/js/newsletter.js`. Podgląd popupu od razu, bez czekania: `?popup=1` (w trybie `'zapis'` ten podgląd wysyła już prawdziwy zapis).
2. Zapisz się własnym adresem. Sprawdź:
   * wiersz w zakładce Newsletter ze statusem „przekazany do GHL”;
   * kontakt z tagiem w GHL;
   * mail z kodem w skrzynce.
3. Jeśli GHL nie działał w chwili zapisu (status „czeka na GHL” albo „błąd GHL” w kolumnie ghl), po naprawie uruchom `ghl_wyslij_zalegle`: dośle zaległe kontakty.

## Do decyzji właściciela

* Wspólny kod NICCI-LEGEND nie ma terminu ważności; koniec akcji to zmiana albo wyczyszczenie `CONFIG.NEWSLETTER.KOD_WSPOLNY` (i tekstu w mailu). Przy osobnych kodach ważność 30 dni (`CONFIG.NEWSLETTER.WAZNOSC_DNI`, 0 = bez terminu).
* Polityka prywatności: newsletter i GHL jako podmiot przetwarzający dane (do uzupełnienia z prawnikiem przed włączeniem).
