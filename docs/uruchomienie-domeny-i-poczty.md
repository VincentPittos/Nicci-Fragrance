# Domena, poczta firmowa i podłączenie sklepu

Instrukcja krok po kroku dla osoby, która zakłada konta.

**Kroki 1 do 3 zrobione 24.09.2026 o 19:40:** serwery DNS domeny to `aida.ns.cloudflare.com` i `braden.ns.cloudflare.com`, rekordy w Cloudflare mają „DNS only”, `https://niccifragrance.pl` odpowiada stroną z Netlify z certyfikatem Let's Encrypt (Netlify odnawia go sam), a `www.niccifragrance.pl` przekierowuje na adres bez `www`. Pierwsza próba miała pomarańczową chmurkę: domena wskazywała wtedy na adresy Cloudflare, a HTTPS nie działał.

**25.09.2026:** skrzynka `kontakt@niccifragrance.pl` działa. W DNS są rekordy MX Google, SPF i klucz DKIM (`google._domainkey`); brakuje DMARC (krok 4.8). Arkusz „Nicci Fragrance: katalog i zamówienia” jest udostępniony adresowi `kontakt@niccifragrance.pl` z prawem edycji (krok 5.1). Tego samego dnia: kopia arkusza i Apps Script na koncie firmowym, wdrożenie z dostępem „Każdy” (pierwsze było ustawione na logowanie i zwracało stronę logowania Google), `API_URL` na stronie (krok 6.1). Katalog z arkusza zgadza się z podglądem (64 zapachy, 6 zestawów). Zostało: próbne zamówienie (krok 6.2), DMARC, przekazanie konta (krok 7).

Stan przed rozpoczęciem:

* Domena `niccifragrance.pl` jest zarejestrowana w domeny.pl i widoczna w rejestrze .pl, ale serwery DNS domeny.pl nie mają jeszcze jej strefy, więc adres nigdzie nie prowadzi. DNSSEC jest wyłączony (brak rekordu DS), więc przeniesienie DNS do Cloudflare niczego nie zepsuje.
* Strona działa pod `https://niccifragrance.netlify.app`.
* Adresy kanoniczne, mapa strony, szablony Instagrama i linki w mailach wskazują już na `https://niccifragrance.pl`.

Kolejność, bo każdy krok zależy od poprzedniego:

1. Cloudflare: dodajesz domenę.
2. domeny.pl: zmieniasz serwery DNS na te z Cloudflare.
3. Netlify: podpinasz domenę do strony.
4. Google Workspace: konto `kontakt@niccifragrance.pl` i poczta. Można zacząć, gdy tylko domena jest aktywna w Cloudflare, równolegle z krokiem 3.
5. Arkusz i Apps Script na koncie firmowym. Wysyłasz mi adres `/exec`.
6. Wpisuję adres do strony, Ty składasz próbne zamówienie.
7. Nicci dodaje kartę, zmienia hasło i włącza weryfikację dwuetapową.

## 1. Cloudflare

1. Zaloguj się na dash.cloudflare.com (albo załóż konto) i wybierz dodanie domeny (Add a domain). Wpisz `niccifragrance.pl` i wybierz plan Free.
2. Jeśli Cloudflare znajdzie jakieś rekordy DNS, usuń je: strefa w domeny.pl jest pusta, więc nie ma czego przenosić.
3. Cloudflare pokaże dwa serwery nazw w rodzaju `ada.ns.cloudflare.com` i `bob.ns.cloudflare.com`. Skopiuj je.

## 2. domeny.pl

1. W panelu domeny.pl wejdź w domenę `niccifragrance.pl` i znajdź zmianę serwerów DNS (delegację). Nazwy w panelu mogą się trochę różnić.
2. Zamiast obecnych serwerów wpisz dwa serwery z Cloudflare i zapisz.
3. Zmiana w rejestrze .pl trwa zwykle od kilkunastu minut do kilku godzin, najdłużej około doby. Cloudflare wyśle maila, gdy domena będzie aktywna (Active). Daj znać po zmianie, sprawdzę delegację z mojej strony.

## 3. Netlify: domena na stronie

