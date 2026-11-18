# Włączenie popupu newslettera: instrukcja krok po kroku (decyzje 101, 105, 109, 110)

## Jak to działa

1. Klient wpisuje imię i e-mail w popupie na stronie i zaznacza zgodę.
2. Strona wysyła zapis do backendu sklepu w Apps Script (ten sam adres co katalog i zamówienia).
3. Backend zapisuje zgodę w zakładce **Newsletter** (data i godzina zgody, strona, kod, wynik przekazania do GHL), a potem tworzy albo aktualizuje kontakt w sub-koncie GHL (imię, e-mail) i dodaje mu tag **newsletter-essentials**.
4. Tag uruchamia workflow w GHL, który wysyła z adresu **kontakt@niccifragrance.pl** mail z kodem (szablon `dev/maile/kod-essentials.html`).
5. Na razie każdy dostaje ten sam kod **NICCI-L3G3ND** (decyzja 109, `CONFIG.NEWSLETTER.KOD_WSPOLNY` w `Code.gs`). Kod jest wpisany wprost w mail. Działa z zestawem NICCI ESSENTIALS i dowolną odlewką 20 ml: zestaw kosztuje wtedy 1 zł. Raz na osobę: przy zamówieniu przez stronę pilnuje tego backend (raz na adres e-mail), przy zamówieniu w wiadomościach sprawdzasz to sam.

Strona nigdy nie dostaje kodu w odpowiedzi: kod trafia tylko do skrzynki, na którą przyszedł zapis.

Pliki z repozytorium (gałąź `claude/serene-cray-umqpzo`), surowa treść do skopiowania:

* `Code.gs`: https://raw.githubusercontent.com/VincentPittos/nicci-fragrance/claude/serene-cray-umqpzo/apps-script/Code.gs
* `Zestaw_Essentials_2026_11.gs`: https://raw.githubusercontent.com/VincentPittos/nicci-fragrance/claude/serene-cray-umqpzo/apps-script/Zestaw_Essentials_2026_11.gs
* `Zestawy_2026_11.gs`: https://raw.githubusercontent.com/VincentPittos/nicci-fragrance/claude/serene-cray-umqpzo/apps-script/Zestawy_2026_11.gs
* `Korekta_2026_11.gs`: https://raw.githubusercontent.com/VincentPittos/nicci-fragrance/claude/serene-cray-umqpzo/apps-script/Korekta_2026_11.gs
* szablon maila: https://raw.githubusercontent.com/VincentPittos/nicci-fragrance/claude/serene-cray-umqpzo/dev/maile/kod-essentials.html

Nazwy przycisków poniżej pochodzą z pomocy HighLevel (listopad 2026). Panel bywa przebudowywany: jeśli coś nazywa się trochę inaczej, szukaj tej samej funkcji w tym samym miejscu menu.

## Krok 1. Sub-konto Nicci Fragrance w GHL

1. Zaloguj się do GHL na koncie agencji i przejdź do widoku agencji (**Agency View**, przełącznik na górze menu po lewej).
2. **Sub-Accounts**, potem **+ Create Sub-Account**.
   * Pyta o snapshot: wybierz pusty (bez snapshotu), bo wszystko ustawimy ręcznie.
   * Pyta o typ konta: konto klienta.
3. Dane konta:
   * Business Name: `Nicci Fragrance`;
   * e-mail: `kontakt@niccifragrance.pl`, strona: `https://niccifragrance.pl`;
   * kraj Polska, strefa czasowa **Europe/Warsaw**;
   * adres i telefon firmy według danych właściciela (nie wpisujemy ich do repozytorium).

   Zapisz.
4. Wejdź do nowego sub-konta (kliknij jego nazwę na liście albo **Switch to Sub-Account**).
5. **Settings**, **Business Profile**: sprawdź strefę czasową i skopiuj **Location ID** (jest w Business Profile; to też ciąg po `/location/` w adresie panelu). Będzie potrzebny w kroku 6.
6. **Settings**, **Email Services** (w nowym układzie panelu: **Settings**, **Communications**, **Email**): usługą wysyłki ma być **LC Email** (domyślna w nowym sub-koncie).

