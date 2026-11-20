/**
 * NICCI: podwyżka cen o 5% (listopad 2026, decyzja 114).
 *
 * Uruchom raz funkcję ceny_2026_11 z edytora Apps Script. Działa z obecnym Code.gs i nie wymaga nowego
 * wdrożenia: strona pokaże nowe ceny przy następnym odświeżeniu katalogu (do 5 minut).
 *   Produkty: cena_5, cena_10 i cena_20 razy 1,05, zaokrąglone zawsze w górę do pełnych 10 zł, np. 80 → 84 → 90,
 *             145 → 152,25 → 160, 200 → 210. Ceny 50, 60, 70, 80 i 90 zł razy 1,10 zamiast 1,05 (50 → 60, 90 → 100).
 *             Ceny powyżej 280 zł zostają bez zmian (decyzja 114).
 *   Zestawy:  kolumna cena tak samo, poza NICCI ESSENTIALS (zostaje 99 zł, cena z kampanii −99%).
 * Puste komórki (pojemność nie w sprzedaży) zostają puste. Kolumny promocji i stanów bez zmian.
 * Przed zmianą skrypt zapisuje stare ceny w nowej zakładce „Ceny przed 2026-11”. Gdy ta zakładka już istnieje,
 * niczego nie zmienia (drugie uruchomienie nie podnosi cen drugi raz). ceny_2026_11_cofnij przywraca ceny
 * z tej zakładki i usuwa ją. Wynik trafia do zakładki Log.
 */
const CENY_2026_11 = { MNOZNIK_PROMIL: 1050, ZAOKRAGLENIE: 10, MAKS_CENA: 280, CENY_PLUS_10: [50, 60, 70, 80, 90], MNOZNIK_PLUS_10: 1100,
  POMIN_ZESTAWY: ['essentials'], ZAKLADKA: 'Ceny przed 2026-11' };

/**
 * 80 → 88 → 90 (+10%); 145 → 152,25 → 160; 200 → 210 (dokładnie 210, bez dodatkowych 10 zł); powyżej MAKS_CENA bez zmian.
 * Tolerancja 1e-9 chroni przed błędem zapisu ułamków (210,00000001 nie może dać 220).
 */
function cena2026_11_(v) {
  const k = CENY_2026_11;
  if (v > k.MAKS_CENA) return v;
  const promil = k.CENY_PLUS_10.indexOf(v) !== -1 ? k.MNOZNIK_PLUS_10 : k.MNOZNIK_PROMIL;
  return Math.ceil(v * promil / (1000 * k.ZAOKRAGLENIE) - 1e-9) * k.ZAOKRAGLENIE;
}

function liczbaCeny2026_11_(v) {
  const s = str_(v).replace(/\s/g, '').replace(',', '.');
  const n = s === '' ? NaN : Number(s);
  return isFinite(n) && n > 0 ? n : null;
}

