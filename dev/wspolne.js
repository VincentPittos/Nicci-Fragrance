// Wspólne narzędzia skryptów deweloperskich: ładowanie Code.gs i nicci-api.js poza Google i przeglądarką.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

/** Ładuje apps-script/Code.gs w piaskownicy. Zwraca kontekst z funkcjami i CONFIG. */
function loadBackend() {
  const code = fs.readFileSync(path.join(ROOT, 'apps-script', 'Code.gs'), 'utf8');
  const ctx = { console, Intl, Date, JSON, Math };
  vm.createContext(ctx);
  vm.runInContext(code + '\n;this.CONFIG = CONFIG; this.TEMPLATES = TEMPLATES; this.STATUS = STATUS;', ctx,
    { filename: 'Code.gs' });
  return ctx;
}

/** Ładuje site/nicci-api.js z atrapą przeglądarki. fetchImpl dostaje (url, opts). */
function loadFrontApi(fetchImpl) {
  const code = fs.readFileSync(path.join(ROOT, 'site', 'nicci-api.js'), 'utf8');
  const store = {};
  const localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
  const window = {};
  const ctx = {
    window, localStorage, fetch: fetchImpl, console, URLSearchParams,
    location: { search: '', href: '' }, navigator: {}, Promise
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'nicci-api.js' });
  return { Nicci: window.Nicci, store };
}

function readSheetJson() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'dev', 'dane', 'arkusz.json'), 'utf8'));
}

/** Konfiguracja deweloperska: przykładowe koszty dostawy, żeby mock dało się przeklikać. */
function devConfig(base) {
  return Object.assign({}, base, {
    IG_HANDLE: 'UZUPELNIJ',
    SHIPPING: { paczkomat: 14.99, kurier: 19.99 },
    FREE_SHIPPING_FROM: 200
  });
}

/** Wiersze arkusza z zastępczym stanem dla aktywnych pozycji z pustym ml_dostepne. */
function withPlaceholderStock(values, ml) {
  const head = values[0];
  const iMl = head.indexOf('ml_dostepne');
  const iAkt = head.indexOf('aktywny');
  return values.map((row, i) => {
    if (i === 0) return row.slice();
    const r = row.slice();
    if (r[iAkt] === 'TAK' && (r[iMl] === '' || r[iMl] === null)) r[iMl] = ml;
    return r;
  });
}

module.exports = { ROOT, loadBackend, loadFrontApi, readSheetJson, devConfig, withPlaceholderStock };
