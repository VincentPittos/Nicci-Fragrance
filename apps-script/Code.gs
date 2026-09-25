/**
 * NICCI FRAGRANCE: backend w Google Apps Script. Arkusz Google jest bazą danych
 * i panelem właściciela.
 *
 * Kontrakt z modułem strony (site/nicci-api.js), szczegóły w docs/kontrakt-api.md:
 *   GET  ?action=catalog
 *        → {ok:true, data:{products, sets, freeShippingFrom, shipping, igHandle, sprzedaz, updated}}
 *   POST {action:'createOrder', customer, delivery, payment, consents, note, website, items, src, quiz}
 *        → {ok:true, numer, ...}  albo  {ok:false, error, fields?, shortages?}
 *
 * Sprzedaż włącza i wyłącza zakładka Sklep w arkuszu (wiersz sprzedaz: TAK albo NIE). Przy NIE strona pokazuje
 * katalog i quiz, ale nie przyjmuje zamówień, a createOrder_ odrzuca każde zamówienie (sprzedaz_wstrzymana).
 *
 * Ceny w arkuszu są w złotych, w API w groszach.
 *
 * Budowa pliku:
 *   1. CONFIG            jedyne miejsce, które uzupełnia właściciel
 *   2. Stałe
 *   3. Czyste funkcje    bez usług Google, testowane w dev/testy_backendu.js
 *   4. TEMPLATES         treści maili
 *   5. Web app           doGet, doPost, createOrder_
 *   6. Arkusz            odczyt, zapis, stany, ewidencja, log
 *   7. Triggery          handleEdit (zmiana statusu, numer przesyłki), hourly (przypomnienia, wygasanie)
 *   8. Narzędzia         setup, diagnostyka
 */

// ============ 1. CONFIG ============
const CONFIG = {
  SHOP_NAME: 'Nicci Fragrance',
  OWNER_EMAIL: 'UZUPELNIJ',          // tu przychodzą powiadomienia o zamówieniach
  IG_HANDLE: 'nicci_fragrance',      // bez @
  SITE_URL: 'https://niccifragrance.pl', // adres strony, bez ukośnika na końcu
  BLIK_PHONE: 'UZUPELNIJ',           // numer telefonu podpięty pod przelewy BLIK
  BANK_ACCOUNT: 'UZUPELNIJ',         // 26 cyfr, spacje dowolne
  RECIPIENT: 'UZUPELNIJ',            // odbiorca przelewu
  SELLER_INFO: 'Nicci Fragrance, kontakt@niccifragrance.pl', // stopka maili
  SHIPPING: { paczkomat: null, kurier: null },   // w zł, np. 14.99
  FREE_SHIPPING_FROM: 0,             // w zł, 0 wyłącza darmową dostawę
  RESERVATION_HOURS: 24,
  REMINDER_AFTER_HOURS: 12,
  LOW_STOCK_ML: 30,                  // od tej liczby ml w dół karta pokazuje „Zostało X ml”
  ORDER_PREFIX: 'NF',
  ORDER_START: 101,
  MAX_QTY: 5,
  MAX_LINES: 20,
  RATE_LIMIT_SECONDS: 60,            // jedno zamówienie z tego samego adresu e-mail na minutę
  MAX_ORDERS_PER_HOUR: 30,           // bezpiecznik na zalew fałszywych zamówień
  CACHE_SECONDS: 300,
  TIMEZONE: 'Europe/Warsaw',
  // Bon za realizację dłuższą niż PO_DNIACH_ROBOCZYCH dni roboczych od wpłaty (bez weekendów i świąt w Polsce).
  // Wystawia się sam (trigger co godzinę), a klient wpisuje kod w polu „Kod bonu”. PROG liczymy za same zapachy.
  BON: { KWOTA: 50, PROG: 199, WAZNOSC_DNI: 90, PO_DNIACH_ROBOCZYCH: 7 },
  // Linki śledzenia w mailu „w drodze”. Przewoźnika wybierasz w kolumnie przewoznik (przy paczkomacie zawsze InPost).
  // Automatycznie odpowiedział tylko link DPD (InPost i DHL blokują boty): sprawdź każdy na pierwszej przesyłce.
  TRACKING_URLS: {
    InPost: 'https://inpost.pl/sledzenie-przesylek?number={numer}',
    DPD: 'https://tracktrace.dpd.com.pl/parcelDetails?typ=1&p1={numer}',
    DHL: 'https://www.dhl.com/pl-pl/home/sledzenie.html?tracking-id={numer}&submit=1'
  }
};

// ============ 2. STAŁE ============
const SHEET = {
  PRODUKTY: 'Produkty', ZESTAWY: 'Zestawy', ZAMOWIENIA: 'Zamowienia',
  EWIDENCJA: 'Ewidencja', LOG: 'Log', STATUSY: 'Statusy', BONY: 'Bony', SKLEP: 'Sklep'
};

// Zakładka Sklep: przełączniki dla właściciela. Pusty arkusz dostaje je z setup().
const SKLEP_USTAWIENIA = [
  ['sprzedaz', 'NIE', 'TAK: sklep przyjmuje zamówienia. NIE: strona pokazuje katalog i quiz, zamówienia są wstrzymane. Zmiana działa na stronie w ciągu kilku minut.']
];

const STATUS = {
  NOWE: 'NOWE', OPLACONE: 'OPŁACONE', WYSLANE: 'WYSŁANE', ANULOWANE: 'ANULOWANE', WYGASLE: 'WYGASŁE'
};

const STATUS_OPIS = [
  [STATUS.NOWE, 'Złożone, czeka na wpłatę. Ml są zarezerwowane do terminu.'],
  [STATUS.OPLACONE, 'Wpłata dotarła. System zdejmuje ml ze stanu, dopisuje ewidencję i wysyła mail.'],
  [STATUS.WYSLANE, 'Ustawia się samo po wpisaniu numeru przesyłki.'],
  [STATUS.ANULOWANE, 'Anulowane. Jeśli było opłacone, ml wracają na stan, a w ewidencji pojawia się korekta.'],
  [STATUS.WYGASLE, 'Brak wpłaty w terminie. Ustawia się samo, ml wracają do katalogu.']
];

const RODZINY = ['świeża', 'cytrusowa', 'aromatyczna', 'wodna', 'drzewna', 'skórzana', 'szyprowa',
  'słodka', 'orientalna', 'ambrowa', 'gourmand', 'kwiatowa'];
const PROFILE = ['męski', 'damski', 'unisex'];
const PORY = ['dzień', 'wieczór', 'uniwersalna'];
const SEZONY = ['wiosna', 'lato', 'jesień', 'zima'];
const POJEMNOSCI = [5, 10, 20];

const HEADERS = {
  Produkty: ['id', 'aktywny', 'marka', 'nazwa', 'rodzina', 'profil', 'nuty_glowy', 'nuty_serca', 'nuty_bazy',
    'opis', 'sezon', 'pora', 'trwalosc', 'projekcja', 'intensywnosc', 'cena_5', 'cena_10', 'cena_20',
    'ml_dostepne', 'podobne', 'zdjecie_url', 'kolejnosc', 'okazja'],
  Zestawy: ['id', 'aktywny', 'nazwa', 'opis', 'rodzina', 'cena', 'sklad'],
  Zamowienia: ['numer', 'utworzone', 'status', 'rezerwacja_do', 'oplacone', 'imie_nazwisko', 'email', 'telefon',
    'instagram', 'dostawa', 'paczkomat', 'ulica', 'kod', 'miasto', 'platnosc', 'pozycje', 'wartosc_produktow',
    'koszt_dostawy', 'bon', 'rabat', 'kwota', 'uwagi_klienta', 'src', 'quiz', 'numer_przesylki', 'przewoznik',
    'bon_za_opoznienie', 'uwagi', 'przypomnienie', 'historia', 'stan_zdjety', 'status_przetworzony', 'pozycje_json',
    'ml_json'],
  Ewidencja: ['data', 'numer', 'typ', 'kwota', 'platnosc', 'klient', 'uwagi'],
  // kwota i prog puste = wartości z CONFIG.BON; wazny_do puste = bez terminu; wykorzystany_w wypełnia system
  Bony: ['kod', 'kwota', 'prog', 'wazny_do', 'wystawiony', 'powod', 'email', 'wykorzystany_w'],
  Log: ['czas', 'poziom', 'zdarzenie', 'szczegoly'],
  Statusy: ['status', 'znaczenie'],
  Sklep: ['ustawienie', 'wartosc', 'opis']
};

// Kolumny techniczne ukrywane przez setup(). Właściciel ich nie edytuje.
const UKRYTE_KOLUMNY = ['stan_zdjety', 'status_przetworzony', 'pozycje_json', 'ml_json'];

const DNI_DOPELNIACZ = ['niedzieli', 'poniedziałku', 'wtorku', 'środy', 'czwartku', 'piątku', 'soboty'];
const MIESIACE_DOPELNIACZ = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca',
  'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

// ============ 3. CZYSTE FUNKCJE ============

function str_(v) {
  return v === null || v === undefined ? '' : String(v).trim();
}

