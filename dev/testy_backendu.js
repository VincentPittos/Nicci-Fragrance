#!/usr/bin/env node
// Testy czystych funkcji apps-script/Code.gs i zgodności z site/nicci-api.js. Uruchom: node dev/testy_backendu.js
'use strict';
const assert = require('assert/strict');
const { loadBackend, loadFrontApi, readSheetJson, devConfig, withPlaceholderStock } = require('./wspolne');

const be = loadBackend();
const sheet = readSheetJson();
const cfg = devConfig(be.CONFIG);
const productRows = be.tableToObjects_(withPlaceholderStock(sheet.Produkty, 100));
const setRows = be.tableToObjects_(sheet.Zestawy);
const NOW = new Date('2026-09-23T16:40:00Z'); // 18:40 w Warszawie

// Obiekty z piaskownicy vm mają własne prototypy, więc porównujemy ich kopie JSON.
const deq = (a, b, m) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b, m);

let passed = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

function validBody(over) {
  return Object.assign({
    customer: { name: 'Anna Nowak', email: 'Anna@Example.com', phone: '+48 600 100 200', instagram: '@anna.n' },
    delivery: { method: 'paczkomat', paczkomat: 'waw12m' },
    payment: 'blik',
    consents: { regulamin: true, prywatnosc: true },
    note: '',
    website: '',
    items: [{ type: 'decant', id: 'p01', ml: 10, qty: 1 }]
  }, over || {});
}

// ---------- katalog ----------
test('katalog: tylko aktywne, ceny w groszach, warianty bez ceny ukryte', () => {
  const c = be.buildCatalog_(productRows, setRows, {}, cfg, NOW);
  assert.equal(c.products.length, 94); // październik 2026: 64 + 30 nowych (Lp. 56 i 72 do 100)
  const p01 = c.products.find((p) => p.id === 'p01');
  deq(p01.variants.map((v) => [v.ml, v.price]), [[5, 11000], [10, 19000], [20, 36000]]);
  const p21 = c.products.find((p) => p.id === 'p21');
  deq(p21.variants.map((v) => v.ml), [10, 20]);
  assert.ok(!c.products.some((p) => p.id === 'p57'), 'pozycja bez nazwy nie trafia do katalogu');
  const p43 = c.products.find((p) => p.id === 'p43');
  assert.equal(p43.bestseller, true, 'bestseller z kolumny bestseller');
  deq(p43.klimat, ['slodki', 'orientalny']);
  assert.equal(p43.renoma, 3);
  assert.equal(c.products.find((p) => p.id === 'p86').profil, 'damski');
  deq(c.shipping, { paczkomat: 1499, kurier: 1999 });
  assert.equal(c.freeShippingFrom, 20000);
});

test('katalog: produkt ze stanem, ale bez żadnej ceny znika z listy i z podobnych', () => {
  const rows = productRows.map((r) => (r.id === 'p02' ? Object.assign({}, r, { cena_5: '', cena_10: '', cena_20: '' }) : r));
  const c = be.buildCatalog_(rows, setRows, {}, cfg, NOW);
  assert.ok(!c.products.some((p) => p.id === 'p02'), 'p02 ma stan, a nie ma cen');
  assert.ok(!c.products.some((p) => p.podobne.indexOf('p02') !== -1), 'podobne nie wskazują na produkt bez cen');
  const p34 = c.products.find((p) => p.id === 'p34');
  assert.ok(p34 && p34.variants.length === 0, 'wyprzedany (0 ml) bez cen zostaje jako wyprzedany');
});

test('katalog: rezerwacja obniża dostępność, niski stan ustawia malo i zostalo', () => {
  const c = be.buildCatalog_(productRows, setRows, { p01: 78 }, cfg, NOW);
  const p01 = c.products.find((p) => p.id === 'p01');
  assert.equal(p01.malo, true);
  assert.equal(p01.zostalo, 22);
  deq(p01.variants.map((v) => v.available), [true, true, true]);
  const c2 = be.buildCatalog_(productRows, setRows, { p01: 88 }, cfg, NOW);
  const q = c2.products.find((p) => p.id === 'p01');
  deq(q.variants.map((v) => v.available), [true, true, false]);
  const c3 = be.buildCatalog_(productRows, setRows, { p01: 97 }, cfg, NOW);
  const r = c3.products.find((p) => p.id === 'p01');
  assert.equal(r.malo, false, 'poniżej najmniejszego wariantu to wyprzedane, nie niski stan');
  assert.ok(r.variants.every((v) => !v.available));
});

test('katalog: wyprzedane mają malo=false i brak dostępnych wariantów', () => {
  const c = be.buildCatalog_(productRows, setRows, { p01: 100 }, cfg, NOW);
  const p01 = c.products.find((p) => p.id === 'p01');
  assert.equal(p01.variants.length, 3, 'ceny zostają, znika tylko dostępność');
  assert.ok(p01.variants.every((v) => !v.available));
  assert.equal(p01.malo, false);
  assert.equal(p01.zostalo, null);
  const p34 = c.products.find((p) => p.id === 'p34');
  assert.equal(p34.variants.length, 0);
  assert.equal(p34.malo, false);
});

test('zestawy: oszczędność tylko gdy są ceny wszystkich składników, brakujący składnik nazwany', () => {
  const c = be.buildCatalog_(productRows, setRows, {}, cfg, NOW);
  const lv = c.sets.find((s) => s.id === 'z01');
  assert.equal(lv.price, 55000);
  assert.equal(lv.cenaOsobno, 63000);
  assert.equal(lv.available, true);
  // Sweet & Spicy: Lost Cherry (niedostępny, bez cen) zastąpiony Wet Cherry Liquor, zestaw dostępny (właściciel, październik 2026)
  const sweet = c.sets.find((s) => s.id === 'z04');
  assert.equal(sweet.available, true);
  deq(sweet.sklad.map((x) => x.id), ['p08', 'p24', 'p29', 'p98', 'p43']);
  // zestaw z niedostępnym składnikiem: nazwany składnik i brak oszczędności
  const bezCen = c.sets.find((s) => s.id === 'z07');
  assert.equal(bezCen.available, false);
  const winter = c.sets.find((s) => s.id === 'z07');
  deq(winter.sklad.filter((x) => !x.available).map((x) => x.nazwa), ['Bottled Absolu']);
  assert.ok(!c.sets.some((s) => s.id === 'z02'), 'zestaw nieaktywny ukryty');
});