1. Netlify, projekt `niccifragrance`, Domain management, Add a domain: `niccifragrance.pl`. Netlify doda też `www.niccifragrance.pl`. Jako domenę główną (primary domain) zostaw `niccifragrance.pl`: na nią wskazują już wszystkie linki, a `www` będzie na nią przekierowywać.
2. W Cloudflare, DNS, Records dodaj:

   | Typ | Nazwa | Wartość | Proxy |
   |---|---|---|---|
   | CNAME | `@` | `apex-loadbalancer.netlify.com` | DNS only (szara chmurka) |
   | CNAME | `www` | `niccifragrance.netlify.app` | DNS only (szara chmurka) |

   Cloudflare pozwala na CNAME w samej domenie (spłaszcza go do adresu IP) i to jest konfiguracja zalecana przez Netlify. Jeśli Netlify w oknie Pending DNS verification pokaże inne wartości, wpisz te z Netlify.

   Szara chmurka jest ważna. Netlify ma własny CDN i sam wystawia certyfikat HTTPS; pomarańczowa chmurka (proxy Cloudflare) dokłada drugą warstwę przed Netlify, a Netlify wprost to odradza (wolniejsze połączenie, problemy z certyfikatem i z publikacją nowych wersji).
3. Netlify, Domain management, HTTPS: kilka do kilkunastu minut po tym, jak DNS zacznie działać, certyfikat wystawi się sam. Jeśli nie, kliknij Verify DNS configuration, potem Provision certificate.
4. Sprawdź `https://niccifragrance.pl` i `https://www.niccifragrance.pl`. Drugi adres ma przekierować na pierwszy.

Netlify zaznacza, że przy zewnętrznym DNS domena bez `www` trafia najpierw do jego serwera pośredniczącego, a nie od razu do najbliższego węzła CDN, i dlatego poleca `www` jako domenę główną. Różnica w szybkości jest niewielka, a przejście na `www` wymagałoby zmiany linków w szablonach Instagrama. Jeśli wolisz `www`, zmienię adres w całej stronie jednym skryptem (`dev/ustaw_domene.py`).

## 4. Google Workspace: kontakt@niccifragrance.pl

1. Na workspace.google.com wybierz rozpoczęcie (Get started). Nazwa firmy: Nicci Fragrance, liczba pracowników: tylko Ty, kraj: Polska.
2. Na pytanie o domenę odpowiedz, że ją masz, i wpisz `niccifragrance.pl`.
3. Pierwszy użytkownik jest administratorem i zarazem skrzynką sklepu: nazwa użytkownika `kontakt`, czyli adres `kontakt@niccifragrance.pl`. Wystarczy jedna licencja w planie Business Starter (poczta, Dysk, Arkusze i Apps Script). Zapisz hasło, w kroku 7 przekażesz je Nicciemu.
4. Weryfikacja domeny: Google poda rekord TXT zaczynający się od `google-site-verification=`. W Cloudflare dodaj rekord TXT, nazwa `@`, wartość od Google, i kliknij weryfikację w Google. Jeśli Google zaproponuje automatyczne dodanie rekordów przez zalogowanie do Cloudflare, możesz z tego skorzystać.
5. Poczta: rekord MX, nazwa `@`, serwer `smtp.google.com`, priorytet `1`. Potem w konsoli administracyjnej (admin.google.com) aktywuj Gmaila: Konto, Domeny, Zarządzaj domenami. Google podaje, że nowy MX może zacząć działać nawet po 72 godzinach, zwykle dzieje się to szybciej.
6. SPF: rekord TXT, nazwa `@`, wartość `v=spf1 include:_spf.google.com ~all`.
7. DKIM, 24 do 72 godzin po aktywacji Gmaila (wcześniej Google nie wygeneruje klucza): admin.google.com, Aplikacje, Google Workspace, Gmail, Uwierzytelnianie e-maili, Wygeneruj nowy rekord, długość klucza 2048. W Cloudflare dodaj rekord TXT o nazwie `google._domainkey` z wartością od Google (zaczyna się od `v=DKIM1`), wróć do konsoli i kliknij Rozpocznij uwierzytelnianie.
8. DMARC, 48 godzin po SPF i DKIM: rekord TXT, nazwa `_dmarc`, wartość `v=DMARC1; p=none; rua=mailto:kontakt@niccifragrance.pl`. Ustawienie `p=none` niczego nie blokuje, a raporty pokażą, czy SPF i DKIM działają.
9. Wyślij maila z prywatnej skrzynki na `kontakt@niccifragrance.pl` i odpowiedz na niego.