function norm_(s) {
  return str_(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
}

function isYes_(v) {
  const t = norm_(v);
  return v === true || t === 'tak' || t === 'true' || t === '1';
}

/** Liczba z komórki: 12, "12", "12,5". Puste albo nieliczbowe → null. */
function toNumber_(v) {
  if (typeof v === 'number') return isFinite(v) ? v : null;
  const t = str_(v).replace(/\s/g, '').replace(',', '.');
  if (t === '' || !/^-?\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

/** Złote z komórki → grosze (liczba całkowita) albo null. */
function toGrosze_(v) {
  const n = toNumber_(v);
  return n === null ? null : Math.round(n * 100);
}

/** Lista po przecinkach, z pominięciem przecinków w nawiasach. */
function splitList_(v) {
  const s = str_(v);
  if (!s) return [];
  const out = [];
  let depth = 0, cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s.charAt(i);
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map(function (x) { return x.trim(); }).filter(Boolean);
}

/** Skala z arkusza: liczba 1-5 zostaje liczbą, tekst („8 h”) zostaje tekstem. */
function scale_(v) {
  const n = toNumber_(v);
  if (n !== null) return n;
  return str_(v);
}

/** Wiersze z getValues() → obiekty z kluczami z nagłówka. _row to numer wiersza w arkuszu. */
function tableToObjects_(values) {
  if (!values || values.length < 1) return [];
  const head = values[0].map(function (h) { return str_(h).toLowerCase(); });
  const out = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row.some(function (c) { return str_(c) !== ''; })) continue;
    const o = { _row: i + 1 };
    head.forEach(function (h, j) { if (h) o[h] = row[j]; });
    out.push(o);
  }
  return out;
}

function productFromRow_(r) {
  const ceny = {};
  POJEMNOSCI.forEach(function (ml) { ceny[ml] = toGrosze_(r['cena_' + ml]); });
  const intens = toNumber_(r.intensywnosc);
  return {
    id: str_(r.id),
    aktywny: isYes_(r.aktywny),
    marka: str_(r.marka),
    nazwa: str_(r.nazwa),
    rodzina: str_(r.rodzina).toLowerCase(),
    profil: str_(r.profil).toLowerCase(),
    nuty: { glowy: splitList_(r.nuty_glowy), serca: splitList_(r.nuty_serca), bazy: splitList_(r.nuty_bazy) },
    opis: str_(r.opis),
    sezon: splitList_(r.sezon).map(function (x) { return x.toLowerCase(); }),
    pora: str_(r.pora).toLowerCase(),
    trwalosc: scale_(r.trwalosc),
    projekcja: scale_(r.projekcja),
    intensywnosc: intens >= 1 && intens <= 3 ? Math.round(intens) : null,
    okazja: splitList_(r.okazja),
    ceny: ceny,
    ml: toNumber_(r.ml_dostepne),
    podobne: splitList_(r.podobne),
    zdjecie: str_(r.zdjecie_url),
    kolejnosc: toNumber_(r.kolejnosc) === null ? 9999 : toNumber_(r.kolejnosc),
    _row: r._row
  };
}

/** "p01:5, p07:10" → [{id:'p01', ml:5}, {id:'p07', ml:10}]. Błędny fragment → ml null. */
function parseSklad_(v) {
  return splitList_(v).map(function (part) {
    const m = part.match(/^([A-Za-z0-9_-]+)\s*:\s*(\d+)$/);
    return m ? { id: m[1], ml: Number(m[2]) } : { id: part, ml: null };
  });
}

function setFromRow_(r) {
  return {
    id: str_(r.id),
    aktywny: isYes_(r.aktywny),
    nazwa: str_(r.nazwa),
    opis: str_(r.opis),
    rodzina: str_(r.rodzina).toLowerCase(),
    cena: toGrosze_(r.cena),
    sklad: parseSklad_(r.sklad),
    _row: r._row
  };
}

/** Ml zarezerwowane przez aktywne zamówienia NOWE: {id: ml}. */
function reservedMl_(orderRows, now) {
  const out = {};
  orderRows.forEach(function (o) {
    if (normStatus_(o.status) !== STATUS.NOWE) return;
    const until = o.rezerwacja_do instanceof Date ? o.rezerwacja_do : new Date(o.rezerwacja_do);
    if (!(until > now)) return;
    let map = {};
    try { map = JSON.parse(str_(o.ml_json) || '{}'); } catch (e) { map = {}; }
    Object.keys(map).forEach(function (id) { out[id] = (out[id] || 0) + Number(map[id] || 0); });
  });
  return out;
}

/** Wolne ml. Puste ml_dostepne = stanu nie liczymy: zapach jest w sprzedaży bez limitu (Infinity). */
function freeMl_(product, reserved) {
  if (product.ml === null) return Infinity;
  return Math.max(0, product.ml - (reserved[product.id] || 0));
}

function isSellable_(p) {
  return p.id && p.aktywny && p.marka && p.nazwa;
}

/** Choć jedna pojemność z ceną. */
function hasPrice_(p) {
  return POJEMNOSCI.some(function (ml) { return p.ceny[ml] !== null; });
}

/** Na liście: produkt z ceną albo wyprzedany (ml_dostepne 0 albo mniej). Produkt bez żadnej ceny, a ze stanem
 *  albo bez liczonego stanu, nie trafia na listę: nie da się go kupić, a „Wyprzedane” byłoby nieprawdą. */
function isListed_(p) {
  return hasPrice_(p) || (p.ml !== null && !(p.ml > 0));
}

/**
 * Katalog w kształcie, który czyta nicci-api.js. Pola produktu opisuje docs/kontrakt-api.md.
 * Ceny w groszach. Stan magazynu nie wychodzi na zewnątrz poza „zostalo” przy niskim stanie.
 */
function buildCatalog_(productRows, setRows, reserved, cfg, now) {
  const every = productRows.map(productFromRow_);
  const all = every.filter(isSellable_);
  const byId = {};
  all.forEach(function (p) { byId[p.id] = p; });
  // Nazwy także pozycji wyłączonych, żeby zestaw mógł powiedzieć, którego składnika brakuje.
  const anyById = {};
  every.forEach(function (p) { if (p.id) anyById[p.id] = p; });
  const free = {};
  all.forEach(function (p) { free[p.id] = freeMl_(p, reserved); });

  const products = all.filter(isListed_).map(function (p) {
    const f = free[p.id];
    const variants = POJEMNOSCI.filter(function (ml) { return p.ceny[ml] !== null; })
      .map(function (ml) { return { ml: ml, price: p.ceny[ml], available: f >= ml }; });
    const minMl = variants.length ? variants[0].ml : Infinity;
    const malo = f >= minMl && f <= cfg.LOW_STOCK_ML;
    return {
      id: p.id, marka: p.marka, nazwa: p.nazwa, rodzina: p.rodzina, profil: p.profil, opis: p.opis,
      nuty: p.nuty, sezon: p.sezon, pora: p.pora, trwalosc: p.trwalosc, projekcja: p.projekcja,
      intensywnosc: p.intensywnosc, okazja: p.okazja, variants: variants,
      malo: malo, zostalo: malo ? Math.floor(f) : null,
      podobne: p.podobne.filter(function (id) { return byId[id] && isListed_(byId[id]) && id !== p.id; }),
      zdjecie: p.zdjecie, kolejnosc: p.kolejnosc
    };
  }).sort(function (a, b) { return a.kolejnosc - b.kolejnosc || a.marka.localeCompare(b.marka, 'pl'); });

  const sets = setRows.map(setFromRow_).filter(function (s) { return s.id && s.aktywny && s.nazwa; })
    .map(function (s) {
      const need = {};
      s.sklad.forEach(function (c) { if (c.ml) need[c.id] = (need[c.id] || 0) + c.ml; });
      const sklad = s.sklad.map(function (c) {
        const p = byId[c.id], any = anyById[c.id];
        return {
          id: c.id, marka: any ? any.marka : '', nazwa: any ? any.nazwa : '', ml: c.ml,
          available: !!p && !!c.ml && free[c.id] >= need[c.id]
        };
      });
      const valid = sklad.length > 0 && sklad.every(function (c) { return c.nazwa && c.ml; });
      const priced = valid && sklad.every(function (c) {
        return byId[c.id] && byId[c.id].ceny[c.ml] !== null && byId[c.id].ceny[c.ml] !== undefined;
      });
      return {
        id: s.id, nazwa: s.nazwa, opis: s.opis, rodzina: s.rodzina, price: s.cena,
        available: valid && s.cena > 0 && sklad.every(function (c) { return c.available; }),
        sklad: sklad,
        cenaOsobno: priced ? sklad.reduce(function (sum, c) { return sum + byId[c.id].ceny[c.ml]; }, 0) : null
      };
    });

  return {
    products: products,
    sets: sets,
    freeShippingFrom: toGrosze_(cfg.FREE_SHIPPING_FROM) || 0,
    shipping: { paczkomat: toGrosze_(cfg.SHIPPING.paczkomat), kurier: toGrosze_(cfg.SHIPPING.kurier) },
    bon: { kwota: toGrosze_(cfg.BON.KWOTA) || 0, prog: toGrosze_(cfg.BON.PROG) || 0 },
    igHandle: str_(cfg.IG_HANDLE),
    // tylko jawne TAK z zakładki Sklep otwiera sprzedaż; strona bez tego pola też jej nie otwiera
    sprzedaz: cfg.SPRZEDAZ === true,
    updated: (now || new Date()).toISOString()
  };
}

function clean_(v, max) {
  return str_(v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Pozycje koszyka z przeglądarki → lista znormalizowana albo null, gdy cokolwiek jest nie tak. */
function normalizeItems_(items, cfg) {
  if (!Array.isArray(items) || items.length < 1 || items.length > cfg.MAX_LINES) return null;
  const merged = {};
  for (let i = 0; i < items.length; i++) {
    const it = items[i] || {};
    const id = str_(it.id);
    const qty = Number(it.qty);
    if (!/^[A-Za-z0-9_-]{1,20}$/.test(id)) return null;
    if (!(qty >= 1 && qty <= cfg.MAX_QTY && Math.floor(qty) === qty)) return null;
    let key;
    if (it.type === 'decant') {
      const ml = Number(it.ml);
      if (POJEMNOSCI.indexOf(ml) === -1) return null;
      key = 'd|' + id + '|' + ml;
      merged[key] = merged[key] || { type: 'decant', id: id, ml: ml, qty: 0 };
    } else if (it.type === 'set') {
      key = 's|' + id;
      merged[key] = merged[key] || { type: 'set', id: id, qty: 0 };
    } else {
      return null;
    }
    merged[key].qty = Math.min(cfg.MAX_QTY, merged[key].qty + qty);
  }
  return Object.keys(merged).map(function (k) { return merged[k]; });
}

/**
 * Walidacja lustrzana do formularza /zamowienie. Nazwy w `fields` odpowiadają polom formularza:
 * name, email, phone, instagram, delivery, paczkomat, street, postcode, city, payment, note, voucher,
 * regulamin, prywatnosc, items.
 */
function validateOrder_(body, cfg) {
  body = body || {};
  const c = body.customer || {}, d = body.delivery || {}, cons = body.consents || {};
  const fields = [];
  const name = clean_(c.name, 100);
  if (name.length < 3) fields.push('name');
  const email = clean_(c.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fields.push('email');
  const phone = clean_(c.phone, 30);
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) fields.push('phone');
  const instagram = clean_(c.instagram, 60).replace(/^@+/, '');
  if (instagram && !/^[A-Za-z0-9._]{1,30}$/.test(instagram)) fields.push('instagram');
  const method = str_(d.method);
  if (method !== 'paczkomat' && method !== 'kurier') fields.push('delivery');
  let paczkomat = '', street = '', postcode = '', city = '';
  if (method === 'paczkomat') {
    paczkomat = clean_(d.paczkomat, 20).toUpperCase().replace(/\s+/g, '');
    if (!/^[A-Z0-9-]{4,12}$/.test(paczkomat)) fields.push('paczkomat');
  }
  if (method === 'kurier') {
    street = clean_(d.street, 120);
    if (street.length < 3) fields.push('street');
    postcode = clean_(d.postcode, 10);
    if (!/^\d{2}-\d{3}$/.test(postcode)) fields.push('postcode');
    city = clean_(d.city, 60);
    if (city.length < 2) fields.push('city');
  }
  const payment = str_(body.payment);
  if (payment !== 'blik' && payment !== 'przelew') fields.push('payment');
  const note = str_(body.note).replace(/\r\n/g, '\n');
  if (note.length > 300) fields.push('note');
  const voucher = normVoucher_(clean_(body.voucher, 30));
  if (voucher && !/^[A-Z0-9-]{4,20}$/.test(voucher)) fields.push('voucher');
  if (cons.regulamin !== true) fields.push('regulamin');
  if (cons.prywatnosc !== true) fields.push('prywatnosc');
  const items = normalizeItems_(body.items, cfg);
  if (!items) fields.push('items');
  if (fields.length) return { ok: false, fields: fields };
  return {
    ok: true,
    data: {
      customer: { name: name, email: email, phone: phone, instagram: instagram },
      delivery: { method: method, paczkomat: paczkomat, street: street, postcode: postcode, city: city },
      payment: payment,
      note: note,
      voucher: voucher,
      items: items,
      src: clean_(body.src, 60),
      quiz: body.quiz && typeof body.quiz === 'object' ? JSON.stringify(body.quiz).slice(0, 500) : ''
    }
  };
}

/**
 * Wycena i kontrola stanów. Ceny wyłącznie z arkusza, nigdy z przeglądarki.
 * → {ok:true, lines, need, subtotal, shipping, total}
 *   {ok:false, error:'invalid_item'} | {ok:false, error:'out_of_stock', shortages} | {ok:false, error:'server_error', internal}
 */
function priceOrder_(items, method, productRows, setRows, reserved, cfg) {
  const all = productRows.map(productFromRow_).filter(isSellable_);
  const byId = {};
  all.forEach(function (p) { byId[p.id] = p; });
  const setsById = {};
  setRows.map(setFromRow_).filter(function (s) { return s.id && s.aktywny; })
    .forEach(function (s) { setsById[s.id] = s; });
  const free = {};
  all.forEach(function (p) { free[p.id] = freeMl_(p, reserved); });

  const need = {};
  const lines = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.type === 'decant') {
      const p = byId[it.id];
      if (!p || p.ceny[it.ml] === null) return { ok: false, error: 'invalid_item' };
      need[p.id] = (need[p.id] || 0) + it.ml * it.qty;
      lines.push({ typ: 'decant', id: p.id, nazwa: p.marka + ' ' + p.nazwa, opis: it.ml + ' ml', ml: it.ml,
        ilosc: it.qty, cena: p.ceny[it.ml], suma: p.ceny[it.ml] * it.qty });
    } else {
      const s = setsById[it.id];
      if (!s || !(s.cena > 0) || !s.sklad.length) return { ok: false, error: 'invalid_item' };
      for (let j = 0; j < s.sklad.length; j++) {
        const comp = s.sklad[j];
        if (!byId[comp.id] || !comp.ml) return { ok: false, error: 'invalid_item' };
        need[comp.id] = (need[comp.id] || 0) + comp.ml * it.qty;
      }
      lines.push({ typ: 'set', id: s.id, nazwa: s.nazwa, opis: 'zestaw', ml: null,
        ilosc: it.qty, cena: s.cena, suma: s.cena * it.qty });
    }
  }

  const shortages = Object.keys(need).filter(function (id) { return need[id] > free[id]; }).map(function (id) {
    const p = byId[id];
    return {
      id: id, nazwa: p.marka + ' ' + p.nazwa, zostalo: Math.floor(free[id]), potrzeba: need[id],
      podobne: p.podobne.filter(function (x) {
        const q = byId[x];
        return q && x !== id && POJEMNOSCI.some(function (ml) { return q.ceny[ml] !== null && free[x] >= ml; });
      }).map(function (x) { return { id: x, nazwa: byId[x].marka + ' ' + byId[x].nazwa }; })
    };
  });
  if (shortages.length) return { ok: false, error: 'out_of_stock', shortages: shortages };

  const subtotal = lines.reduce(function (s, l) { return s + l.suma; }, 0);
  const threshold = toGrosze_(cfg.FREE_SHIPPING_FROM) || 0;
  const base = toGrosze_(cfg.SHIPPING[method]);
  if (base === null) return { ok: false, error: 'server_error', internal: 'CONFIG.SHIPPING.' + method + ' nie jest uzupełnione' };
  const shipping = threshold > 0 && subtotal >= threshold ? 0 : base;
  return { ok: true, lines: lines, need: need, subtotal: subtotal, shipping: shipping, total: subtotal + shipping };
}

// ---------- bony ----------

/** Kod bonu z formularza albo arkusza: wielkie litery, bez spacji. */
function normVoucher_(v) {
  return str_(v).toUpperCase().replace(/\s+/g, '');
}

/** Czy zamówienie trzyma bon: opłacone, wysłane albo nowe przed końcem rezerwacji. Wygasłe i anulowane go oddają. */
function orderHoldsVoucher_(rec, now) {
  const s = normStatus_(rec.status);
  if (s === STATUS.OPLACONE || s === STATUS.WYSLANE) return true;
  if (s !== STATUS.NOWE) return false;
  const until = rec.rezerwacja_do instanceof Date ? rec.rezerwacja_do : new Date(rec.rezerwacja_do);
  return !(until <= now);
}

/**
 * Sprawdza bon dla zamówienia. subtotal w groszach, same zapachy bez dostawy.
 * → {ok:true, kod, rabat, row} | {ok:false, reason:'nieznany'|'wykorzystany'|'wygasl'|'prog', prog?, brakuje?}
 * wykorzystany_w z numerem, którego nie ma w zamówieniach (np. wpis ręczny), też oznacza wykorzystany.
 */
function checkVoucher_(code, bonRows, orderRows, subtotal, now, cfg) {
  const bon = bonRows.filter(function (b) { return normVoucher_(b.kod) === code; })[0];
  if (!code || !bon) return { ok: false, reason: 'nieznany' };
  const used = str_(bon.wykorzystany_w);
  if (used) {
    const holder = orderRows.filter(function (o) { return str_(o.numer) === used; })[0];
    if (!holder || orderHoldsVoucher_(holder, now)) return { ok: false, reason: 'wykorzystany' };
  }
  const valid = bon.wazny_do instanceof Date ? bon.wazny_do : (str_(bon.wazny_do) ? new Date(bon.wazny_do) : null);
  if (valid && !isNaN(valid.getTime()) && ymd_(now, cfg.TIMEZONE) > ymd_(valid, cfg.TIMEZONE)) return { ok: false, reason: 'wygasl' };
  const kwota = toGrosze_(str_(bon.kwota) === '' ? cfg.BON.KWOTA : bon.kwota) || 0;
  const prog = toGrosze_(str_(bon.prog) === '' ? cfg.BON.PROG : bon.prog) || 0;
  if (subtotal < prog) return { ok: false, reason: 'prog', prog: prog, brakuje: prog - subtotal };
  return { ok: true, kod: normVoucher_(bon.kod), rabat: Math.min(kwota, subtotal), row: bon._row };
}

/** Kod bonu NF-XXXX-XXXX z liter i cyfr bez łatwych do pomylenia (0, O, 1, I, L). */
function voucherCode_(rnd) {
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const r = rnd || Math.random;
  let s = '';
  for (let i = 0; i < 8; i++) s += abc.charAt(Math.floor(r() * abc.length));
  return 'NF-' + s.slice(0, 4) + '-' + s.slice(4);
}

/** Dni ustawowo wolne od pracy w Polsce w roku y, jako 'RRRR-MM-DD'. Od 2025 także Wigilia. */
function polishHolidays_(y) {
  // Wielkanoc według algorytmu Meeusa, Jonesa i Butchera (kalendarz gregoriański)
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const easter = Date.UTC(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
  const out = ['01-01', '01-06', '05-01', '05-03', '08-15', '11-01', '11-11', '12-25', '12-26']
    .map(function (md) { return y + '-' + md; });
  if (y >= 2025) out.push(y + '-12-24');
  // poniedziałek wielkanocny i Boże Ciało; Wielkanoc i Zielone Świątki wypadają w niedzielę
  [1, 60].forEach(function (days) { out.push(new Date(easter + days * 86400000).toISOString().slice(0, 10)); });
  return out;
}

/** Data 'RRRR-MM-DD' w strefie tz. */
function ymd_(date, tz) {
  const p = dateParts_(date, tz);
  return p.year + '-' + String(p.month).padStart(2, '0') + '-' + String(p.day).padStart(2, '0');
}

/** 'RRRR-MM-DD' n-tego dnia roboczego po dniu daty `from` (w strefie tz). Dzień wpłaty się nie liczy. */
function workdayDeadline_(from, n, tz) {
  const p = dateParts_(from, tz);
  let t = Date.UTC(p.year, p.month - 1, p.day);
  const holidays = {};
  let left = n;
  while (left > 0) {
    t += 86400000;
    const d = new Date(t);
    const y = d.getUTCFullYear();
    holidays[y] = holidays[y] || polishHolidays_(y);
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6 && holidays[y].indexOf(d.toISOString().slice(0, 10)) === -1) left--;
  }
  return new Date(t).toISOString().slice(0, 10);
}

/** Czy opłaconemu, niewysłanemu zamówieniu należy się już bon za opóźnienie (i jeszcze go nie dostało). */
function dueVoucher_(rec, now, cfg) {
  if (normStatus_(rec.status) !== STATUS.OPLACONE || str_(rec.bon_za_opoznienie)) return false;
  const paid = rec.oplacone instanceof Date ? rec.oplacone : (str_(rec.oplacone) ? new Date(rec.oplacone) : null);
  if (!paid || isNaN(paid.getTime())) return false;
  return ymd_(now, cfg.TIMEZONE) > workdayDeadline_(paid, cfg.BON.PO_DNIACH_ROBOCZYCH, cfg.TIMEZONE);
}

function nextOrderNumber_(orderRows, cfg) {
  let max = cfg.ORDER_START - 1;
  const re = new RegExp('^' + cfg.ORDER_PREFIX + '(\\d+)$');
  orderRows.forEach(function (o) {
    const m = str_(o.numer).match(re);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return cfg.ORDER_PREFIX + String(max + 1).padStart(4, '0');
}

function normStatus_(v) {
  const t = norm_(v).toUpperCase();
  const map = { NOWE: STATUS.NOWE, OPLACONE: STATUS.OPLACONE, WYSLANE: STATUS.WYSLANE,
    ANULOWANE: STATUS.ANULOWANE, WYGASLE: STATUS.WYGASLE };
  return map[t] || str_(v).toUpperCase();
}

function formatPln_(grosze) {
  return (grosze / 100).toFixed(2).replace('.', ',') + ' zł';
}

function formatNrb_(v) {
  const d = str_(v).replace(/\D/g, '');
  if (d.length !== 26) return str_(v);
  return d.slice(0, 2) + ' ' + d.slice(2).replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** Części daty w strefie sklepu. W Apps Script przez Utilities, w Node przez Intl. */
function dateParts_(date, tz) {
  if (typeof Utilities !== 'undefined') {
    const f = function (p) { return Utilities.formatDate(date, tz, p); };
    return { weekday: Number(f('u')) % 7, day: Number(f('d')), month: Number(f('M')), year: Number(f('yyyy')), time: f('HH:mm') };
  }
  const parts = {};
  new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'numeric',
    year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(date).forEach(function (p) { parts[p.type] = p.value; });
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return { weekday: wd, day: Number(parts.day), month: Number(parts.month), year: Number(parts.year),
    time: (parts.hour === '24' ? '00' : parts.hour) + ':' + parts.minute };
}

/** "czwartku 25 września, 18:40", do użycia po słowie „do”. */
function terminTxt_(date, tz) {
  const p = dateParts_(date, tz);
  return DNI_DOPELNIACZ[p.weekday] + ' ' + p.day + ' ' + MIESIACE_DOPELNIACZ[p.month - 1] + ', ' + p.time;
}

function dateTxt_(date, tz) {
  const p = dateParts_(date, tz);
  return String(p.day).padStart(2, '0') + '.' + String(p.month).padStart(2, '0') + '.' + p.year + ' ' + p.time;
}

/** "25.12.2026" */
function dayTxt_(date, tz) {
  return dateTxt_(date, tz).slice(0, 10);
}

function deliveryTxt_(d) {
  return d.method === 'paczkomat' ? 'Paczkomat InPost ' + d.paczkomat
    : 'Kurier: ' + d.street + ', ' + d.postcode + ' ' + d.city;
}

function paymentTxt_(p) {
  return p === 'blik' ? 'BLIK na telefon' : 'przelew na konto';
}

/** Treść do wklejenia w DM. Zaczyna się od ZAMOWIENIE, bo na to słowo reaguje automatyczna odpowiedź. */
function buildIgMessage_(order) {
  const lines = order.lines.map(function (l) { return l.nazwa + ' ' + l.opis + ' x' + l.ilosc; });
  return ['ZAMOWIENIE ' + order.numer,
    'Kwota: ' + formatPln_(order.total) + ', ' + paymentTxt_(order.payment),
    lines.join('\n'),
    'Dostawa: ' + deliveryTxt_(order.delivery)].join('\n');
}

/** Odpowiedź createOrder dla strony. Zapisywana w przeglądarce przez Nicci.lastOrder(). */
function orderResponse_(order, cfg) {
  return {
    ok: true,
    numer: order.numer,
    kwota: order.total,
    kwotaTxt: formatPln_(order.total),
    wartoscProduktow: order.subtotal,
    kosztDostawy: order.shipping,
    rabat: order.rabat || 0,
    bon: order.bon || '',
    platnosc: order.payment,
    rezerwacjaDo: order.until.toISOString(),
    terminTxt: terminTxt_(order.until, cfg.TIMEZONE),
    tytul: order.numer,
    dane: {
      blik: { telefon: str_(cfg.BLIK_PHONE), odbiorca: str_(cfg.RECIPIENT) },
      przelew: { konto: formatNrb_(cfg.BANK_ACCOUNT), odbiorca: str_(cfg.RECIPIENT) }
    },
    pozycje: order.lines.map(function (l) {
      return { nazwa: l.nazwa, opis: l.opis, ilosc: l.ilosc, suma: l.suma };
    }),
    dostawa: { metoda: order.delivery.method, opis: deliveryTxt_(order.delivery) },
    email: order.customer.email,
    igHandle: str_(cfg.IG_HANDLE),
    igMessage: buildIgMessage_(order)
  };
}

/** Wartość tekstowa do komórki: nie pozwala, by tekst klienta zaczynający się od = + - @ stał się formułą. */
function safeCell_(v) {
  if (typeof v !== 'string') return v;
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function escapeHtml_(s) {
  return str_(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function firstName_(name) {
  return str_(name).split(' ')[0];
}

// ============ 4. TEMPLATES (treści maili) ============
// Każdy szablon zwraca {subject, text, html}. Dane klienta zawsze przez escapeHtml_ w wersji HTML.

const TEMPLATES = {
  klientNowe: function (o, cfg) {
    const blik = [
      'Przelew BLIK na telefon',
      'Numer telefonu: ' + cfg.BLIK_PHONE,
      'Odbiorca: ' + cfg.RECIPIENT,
      'Kwota: ' + formatPln_(o.total),
      'Tytuł: ' + o.numer,
      'W aplikacji banku wybierz przelew na telefon BLIK i wpisz te dane.'
    ];
    const przelew = [
      'Przelew na konto',
      'Numer konta: ' + formatNrb_(cfg.BANK_ACCOUNT),
      'Odbiorca: ' + cfg.RECIPIENT,
      'Kwota: ' + formatPln_(o.total),
      'Tytuł: ' + o.numer
    ];
    const main = o.payment === 'blik' ? blik : przelew;
    const alt = o.payment === 'blik' ? przelew : blik;
    const paragraphs = [
      'Cześć ' + firstName_(o.customer.name) + ',',
      'dziękujemy za zamówienie ' + o.numer + '. Twoje zapachy są zarezerwowane do ' + terminTxt_(o.until, cfg.TIMEZONE) + '.',
      main,
      'Jeśli wygodniej Ci inaczej, możesz też zapłacić tak:',
      alt,
      itemsBlock_(o),
      'Gdy zobaczymy wpłatę, napiszemy do Ciebie i zaczniemy odlewać. Wpłaty sprawdzamy ręcznie, więc na potwierdzenie trzeba chwilę poczekać. Jeśli pieniądze nie dotrą do końca rezerwacji, zapachy wrócą do katalogu.',
      'Masz pytanie? Odpisz na tego maila albo napisz do nas na Instagramie: https://ig.me/m/' + cfg.IG_HANDLE
    ];
    return mail_('Zamówienie ' + o.numer + ': dane do płatności', paragraphs, cfg);
  },

  wlascicielNowe: function (o, cfg) {
    const c = o.customer;
    return mail_('Nowe zamówienie ' + o.numer + ': ' + formatPln_(o.total) + ', ' + paymentTxt_(o.payment), [
      'Klient: ' + c.name + ', ' + c.email + ', tel. ' + c.phone + (c.instagram ? ', IG @' + c.instagram : ''),
      itemsBlock_(o),
      o.note ? 'Uwagi klienta: ' + o.note : '',
      'Źródło: ' + (o.src || 'brak') + '. Rezerwacja do ' + terminTxt_(o.until, cfg.TIMEZONE) + '.',
      'Gdy wpłata dotrze, zmień status w arkuszu na OPŁACONE.'
    ], cfg);
  },

  klientPrzypomnienie: function (o, cfg) {
    return mail_('Zamówienie ' + o.numer + ' czeka na wpłatę', [
      'Cześć ' + firstName_(o.customer.name) + ',',
      'Twoje zapachy dalej czekają. Rezerwację trzymamy do ' + terminTxt_(o.until, cfg.TIMEZONE) + '.',
      'Kwota: ' + formatPln_(o.total) + ', tytuł przelewu: ' + o.numer + '. Dane do płatności są w poprzednim mailu od nas.',
      'Jeśli wpłata jest już w drodze, nic więcej nie musisz robić. A jeśli zmienisz zdanie, zignoruj tę wiadomość, rezerwacja sama wygaśnie.'
    ], cfg);
  },

  klientWygasle: function (o, cfg) {
    return mail_('Rezerwacja ' + o.numer + ' wygasła', [
      'Cześć ' + firstName_(o.customer.name) + ',',
      'nie zobaczyliśmy wpłaty za zamówienie ' + o.numer + ', więc rezerwacja wygasła, a zapachy wróciły do katalogu.',
      'Jeśli pieniądze są już w drodze, nic więcej nie musisz robić: gdy wpłata dotrze, zrealizujemy zamówienie.',
      'Możesz też złożyć zamówienie jeszcze raz: ' + cfg.SITE_URL
    ], cfg);
  },

  klientOplacone: function (o, cfg) {
    return mail_('Mamy Twoją wpłatę za ' + o.numer, [
      'Cześć ' + firstName_(o.customer.name) + ',',
      'wpłata dotarła, dziękujemy. Zabieramy się za odlewanie Twoich zapachów.',
      'Gdy paczka wyjdzie, wyślemy Ci numer przesyłki.'
    ], cfg);
  },

  klientWyslane: function (o, cfg, tracking, carrier) {
    const url = trackingUrl_(carrier, tracking, cfg);
    return mail_('Zamówienie ' + o.numer + ' jest w drodze', [
      'Cześć ' + firstName_(o.customer.name) + ',',
      'paczka jest już nadana' + (carrier ? ', wiezie ją ' + carrier : '') + '. Numer przesyłki: ' + tracking + '.',
      url ? 'Śledzenie: ' + url : '',
      'Miłego testowania. Jeśli któryś zapach zostanie z Tobą na dłużej, daj nam znać na Instagramie.'
    ], cfg);
  },

  klientBon: function (o, cfg, bon) {
    return mail_('Bon na ' + formatPln_(toGrosze_(bon.kwota)) + ' za dłuższą realizację ' + o.numer, [
      'Cześć ' + firstName_(o.customer.name) + ',',
      'realizacja zamówienia ' + o.numer + ' trwa dłużej niż ' + cfg.BON.PO_DNIACH_ROBOCZYCH + ' dni roboczych od wpłaty, a tyle obiecujemy. Przepraszamy.',
      ['Twój bon', 'Kod: ' + bon.kod, 'Wartość: ' + formatPln_(toGrosze_(bon.kwota)),
        'Działa, gdy zapachy w zamówieniu kosztują co najmniej ' + formatPln_(toGrosze_(bon.prog)) + ' (bez dostawy).',
        'Ważny do ' + dayTxt_(bon.wazny_do, cfg.TIMEZONE) + '.'],
      'Wpisz kod w polu „Kod bonu” przy kolejnym zamówieniu: ' + cfg.SITE_URL,
      'Obecne zamówienie dalej realizujemy. Gdy paczka wyjdzie, dostaniesz mail z numerem przesyłki.'
    ], cfg);
  },

  wlascicielBon: function (o, cfg, bon) {
    return mail_('Bon za opóźnienie: ' + o.numer, [
      'Od wpłaty za ' + o.numer + ' minęło ' + cfg.BON.PO_DNIACH_ROBOCZYCH + ' dni roboczych, a zamówienie nie ma jeszcze statusu WYSŁANE.',
      'Klient dostał mailem bon ' + bon.kod + ' na ' + formatPln_(toGrosze_(bon.kwota)) + ', ważny do ' + dayTxt_(bon.wazny_do, cfg.TIMEZONE) + '. Bon jest w zakładce Bony.',
      'Jeśli paczka już wyszła, wpisz numer przesyłki w arkuszu.',
      'Klient: ' + o.customer.name + ', ' + o.customer.email + ', tel. ' + o.customer.phone
    ], cfg);
  },

  wlascicielPoTerminie: function (o, cfg, braki) {
    return mail_('Wpłata po terminie: ' + o.numer, [
      'Zamówienie ' + o.numer + ' zostało opłacone po wygaśnięciu rezerwacji.',
      braki.length ? 'Po zdjęciu ze stanu brakuje: ' + braki.join('; ') + '. Zamówienie realizujemy: sprowadź brakujący zapach (do 5 dni roboczych) i daj klientowi znać o terminie.'
        : 'Stany wystarczyły, ml zdjęliśmy normalnie. Upewnij się tylko, że flakony się zgadzają.',
      'Klient: ' + o.customer.name + ', ' + o.customer.email + ', tel. ' + o.customer.phone
    ], cfg);
  }
};

function itemsBlock_(o) {
  const lines = o.lines.map(function (l) {
    return l.nazwa + ', ' + l.opis + ' x' + l.ilosc + ': ' + formatPln_(l.suma);
  });
  lines.push('Dostawa (' + deliveryTxt_(o.delivery) + '): ' + (o.shipping === 0 ? 'gratis' : formatPln_(o.shipping)));
  if (o.rabat) lines.push('Bon ' + o.bon + ': -' + formatPln_(o.rabat));
  lines.push('Razem: ' + formatPln_(o.total));
  return ['Twoje zamówienie'].concat(lines);
}

/** Paragraf to tekst albo tablica linii, z których pierwsza jest nagłówkiem bloku. */
function mail_(subject, paragraphs, cfg) {
  const parts = paragraphs.filter(function (p) { return p && (typeof p === 'string' || p.length); });
  const text = parts.map(function (p) { return typeof p === 'string' ? p : p.join('\n'); }).join('\n\n')
    + '\n\n' + cfg.SHOP_NAME + '\n' + cfg.SELLER_INFO;
  const htmlParts = parts.map(function (p) {
    if (typeof p === 'string') return '<p style="margin:0 0 16px">' + escapeHtml_(p) + '</p>';
    return '<div style="margin:0 0 20px;padding:16px 18px;border:1px solid #D5A865;background:#FBF7F1">'
      + '<p style="margin:0 0 8px;font-weight:600">' + escapeHtml_(p[0]) + '</p>'
      + p.slice(1).map(function (l) { return '<p style="margin:0 0 4px">' + escapeHtml_(l) + '</p>'; }).join('')
      + '</div>';
  }).join('');
  const html = '<div style="background:#F4ECE2;padding:24px 12px">'
    + '<div style="max-width:560px;margin:0 auto;background:#ffffff;padding:28px 24px;font:15px/1.6 Arial,Helvetica,sans-serif;color:#1c1a18">'
    + '<p style="margin:0 0 20px;font:600 20px Georgia,serif;letter-spacing:.04em;color:#040404">' + escapeHtml_(cfg.SHOP_NAME) + '</p>'
    + htmlParts
    + '<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #E8D7C3;font-size:12px;color:#6b5d52">'
    + escapeHtml_(cfg.SELLER_INFO) + '</p></div></div>';
  return { subject: subject, text: text, html: html };
}

// ============ 5. WEB APP ============

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : '';
  try {
    if (action === 'catalog') return json_({ ok: true, data: getCatalogCached_() });
    if (action === 'ping') return json_({ ok: true, time: new Date().toISOString() });
    return json_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    log_('ERROR', 'doGet', String(err && err.stack || err));
    return json_({ ok: false, error: 'server_error' });
  }
}

function doPost(e) {
  try {
    const raw = e && e.postData ? e.postData.contents : '';
    if (!raw || raw.length > 20000) return json_({ ok: false, error: 'server_error' });
    let body;
    try { body = JSON.parse(raw); } catch (err) { return json_({ ok: false, error: 'server_error' }); }
    if (body.action === 'createOrder') return json_(createOrder_(body));
    return json_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    log_('ERROR', 'doPost', String(err && err.stack || err));
    return json_({ ok: false, error: 'server_error' });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function createOrder_(body) {
  if (str_(body.website) !== '') {
    log_('WARN', 'honeypot', 'Wypełnione ukryte pole, zamówienie odrzucone.');
    return { ok: false, error: 'server_error' };
  }
  // sprawdzane przy każdym zamówieniu, bez cache: NIE w zakładce Sklep działa od razu
  if (!salesOpen_()) return { ok: false, error: 'sprzedaz_wstrzymana' };
  const v = validateOrder_(body, CONFIG);
  if (!v.ok) return { ok: false, error: 'validation', fields: v.fields };
  const data = v.data;

  const cache = CacheService.getScriptCache();
  const rlKey = 'rl_' + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, data.customer.email)).slice(0, 40);
  if (cache.get(rlKey)) return { ok: false, error: 'rate_limited' };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, error: 'busy' };
  let order;
  try {
    const hourCount = Number(cache.get('orders_hour') || 0);
    if (hourCount >= CONFIG.MAX_ORDERS_PER_HOUR) {
      log_('WARN', 'limit', 'Przekroczony limit zamówień na godzinę.');
      return { ok: false, error: 'busy' };
    }
    const now = new Date();
    const orderSheet = sheet_(SHEET.ZAMOWIENIA);
    const orders = tableToObjects_(orderSheet.getDataRange().getValues());
    const priced = priceOrder_(data.items, data.delivery.method, readTable_(SHEET.PRODUKTY),
      readTable_(SHEET.ZESTAWY), reservedMl_(orders, now), CONFIG);
    if (!priced.ok) {
      if (priced.internal) log_('ERROR', 'createOrder', priced.internal);
      if (priced.error === 'out_of_stock') invalidateCatalog_();
      return { ok: false, error: priced.error, shortages: priced.shortages };
    }
    let voucher = null;
    const bonSheet = data.voucher ? ss_().getSheetByName(SHEET.BONY) : null;
    if (data.voucher) {
      const bonRows = bonSheet ? tableToObjects_(bonSheet.getDataRange().getValues()) : [];
      voucher = checkVoucher_(data.voucher, bonRows, orders, priced.subtotal, now, CONFIG);
      if (!voucher.ok) return { ok: false, error: 'validation', fields: ['voucher'], voucher: voucher };
    }
    const rabat = voucher ? voucher.rabat : 0;
    order = {
      numer: nextOrderNumber_(orders, CONFIG),
      created: now,
      until: new Date(now.getTime() + CONFIG.RESERVATION_HOURS * 3600 * 1000),
      customer: data.customer, delivery: data.delivery, payment: data.payment, note: data.note,
      src: data.src, quiz: data.quiz,
      lines: priced.lines, need: priced.need, subtotal: priced.subtotal, shipping: priced.shipping,
      bon: voucher ? voucher.kod : '', rabat: rabat, total: priced.total - rabat
    };
    appendRecord_(orderSheet, {
      numer: order.numer, utworzone: now, status: STATUS.NOWE, rezerwacja_do: order.until,
      imie_nazwisko: order.customer.name, email: order.customer.email, telefon: order.customer.phone,
      instagram: order.customer.instagram, dostawa: order.delivery.method, paczkomat: order.delivery.paczkomat,
      ulica: order.delivery.street, kod: order.delivery.postcode, miasto: order.delivery.city,
      platnosc: order.payment,
      pozycje: order.lines.map(function (l) { return l.nazwa + ' ' + l.opis + ' x' + l.ilosc; }).join('; '),
      wartosc_produktow: order.subtotal / 100, koszt_dostawy: order.shipping / 100,
      bon: order.bon, rabat: rabat ? rabat / 100 : '', kwota: order.total / 100,
      uwagi_klienta: order.note, src: order.src, quiz: order.quiz,
      historia: dateTxt_(now, CONFIG.TIMEZONE) + ' NOWE', status_przetworzony: STATUS.NOWE,
      pozycje_json: JSON.stringify(order.lines), ml_json: JSON.stringify(order.need)
    });
    if (voucher) writeFields_(bonSheet, headerMap_(bonSheet), voucher.row, { wykorzystany_w: order.numer });
    SpreadsheetApp.flush();
    cache.put(rlKey, '1', CONFIG.RATE_LIMIT_SECONDS);
    cache.put('orders_hour', String(hourCount + 1), 3600);
    invalidateCatalog_();
  } finally {
    lock.releaseLock();
  }

  sendMail_(order.customer.email, TEMPLATES.klientNowe(order, CONFIG), 'klientNowe ' + order.numer);
  sendMail_(CONFIG.OWNER_EMAIL, TEMPLATES.wlascicielNowe(order, CONFIG), 'wlascicielNowe ' + order.numer);
  log_('INFO', 'zamówienie', order.numer + ' ' + formatPln_(order.total) + ' src=' + (order.src || '-'));
  return orderResponse_(order, CONFIG);
}

function sendMail_(to, tpl, label) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str_(to))) {
    log_('ERROR', 'mail', label + ': brak poprawnego adresu odbiorcy');
    return false;
  }
  try {
    const opts = { to: to, subject: tpl.subject, body: tpl.text, htmlBody: tpl.html, name: CONFIG.SHOP_NAME };
    if (/@/.test(CONFIG.OWNER_EMAIL) && to !== CONFIG.OWNER_EMAIL) opts.replyTo = CONFIG.OWNER_EMAIL;
    MailApp.sendEmail(opts);
    return true;
  } catch (err) {
    log_('ERROR', 'mail', label + ': ' + err);
    return false;
  }
}

// ============ 6. ARKUSZ ============

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Brak zakładki ' + name + '. Uruchom setup.');
  return sh;
}

function readTable_(name) {
  return tableToObjects_(sheet_(name).getDataRange().getValues());
}

/** {nazwa_kolumny: numer kolumny od 1} */
function headerMap_(sh) {
  const head = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0];
  const map = {};
  head.forEach(function (h, i) { if (str_(h)) map[str_(h).toLowerCase()] = i + 1; });
  return map;
}