## Krok 2. Domena wysyłkowa dla kontakt@niccifragrance.pl

Bez tego GHL wysyła z zastępczego adresu w swojej domenie (np. `...@mg.msgsndr.com`), a mail od kontakt@niccifragrance.pl trafiałby do spamu. DNS domeny jest w **Cloudflare**.

1. W sub-koncie: **Settings**, **Email Services**, zakładka **Dedicated Domain and IP**, **Add Domain**. W nowym układzie panelu (listopad 2026): **Settings**, **Communications**, **Email**, przycisk **+ Add Domain** w prawym górnym rogu.
2. Wpisz poddomenę tylko do wysyłki: **`mg.niccifragrance.pl`**, czyli domenę, a nie adres e-mail (pomoc GHL zaleca osobną poddomenę, nieużywaną do niczego innego). Domeny głównej `niccifragrance.pl` GHL nie przyjmie, bo ma już pocztę Google (MX i SPF): to błąd „Domain already pointing to email server!”.
   Adresu kontakt@niccifragrance.pl nie dodaje się w tym miejscu: wpisuje się go jako nadawcę w akcji **Send Email** w workflow (krok 5), gdy domena jest zweryfikowana.
3. Po dodaniu domena ma status **Inactive** i napis „Unverified domain will be auto deleted after ...”: to normalne, dopóki w DNS nie ma jej rekordów. Kliknij **Verify Now** na karcie `mg.niccifragrance.pl`: GHL pokaże 5 rekordów z przyciskiem kopiowania. Jeśli zaproponuje automatyczną konfigurację w Cloudflare, możesz z niej skorzystać. Ręcznie: Cloudflare, domena `niccifragrance.pl`, **DNS**, **Records**, **Add record**, w polu **Name** sam przedrostek (Cloudflare dopisuje `niccifragrance.pl`), TTL Auto.

   | Type | Name | Content | Uwagi |
   |---|---|---|---|
   | TXT | `mg` | `v=spf1 include:mailgun.org ~all` | SPF poddomeny |
   | TXT | z ekranu GHL, bez `.niccifragrance.pl` (np. `xxx._domainkey.mg`) | długi klucz z ekranu GHL, skopiowany w całości | DKIM, inny dla każdej domeny |
   | MX | `mg` | `mxa.mailgun.org` | Priority 10 |
   | MX | `mg` | `mxb.mailgun.org` | Priority 10 |
   | CNAME | `email.mg` | `mailgun.org` | **Proxy status: DNS only** (szara chmurka) |

   Wartości z tabeli są według pomocy GHL (artykuł o konfiguracji LC Email w Google Domains, ten sam zestaw 5 rekordów u każdego dostawcy DNS). Jeśli ekran GHL pokazuje coś innego, wpisz to, co pokazuje GHL. Pomarańczowa chmurka przy CNAME psuje weryfikację. Rekordy MX na `mg` nie dotykają poczty Google na `niccifragrance.pl`.
   Jeśli na liście domen jest też sama `niccifragrance.pl`, usuń ją (trzy kropki na karcie, **Delete Domain**) i nie dodawaj jej rekordów: drugi rekord SPF i MX Mailgun na domenie głównej zepsułyby skrzynkę Google.
4. **Nie ruszaj** istniejących rekordów domeny głównej: MX Google, TXT `v=spf1 include:_spf.google.com ~all` i `google._domainkey`. Od nich zależy skrzynka kontakt@niccifragrance.pl w Google Workspace. Rekordy GHL idą na poddomenę `mg`.
5. W GHL kliknij weryfikację. Pomoc GHL podaje do 24 godzin propagacji (w Cloudflare zwykle kilka minut). Błąd „pre-existing record” oznacza rekord wieloznaczny `*.niccifragrance.pl` (usuń go na czas weryfikacji), a „Domain already pointing to email server!” istniejący rekord MX albo SPF na tej poddomenie.
6. Zalecane: rekord DMARC dla domeny głównej. Cloudflare, **Add record**, Type **TXT**, Name `_dmarc`, Content `v=DMARC1; p=none`. Polityka `p=none` niczego nie blokuje, a Gmail i Yahoo oczekują DMARC od nadawców poczty masowej.
7. Po weryfikacji (zielone znaczniki, status aktywny, certyfikat SSL GHL generuje sam): zakładka **Domain Configuration**, ustaw `mg.niccifragrance.pl` jako domyślną (**Default**). Bez domyślnej domeny wysyłki bez przypisania mogą iść przez wspólną infrastrukturę GHL.
8. Nowa domena wysyłkowa: na początku małe wysyłki (sam newsletter z popupu się do tego nadaje), bez masowych kampanii od pierwszego dnia.