Bez SPF i DKIM maile z potwierdzeniem zamówienia częściej trafiają do spamu. Sklep może ruszyć po kroku 6, a DKIM i DMARC dopisujesz, gdy Google na to pozwoli. Rekordy poczty (MX, TXT) nie przechodzą przez proxy Cloudflare, więc chmurka nie ma przy nich znaczenia.

## 5. Arkusz i Apps Script na koncie firmowym

Maile sklepu wychodzą z konta, na którym działa skrypt, więc cały ten krok robisz zalogowany jako `kontakt@niccifragrance.pl`.

1. Napisz mi, gdy konto działa: udostępnię arkusz „Nicci Fragrance: katalog i zamówienia” (dziś leży na koncie kontakt@skalentra.pl) na adres `kontakt@niccifragrance.pl`.
2. Na koncie firmowym otwórz arkusz, wybierz Plik, Utwórz kopię, nazwa „Nicci Fragrance: katalog i zamówienia”. Kopia należy do konta firmowego. Własności oryginału nie da się przenieść do innej organizacji Google, więc dalej pracujesz tylko na kopii.
3. W kopii wybierz Rozszerzenia, Apps Script. Usuń zawartość edytora i wklej `apps-script/Code.gs`. W ustawieniach projektu (koło zębate) ustaw strefę czasową Europe/Warsaw.
4. W `CONFIG` na górze pliku wpisz:
   * `OWNER_EMAIL: 'kontakt@niccifragrance.pl'`,
   * `BLIK_PHONE`, `BANK_ACCOUNT` (26 cyfr) i `RECIPIENT`: dane Nicciego do wpłat. Klient widzi je po zamówieniu na stronie i w mailu,
   * `SHIPPING`: koszt dostawy w zł, np. `{ paczkomat: 14.99, kurier: 19.99 }`,
   * `FREE_SHIPPING_FROM`: próg darmowej dostawy w zł albo `0`,
   * `SITE_URL` zostaw `https://niccifragrance.pl`. Jeśli domena jeszcze nie działa, wpisz tymczasowo `https://niccifragrance.netlify.app`, a po podłączeniu domeny zmień i wdróż nową wersję.
5. Wybierz funkcję `setup` i kliknij Uruchom. Zaakceptuj uprawnienia (przy ekranie „Google nie zweryfikował tej aplikacji” wybierz Zaawansowane i przejdź do projektu). Potem uruchom `diagnostyka`: zakładka Log nie może mieć wpisów „nie jest uzupełnione”.
6. Wybierz Wdróż, Nowe wdrożenie, typ Aplikacja internetowa. Wykonaj jako: Ja. Kto ma dostęp: Każdy. Skopiuj adres kończący się na `/exec` i wyślij mi go.

## 6. Podłączenie strony i próbne zamówienie

1. Wpiszę adres `/exec` w `site/nicci-api.js` i wypchnę zmiany. Tryb podglądu (komunikat „To podgląd sklepu”) wyłączy się sam, a katalog zacznie przychodzić z arkusza.
2. Złóż prawdziwe zamówienie BLIK na prywatny e-mail i sprawdź: mail z danymi do płatności u klienta, mail „Nowe zamówienie” na `kontakt@niccifragrance.pl`, nowy wiersz w zakładce Zamowienia. Zmień status na OPŁACONE (klient dostaje mail o wpłacie), wpisz numer przesyłki (mail z linkiem do śledzenia). Pełna lista: `refs/README.md`, testy 1 do 9.

## 7. Przekazanie konta Nicciemu

1. Nicci loguje się na admin.google.com jako `kontakt@niccifragrance.pl`, wchodzi w Rozliczenia i dodaje swoją kartę. Trzeba to zrobić przed końcem okresu próbnego, inaczej Google zawiesi konto.
2. Nicci zmienia hasło i włącza weryfikację dwuetapową na swoim telefonie.
3. Po zmianie hasła złóż drugie próbne zamówienie. Jeśli mail nie przyjdzie, otwórz Apps Script, uruchom `setup` jeszcze raz i zaakceptuj uprawnienia.

Konto Google Workspace może wysłać ze skryptu maile do 1500 odbiorców dziennie (zwykłe konto Gmail: 100). Jedno zamówienie to zwykle 4 do 5 maili.