function appendRecord_(sh, record) {
  const H = headerMap_(sh);
  const width = sh.getLastColumn();
  const row = new Array(width).fill('');
  Object.keys(record).forEach(function (k) { if (H[k]) row[H[k] - 1] = safeCell_(record[k]); });
  sh.appendRow(row);
}

function readRecord_(sh, H, r) {
  const vals = sh.getRange(r, 1, 1, sh.getLastColumn()).getValues()[0];
  const o = { _row: r };
  Object.keys(H).forEach(function (k) { o[k] = vals[H[k] - 1]; });
  return o;
}

function writeFields_(sh, H, r, fields) {
  Object.keys(fields).forEach(function (k) {
    if (H[k]) sh.getRange(r, H[k]).setValue(safeCell_(fields[k]));
  });
}

/** Odtwarza obiekt zamówienia z wiersza, na potrzeby maili po zmianie statusu. */
function orderFromRecord_(o) {
  let lines = [];
  try { lines = JSON.parse(str_(o.pozycje_json) || '[]'); } catch (e) { lines = []; }
  const total = Math.round(Number(o.kwota || 0) * 100);
  const shipping = Math.round(Number(o.koszt_dostawy || 0) * 100);
  const rabat = Math.round(Number(o.rabat || 0) * 100);
  return {
    numer: str_(o.numer),
    created: o.utworzone instanceof Date ? o.utworzone : new Date(o.utworzone),
    until: o.rezerwacja_do instanceof Date ? o.rezerwacja_do : new Date(o.rezerwacja_do),
    customer: { name: str_(o.imie_nazwisko), email: str_(o.email), phone: str_(o.telefon), instagram: str_(o.instagram) },
    delivery: { method: str_(o.dostawa), paczkomat: str_(o.paczkomat), street: str_(o.ulica), postcode: str_(o.kod), city: str_(o.miasto) },
    payment: str_(o.platnosc), note: str_(o.uwagi_klienta), src: str_(o.src),
    bon: str_(o.bon), rabat: rabat,
    lines: lines, subtotal: total - shipping + rabat, shipping: shipping, total: total
  };
}

