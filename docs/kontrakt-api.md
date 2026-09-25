# Kontrakt API

Źródło prawdy: `apps-script/Code.gs` (funkcje `buildCatalog_`, `validateOrder_`, `priceOrder_`, `orderResponse_`). Moduł `site/nicci-api.js` jest niezmieniony, zmienia się w nim tylko `API_URL` i `IG_HANDLE`. Zgodność obu stron sprawdza `node dev/testy_backendu.js`.

Wszystkie kwoty w API są w **groszach**. W arkuszu są w złotych.

## GET `?action=catalog`

```js
{ ok: true, data: {
  products: [Produkt],
  sets: [Zestaw],
  freeShippingFrom: 20000,              // 0 = brak darmowej dostawy
  bon: { kwota: 5000, prog: 19900 },    // CONFIG.BON, tylko do podglądu rabatu w podsumowaniu zamówienia
  shipping: { paczkomat: 1499, kurier: 1999 },
  igHandle: 'nicci_fragrance',
  sprzedaz: false,                      // true tylko przy TAK w zakładce Sklep; strona bez true nie przyjmuje zamówień
  updated: '2026-09-23T12:00:00.000Z'
}}
```

Katalog jest w cache 5 minut. Nowe zamówienie, zmiana statusu i każda edycja zakładek Produkty albo Zestawy czyści cache od razu.

### Produkt

| Pole | Typ | Uwagi |
|---|---|---|
| `id` | string | `p01` |
| `marka`, `nazwa`, `opis` | string | opis bez zmian z arkusza |
| `rodzina` | string | jedna z 12 kanonicznych, małe litery |
| `profil` | string | `męski`, `damski`, `unisex` |
| `nuty` | `{glowy[], serca[], bazy[]}` | przecinki w nawiasach nie dzielą nut |
| `sezon` | string[] | z: wiosna, lato, jesień, zima |
| `pora` | string | `dzień`, `wieczór`, `uniwersalna` |
| `trwalosc`, `projekcja` | number 1–5 albo string | liczba: pasek; tekst: sam tekst; `''`: nie renderować |
| `intensywnosc` | 1, 2, 3 albo null | tylko dla quizu |
| `okazja` | string[] | może być pusta |
| `variants` | `[{ml, price, available}]` | tylko warianty z ceną, rosnąco po ml |
| `malo` | bool | wolny stan od najmniejszego wariantu do `LOW_STOCK_ML` |
| `zostalo` | number albo null | wolne ml, tylko gdy `malo` |
| `podobne` | string[] | id aktywnych produktów |
| `zdjecie` | string | URL albo `''` |
| `kolejnosc` | number | |

Produkt wyprzedany: `variants` bez `available: true` albo pusta lista.

### Zestaw

| Pole | Typ | Uwagi |
|---|---|---|
| `id`, `nazwa`, `opis`, `rodzina` | string | |
| `price` | number | grosze |
| `available` | bool | false, gdy brakuje któregokolwiek składnika |
| `sklad` | `[{id, marka, nazwa, ml, available}]` | nazwa także dla składnika wyłączonego z oferty |
| `cenaOsobno` | number albo null | suma cen składników, null gdy któregoś wariantu nie ma w cenniku |

## POST `createOrder`

Ciało wysyła `Nicci.createOrder(payload)` jako `text/plain` (bez preflight CORS). Moduł sam dokłada `items`, `src` i `quiz`.

```js
{ action: 'createOrder',
  customer: { name, email, phone, instagram },
  delivery: { method: 'paczkomat'|'kurier', paczkomat, street, postcode, city },
  payment: 'blik'|'przelew',
  consents: { regulamin: true, prywatnosc: true },
  note, voucher /* kod bonu, opcjonalny */, website /* honeypot */, items, src, quiz }
```

`voucher` przechodzi przez `Nicci.createOrder` bez zmian w module (payload jest kopiowany w całości).

### Odpowiedź `ok`

```js
{ ok: true, numer: 'NF0101', kwota: 20499, kwotaTxt: '204,99 zł',
  wartoscProduktow: 19000, kosztDostawy: 1499, rabat: 0, bon: '', platnosc: 'blik',   // rabat w groszach
  rezerwacjaDo: ISO, terminTxt: 'czwartku 24 września, 18:40',   // „Zarezerwowaliśmy do {terminTxt}”
  tytul: 'NF0101',
  dane: { blik: { telefon, odbiorca }, przelew: { konto, odbiorca } },
  pozycje: [{ nazwa, opis, ilosc, suma }],
  dostawa: { metoda, opis },
  email, igHandle, igMessage }
```

### Błędy

| `error` | Dodatkowe pola | Kiedy |
|---|---|---|
| `validation` | `fields`: name, email, phone, instagram, delivery, paczkomat, street, postcode, city, payment, note, voucher, regulamin, prywatnosc, items | walidacja lustrzana |
| `validation` z `fields: ['voucher']` | `voucher: {reason, prog, brakuje}`, gdzie `reason` to nieznany, wykorzystany, wygasl albo prog (wtedy są `prog` i `brakuje`) | kod bonu odrzucony; kwoty w groszach, próg liczony za same zapachy |
| `out_of_stock` | `shortages: [{id, nazwa, zostalo, potrzeba, podobne:[{id, nazwa}]}]` | ktoś zarezerwował ml w międzyczasie |
| `invalid_item` | | pozycja albo wariant zniknęły z oferty |
| `rate_limited` | | drugie zamówienie z tego samego e-maila w ciągu minuty |
| `busy` | | blokada zajęta albo przekroczony limit zamówień na godzinę |
| `sprzedaz_wstrzymana` | | w zakładce Sklep jest `sprzedaz: NIE` (albo zakładki brak); sprawdzane przy każdym zamówieniu, bez cache |
| `server_error` | | honeypot, błąd konfiguracji, nieoczekiwany błąd (szczegóły tylko w zakładce Log) |

`network` nadaje sam moduł, gdy żądanie nie dojdzie. Komunikat dla klienta jest w `res.message`.

## Walidacja

| Pole | Reguła |
|---|---|
| Imię i nazwisko | min. 3 znaki |
| E-mail | format adresu |
| Telefon | 9 do 15 cyfr, reszta znaków pomijana |
| Instagram | opcjonalny, `@` na początku usuwamy, potem litery, cyfry, `.` i `_` |
| Dostawa | `paczkomat` albo `kurier` |
| Kod paczkomatu | 4 do 12 znaków A-Z, 0-9, `-` |
| Ulica, kod, miasto | przy kurierze; kod `00-000` |
| Płatność | `blik` albo `przelew` |
| Uwagi | do 300 znaków |
| Zgody | obie `true` |
| Pozycje | 1 do 20, ilość 1 do 5, ml 5, 10 albo 20 |