test('rezerwacje: liczą się tylko NOWE przed terminem', () => {
  const rows = [
    { status: 'NOWE', rezerwacja_do: new Date(NOW.getTime() + 3600e3), ml_json: '{"p01":15,"p02":5}' },
    { status: 'NOWE', rezerwacja_do: new Date(NOW.getTime() - 1), ml_json: '{"p01":100}' },
    { status: 'OPŁACONE', rezerwacja_do: new Date(NOW.getTime() + 3600e3), ml_json: '{"p01":100}' },
    { status: 'nowe', rezerwacja_do: new Date(NOW.getTime() + 3600e3).toISOString(), ml_json: '{"p01":5}' }
  ];
  deq(be.reservedMl_(rows, NOW), { p01: 20, p02: 5 });
});

// ---------- walidacja ----------
test('walidacja: poprawne zamówienie przechodzi i jest znormalizowane', () => {
  const v = be.validateOrder_(validBody(), cfg);
  assert.equal(v.ok, true);
  assert.equal(v.data.customer.email, 'anna@example.com');
  assert.equal(v.data.customer.instagram, 'anna.n');
  assert.equal(v.data.delivery.paczkomat, 'WAW12M');
});

test('walidacja: zwraca listę pól jak w tabeli z architektury', () => {
  const v = be.validateOrder_({
    customer: { name: 'Al', email: 'zly@', phone: '600 100', instagram: 'z spacją' },
    delivery: { method: 'kurier', street: '', postcode: '00000', city: '' },
    payment: 'karta', consents: { regulamin: true }, note: 'x'.repeat(301),
    items: [{ type: 'decant', id: 'p01', ml: 7, qty: 1 }]
  }, cfg);
  assert.equal(v.ok, false);
  deq(v.fields.sort(), ['city', 'email', 'instagram', 'items', 'name', 'note', 'payment', 'phone',
    'postcode', 'prywatnosc', 'street'].sort());
});

test('walidacja: paczkomat 4-12 znaków, ilość 1-5, typ pozycji', () => {
  deq(be.validateOrder_(validBody({ delivery: { method: 'paczkomat', paczkomat: 'AB' } }), cfg).fields, ['paczkomat']);
  deq(be.validateOrder_(validBody({ items: [{ type: 'decant', id: 'p01', ml: 5, qty: 6 }] }), cfg).fields, ['items']);
  deq(be.validateOrder_(validBody({ items: [{ type: 'hack', id: 'p01', qty: 1 }] }), cfg).fields, ['items']);
  deq(be.validateOrder_(validBody({ items: [] }), cfg).fields, ['items']);
});

test('walidacja: te same pozycje są łączone z limitem 5', () => {
  const v = be.validateOrder_(validBody({ items: [
    { type: 'decant', id: 'p01', ml: 10, qty: 4 }, { type: 'decant', id: 'p01', ml: 10, qty: 3 }] }), cfg);
  deq(v.data.items, [{ type: 'decant', id: 'p01', ml: 10, qty: 5 }]);
});

// ---------- wycena ----------
test('wycena: ceny z arkusza, dostawa, darmowa od progu', () => {
  const r = be.priceOrder_([{ type: 'decant', id: 'p01', ml: 10, qty: 1 }], 'paczkomat', productRows, setRows, {}, cfg);
  assert.equal(r.ok, true);
  assert.equal(r.subtotal, 19000);
  assert.equal(r.shipping, 1499);
  assert.equal(r.total, 20499);
  const r2 = be.priceOrder_([{ type: 'decant', id: 'p01', ml: 20, qty: 1 }], 'kurier', productRows, setRows, {}, cfg);
  assert.equal(r2.shipping, 0);
  assert.equal(r2.total, 36000);
});

test('wycena: zestaw zużywa ml składników', () => {
  const r = be.priceOrder_([{ type: 'set', id: 'z01', qty: 2 }], 'paczkomat', productRows, setRows, {}, cfg);
  assert.equal(r.ok, true);
  assert.equal(r.subtotal, 110000);
  deq(r.need, { p01: 10, p02: 10, p03: 10, p04: 10, p05: 10 });
});

test('wycena: nieznana pozycja albo wariant bez ceny to invalid_item', () => {
  assert.equal(be.priceOrder_([{ type: 'decant', id: 'p999', ml: 5, qty: 1 }], 'paczkomat', productRows, setRows, {}, cfg).error, 'invalid_item');
  assert.equal(be.priceOrder_([{ type: 'decant', id: 'p21', ml: 5, qty: 1 }], 'paczkomat', productRows, setRows, {}, cfg).error, 'invalid_item');
  assert.equal(be.priceOrder_([{ type: 'set', id: 'z02', qty: 1 }], 'paczkomat', productRows, setRows, {}, cfg).error, 'invalid_item');
});

test('wycena: brak stanu zwraca shortages z dostępnymi podobnymi', () => {
  const r = be.priceOrder_([{ type: 'decant', id: 'p01', ml: 20, qty: 1 }], 'paczkomat', productRows, setRows, { p01: 90, p46: 100 }, cfg);
  assert.equal(r.error, 'out_of_stock');
  assert.equal(r.shortages[0].id, 'p01');
  assert.equal(r.shortages[0].zostalo, 10);
  assert.ok(!r.shortages[0].podobne.some((x) => x.id === 'p46'), 'podobny bez stanu nie jest proponowany');
  assert.ok(r.shortages[0].podobne.some((x) => x.id === 'p45'));
});

test('wycena: brak kosztu dostawy w CONFIG to server_error z opisem dla logu', () => {
  const r = be.priceOrder_([{ type: 'decant', id: 'p01', ml: 10, qty: 1 }], 'paczkomat', productRows, setRows, {}, be.CONFIG);
  assert.equal(r.error, 'server_error');
  assert.match(r.internal, /SHIPPING\.paczkomat/);
});

