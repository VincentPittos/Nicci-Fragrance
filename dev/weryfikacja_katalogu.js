#!/usr/bin/env node
// Weryfikacja nut i opisów (listopad 2026, decyzja 86): z dev/dane/weryfikacja_2026_11.json robi trzy rzeczy.
//   1. site/js/korekty-katalogu.js: poprawki dla strony. Strona podmienia opis, nuty i osiągi zapachu tylko wtedy,
//      gdy katalog z arkusza ma jeszcze dokładnie stary tekst (skrót FNV-1a starych wartości), więc po aktualizacji
//      arkusza albo po zmianie właściciela poprawka sama przestaje działać.
//   2. apps-script/Korekta_2026_11.gs: jednorazowa funkcja dla arkusza sklepu. Działa ze starym Code.gs (używa
//      tylko ss_, headerMap_, str_, log_, invalidateCatalog_). Zmienia komórkę tylko, gdy stoi w niej stary tekst.
//   3. dev/dane/arkusz.json: te same poprawki w danych repozytorium (tam, gdzie stoi stary tekst).
// Przy pierwszym uruchomieniu wpisuje do pliku weryfikacji wartości „przed” z dev/dane/arkusz.json i dalej z nich
// korzysta, więc kolejne uruchomienia dają ten sam wynik.
//
//   node dev/weryfikacja_katalogu.js
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, loadBackend } = require('./wspolne');

const be = loadBackend();
const PLIK = path.join(ROOT, 'dev', 'dane', 'weryfikacja_2026_11.json');
const ARKUSZ = path.join(ROOT, 'dev', 'dane', 'arkusz.json');
const POLA = ['opis', 'nuty_glowy', 'nuty_serca', 'nuty_bazy', 'trwalosc', 'projekcja', 'intensywnosc', 'rodzina'];

/** FNV-1a 32-bit po jednostkach UTF-16, tak samo jak korekty() w site/js/app.js. */
function fnv(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}

/** Intensywność do quizu z projekcji, jak intensywnosc_z_projekcji w dev/konwersja_arkusza.py. */
function intensywnosc(proj) { return proj <= 2.5 ? 1 : proj <= 3.5 ? 2 : 3; }

/** Wartość pola w postaci, w jakiej podaje ją katalog (API), z wiersza arkusza. */
function wApi(row, pole) {
  const p = be.productFromRow_(row);
  return { opis: p.opis, nuty_glowy: p.nuty.glowy, nuty_serca: p.nuty.serca, nuty_bazy: p.nuty.bazy,
    trwalosc: p.trwalosc, projekcja: p.projekcja, intensywnosc: p.intensywnosc, rodzina: p.rodzina }[pole];
}

const tekst = (v) => (v === null || v === undefined ? '' : String(v).trim());

/**
 * Z danych weryfikacji i arkusza (obiekt jak dev/dane/arkusz.json) buduje treść obu plików i nakłada poprawki na ark.
 * Uzupełnia brakujące „przed” w dane. Zwraca { korektyJs, gs, korekty, wRepo, uzupelnione }.
 */