/**
 * Zmienia ml_dostepne o znak * ml z mapy {id: ml}. Zwraca listę opisów produktów, które zeszły poniżej zera.
 * Stanu nie przycinamy do zera, żeby anulowanie mogło go dokładnie odwrócić. Pustej komórki nie ruszamy:
 * tego zapachu nie liczymy, a wpisana tam liczba ujemna zrobiłaby z niego wyprzedany.
 */
function adjustStock_(mlMap, sign) {
  const sh = sheet_(SHEET.PRODUKTY);
  const H = headerMap_(sh);
  if (!H.id || !H.ml_dostepne) throw new Error('Produkty: brak kolumny id albo ml_dostepne');
  const last = sh.getLastRow();
  if (last < 2) return [];
  const ids = sh.getRange(2, H.id, last - 1, 1).getValues();
  const range = sh.getRange(2, H.ml_dostepne, last - 1, 1);
  const stock = range.getValues();
  const braki = [];
  ids.forEach(function (row, i) {
    const id = str_(row[0]);
    const current = toNumber_(stock[i][0]);
    if (!mlMap[id] || current === null) return;
    const next = current + sign * Number(mlMap[id]);
    stock[i][0] = next;
    if (next < 0) braki.push(id + ' (' + next + ' ml)');
  });
  range.setValues(stock);
  invalidateCatalog_();
  return braki;
}

