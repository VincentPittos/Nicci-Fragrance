#!/usr/bin/env node
// Dane podglądu etapu 2: sześć produktów z dev/catalog.mock.json. Stany demonstracyjne są jawnie oznaczone.
'use strict';
const fs = require('fs');
const path = require('path');
const cat = require('../catalog.mock.json').data;
const ids = ['p01', 'p45', 'p08', 'p43', 'p21', 'p34'];
const products = ids.map((id) => JSON.parse(JSON.stringify(cat.products.find((p) => p.id === id))));
const demo = [];
// niski stan i niedostępny wariant tylko do pokazania wyglądu, w danych ich nie ma
const p01 = products[0]; p01.malo = true; p01.zostalo = 22; demo.push('p01: niski stan 22 ml');
const p43 = products[3]; const v20 = p43.variants.find((v) => v.ml === 20); if (v20) { v20.available = false; demo.push('p43: 20 ml chwilowo niedostępne'); }
const nazwy = {};
cat.products.forEach((p) => { nazwy[p.id] = p.marka + ' ' + p.nazwa; });
const out = '// Wygenerowane przez dev/etap-2/zbuduj_dane.js\nwindow.PODGLAD = ' +
  JSON.stringify({ products, demo, nazwy }) + ';\n';
fs.writeFileSync(path.join(__dirname, 'dane.js'), out);
console.log('dane.js:', products.map((p) => p.id + ' ' + p.variants.map((v) => v.ml).join('/')).join(', '));