function zbuduj(dane, ark) {
  const head = ark.Produkty[0];
  const byId = {};
  ark.Produkty.slice(1).forEach((r) => { byId[r[0]] = r; });
  const obiekt = (r) => Object.fromEntries(head.map((k, i) => [k, r[i]]));
  let uzupelnione = 0;

  dane.zapachy.forEach((z) => {
    const r = byId[z.id];
    if (!r) throw new Error('brak ' + z.id + ' w arkusz.json');
    if (z.po.projekcja !== undefined && z.po.intensywnosc === undefined) z.po.intensywnosc = intensywnosc(Number(z.po.projekcja));
    Object.keys(z.po).forEach((k) => { if (POLA.indexOf(k) === -1) throw new Error(z.id + ': nieznane pole ' + k); });
    if (!z.przed) {
      z.przed = {};
      Object.keys(z.po).forEach((k) => { z.przed[k] = r[head.indexOf(k)]; });
      uzupelnione++;
    }
    // bez zmian, które niczego nie zmieniają
    Object.keys(z.po).forEach((k) => { if (tekst(z.po[k]) === tekst(z.przed[k])) { delete z.po[k]; delete z.przed[k]; } });
  });

  // 1. strona
  const korekty = dane.zapachy.filter((z) => Object.keys(z.po).length).map((z) => {
    const pola = Object.keys(z.po).sort((a, b) => POLA.indexOf(a) - POLA.indexOf(b));
    const przedRow = Object.assign(obiekt(byId[z.id]), z.przed);
    const poRow = Object.assign(obiekt(byId[z.id]), z.po);
    const nowe = {};
    pola.forEach((k) => { nowe[k] = wApi(poRow, k); });
    return { id: z.id, h: fnv(JSON.stringify(pola.map((k) => wApi(przedRow, k)))), pola: pola, nowe: nowe };
  });
  const korektyJs =
    '/* NICCI: poprawki nut i opisów z weryfikacji ' + dane.data + ' (decyzja 86). Generuje dev/weryfikacja_katalogu.js\n' +
    '   z dev/dane/weryfikacja_2026_11.json; nie edytuj ręcznie. site/js/app.js podmienia pola zapachu tylko wtedy, gdy\n' +
    '   katalog z arkusza ma jeszcze stare wartości (skrót h), więc po aktualizacji arkusza poprawki same wygasają. */\n' +
    'window.NicciKorekty = ' + JSON.stringify(korekty) + ';\n';

  // 2. arkusz sklepu (Apps Script)
  const dlaArkusza = dane.zapachy.filter((z) => Object.keys(z.po).length).map((z) => ({
    id: z.id, nazwa: z.nazwa, pola: Object.fromEntries(Object.keys(z.po).map((k) => [k, [z.przed[k], z.po[k]]]))
  }));
  const gs = `/**
 * NICCI: poprawki nut i opisów z weryfikacji ${dane.data} (decyzja 86). Wygenerowane przez dev/weryfikacja_katalogu.js.
 *
 * Uruchom raz funkcję korekta_2026_11 z edytora Apps Script. Nie wymaga nowego Code.gs ani nowego wdrożenia:
 * zmienia tylko komórki w zakładce Produkty, a strona czyta je przy każdym odświeżeniu katalogu (do 5 minut).
 * Komórkę zmienia tylko wtedy, gdy stoi w niej dokładnie stary tekst. Twoje własne zmiany zostają, a ich lista
 * trafia do zakładki Log. Ponowne uruchomienie niczego nie psuje. Po uruchomieniu ten plik można usunąć.
 */
const KOREKTA_2026_11 = ${JSON.stringify(dlaArkusza, null, 1)};

function korekta_2026_11() {
  const sh = ss_().getSheetByName(SHEET.PRODUKTY);
  const H = headerMap_(sh);
  const n = sh.getLastRow() - 1;
  const ids = n > 0 ? sh.getRange(2, H.id, n, 1).getValues().map(function (r) { return str_(r[0]); }) : [];
  let zmienione = 0, juz = 0;
  const zostawione = [], brak = [];
  KOREKTA_2026_11.forEach(function (z) {
    const i = ids.indexOf(z.id);
    if (i === -1) { brak.push(z.id); return; }
    Object.keys(z.pola).forEach(function (k) {
      if (!H[k]) { zostawione.push(z.id + '.' + k + ' (brak kolumny)'); return; }
      const cell = sh.getRange(i + 2, H[k]);
      const obecna = str_(cell.getValue());
      if (obecna === str_(z.pola[k][1])) { juz++; return; }
      if (obecna !== str_(z.pola[k][0])) { zostawione.push(z.id + '.' + k); return; }
      cell.setValue(z.pola[k][1]);
      zmienione++;
    });
  });
  invalidateCatalog_();
  const tekst = 'Poprawki nut i opisów: zmienione komórki ' + zmienione + ' w ' + KOREKTA_2026_11.length + ' zapachach' +
    (juz ? ', już poprawne ' + juz : '') +
    (zostawione.length ? '; zostawione Twoje wpisy: ' + zostawione.join(', ') : '') +
    (brak.length ? '; nie ma w arkuszu: ' + brak.join(', ') : '') + '.';
  log_('INFO', 'korekta_2026_11', tekst);
  return tekst;
}
`;

  // 3. dane repozytorium
  let wRepo = 0;
  dane.zapachy.forEach((z) => {
    const r = byId[z.id];
    Object.keys(z.po).forEach((k) => {
      const i = head.indexOf(k);
      if (tekst(r[i]) === tekst(z.przed[k])) { r[i] = z.po[k]; wRepo++; }
    });
  });
  return { korektyJs, gs, korekty, wRepo, uzupelnione };
}

function main() {
  const dane = JSON.parse(fs.readFileSync(PLIK, 'utf8'));
  const raw = fs.readFileSync(ARKUSZ, 'utf8');
  const ark = JSON.parse(raw);
  const w = zbuduj(dane, ark);
  if (w.uzupelnione) fs.writeFileSync(PLIK, JSON.stringify(dane, null, 1) + '\n');
  fs.writeFileSync(path.join(ROOT, 'site', 'js', 'korekty-katalogu.js'), w.korektyJs);
  fs.writeFileSync(path.join(ROOT, 'apps-script', 'Korekta_2026_11.gs'), w.gs);
  fs.writeFileSync(ARKUSZ, JSON.stringify(ark, null, 1) + (raw.endsWith('\n') ? '\n' : ''));
  console.log('zapachów z poprawkami:', w.korekty.length, '| komórek w arkusz.json zmienionych teraz:', w.wRepo,
    '| pliki: site/js/korekty-katalogu.js, apps-script/Korekta_2026_11.gs');
}

if (require.main === module) main();
module.exports = { fnv, intensywnosc, zbuduj, POLA };
