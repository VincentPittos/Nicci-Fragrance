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
  assert.equal(c.products.length, 64);
  const p01 = c.products.find((p) => p.id === 'p01');
  deq(p01.variants.map((v) => [v.ml, v.price]), [[5, 11000], [10, 19000], [20, 36000]]);
  const p21 = c.products.find((p) => p.id === 'p21');
  deq(p21.variants.map((v) => v.ml), [10, 20]);
  assert.ok(!c.products.some((p) => p.id === 'p56'), 'pozycja bez nazwy nie trafia do katalogu');
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
  const sweet = c.sets.find((s) => s.id === 'z04');
  assert.equal(sweet.available, false);
  deq(sweet.sklad.filter((x) => !x.available).map((x) => x.nazwa), ['Lost Cherry']);
  assert.equal(sweet.cenaOsobno, null);
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
  assert.equal(be.priceOrder_([{ type: 'decant', id: 'p99', ml: 5, qty: 1 }], 'paczkomat', productRows, setRows, {}, cfg).error, 'invalid_item');
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
    const t = be.TEMPLATES[k](order, c, k === 'klientWyslane' ? 'ABC123' : []);
    assert.ok(!/<script>/.test(t.html), k + ': surowy HTML klienta w mailu');
    assert.ok(!/[–—]/.test(t.text + t.subject), k + ': półpauza albo pauza w treści');
  });
  const nowe = be.TEMPLATES.klientNowe(order, c);
  assert.match(nowe.text, /Tytuł: NF0101/);
  assert.match(nowe.text, /12 3456 7890 1234 5678 9012 3456/);
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

test('diagnostyka: wykrywa puste CONFIG i brak stanów w imporcie', () => {
  const d = be.diagnoza_(be.tableToObjects_(sheet.Produkty), setRows, be.CONFIG);
  const msgs = d.map((x) => x[1]).join('\n');
  assert.match(msgs, /CONFIG\.OWNER_EMAIL nie jest uzupełnione/);
  assert.match(msgs, /ml_dostepne nie jest uzupełnione/);
});

// ---------- zgodność z nicci-api.js (bez zmian w module) ----------
test('nicci-api.js: katalog, filtry, grupowanie, quiz i koszyk działają na danych z backendu', async () => {
  const catalog = be.buildCatalog_(productRows, setRows, {}, cfg, NOW);
  const body = JSON.stringify({ ok: true, data: catalog });
  const { Nicci } = loadFrontApi(async () => ({ json: async () => JSON.parse(body) }));
  const cat = await Nicci.fetchCatalog();
  assert.equal(cat.products.length, 64);

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
  assert.equal(slodki.set, null, 'Sweet & Spicy jest niedostępny, więc quiz go nie proponuje');

  Nicci.cart.addDecant('p01', 10);
  Nicci.cart.addDecant('p01', 10);
  Nicci.cart.addSet('z01');
  const sum = Nicci.cart.summary(cat, 'paczkomat');
  assert.equal(sum.subtotal, 19000 * 2 + 55000);
  assert.equal(sum.shipping, 0);
  assert.equal(Nicci.cart.count(), 3);
});

(async () => {
  for (const [name, fn] of tests) {
    try { await fn(); passed++; console.log('ok   ' + name); } catch (e) { console.log('FAIL ' + name + '\n     ' + e.message); process.exitCode = 1; }
  }
  console.log(`\n${passed}/${tests.length} testów przeszło`);
})();