function ceny_2026_11() {
  const k = CENY_2026_11;
  const ss = ss_();
  if (ss.getSheetByName(k.ZAKLADKA)) {
    const t = 'Zakładka „' + k.ZAKLADKA + '” już jest, więc ceny były podniesione. Nic nie zmieniono.';
    log_('INFO', 'ceny_2026_11', t);
    return t;
  }
  const plan = [
    { sheet: ss.getSheetByName(SHEET.PRODUKTY), typ: 'produkt', pola: ['cena_5', 'cena_10', 'cena_20'] },
    { sheet: ss.getSheetByName(SHEET.ZESTAWY), typ: 'zestaw', pola: ['cena'] }
  ];
  const kopia = [['typ', 'id', 'pole', 'cena', 'nowa']];
  const zmiany = [];
  let zmienione = 0, bez = 0, powyzej = 0;
  plan.forEach(function (p) {
    if (!p.sheet) throw new Error('Brak zakładki dla: ' + p.typ);
    const H = headerMap_(p.sheet);
    const n = p.sheet.getLastRow() - 1;
    if (n < 1) return;
    const ids = p.sheet.getRange(2, H.id, n, 1).getValues();
    p.pola.forEach(function (pole) {
      if (!H[pole]) throw new Error('W zakładce brakuje kolumny ' + pole);
      const kol = p.sheet.getRange(2, H[pole], n, 1).getValues();
      kol.forEach(function (r, i) {
        const id = str_(ids[i][0]);
        const stara = liczbaCeny2026_11_(r[0]);
        if (!id || stara === null) return;
        if (p.typ === 'zestaw' && k.POMIN_ZESTAWY.indexOf(id) !== -1) return;
        if (stara > k.MAKS_CENA) { powyzej++; return; }
        const nowa = cena2026_11_(stara);
        kopia.push([p.typ, id, pole, r[0], nowa]);
        if (nowa === stara) { bez++; return; }
        zmiany.push({ sheet: p.sheet, row: i + 2, col: H[pole], nowa: nowa });
        zmienione++;
      });
    });
  });
  // najpierw kopia, potem zmiany: przerwane uruchomienie zostawia zakładkę, z której ceny_2026_11_cofnij przywraca
  const bk = ss.insertSheet(k.ZAKLADKA);
  bk.getRange(1, 1, kopia.length, kopia[0].length).setValues(kopia);
  zmiany.forEach(function (z) { z.sheet.getRange(z.row, z.col).setValue(z.nowa); });
  invalidateCatalog_();
  const t = 'Ceny +5%, w górę do pełnych 10 zł: zmienione ' + zmienione + ', powyżej ' + k.MAKS_CENA + ' zł bez zmian ' + powyzej +
    (bez ? ', bez zmiany po zaokrągleniu ' + bez : '') + ' (NICCI ESSENTIALS bez zmian). Stare ceny w zakładce „' + k.ZAKLADKA + '”.';
  log_('INFO', 'ceny_2026_11', t);
  return t;
}

/** Przywraca ceny z zakładki „Ceny przed 2026-11” (tylko tam, gdzie w arkuszu nadal stoi cena z podwyżki). */
function ceny_2026_11_cofnij() {
  const k = CENY_2026_11;
  const ss = ss_();
  const bk = ss.getSheetByName(k.ZAKLADKA);
  if (!bk) return 'Nie ma zakładki „' + k.ZAKLADKA + '”, więc nie ma czego cofać.';
  const sheets = { produkt: ss.getSheetByName(SHEET.PRODUKTY), zestaw: ss.getSheetByName(SHEET.ZESTAWY) };
  const rows = tableToObjects_(bk.getDataRange().getValues());
  const cache = {};
  let cofniete = 0;
  const zostawione = [];
  rows.forEach(function (r) {
    const sh = sheets[str_(r.typ)];
    if (!sh) return;
    const key = str_(r.typ);
    if (!cache[key]) {
      const H = headerMap_(sh);
      const n = sh.getLastRow() - 1;
      cache[key] = { H: H, ids: n > 0 ? sh.getRange(2, H.id, n, 1).getValues().map(function (x) { return str_(x[0]); }) : [] };
    }
    const c = cache[key];
    const i = c.ids.indexOf(str_(r.id));
    if (i === -1 || !c.H[str_(r.pole)]) return;
    const cell = sh.getRange(i + 2, c.H[str_(r.pole)]);
    if (liczbaCeny2026_11_(cell.getValue()) !== liczbaCeny2026_11_(r.nowa)) { zostawione.push(r.id + '.' + r.pole); return; }
    cell.setValue(r.cena);
    cofniete++;
  });
  ss.deleteSheet(bk);
  invalidateCatalog_();
  const t = 'Cofnięta podwyżka cen: przywrócone ' + cofniete + (zostawione.length ? '; zostawione (zmienione ręcznie po podwyżce): ' + zostawione.join(', ') : '') + '.';
  log_('INFO', 'ceny_2026_11_cofnij', t);
  return t;
}