function addLedger_(o, typ, grosze, uwagi) {
  appendRecord_(sheet_(SHEET.EWIDENCJA), {
    data: new Date(), numer: o.numer, typ: typ, kwota: grosze / 100, platnosc: o.payment,
    klient: o.customer.name, uwagi: uwagi || ''
  });
}

function log_(poziom, zdarzenie, szczegoly) {
  try {
    const sh = ss_().getSheetByName(SHEET.LOG);
    if (sh) sh.appendRow([new Date(), poziom, zdarzenie, safeCell_(str_(szczegoly).slice(0, 1000))]);
  } catch (e) { /* log nie może wywrócić zamówienia */ }
  Logger.log(poziom + ' ' + zdarzenie + ' ' + szczegoly);
}

// Katalog w cache jest dzielony na kawałki, bo CacheService trzyma maksymalnie 100 KB na klucz.
function getCatalogCached_() {
  const cache = CacheService.getScriptCache();
  const n = Number(cache.get('catalog_n') || 0);
  if (n > 0) {
    const keys = [];
    for (let i = 0; i < n; i++) keys.push('catalog_' + i);
    const got = cache.getAll(keys);
    if (keys.every(function (k) { return got[k] !== undefined && got[k] !== null; })) {
      try { return JSON.parse(keys.map(function (k) { return got[k]; }).join('')); } catch (e) { /* przebuduj */ }
    }
  }
  const catalog = buildCatalog_(readTable_(SHEET.PRODUKTY), readTable_(SHEET.ZESTAWY),
    reservedMl_(readTable_(SHEET.ZAMOWIENIA), new Date()), Object.assign({}, CONFIG, { SPRZEDAZ: salesOpen_() }), new Date());
  const str = JSON.stringify(catalog);
  const size = 40000;
  const chunks = {};
  const count = Math.ceil(str.length / size);
  for (let i = 0; i < count; i++) chunks['catalog_' + i] = str.substr(i * size, size);
  chunks.catalog_n = String(count);
  try { cache.putAll(chunks, CONFIG.CACHE_SECONDS); } catch (e) { log_('WARN', 'cache', String(e)); }
  return catalog;
}