// ---------- numery, daty, bezpieczeństwo ----------
test('numer zamówienia: NF0101, potem kolejny', () => {
  assert.equal(be.nextOrderNumber_([], cfg), 'NF0101');
  assert.equal(be.nextOrderNumber_([{ numer: 'NF0105' }, { numer: 'NF0102' }, { numer: 'X1' }], cfg), 'NF0106');
});

test('termin po polsku w strefie Europe/Warsaw', () => {
  assert.equal(be.terminTxt_(new Date('2026-09-24T16:40:00Z'), 'Europe/Warsaw'), 'czwartku 24 września, 18:40');
  assert.equal(be.terminTxt_(new Date('2026-01-04T23:05:00Z'), 'Europe/Warsaw'), 'poniedziałku 5 stycznia, 00:05');
});

test('komórki: tekst klienta nie może stać się formułą', () => {
  assert.equal(be.safeCell_('=HYPERLINK("x")'), '\'=HYPERLINK("x")');
  assert.equal(be.safeCell_('+48 600 100 200'), "'+48 600 100 200");
  assert.equal(be.safeCell_('Anna'), 'Anna');
  assert.equal(be.safeCell_(12), 12);
});

test('maile: dane klienta są escapowane, treść bez myślników', () => {
  const v = be.validateOrder_(validBody({ customer: { name: '<script>alert(1)</script> Kowal', email: 'a@b.pl', phone: '600100200' } }), cfg);
  const p = be.priceOrder_(v.data.items, 'paczkomat', productRows, setRows, {}, cfg);
  const order = { numer: 'NF0101', until: new Date('2026-09-24T16:40:00Z'), customer: v.data.customer,
    delivery: v.data.delivery, payment: 'blik', note: '', lines: p.lines, subtotal: p.subtotal, shipping: p.shipping, total: p.total };
  const c = Object.assign({}, cfg, { BLIK_PHONE: '600 000 000', RECIPIENT: 'Nicci', BANK_ACCOUNT: '12345678901234567890123456', SELLER_INFO: 'dane' });
  Object.keys(be.TEMPLATES).forEach((k) => {
    const bon = { kod: 'NF-ABCD-EFGH', kwota: 50, prog: 199, wazny_do: new Date('2026-12-22T12:00:00Z') };
    const t = k === 'klientWyslane' ? be.TEMPLATES[k](order, c, 'ABC123', 'InPost')
      : /Bon$/.test(k) ? be.TEMPLATES[k](order, c, bon) : be.TEMPLATES[k](order, c, []);
    assert.ok(!/<script>/.test(t.html), k + ': surowy HTML klienta w mailu');
    assert.ok(!/[–—]/.test(t.text + t.subject), k + ': półpauza albo pauza w treści');
  });
  const nowe = be.TEMPLATES.klientNowe(order, c);
  assert.match(nowe.text, /Tytuł: NF0101/);
  assert.match(nowe.text, /12 3456 7890 1234 5678 9012 3456/);
});

test('wysyłka: przewoźnik z kolumny, paczkomat zawsze InPost, link śledzenia w mailu', () => {
  const c = Object.assign({}, cfg, { SELLER_INFO: 'dane' });
  assert.equal(be.carrierFor_({ dostawa: 'paczkomat', przewoznik: '' }, c), 'InPost');
  assert.equal(be.carrierFor_({ dostawa: 'kurier', przewoznik: 'dpd' }, c), 'DPD', 'wielkość liter bez znaczenia');
  assert.equal(be.carrierFor_({ dostawa: 'kurier', przewoznik: '' }, c), '', 'kurier bez przewoźnika: mail czeka');
  assert.equal(be.carrierFor_({ dostawa: 'kurier', przewoznik: 'Poczta' }, c), '', 'spoza listy: mail czeka');
  const order = { numer: 'NF0101', customer: { name: 'Anna Kowal', email: 'a@b.pl' }, delivery: { method: 'kurier' }, lines: [], total: 0 };
  const dpd = be.TEMPLATES.klientWyslane(order, c, 'AB 12/3', 'DPD');
  assert.match(dpd.text, /wiezie ją DPD/);
  assert.match(dpd.text, /tracktrace\.dpd\.com\.pl\/parcelDetails\?typ=1&p1=AB%2012%2F3/, 'numer zakodowany w adresie');
  const dhl = be.TEMPLATES.klientWyslane(order, c, '123', 'DHL');
  assert.match(dhl.text, /dhl\.com\/pl-pl\/home\/sledzenie\.html\?tracking-id=123/);
  const none = be.TEMPLATES.klientWyslane(order, c, '123', '');
  assert.ok(!/Śledzenie:/.test(none.text), 'bez przewoźnika nie ma zmyślonego linku');
});

test('odpowiedź zamówienia: pola, których używa strona potwierdzenia', () => {
  const v = be.validateOrder_(validBody(), cfg);
  const p = be.priceOrder_(v.data.items, 'paczkomat', productRows, setRows, {}, cfg);
  const res = be.orderResponse_({ numer: 'NF0101', until: new Date('2026-09-24T16:40:00Z'), customer: v.data.customer,
    delivery: v.data.delivery, payment: 'blik', lines: p.lines, subtotal: p.subtotal, shipping: p.shipping, total: p.total }, cfg);
  ['ok', 'numer', 'kwota', 'kwotaTxt', 'terminTxt', 'tytul', 'dane', 'pozycje', 'igHandle', 'igMessage'].forEach((k) =>
    assert.ok(k in res, 'brak pola ' + k));
  assert.match(res.igMessage, /^ZAMOWIENIE NF0101\n/);
});

