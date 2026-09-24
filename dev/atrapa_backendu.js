// Atrapa backendu do podglądu i testów: te same funkcje z apps-script/Code.gs (walidacja, wycena, stany,
// rezerwacje, numeracja, odpowiedź), tylko zamiast arkusza i maili jest plik z zamówieniami.
//
//   echo '{"method":"GET","query":"action=catalog"}' | node dev/atrapa_backendu.js
//   echo '{"method":"POST","body":"{...}"}' | node dev/atrapa_backendu.js
// Zmienne: NICCI_STAN="p06=5,p07=0" nadpisuje ml_dostepne (test braków), NICCI_ZAMOWIENIA=plik.json,
// NICCI_BONY='[{"kod":"...","kwota":50,"prog":199,"wazny_do":"2099-12-31"}]' zamiast bonów testowych niżej.
// Dane przykładowe (BLIK, konto, odbiorca) są wyłącznie do podglądu i nie trafiają do Code.gs.
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, loadBackend, readSheetJson, devConfig } = require('./wspolne');

const ORDERS_FILE = process.env.NICCI_ZAMOWIENIA || path.join(ROOT, 'dev', 'zamowienia-dev.json');
// Bony do podglądu: ważny, drugi ważny (np. do testu progu) i po terminie. wykorzystany_w wynika z pliku zamówień.
const BONY = process.env.NICCI_BONY ? JSON.parse(process.env.NICCI_BONY) : [
  { kod: 'NF-TEST-BON1', kwota: 50, prog: 199, wazny_do: '2099-12-31' },
  { kod: 'NF-TEST-BON2', kwota: 50, prog: 199, wazny_do: '2099-12-31' },
  { kod: 'NF-TEST-STARY', kwota: 50, prog: 199, wazny_do: '2020-01-01' }
];

function stockOverrides(values) {
  const spec = process.env.NICCI_STAN || '';
  if (!spec) return values;
  const head = values[0];
  const iId = head.indexOf('id'), iMl = head.indexOf('ml_dostepne');
  const map = {};
  spec.split(',').forEach((p) => { const [id, ml] = p.split('='); if (id) map[id.trim()] = Number(ml); });
  return values.map((r, i) => (i && r[iId] in map ? Object.assign(r.slice(), { [iMl]: map[r[iId]] }) : r));
}

function createBackend() {
  const be = loadBackend();
  const cfg = devConfig(be.CONFIG);
  Object.assign(cfg, {
    BLIK_PHONE: '500 600 700', BANK_ACCOUNT: '12102012340000123456789012',
    RECIPIENT: 'Nicci Fragrance (dane przykładowe)', SITE_URL: 'http://127.0.0.1:8766'
  });
  const sheet = readSheetJson();
  // stany jak w arkuszu właściciela: puste ml_dostepne = bez limitu, 0 = wyprzedane; NICCI_STAN nadpisuje wybrane
  const productRows = be.tableToObjects_(stockOverrides(sheet.Produkty));
  const setRows = be.tableToObjects_(sheet.Zestawy);
  let orders = [];
  try { orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')); } catch (e) { orders = []; }
  const rows = () => orders.map((o) => Object.assign({}, o, { rezerwacja_do: new Date(o.rezerwacja_do) }));

  function catalog(now) {
    return { ok: true, data: JSON.parse(JSON.stringify(be.buildCatalog_(productRows, setRows, be.reservedMl_(rows(), now), cfg, now))) };
  }

  function createOrder(body, now) {
    if (String(body.website || '') !== '') return { ok: false, error: 'server_error' };
    const v = be.validateOrder_(body, cfg);
    if (!v.ok) return { ok: false, error: 'validation', fields: Array.from(v.fields) };
    const d = v.data;
    const priced = be.priceOrder_(d.items, d.delivery.method, productRows, setRows, be.reservedMl_(rows(), now), cfg);
    if (!priced.ok) return JSON.parse(JSON.stringify({ ok: false, error: priced.error, shortages: priced.shortages }));
    let voucher = null;
    if (d.voucher) {
      const bonRows = BONY.map((b, i) => {
        const last = orders.filter((o) => o.bon === b.kod).pop();
        return Object.assign({ _row: i + 2, wykorzystany_w: last ? last.numer : '' }, b);
      });
      voucher = be.checkVoucher_(d.voucher, bonRows, rows(), priced.subtotal, now, cfg);
      if (!voucher.ok) return JSON.parse(JSON.stringify({ ok: false, error: 'validation', fields: ['voucher'], voucher }));
    }
    const rabat = voucher ? voucher.rabat : 0;
    const order = {
      numer: be.nextOrderNumber_(orders, cfg), created: now,
      until: new Date(now.getTime() + cfg.RESERVATION_HOURS * 3600 * 1000),
      customer: d.customer, delivery: d.delivery, payment: d.payment, note: d.note, src: d.src, quiz: d.quiz,
      lines: priced.lines, need: priced.need, subtotal: priced.subtotal, shipping: priced.shipping,
      bon: voucher ? voucher.kod : '', rabat, total: priced.total - rabat
    };
    orders.push({
      numer: order.numer, status: 'NOWE', rezerwacja_do: order.until.toISOString(), ml_json: JSON.stringify(order.need),
      bon: order.bon, rabat: rabat / 100,
      email: d.customer.email, kwota: order.total / 100, src: d.src, quiz: d.quiz, pozycje: order.lines.map((l) => l.nazwa + ' ' + l.opis + ' x' + l.ilosc).join('; ')
    });
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 1));
    return JSON.parse(JSON.stringify(be.orderResponse_(order, cfg)));
  }

  return { catalog, createOrder, cfg };
}

module.exports = { createBackend };

if (require.main === module) {
  let input = '';
  process.stdin.on('data', (c) => { input += c; });
  process.stdin.on('end', () => {
    const req = JSON.parse(input || '{}');
    const api = createBackend();
    const now = new Date();
    let res;
    try {
      if (req.method === 'POST') {
        const raw = req.body || '';
        if (!raw || raw.length > 20000) res = { ok: false, error: 'server_error' };
        else {
          let body = null;
          try { body = JSON.parse(raw); } catch (e) { body = null; }
          res = !body ? { ok: false, error: 'server_error' } : body.action === 'createOrder' ? api.createOrder(body, now) : { ok: false, error: 'unknown_action' };
        }
      } else {
        const q = new URLSearchParams(req.query || '');
        res = q.get('action') === 'catalog' ? api.catalog(now) : q.get('action') === 'ping' ? { ok: true } : { ok: false, error: 'unknown_action' };
      }
    } catch (e) {
      res = { ok: false, error: 'server_error', dev: String(e && e.stack || e) };
    }
    process.stdout.write(JSON.stringify(res));
  });
}