function invalidateCatalog_() {
  CacheService.getScriptCache().remove('catalog_n');
}

/** Wiersz sprzedaz w zakładce Sklep. Tylko TAK włącza sprzedaż; brak zakładki albo wiersza to NIE. */
function salesOpen_() {
  const sh = ss_().getSheetByName(SHEET.SKLEP);
  if (!sh || sh.getLastRow() < 2) return false;
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
  const row = rows.filter(function (r) { return str_(r[0]).toLowerCase() === 'sprzedaz'; })[0];
  return !!row && str_(row[1]).toUpperCase() === 'TAK';
}

// ============ 7. TRIGGERY ============

/** Instalowany trigger onEdit (tworzy go setup). Działa też przy edycji z aplikacji Arkusze na telefonie. */
function handleEdit(e) {
  if (!e || !e.range) return;
  const sh = e.range.getSheet();
  const name = sh.getName();
  if (name === SHEET.PRODUKTY || name === SHEET.ZESTAWY || name === SHEET.SKLEP) { invalidateCatalog_(); return; }
  if (name !== SHEET.ZAMOWIENIA) return;
  const H = headerMap_(sh);
  const c0 = e.range.getColumn(), c1 = c0 + e.range.getNumColumns() - 1;
  const touches = function (col) { return H[col] && H[col] >= c0 && H[col] <= c1; };
  if (!touches('status') && !touches('numer_przesylki') && !touches('przewoznik')) return;
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const r0 = Math.max(2, e.range.getRow()), r1 = e.range.getRow() + e.range.getNumRows() - 1;
    for (let r = r0; r <= r1; r++) {
      if (touches('numer_przesylki') || touches('przewoznik')) handleTracking_(sh, H, r);
      handleStatus_(sh, H, r);
    }
  } catch (err) {
    log_('ERROR', 'handleEdit', String(err && err.stack || err));
  } finally {
    lock.releaseLock();
  }
}

