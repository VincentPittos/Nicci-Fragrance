/**
 * NICCI: druga podwyżka cen (listopad 2026, decyzja 115). Nowe ceny podstawowe, bez funkcji cofania.
 *
 * Uruchom raz funkcję ceny_2026_11_druga z edytora Apps Script. Działa z obecnym Code.gs i nie wymaga nowego
 * wdrożenia: strona pokaże nowe ceny przy następnym odświeżeniu katalogu (do 5 minut).
 *   cena_5, cena_10, cena_20 i cena zestawu do 200 zł włącznie (obecne, już po pierwszej podwyżce z 20.11,
 *   decyzja 114) razy 1,05, zawsze w górę do pełnych 10 zł: 60 → 70, 150 → 160, 200 → 210. Powyżej 200 zł bez zmian.
 *   NICCI ESSENTIALS zostaje 99 zł (cena z kampanii −99%). Puste komórki zostają puste, promocje i stany bez zmian.
 * Drugie uruchomienie niczego nie zmienia (znacznik CENY_2026_11_DRUGA we Właściwościach skryptu), więc ceny
 * nie wzrosną dwa razy. Wynik trafia do zakładki Log. Po uruchomieniu ten plik można usunąć.
 */
const CENY_2026_11_DRUGA = { MNOZNIK_PROMIL: 1050, MAKS_CENA: 200, ZAOKRAGLENIE: 10, POMIN_ZESTAWY: ['essentials'], ZNACZNIK: 'CENY_2026_11_DRUGA' };

/** Do MAKS_CENA: razy 1,05 i zawsze w górę do 10 zł (200 → 210 dokładnie; tolerancja 1e-9 na zapis ułamków). */
function cena2026_11_(v) {
  const k = CENY_2026_11_DRUGA;
  if (v > k.MAKS_CENA) return v;
  return Math.ceil(v * k.MNOZNIK_PROMIL / (1000 * k.ZAOKRAGLENIE) - 1e-9) * k.ZAOKRAGLENIE;
}

function liczbaCeny2026_11_(v) {
  const s = str_(v).replace(/\s/g, '').replace(',', '.');
  const n = s === '' ? NaN : Number(s);
  return isFinite(n) && n > 0 ? n : null;
}

function ceny_2026_11_druga() {
  const k = CENY_2026_11_DRUGA;
  const props = PropertiesService.getScriptProperties();
  const byla = props.getProperty(k.ZNACZNIK);
  if (byla) {
    const t = 'Ta podwyżka była już zrobiona (' + byla + '). Nic nie zmieniono.';
    log_('INFO', 'ceny_2026_11_druga', t);
    return t;
  }
  const ss = ss_();
  const plan = [
    { sheet: ss.getSheetByName(SHEET.PRODUKTY), typ: 'produkt', pola: ['cena_5', 'cena_10', 'cena_20'] },
    { sheet: ss.getSheetByName(SHEET.ZESTAWY), typ: 'zestaw', pola: ['cena'] }
  ];
  const zapisy = [];
  let zmienione = 0, powyzej = 0;
  plan.forEach(function (p) {
    if (!p.sheet) throw new Error('Brak zakładki dla: ' + p.typ);
    const H = headerMap_(p.sheet);
    const n = p.sheet.getLastRow() - 1;
    if (n < 1) return;
    const ids = p.sheet.getRange(2, H.id, n, 1).getValues();
    p.pola.forEach(function (pole) {
      if (!H[pole]) throw new Error('W zakładce brakuje kolumny ' + pole);
      const kol = p.sheet.getRange(2, H[pole], n, 1).getValues();
      kol.forEach(function (row, i) {
        const id = str_(ids[i][0]);
        const stara = liczbaCeny2026_11_(row[0]);
        if (!id || stara === null) return;
        if (p.typ === 'zestaw' && k.POMIN_ZESTAWY.indexOf(id) !== -1) return;
        if (stara > k.MAKS_CENA) { powyzej++; return; }
        const nowa = cena2026_11_(stara);
        if (nowa === stara) return;
        // zapis tylko zmienionych komórek: formuły i wpisy w pozostałych zostają nietknięte
        zapisy.push({ sheet: p.sheet, row: i + 2, col: H[pole], nowa: nowa });
        zmienione++;
      });
    });
  });
  // znacznik przed zapisem: nawet przerwane uruchomienie nie podniesie cen drugi raz
  const kiedy = dateTxt_(new Date(), CONFIG.TIMEZONE);
  props.setProperty(k.ZNACZNIK, kiedy);
  zapisy.forEach(function (z) { z.sheet.getRange(z.row, z.col).setValue(z.nowa); });
  invalidateCatalog_();
  const t = 'Ceny do ' + k.MAKS_CENA + ' zł +5%, w górę do pełnych 10 zł: zmienione ' + zmienione + ', powyżej ' + k.MAKS_CENA +
    ' zł bez zmian ' + powyzej + ' (NICCI ESSENTIALS bez zmian). Nowe ceny podstawowe od ' + kiedy + '.';
  log_('INFO', 'ceny_2026_11_druga', t);
  return t;
}