// ---------- bony ----------
test('bony: kod nieznany, wykorzystany, zwolniony po wygaśnięciu, po terminie, poniżej progu, poprawny', () => {
  const bony = [
    { _row: 2, kod: 'NF-AAAA-BBBB', kwota: '', prog: '', wazny_do: new Date('2026-12-22T12:00:00Z'), wykorzystany_w: '' },
    { _row: 3, kod: 'NF-USED-0001', kwota: 50, prog: 199, wazny_do: '', wykorzystany_w: 'NF0101' },
    { _row: 4, kod: 'NF-FREE-0002', kwota: 50, prog: 199, wazny_do: '', wykorzystany_w: 'NF0102' },
    { _row: 5, kod: 'NF-OLD0-0003', kwota: 50, prog: 199, wazny_do: new Date('2026-09-22T10:00:00Z'), wykorzystany_w: '' },
    { _row: 6, kod: 'NF-HAND-0004', kwota: 30, prog: 100, wazny_do: '', wykorzystany_w: 'w sklepie' }
  ];
  const orders = [
    { numer: 'NF0101', status: 'OPŁACONE', rezerwacja_do: new Date('2026-09-22T10:00:00Z') },
    { numer: 'NF0102', status: 'NOWE', rezerwacja_do: new Date('2026-09-23T10:00:00Z') }
  ];
  const chk = (code, sub) => JSON.parse(JSON.stringify(be.checkVoucher_(code, bony, orders, sub, NOW, cfg)));
  assert.equal(chk('NF-XXXX-YYYY', 30000).reason, 'nieznany');
  assert.equal(chk('', 30000).reason, 'nieznany');
  assert.equal(chk('NF-USED-0001', 30000).reason, 'wykorzystany', 'opłacone zamówienie trzyma bon');
  deq(chk('NF-FREE-0002', 30000), { ok: true, kod: 'NF-FREE-0002', rabat: 5000, row: 4 });
  assert.equal(chk('NF-OLD0-0003', 30000).reason, 'wygasl', 'ważny do 22.09, dziś 23.09');
  assert.equal(chk('NF-HAND-0004', 30000).reason, 'wykorzystany', 'wpis ręczny w wykorzystany_w');
  deq(chk('NF-AAAA-BBBB', 19800), { ok: false, reason: 'prog', prog: 19900, brakuje: 100 });
  deq(chk('NF-AAAA-BBBB', 19900), { ok: true, kod: 'NF-AAAA-BBBB', rabat: 5000, row: 2 }, 'puste kwota i prog biorą CONFIG.BON');
  assert.equal(be.normVoucher_(' nf-aaaa bbbb '), 'NF-AAAABBBB');
  assert.match(be.voucherCode_(), /^NF-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
  // walidacja formularza: kod z małych liter i spacji się normalizuje, dziwne znaki to błąd pola
  assert.equal(be.validateOrder_(validBody({ voucher: ' nf-aaaa-bbbb ' }), cfg).data.voucher, 'NF-AAAA-BBBB');
  deq(be.validateOrder_(validBody({ voucher: 'NF<script>' }), cfg).fields, ['voucher']);
  assert.equal(be.validateOrder_(validBody(), cfg).data.voucher, '');
});

test('bony: dni robocze bez weekendów i świąt w Polsce (z Wigilią od 2025)', () => {
  const h27 = Array.from(be.polishHolidays_(2027));
  ['2027-01-06', '2027-03-29', '2027-05-03', '2027-05-27', '2027-12-24', '2027-12-26'].forEach((d) => assert.ok(h27.includes(d), d));
  assert.ok(!Array.from(be.polishHolidays_(2024)).includes('2024-12-24'), 'Wigilia wolna dopiero od 2025');
  // piątek 18.12.2026: 21, 22, 23, potem 24 do 27 wolne, 28, 29, 30, 31
  assert.equal(be.workdayDeadline_(new Date('2026-12-18T09:00:00Z'), 7, 'Europe/Warsaw'), '2026-12-31');
  // czwartek przed Wielkanocą 2026: poniedziałek wielkanocny 6.04 się nie liczy
  assert.equal(be.workdayDeadline_(new Date('2026-04-02T12:00:00Z'), 7, 'Europe/Warsaw'), '2026-04-14');
  // wpłata 22.09 o 0:30 w Warszawie (w UTC jeszcze 21.09) liczy się od 22.09
  assert.equal(be.workdayDeadline_(new Date('2026-09-21T22:30:00Z'), 1, 'Europe/Warsaw'), '2026-09-23');
});

test('bony: za opóźnienie dopiero dzień po terminie, raz, tylko przy statusie OPŁACONE', () => {
  const rec = { status: 'OPŁACONE', oplacone: new Date('2026-12-18T09:00:00Z'), bon_za_opoznienie: '' };
  assert.equal(be.dueVoucher_(rec, new Date('2026-12-31T21:30:00Z'), cfg), false, '31.12, 22:30 w Warszawie: jeszcze w terminie');
  assert.equal(be.dueVoucher_(rec, new Date('2026-12-31T23:30:00Z'), cfg), true, '1.01, 0:30 w Warszawie: po terminie');
  assert.equal(be.dueVoucher_(Object.assign({}, rec, { bon_za_opoznienie: 'NF-AAAA-BBBB' }), new Date('2027-01-05T12:00:00Z'), cfg), false);
  assert.equal(be.dueVoucher_(Object.assign({}, rec, { status: 'WYSŁANE' }), new Date('2027-01-05T12:00:00Z'), cfg), false);
  assert.equal(be.dueVoucher_(Object.assign({}, rec, { oplacone: '' }), new Date('2027-01-05T12:00:00Z'), cfg), false);
});

test('bony: rabat w mailu, w odpowiedzi dla strony i po odczycie wiersza z arkusza', () => {
  const v = be.validateOrder_(validBody({ items: [{ type: 'decant', id: 'p01', ml: 20, qty: 1 }] }), cfg);
  const p = be.priceOrder_(v.data.items, 'paczkomat', productRows, setRows, {}, cfg);
  const order = { numer: 'NF0103', until: new Date('2026-09-24T16:40:00Z'), customer: v.data.customer, delivery: v.data.delivery,
    payment: 'blik', note: '', lines: p.lines, subtotal: p.subtotal, shipping: p.shipping, bon: 'NF-AAAA-BBBB', rabat: 5000,
    total: p.total - 5000 };
  const c = Object.assign({}, cfg, { BLIK_PHONE: '600 000 000', RECIPIENT: 'Nicci', BANK_ACCOUNT: '12345678901234567890123456', SELLER_INFO: 'dane' });
  const mail = be.TEMPLATES.klientNowe(order, c).text;
  assert.match(mail, /Bon NF-AAAA-BBBB: -50,00 zł/);
  assert.match(mail, /Razem: 310,00 zł/, '360 zł, dostawa gratis od 200 zł, minus bon 50 zł');
  const res = be.orderResponse_(order, cfg);
  assert.equal(res.rabat, 5000);
  assert.equal(res.kwota, 31000);
  const back = be.orderFromRecord_({ numer: 'NF0103', kwota: 310, koszt_dostawy: 0, rabat: 50, bon: 'NF-AAAA-BBBB' });
  assert.equal(back.subtotal, 36000);
  assert.equal(back.total, 31000);
  const cat = be.buildCatalog_(productRows, setRows, {}, cfg, NOW);
  deq(cat.bon, { kwota: 5000, prog: 19900 });
});

test('diagnostyka: wykrywa puste CONFIG i brak stanów w imporcie', () => {
  const d = be.diagnoza_(be.tableToObjects_(sheet.Produkty), setRows, be.CONFIG);
  const msgs = d.map((x) => x[1]).join('\n');
  assert.match(msgs, /CONFIG\.OWNER_EMAIL nie jest uzupełnione/);
  assert.match(msgs, /92 aktywnych zapachów bez ml_dostepne: sprzedaż bez limitu/);
  assert.ok(!d.some((x) => x[0] === 'ERROR' && /ml_dostepne/.test(x[1])), 'pusty stan to nie błąd');
});

test('stan: puste ml_dostepne = sprzedaż bez limitu i bez etykiety, 0 = wyprzedane, bez ceny = ukryty', () => {
  const raw = be.tableToObjects_(sheet.Produkty); // bez stanu zastępczego, jak w arkuszu właściciela
  const c = be.buildCatalog_(raw, setRows, { p01: 5000 }, cfg, NOW);
  const p01 = c.products.find((p) => p.id === 'p01');
  deq(p01.variants.map((v) => v.available), [true, true, true], 'rezerwacje nie zmniejszają nieliczonego stanu');
  assert.equal(p01.malo, false);
  assert.equal(p01.zostalo, null);
  const p34 = c.products.find((p) => p.id === 'p34');
  assert.ok(p34 && p34.variants.length === 0, 'p34 ma 0 ml: wyprzedany');
  const bezCeny = raw.map((r) => (r.id === 'p02' ? Object.assign({}, r, { cena_5: '', cena_10: '', cena_20: '' }) : r));
  assert.ok(!be.buildCatalog_(bezCeny, setRows, {}, cfg, NOW).products.some((p) => p.id === 'p02'), 'bez ceny i bez stanu: ukryty');
  const v = be.validateOrder_(validBody({ items: [{ type: 'decant', id: 'p01', ml: 20, qty: 5 }] }), cfg);
  assert.equal(be.priceOrder_(v.data.items, 'paczkomat', raw, setRows, {}, cfg).ok, true, '100 ml z nieliczonego stanu przechodzi');
  const z = be.buildCatalog_(raw, setRows, {}, cfg, NOW).sets;
  assert.ok(z.every((x) => x.sklad.every((k) => k.id === 'p34' || k.id === 'p60' || k.available)), 'składniki bez stanu są dostępne');
});

test('stan: płatność i anulowanie nie wpisują liczby do pustej komórki ml_dostepne', () => {
  const grid = [['id', 'ml_dostepne'], ['p01', ''], ['p02', 40]];
  const sheetFake = {
    getLastRow: () => grid.length, getLastColumn: () => 2,
    getRange: (r, c, nr, nc) => ({
      getValues: () => grid.slice(r - 1, r - 1 + (nr || 1)).map((row) => row.slice(c - 1, c - 1 + (nc || 1))),
      setValues: (vals) => vals.forEach((row, i) => row.forEach((v, j) => { grid[r - 1 + i][c - 1 + j] = v; }))
    })
  };
  be.SpreadsheetApp = { getActiveSpreadsheet: () => ({ getSheetByName: () => sheetFake }) };
  be.CacheService = { getScriptCache: () => ({ remove: () => {} }) };
  const braki = be.adjustStock_({ p01: 10, p02: 50 }, -1);
  assert.equal(grid[1][1], '', 'nieliczony zapach zostaje pusty');
  assert.equal(grid[2][1], -10);
  deq(braki, ['p02 (-10 ml)']);
  be.adjustStock_({ p01: 10, p02: 50 }, +1);
  assert.equal(grid[1][1], '');
  assert.equal(grid[2][1], 40);
});

// ---------- zgodność z nicci-api.js (bez zmian w module) ----------
test('nicci-api.js: katalog, filtry, grupowanie, quiz i koszyk działają na danych z backendu', async () => {
  const catalog = be.buildCatalog_(productRows, setRows, {}, cfg, NOW);
  const body = JSON.stringify({ ok: true, data: catalog });
  const { Nicci } = loadFrontApi(async () => ({ json: async () => JSON.parse(body) }));
  const cat = await Nicci.fetchCatalog();
  assert.equal(cat.products.length, 94);

  const drzewne = Nicci.filterProducts(cat.products, { rodzina: ['drzewna'], tylkoDostepne: true });
  assert.ok(drzewne.length > 0 && drzewne.every((p) => p.rodzina === 'drzewna'));
  assert.ok(Nicci.filterProducts(cat.products, { szukaj: 'bergamotka' }).length > 0, 'szukanie po nutach');
  assert.ok(!Nicci.filterProducts(cat.products, { tylkoDostepne: true }).some((p) => p.id === 'p34'));
  const zima = Nicci.filterProducts(cat.products, { sezon: 'zima' });
  assert.ok(zima.length > 0 && zima.every((p) => p.sezon.includes('zima')));
  const grupy = Nicci.groupProducts(cat.products, 'rodzina');
  assert.ok(grupy.length >= 8 && grupy.every((g) => g.items.length > 0));

  const rec = Nicci.quiz.recommend(cat, { profil: 'meski', klimat: ['drzewny'], pora: 'wieczór', sezon: 'chlodno', intensywnosc: 3 });
  assert.equal(rec.top.length, 3);
  assert.ok(rec.top.every((p) => ['drzewna', 'skórzana', 'szyprowa'].includes(p.rodzina)), 'dopasowanie rodziny działa');
  const slodki = Nicci.quiz.recommend(cat, { profil: 'unisex', klimat: ['slodki'], pora: 'wieczór', sezon: 'chlodno', intensywnosc: 3 });
  assert.equal(slodki.set && slodki.set.id, 'z04', 'Sweet & Spicy jest dostępny i ma rodzinę gourmand');

  Nicci.cart.addDecant('p01', 10);
  Nicci.cart.addDecant('p01', 10);
  Nicci.cart.addSet('z01');
  const sum = Nicci.cart.summary(cat, 'paczkomat');
  assert.equal(sum.subtotal, 19000 * 2 + 55000);
  assert.equal(sum.shipping, 0);
  assert.equal(Nicci.cart.count(), 3);
});

// ---------- sprzedaż wstrzymana (zakładka Sklep) ----------
test('sprzedaż: katalog ma sprzedaz true tylko przy jawnym TAK, domyślnie wstrzymana', () => {
  assert.equal(be.buildCatalog_(productRows, setRows, {}, Object.assign({}, cfg, { SPRZEDAZ: true }), NOW).sprzedaz, true);
  assert.equal(be.buildCatalog_(productRows, setRows, {}, Object.assign({}, cfg, { SPRZEDAZ: false }), NOW).sprzedaz, false);
  assert.equal(be.buildCatalog_(productRows, setRows, {}, be.CONFIG, NOW).sprzedaz, false, 'CONFIG bez SPRZEDAZ: wstrzymana');
});

test('sprzedaż: atrapa backendu odrzuca zamówienie przy NICCI_SPRZEDAZ=NIE, bez zapisu', () => {
  const os = require('os'), fs = require('fs'), path = require('path');
  const plik = path.join(os.tmpdir(), 'nicci-sprzedaz-' + process.pid + '.json');
  const prev = { s: process.env.NICCI_SPRZEDAZ, z: process.env.NICCI_ZAMOWIENIA };
  try {
    process.env.NICCI_ZAMOWIENIA = plik;
    process.env.NICCI_SPRZEDAZ = 'NIE';
    delete require.cache[require.resolve('./atrapa_backendu')];
    const zamknieta = require('./atrapa_backendu').createBackend();
    assert.equal(zamknieta.catalog(NOW).data.sprzedaz, false);
    deq(zamknieta.createOrder(validBody(), NOW), { ok: false, error: 'sprzedaz_wstrzymana' });
    assert.ok(!fs.existsSync(plik), 'nic nie zapisano');
    process.env.NICCI_SPRZEDAZ = 'TAK';
    const otwarta = require('./atrapa_backendu').createBackend();
    assert.equal(otwarta.catalog(NOW).data.sprzedaz, true);
  } finally {
    if (prev.s === undefined) delete process.env.NICCI_SPRZEDAZ; else process.env.NICCI_SPRZEDAZ = prev.s;
    if (prev.z === undefined) delete process.env.NICCI_ZAMOWIENIA; else process.env.NICCI_ZAMOWIENIA = prev.z;
    try { fs.unlinkSync(plik); } catch (e) { /* nie powstał */ }
  }
});

// ---------- quiz: site/js/dobor.js (październik 2026) ----------
function loadDobor() {
  const ctx = { window: {}, localStorage: { setItem() {} }, console };
  require('vm').createContext(ctx);
  require('vm').runInContext(require('fs').readFileSync(require('path').join(__dirname, '..', 'site', 'js', 'dobor.js'), 'utf8'), ctx);
  return ctx.window.NicciDobor;
}

test('quiz: profil filtruje, klimat główny wygrywa z dodatkowym, trójka bez dwóch wersji jednej linii', () => {
  const D = loadDobor();
  const cat = JSON.parse(JSON.stringify(be.buildCatalog_(productRows, setRows, {}, cfg, NOW)));
  const ona = D.recommend(cat, { profil: 'damski', klimat: ['kwiatowy'], pora: 'wieczór', sezon: 'chlodno', intensywnosc: 3 });
  assert.equal(ona.top.length, 3);
  assert.ok(ona.top.every((p) => p.profil !== 'męski'), 'dla niej bez zapachów męskich');
  assert.equal(D.klimaty(ona.top[0])[0], 'kwiatowy', 'pierwszy wynik ma kwiatowy jako klimat główny');
  const on = D.recommend(cat, { profil: 'meski', klimat: ['aromatyczny'], pora: 'wieczór', sezon: 'chlodno', intensywnosc: 3 });
  assert.ok(on.top.every((p) => p.profil !== 'damski'), 'dla niego bez zapachów damskich');
  assert.ok(on.top.filter((p) => /sauvage/i.test(p.nazwa)).length <= 1, 'najwyżej jeden Sauvage');
  assert.ok(on.top.every((p) => D.klimaty(p).includes('aromatyczny')));
  // dwa klimaty: w trójce jest przedstawiciel każdego
  const dwa = D.recommend(cat, { profil: 'unisex', klimat: ['cytrusowy', 'orientalny'], pora: 'uniwersalna', sezon: 'caly', intensywnosc: 2 });
  ['cytrusowy', 'orientalny'].forEach((k) => assert.ok(dwa.top.some((p) => D.klimaty(p).includes(k)), 'brak klimatu ' + k));
  // stara odpowiedź „swiezy” liczy się jak cytrusowy
  const stary = D.recommend(cat, { profil: 'unisex', klimat: ['swiezy'], pora: 'dzień', sezon: 'cieplo', intensywnosc: 2 });
  assert.ok(stary.top.every((p) => D.klimaty(p).includes('cytrusowy')));
});

test('quiz: bestseller przy podobnym dopasowaniu wyżej; zestaw tylko pasujący', () => {
  const D = loadDobor();
  const cat = JSON.parse(JSON.stringify(be.buildCatalog_(productRows, setRows, {}, cfg, NOW)));
  const r = D.recommend(cat, { profil: 'meski', klimat: ['cytrusowy'], pora: 'dzień', sezon: 'cieplo', intensywnosc: 2 });
  assert.ok(r.top[0].bestseller, 'pierwszy wynik to bestseller');
  assert.ok(r.set && r.set.sklad.filter((x) => D.klimaty(cat.products.find((p) => p.id === x.id) || {}).includes('cytrusowy')).length >= 3);
  const bez = D.recommend(cat, { profil: 'damski', klimat: ['orientalny', 'kwiatowy'], pora: 'wieczór', sezon: 'chlodno', intensywnosc: 3 });
  assert.equal(bez.set, null, 'żaden dostępny zestaw nie jest orientalno-kwiatowy');
  assert.equal(bez.partial, false);
});

test('quiz: „Dla niej” bez zapachów odbieranych jako męskie, „Dla niego” bez damskich; damskie wyżej', () => {
  const D = loadDobor();
  const cat = JSON.parse(JSON.stringify(be.buildCatalog_(productRows, setRows, {}, cfg, NOW)));
  assert.equal(cat.products.find((p) => p.id === 'p05').odbior, 'męski', 'Ombre Nomade odbierany jako męski');
  assert.equal(cat.products.find((p) => p.id === 'p86').odbior, '', 'odbior tylko przy unisex');
  let sprawdzone = 0;
  ['damski', 'meski'].forEach((profil) => {
    ['cytrusowy', 'aromatyczny', 'drzewny', 'slodki', 'orientalny', 'kwiatowy'].forEach((k) => {
      ['dzień', 'wieczór', 'uniwersalna'].forEach((pora) => {
        ['cieplo', 'chlodno', 'caly'].forEach((sezon) => {
          [1, 2, 3].forEach((intensywnosc) => {
            const r = D.recommend(cat, { profil, klimat: [k], pora, sezon, intensywnosc });
            const przeciwny = profil === 'damski' ? 'meski' : 'damski';
            assert.ok(r.top.every((p) => D.lean(p) !== przeciwny), profil + ' ' + k + ' ' + pora + ' ' + sezon + ' ' + intensywnosc + ': ' + r.top.map((p) => p.nazwa));
            sprawdzone++;
          });
        });
      });
    });
  });
  assert.equal(sprawdzone, 324);
  // przypadek z rozmowy z właścicielem: „Dla niej” bez Ombre Nomade i Ombré Leather
  const ona = D.recommend(cat, { profil: 'damski', klimat: ['orientalny', 'drzewny'], pora: 'wieczór', sezon: 'chlodno', intensywnosc: 3 });
  assert.ok(!ona.top.some((p) => p.id === 'p05' || p.id === 'p32'), ona.top.map((p) => p.nazwa).join(', '));
  assert.ok(ona.top.some((p) => p.profil === 'damski'), 'co najmniej jeden zapach damski');
  // katalog z arkusza sprzed aktualizacji (bez pola odbior): quiz bierze odbiór domyślny
  const stary = JSON.parse(JSON.stringify(cat));
  stary.products.forEach((p) => { delete p.odbior; });
  const onaStary = D.recommend(stary, { profil: 'damski', klimat: ['orientalny', 'drzewny'], pora: 'wieczór', sezon: 'chlodno', intensywnosc: 3 });
  deq(onaStary.top.map((p) => p.id), JSON.parse(JSON.stringify(ona.top.map((p) => p.id))), 'ten sam wynik bez pola odbior');
});

// ---------- jednorazowa aktualizacja arkusza właściciela (apps-script/Aktualizacja_2026_10.gs) ----------
/** Atrapa arkusza Google: siatka wartości z getRange/getValues/setValues/appendRow jak w Apps Script. */
function fakeSpreadsheet(tables) {
  const sheets = {};
  const makeSheet = (grid) => {
    const width = () => Math.max(0, ...grid.map((r) => r.length));
    const cell = (r, c) => (grid[r] && grid[r][c] !== undefined ? grid[r][c] : '');
    const put = (r, c, v) => { while (grid.length <= r) grid.push([]); while (grid[r].length < c) grid[r].push(''); grid[r][c] = v; };
    return {
      grid,
      getLastRow: () => grid.length,
      getLastColumn: width,
      getRange: (r, c, nr, nc) => ({
        getValues: () => Array.from({ length: nr || 1 }, (_, i) => Array.from({ length: nc || 1 }, (_, j) => cell(r - 1 + i, c - 1 + j))),
        setValues: (vals) => vals.forEach((row, i) => row.forEach((v, j) => put(r - 1 + i, c - 1 + j, v))),
        setValue: (v) => put(r - 1, c - 1, v),
        setFontWeight: () => {}
      }),
      appendRow: (row) => { grid.push(row.slice()); },
      setFrozenRows: () => {}
    };
  };
  Object.keys(tables).forEach((k) => { sheets[k] = makeSheet(tables[k].map((r) => r.slice())); });
  return {
    sheets,
    getSheetByName: (n) => sheets[n] || null,
    insertSheet: (n) => (sheets[n] = makeSheet([]))
  };
}

test('aktualizacja arkusza 2026-10: z importu wrześniowego i po poprzedniej aktualizacji wychodzi ten sam arkusz', () => {
  const fs = require('fs');
  const path = require('path');
  const vm = require('vm');
  const { execSync } = require('child_process');
  const code = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8') + '\n' +
    fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Aktualizacja_2026_10.gs'), 'utf8');
  const git = (rev) => JSON.parse(execSync('git show ' + rev + ':dev/dane/arkusz.json', { cwd: path.join(__dirname, '..') }).toString());
  const oczekiwane = JSON.parse(JSON.stringify(be.tableToObjects_(sheet.Produkty)));

  // dce7735: arkusz właściciela z importu (wrzesień, 71 pozycji); 4f18f5e: po poprzedniej wersji aktualizacji (100)
  ['dce7735', '4f18f5e'].forEach((rev) => {
    const ctx = { console, Intl, Date, JSON, Math, Logger: { log() {} }, CacheService: { getScriptCache: () => ({ remove() {} }) } };
    vm.createContext(ctx);
    vm.runInContext(code + '\n;this.SHEET = SHEET;', ctx, { filename: 'Aktualizacja_2026_10.gs' });
    const przed = git(rev);
    const head = przed.Produkty[0];
    const c = (n) => head.indexOf(n);
    const wiersz = (id) => przed.Produkty.find((r) => r[0] === id);
    wiersz('p03')[c('cena_10')] = 999;                 // zmiana właściciela: zostaje
    wiersz('p42')[c('podobne')] = 'p01, p02';          // ręczna lista podobnych: zostaje
    wiersz('p21')[c('ml_dostepne')] = 35;              // stan prowadzony przez właściciela: zostaje
    if (c('klimat') !== -1) wiersz('p05')[c('klimat')] = 'drzewny'; // własny klimat (po poprzedniej aktualizacji)
    const ss = fakeSpreadsheet({ [ctx.SHEET.PRODUKTY]: przed.Produkty, [ctx.SHEET.ZESTAWY]: przed.Zestawy, [ctx.SHEET.LOG]: [['czas', 'poziom', 'zdarzenie', 'szczegoly']] });
    ctx.SpreadsheetApp = { getActiveSpreadsheet: () => ss };

    const opis = vm.runInContext('aktualizacja_2026_10()', ctx);
    assert.match(opis, rev === 'dce7735' ? /Produkty: dopisane 29, uzupełnione puste wiersze 1/ : /Produkty: dopisane 0, uzupełnione puste wiersze 0/, rev);
    assert.match(opis, /zostawione Twoje wpisy: [^.]*p03\.cena_10/, rev);
    assert.match(opis, /p42\.podobne/, rev);
    assert.doesNotMatch(opis, /ml_dostepne/, rev);

    const byId = Object.fromEntries(JSON.parse(JSON.stringify(be.tableToObjects_(ss.sheets[ctx.SHEET.PRODUKTY].grid))).map((p) => [p.id, p]));
    assert.equal(Object.keys(byId).length, 100, rev);
    const wlasne = { p03: ['cena_10'], p42: ['podobne'], p21: ['ml_dostepne'], p05: c('klimat') !== -1 ? ['klimat'] : [] };
    oczekiwane.forEach((e) => {
      Object.keys(e).forEach((k) => { if ((wlasne[e.id] || []).indexOf(k) === -1) assert.deepEqual(byId[e.id][k], e[k], rev + ' ' + e.id + '.' + k); });
    });
    assert.equal(byId.p03.cena_10, 999);
    assert.equal(byId.p42.podobne, 'p01, p02');
    assert.equal(byId.p21.ml_dostepne, 35);
    const z04 = ss.sheets[ctx.SHEET.ZESTAWY].grid.find((r) => r[0] === 'z04').join('|');
    assert.ok(/p98:5/.test(z04) && !/p34:/.test(z04), rev + ' Sweet & Spicy z Wet Cherry Liquor');

    // drugie uruchomienie niczego nie zmienia
    const drugi = vm.runInContext('aktualizacja_2026_10()', ctx);
    assert.match(drugi, /Produkty: dopisane 0, uzupełnione puste wiersze 0, zmienione komórki 0/, rev);
    assert.match(drugi, /Zestawy: dopisane 0, uzupełnione puste wiersze 0, zmienione komórki 0/, rev);

    // katalog z zaktualizowanego arkusza: bestsellery, nowości i odbiór na miejscu
    const cat = be.buildCatalog_(be.tableToObjects_(withPlaceholderStock(ss.sheets[ctx.SHEET.PRODUKTY].grid, 100)), be.tableToObjects_(ss.sheets[ctx.SHEET.ZESTAWY].grid), {}, cfg, NOW);
    assert.equal(cat.products.length, 94, rev);
    assert.equal(cat.products.filter((p) => p.bestseller).length, 12, rev);
    deq(cat.products.filter((p) => p.nowosc).map((p) => p.id).sort(), ['p54', 'p81', 'p94'], rev);
    assert.equal(cat.products.find((p) => p.id === 'p32').odbior, 'męski', rev);
    assert.ok(cat.sets.find((z) => z.id === 'z04').available, rev + ' Sweet & Spicy dostępny');
  });
});

test('zdjęcia: lista w app.js zgadza się z plikami, puste zdjecie z arkusza dostaje plik ze strony', () => {
  const fs = require('fs'), path = require('path');
  const site = path.join(__dirname, '..', 'site');
  const src = fs.readFileSync(path.join(site, 'js', 'app.js'), 'utf8');
  const lista = src.match(/var ZDJECIA = '([^']*)'/)[1].split(' ').map((n) => 'p' + n);
  const pliki = fs.readdirSync(path.join(site, 'img', 'produkty')).filter((f) => /^p\d+-800\.webp$/.test(f)).map((f) => f.split('-')[0]);
  deq(lista.slice().sort(), pliki.slice().sort());
  lista.forEach((id) => assert.ok(fs.existsSync(path.join(site, 'img', 'produkty', id + '-400.webp')), id + '-400.webp'));
  // każdy aktywny zapach z arkusza ma plik, więc pusta komórka zdjecie_url nie zostawia kadru zastępczego
  const cat = be.buildCatalog_(productRows, setRows, {}, cfg, NOW);
  const bez = cat.products.filter((p) => lista.indexOf(p.id) === -1).map((p) => p.id);
  deq(bez, []);
  // ta sama funkcja co w przeglądarce: uzupełnia tylko puste pole
  const withPhotos = new Function('ZDJECIA', 'return ' + src.match(/function withPhotos\(data\) \{[\s\S]*?\n  \}/)[0])(lista.map((id) => id.slice(1)));
  const d = withPhotos({ products: [{ id: 'p83', zdjecie: '' }, { id: 'p98' }, { id: 'p44', zdjecie: '/img/inne.webp' }, { id: 'p999', zdjecie: '' }] });
  deq(d.products.map((p) => p.zdjecie), ['/img/produkty/p83-800.webp', '/img/produkty/p98-800.webp', '/img/inne.webp', '']);
});

(async () => {
  for (const [name, fn] of tests) {
    try { await fn(); passed++; console.log('ok   ' + name); } catch (e) { console.log('FAIL ' + name + '\n     ' + e.message); process.exitCode = 1; }
  }
  console.log(`\n${passed}/${tests.length} testów przeszło`);
})();