function handleTracking_(sh, H, r) {
  const rec = readRecord_(sh, H, r);
  const tracking = str_(rec.numer_przesylki);
  if (!rec.numer || !tracking) return;
  const status = normStatus_(rec.status);
  if (status === STATUS.WYSLANE) return;
  if (status !== STATUS.OPLACONE) {
    writeFields_(sh, H, r, { uwagi: appendNote_(rec.uwagi, 'Numer przesyłki wpisany przy statusie ' + status + '. Mail nie poszedł, najpierw ustaw OPŁACONE.') });
    return;
  }
  const carrier = carrierFor_(rec, CONFIG);
  if (!carrier) {
    writeFields_(sh, H, r, { uwagi: appendNote_(rec.uwagi, 'Wybierz przewoźnika w kolumnie przewoznik. Mail z numerem przesyłki pójdzie zaraz po wyborze.') });
    return;
  }
  writeFields_(sh, H, r, { status: STATUS.WYSLANE });
  handleStatus_(sh, H, r);
  const order = orderFromRecord_(rec);
  sendMail_(order.customer.email, TEMPLATES.klientWyslane(order, CONFIG, tracking, carrier), 'klientWyslane ' + order.numer);
}

/** Przewoźnik z kolumny przewoznik (wielkość liter bez znaczenia); przy paczkomacie zawsze InPost. Pusty, gdy nie wiadomo. */
function carrierFor_(rec, cfg) {
  if (str_(rec.dostawa) === 'paczkomat') return 'InPost';
  const want = str_(rec.przewoznik).toLowerCase();
  return Object.keys(cfg.TRACKING_URLS).filter(function (k) { return k.toLowerCase() === want; })[0] || '';
}

function trackingUrl_(carrier, tracking, cfg) {
  const tpl = carrier && cfg.TRACKING_URLS[carrier];
  return tpl ? tpl.replace('{numer}', encodeURIComponent(tracking)) : '';
}

/** Skutki zmiany statusu. Idempotentne dzięki kolumnom status_przetworzony i stan_zdjety. */
function handleStatus_(sh, H, r) {
  const rec = readRecord_(sh, H, r);
  if (!str_(rec.numer)) return;
  const status = normStatus_(rec.status);
  const prev = normStatus_(rec.status_przetworzony) || STATUS.NOWE;
  if (status === prev) return;
  if ([STATUS.NOWE, STATUS.OPLACONE, STATUS.WYSLANE, STATUS.ANULOWANE, STATUS.WYGASLE].indexOf(status) === -1) {
    log_('WARN', 'status', rec.numer + ': nieznany status ' + rec.status);
    return;
  }
  const order = orderFromRecord_(rec);
  let ml = {};
  try { ml = JSON.parse(str_(rec.ml_json) || '{}'); } catch (e) { ml = {}; }
  const updates = {};

  if ((status === STATUS.OPLACONE || status === STATUS.WYSLANE) && str_(rec.stan_zdjety) !== 'TAK') {
    const braki = adjustStock_(ml, -1);
    updates.stan_zdjety = 'TAK';
    if (!str_(rec.oplacone)) updates.oplacone = new Date();
    if (order.bon) {
      const clash = claimVoucherOnPayment_(order, tableToObjects_(sh.getDataRange().getValues()), new Date());
      if (clash) { updates.uwagi = appendNote_(rec.uwagi, clash); log_('WARN', 'bon', order.numer + ': ' + clash); }
    }
    addLedger_(order, 'wpłata', order.total, '');
    const late = prev === STATUS.WYGASLE || new Date() > order.until;
    if (late || braki.length) sendMail_(CONFIG.OWNER_EMAIL, TEMPLATES.wlascicielPoTerminie(order, CONFIG, braki), 'poTerminie ' + order.numer);
    if (status === STATUS.OPLACONE) sendMail_(order.customer.email, TEMPLATES.klientOplacone(order, CONFIG), 'klientOplacone ' + order.numer);
  }
  if (status === STATUS.ANULOWANE && str_(rec.stan_zdjety) === 'TAK') {
    adjustStock_(ml, +1);
    updates.stan_zdjety = 'ZWRÓCONE';
    addLedger_(order, 'korekta', -order.total, 'anulowanie opłaconego zamówienia');
  }
  if (status === STATUS.NOWE && str_(rec.stan_zdjety) === 'TAK') {
    log_('WARN', 'status', rec.numer + ': powrót do NOWE po opłaceniu. Stanów nie zmieniamy, sprawdź ręcznie.');
  }
  updates.status_przetworzony = status;
  updates.historia = appendNote_(rec.historia, dateTxt_(new Date(), CONFIG.TIMEZONE) + ' ' + prev + ' → ' + status);
  writeFields_(sh, H, r, updates);
  invalidateCatalog_();
}

/**
 * Opłacone zamówienie z bonem (np. wpłata po wygaśnięciu rezerwacji): bon wraca do tego zamówienia, chyba że
 * w międzyczasie użyło go inne, aktywne zamówienie. Zwraca opis kolizji do kolumny uwagi albo ''.
 */
function claimVoucherOnPayment_(order, orderRows, now) {
  const sh = ss_().getSheetByName(SHEET.BONY);
  if (!sh) return 'Brak zakładki Bony, bon ' + order.bon + ' nie został oznaczony jako wykorzystany.';
  const bon = tableToObjects_(sh.getDataRange().getValues()).filter(function (b) { return normVoucher_(b.kod) === order.bon; })[0];
  if (!bon) return 'Bonu ' + order.bon + ' nie ma w zakładce Bony.';
  const used = str_(bon.wykorzystany_w);
  if (used && used !== order.numer) {
    const other = orderRows.filter(function (o) { return str_(o.numer) === used; })[0];
    if (!other || orderHoldsVoucher_(other, now)) return 'Bon ' + order.bon + ' jest też w zamówieniu ' + used + '. Sprawdź, czy rabat nie liczy się dwa razy.';
  }
  if (used !== order.numer) writeFields_(sh, headerMap_(sh), bon._row, { wykorzystany_w: order.numer });
  return '';
}

/** Wystawia bon za opóźnienie: wiersz w Bony, kod w zamówieniu, mail do klienta i do właściciela. */
function issueDelayVoucher_(sh, H, rec, now) {
  const order = orderFromRecord_(rec);
  const bonSheet = ensureSheet_(ss_(), SHEET.BONY, HEADERS[SHEET.BONY]);
  const taken = tableToObjects_(bonSheet.getDataRange().getValues()).map(function (b) { return normVoucher_(b.kod); });
  let kod = voucherCode_();
  while (taken.indexOf(kod) !== -1) kod = voucherCode_();
  const bon = { kod: kod, kwota: CONFIG.BON.KWOTA, prog: CONFIG.BON.PROG,
    wazny_do: new Date(now.getTime() + CONFIG.BON.WAZNOSC_DNI * 86400000) };
  appendRecord_(bonSheet, { kod: kod, kwota: bon.kwota, prog: bon.prog, wazny_do: bon.wazny_do, wystawiony: now,
    powod: 'opóźnienie ' + order.numer, email: order.customer.email, wykorzystany_w: '' });
  writeFields_(sh, H, rec._row, { bon_za_opoznienie: kod,
    historia: appendNote_(rec.historia, dateTxt_(now, CONFIG.TIMEZONE) + ' bon ' + kod + ' za opóźnienie') });
  sendMail_(order.customer.email, TEMPLATES.klientBon(order, CONFIG, bon), 'klientBon ' + order.numer);
  sendMail_(CONFIG.OWNER_EMAIL, TEMPLATES.wlascicielBon(order, CONFIG, bon), 'wlascicielBon ' + order.numer);
  log_('INFO', 'bon', order.numer + ': wystawiony ' + kod);
}

function appendNote_(current, line) {
  const c = str_(current);
  return c ? c + '\n' + line : line;
}

/** Trigger co godzinę: przypomnienie po REMINDER_AFTER_HOURS, wygaszenie po terminie rezerwacji, bon za opóźnienie. */
function hourly() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    const sh = sheet_(SHEET.ZAMOWIENIA);
    const H = headerMap_(sh);
    const rows = tableToObjects_(sh.getDataRange().getValues());
    const now = new Date();
    let changed = false;
    rows.forEach(function (rec) {
      if (dueVoucher_(rec, now, CONFIG)) { issueDelayVoucher_(sh, H, rec, now); return; }
      if (normStatus_(rec.status) !== STATUS.NOWE) return;
      const order = orderFromRecord_(rec);
      if (now >= order.until) {
        writeFields_(sh, H, rec._row, {
          status: STATUS.WYGASLE, status_przetworzony: STATUS.WYGASLE,
          historia: appendNote_(rec.historia, dateTxt_(now, CONFIG.TIMEZONE) + ' NOWE → WYGASŁE (automatycznie)')
        });
        sendMail_(order.customer.email, TEMPLATES.klientWygasle(order, CONFIG), 'klientWygasle ' + order.numer);
        changed = true;
      } else if (!str_(rec.przypomnienie) && now - order.created >= CONFIG.REMINDER_AFTER_HOURS * 3600 * 1000) {
        sendMail_(order.customer.email, TEMPLATES.klientPrzypomnienie(order, CONFIG), 'przypomnienie ' + order.numer);
        writeFields_(sh, H, rec._row, { przypomnienie: now });
      }
    });
    if (changed) invalidateCatalog_();
    trimLog_(3000);
  } catch (err) {
    log_('ERROR', 'hourly', String(err && err.stack || err));
  } finally {
    lock.releaseLock();
  }
}