## Krok 3. Link do wypisania

Szablon ma w stopce link do wypisania (`{{email.unsubscribe_link}}`), bo maile wysyłane z workflow nie zawsze dostają domyślny.

1. **Settings**, **Business Profile**, zakładka **General**: wyłącz **Include Unsubscribe Link**. Inaczej w mailu będą dwa linki.
2. Każdy kolejny mail z tego sub-konta musi mieć w treści `{{email.unsubscribe_link}}` (albo przełącznik trzeba z powrotem włączyć).

## Krok 4. Szablon maila

1. **Marketing**, **Emails**, **Templates**, nowy szablon. Wybierz pusty szablon i edytor kodu HTML (wklejenie własnego HTML).
2. Wklej **cały** plik szablonu (link na górze tej instrukcji). Nazwa: `Kod −99% Siedem Legend`. Zapisz.
3. Wyślij test na własny adres (przycisk testu w edytorze) i sprawdź: obrazy się wczytują, kod **NICCI-L3G3ND**, jeden link do wypisania w stopce. Pole `{{contact.first_name}}` w teście bywa puste: w prawdziwej wysyłce wstawi imię z popupu.

## Krok 5. Workflow z mailem

1. **Automation**, **Workflows**, **+ Create Workflow**, **Start from Scratch**.
2. **Add New Trigger**, **Contact Tag**, filtr: **Tag Added** = `newsletter-essentials`. Zapisz wyzwalacz.
3. Plus pod wyzwalaczem, akcja **Send Email**:
   * From Name: `Nicci Fragrance`;
   * From Email: `kontakt@niccifragrance.pl` (dopiero po zweryfikowaniu domeny z kroku 2);
   * Subject: `{{contact.first_name}}, Twój kod −99% na Siedem Legend`;
   * Template: szablon z kroku 4.

   Zapisz akcję.
4. W ustawieniach workflow zostaw wyłączone ponowne wejście (**Allow re-entry**), żeby jeden kontakt dostał mail raz.
5. Przełącz workflow z **Draft** na **Publish** i zapisz.

## Krok 6. Token dla strony (Private Integration)

1. W sub-koncie: **Settings**, **Private Integrations**. Jeśli tej pozycji nie ma, włącz ją w ustawieniach agencji, w sekcji **Labs**.
2. **Create new Integration** (w części panelu przycisk nazywa się **Create Private Integration**). Nazwa: `Strona niccifragrance.pl`, opis: `Zapis z popupu newslettera`.
3. Uprawnienia (scopes), tylko te trzy:
   * odczyt kontaktów (`contacts.readonly`);
   * edycja kontaktów (`contacts.write`);
   * odczyt pól kontaktów (`locations/customFields.readonly`; używa go funkcja `ghl_test` do sprawdzenia połączenia).
4. Zapisz i **od razu skopiuj token**: GHL pokazuje go tylko raz. **Nie wklejaj go do czatu, maila ani repozytorium.** Trafia wyłącznie do Apps Script (krok 7).
5. GHL zaleca wymianę tokenu co 90 dni (menu z trzema kropkami, **Rotate and expire this token later**; stary działa jeszcze 7 dni). Po wymianie podmień `GHL_TOKEN` w Apps Script.

## Krok 7. Apps Script (arkusz sklepu)

