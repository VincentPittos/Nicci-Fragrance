#!/usr/bin/env node
// Buduje dev/catalog.mock.json funkcją buildCatalog_ z apps-script/Code.gs, na danych z dev/dane/arkusz.json.
// Dzięki temu mock ma dokładnie ten kształt, który zwróci backend.
// Stan magazynu: źródło go nie ma, więc aktywne pozycje z pustym ml_dostepne dostają zastępcze 100 ml.
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, loadBackend, readSheetJson, devConfig, withPlaceholderStock } = require('./wspolne');

const ML_ZASTEPCZE = 100;
const be = loadBackend();
const sheet = readSheetJson();
const products = be.tableToObjects_(withPlaceholderStock(sheet.Produkty, ML_ZASTEPCZE));
const sets = be.tableToObjects_(sheet.Zestawy);
const cfg = devConfig(be.CONFIG);
const catalog = be.buildCatalog_(products, sets, {}, cfg, new Date('2026-09-23T12:00:00Z'));

const out = {
  ok: true,
  _dev: 'Mock z dev/zbuduj_mock.js. ml_dostepne zastępczo ' + ML_ZASTEPCZE +
    ' ml, koszty dostawy przykładowe (14,99 / 19,99 zł, darmowa od 200 zł). Nie są to dane produkcyjne.',
  data: catalog
};
fs.writeFileSync(path.join(ROOT, 'dev', 'catalog.mock.json'), JSON.stringify(out, null, 1));
console.log('catalog.mock.json: produkty', catalog.products.length, 'zestawy', catalog.sets.length,
  'bajtów', JSON.stringify(out).length);