function trimLog_(max) {
  const sh = ss_().getSheetByName(SHEET.LOG);
  if (!sh) return;
  const extra = sh.getLastRow() - 1 - max;
  if (extra > 0) sh.deleteRows(2, extra);
}

// ============ 8. NARZĘDZIA ============

/** Uruchom raz z edytora: zakładki, nagłówki, lista statusów, formaty, dwa triggery. Bezpieczne do powtórzenia. */
function setup() {
  const ss = ss_();
  ss.setSpreadsheetTimeZone(CONFIG.TIMEZONE);
  Object.keys(HEADERS).forEach(function (name) { ensureSheet_(ss, name, HEADERS[name]); });

  const st = ss.getSheetByName(SHEET.STATUSY);
  if (st.getLastRow() < 2) st.getRange(2, 1, STATUS_OPIS.length, 2).setValues(STATUS_OPIS);

  // Sklep: brakujące przełączniki z wartością domyślną (sprzedaz: NIE), istniejących wartości nie zmieniamy
  const sk = ss.getSheetByName(SHEET.SKLEP);
  const obecne = sk.getLastRow() > 1 ? sk.getRange(2, 1, sk.getLastRow() - 1, 1).getValues().map(function (r) { return str_(r[0]).toLowerCase(); }) : [];
  SKLEP_USTAWIENIA.forEach(function (u) { if (obecne.indexOf(u[0]) === -1) sk.appendRow(u); });
  const takNie = SpreadsheetApp.newDataValidation().requireValueInList(['TAK', 'NIE'], true).setAllowInvalid(false).build();
  sk.getRange(2, 2, sk.getLastRow() - 1, 1).setDataValidation(takNie);
  sk.setColumnWidth(3, 520);

  const zam = ss.getSheetByName(SHEET.ZAMOWIENIA);
  const H = headerMap_(zam);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(st.getRange(2, 1, STATUS_OPIS.length, 1), true).setAllowInvalid(false).build();
  zam.getRange(2, H.status, zam.getMaxRows() - 1, 1).setDataValidation(rule);
  const carriers = SpreadsheetApp.newDataValidation()
    .requireValueInList(Object.keys(CONFIG.TRACKING_URLS), true).setAllowInvalid(false).build();
  zam.getRange(2, H.przewoznik, zam.getMaxRows() - 1, 1).setDataValidation(carriers);
  ['utworzone', 'rezerwacja_do', 'oplacone', 'przypomnienie'].forEach(function (k) {
    zam.getRange(2, H[k], zam.getMaxRows() - 1, 1).setNumberFormat('dd.mm.yyyy HH:mm');
  });
  ['wartosc_produktow', 'koszt_dostawy', 'rabat', 'kwota'].forEach(function (k) {
    zam.getRange(2, H[k], zam.getMaxRows() - 1, 1).setNumberFormat('0.00 "zł"');
  });
  UKRYTE_KOLUMNY.forEach(function (k) { if (H[k]) zam.hideColumns(H[k]); });
  const ew = ss.getSheetByName(SHEET.EWIDENCJA);
  ew.getRange(2, 1, ew.getMaxRows() - 1, 1).setNumberFormat('dd.mm.yyyy HH:mm');
  ew.getRange(2, 4, ew.getMaxRows() - 1, 1).setNumberFormat('0.00 "zł"');
  const bony = ss.getSheetByName(SHEET.BONY);
  const HB = headerMap_(bony);
  ['kwota', 'prog'].forEach(function (k) { bony.getRange(2, HB[k], bony.getMaxRows() - 1, 1).setNumberFormat('0.00 "zł"'); });
  ['wazny_do', 'wystawiony'].forEach(function (k) { bony.getRange(2, HB[k], bony.getMaxRows() - 1, 1).setNumberFormat('dd.mm.yyyy'); });

  ScriptApp.getProjectTriggers().forEach(function (t) {
    const fn = t.getHandlerFunction();
    if (fn === 'handleEdit' || fn === 'hourly') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('handleEdit').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('hourly').timeBased().everyHours(1).create();
  log_('INFO', 'setup', 'Zakładki, statusy i triggery gotowe.');
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  const lastCol = sh.getLastColumn();
  const current = lastCol ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return str_(h).toLowerCase(); }) : [];
  if (!current.some(Boolean)) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    const missing = headers.filter(function (h) { return current.indexOf(h) === -1; });
    if (missing.length) sh.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
  }
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold');
  return sh;
}

/** Sprawdza CONFIG i dane. Wyniki w zakładce Log. Przed startem nie może być wpisów ERROR. */
function diagnostyka() {
  const wyniki = diagnoza_(readTable_(SHEET.PRODUKTY), readTable_(SHEET.ZESTAWY), CONFIG);
  wyniki.forEach(function (w) { log_(w[0], 'diagnostyka', w[1]); });
  let quota = '?';
  try { quota = MailApp.getRemainingDailyQuota(); } catch (e) { /* brak uprawnień przy pierwszym uruchomieniu */ }
  log_('INFO', 'diagnostyka', 'Sprzedaż: ' + (salesOpen_() ? 'włączona (Sklep, sprzedaz: TAK).' : 'wstrzymana (Sklep, sprzedaz: NIE), strona nie przyjmuje zamówień.'));
  log_('INFO', 'diagnostyka', 'Pozostały dzienny limit maili: ' + quota + '. Błędów: '
    + wyniki.filter(function (w) { return w[0] === 'ERROR'; }).length + ', ostrzeżeń: '
    + wyniki.filter(function (w) { return w[0] === 'WARN'; }).length + '.');
}

/** Czysta część diagnostyki: [[poziom, komunikat], ...] */
function diagnoza_(productRows, setRows, cfg) {
  const out = [];
  const E = function (m) { out.push(['ERROR', m]); };
  const W = function (m) { out.push(['WARN', m]); };
  ['OWNER_EMAIL', 'IG_HANDLE', 'SITE_URL', 'BLIK_PHONE', 'BANK_ACCOUNT', 'RECIPIENT', 'SELLER_INFO'].forEach(function (k) {
    if (!str_(cfg[k]) || cfg[k] === 'UZUPELNIJ') E('CONFIG.' + k + ' nie jest uzupełnione');
  });
  ['paczkomat', 'kurier'].forEach(function (k) {
    if (toNumber_(cfg.SHIPPING[k]) === null) E('CONFIG.SHIPPING.' + k + ' nie jest uzupełnione');
  });
  if (str_(cfg.BANK_ACCOUNT).replace(/\D/g, '').length !== 26 && cfg.BANK_ACCOUNT !== 'UZUPELNIJ') E('CONFIG.BANK_ACCOUNT nie ma 26 cyfr');

  const products = productRows.map(productFromRow_);
  const ids = {};
  let bezStanu = 0;
  products.forEach(function (p) {
    const label = (p.id || 'wiersz ' + p._row) + ' ' + p.marka + ' ' + p.nazwa;
    if (!p.id) { E('Produkty wiersz ' + p._row + ': id nie jest uzupełnione'); return; }
    if (ids[p.id]) E('Produkty: powtórzone id ' + p.id);
    ids[p.id] = p;
    if (!p.aktywny) return;
    if (!p.marka || !p.nazwa) E(label + ': marka albo nazwa nie jest uzupełniona');
    if (RODZINY.indexOf(p.rodzina) === -1) W(label + ': rodzina „' + p.rodzina + '” spoza listy, quiz jej nie dopasuje');
    if (p.profil && PROFILE.indexOf(p.profil) === -1) W(label + ': profil „' + p.profil + '” spoza listy');
    if (!p.profil) W(label + ': profil nie jest uzupełniony');
    if (PORY.indexOf(p.pora) === -1) W(label + ': pora „' + p.pora + '” spoza listy');
    p.sezon.forEach(function (s) { if (SEZONY.indexOf(s) === -1) W(label + ': sezon „' + s + '” spoza listy'); });
    if (p.intensywnosc === null) W(label + ': intensywnosc nie jest uzupełniona (quiz przyjmie 2)');
    if (p.ml === null) bezStanu++;
    else if (p.ml < 0) W(label + ': ml_dostepne poniżej zera (' + p.ml + ')');
    if (!hasPrice_(p) && !(p.ml !== null && p.ml <= 0)) E(label + ': nie ma żadnej ceny, strona go nie pokaże');
    if (!p.opis) W(label + ': brak opisu');
    if (!p.zdjecie) W(label + ': brak zdjęcia');
  });
  if (bezStanu) out.push(['INFO', bezStanu + ' aktywnych zapachów bez ml_dostepne: sprzedaż bez limitu i bez etykiety „Zostało X ml”. Gdy zapach się skończy, wpisz 0.']);
  products.forEach(function (p) {
    if (!p.aktywny) return;
    p.podobne.forEach(function (x) { if (!ids[x]) W(p.id + ': podobne wskazuje na nieistniejące id ' + x); });
  });
  setRows.map(setFromRow_).forEach(function (s) {
    if (!s.aktywny) return;
    const label = (s.id || 'wiersz ' + s._row) + ' ' + s.nazwa;
    if (!(s.cena > 0)) E(label + ': cena zestawu nie jest uzupełniona');
    if (!s.sklad.length) E(label + ': skład nie jest uzupełniony');
    if (!s.rodzina) W(label + ': brak rodziny, quiz nie zaproponuje tego zestawu');
    s.sklad.forEach(function (c) {
      const p = ids[c.id];
      if (!c.ml) E(label + ': błędny zapis składnika „' + c.id + '”, oczekiwane id:ml');
      else if (!p) E(label + ': składnik ' + c.id + ' nie istnieje w Produktach');
      else if (p.ceny[c.ml] === null) W(label + ': ' + c.id + ' nie ma ceny ' + c.ml + ' ml, oszczędności nie policzymy');
    });
  });
  return out;
}