1. Otwórz arkusz sklepu, **Rozszerzenia**, **Apps Script**.
2. Plik **Code.gs**: zaznacz całą treść, usuń i wklej aktualny `Code.gs` (link na górze). Zapisz (Ctrl+S).
3. Dodaj trzy pliki, jeśli ich jeszcze nie ma (plus obok **Pliki**, **Skrypt**, nazwa jak niżej, wklej treść z linku, zapisz): `Zestaw_Essentials_2026_11`, `Zestawy_2026_11`, `Korekta_2026_11`.
4. **Ustawienia projektu** (koło zębate), **Właściwości skryptu**, **Dodaj właściwość skryptu**:
   * `GHL_TOKEN`: token z kroku 6;
   * `GHL_LOCATION_ID`: Location ID z kroku 1.

   Zapisz.
5. W edytorze wybierz funkcję **`ghl_test`** i kliknij **Uruchom**. Za pierwszym razem Google poprosi o uprawnienia (połączenia z usługami zewnętrznymi): zaakceptuj. W zakładce **Log** arkusza powinno być: „GHL działa. Wspólny kod NICCI-L3G3ND jest wpisany w mail…”. Błąd HTTP 401 albo 403 to zły token, Location ID albo brak uprawnienia z kroku 6.
6. Uruchom po kolei (każda raz):
   * **`setup`**: dopisze zakładkę Newsletter;
   * **`zestaw_essentials_2026_11`**: dopisze zestaw NICCI ESSENTIALS do zakładki Zestawy. Bez niego kod nie ma czego obniżyć, a link z maila prowadzi do zakładki Zestawy na stronie;
   * **`zestawy_2026_11`**: włączy Bottled Absolu (Winter Discovery Set) i wyłączy zestawy LV i Nous Tous;
   * **`korekta_2026_11`**: poprawki nut i opisów (w tym p60).
7. **Wdróż**, **Zarządzaj wdrożeniami**, ołówek przy obecnym wdrożeniu, **Wersja: Nowa wersja**, **Wdróż**. Adres zostaje ten sam, więc strona nie wymaga zmian.

## Krok 8. Polityka prywatności

Przed zbieraniem adresów strona `/prywatnosc` musi opisywać newsletter: cel (wysyłka newslettera i kodu), podstawę (zgoda), czas przechowywania, wycofanie zgody, a GHL (HighLevel) jako podmiot przetwarzający dane. Szkic akapitu przygotujemy; treść zatwierdza właściciel (najlepiej z prawnikiem).

## Krok 9. Włączenie i test

1. Daj znać, że kroki 1 do 8 są gotowe. Popup jest na stronie głównej, w katalogu i na stronie wyniku quizu, ale schowany (`TRYB = 'wylaczony'` w `site/js/newsletter.js`). Włączamy `TRYB = 'zapis'` i publikujemy. Podgląd przed włączeniem: `?popup=1` (w trybie `'zapis'` ten podgląd wysyła już prawdziwy zapis).
2. Zapisz się własnym adresem (najlepiej Gmail) i sprawdź:
   * w zakładce **Newsletter** wiersz ze statusem „przekazany do GHL”;
   * w GHL, **Contacts**: kontakt z tagiem `newsletter-essentials`;
   * w skrzynce mail od kontakt@niccifragrance.pl w odebranych (nie w spamie), z kodem NICCI-L3G3ND i obrazami;
   * link do wypisania: po kliknięciu kontakt w GHL dostaje blokadę maili (DND).
3. Jeśli GHL nie działał w chwili zapisu (w kolumnie ghl „czeka na GHL” albo „błąd GHL”), po naprawie uruchom **`ghl_wyslij_zalegle`**: dośle zaległe kontakty.

## Do decyzji właściciela

* Wspólny kod NICCI-L3G3ND nie ma terminu ważności; koniec akcji to zmiana albo wyczyszczenie `CONFIG.NEWSLETTER.KOD_WSPOLNY` (i kodu w mailu). Pusty `KOD_WSPOLNY` przywraca osobne kody `NICCI-XXXXXX` dla każdego adresu (wiersz w Bony, 30 dni, `CONFIG.NEWSLETTER.WAZNOSC_DNI`); wtedy w GHL potrzebne jest pole kontaktu typu tekst `Kod Essentials` z kluczem `contact.kod_essentials`, a w mailu `{{contact.kod_essentials}}` zamiast NICCI-L3G3ND.
* Wysyłka z LC Email jest płatna od liczby maili i nalicza się w portfelu agencji; stawkę widać w ustawieniach rozliczeń agencji.
