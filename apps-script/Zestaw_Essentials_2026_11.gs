/**
 * NICCI: zestaw NICCI ESSENTIALS (7 zapachów po 1 ml, 99 zł) w zakładce Zestawy (listopad 2026, decyzja 87).
 *
 * Uruchom raz funkcję zestaw_essentials_2026_11 z edytora Apps Script. Działa z obecnym Code.gs i nie wymaga
 * nowego wdrożenia: dopisuje jeden wiersz na początku zakładki Zestawy, a strona pokaże zestaw przy następnym
 * odświeżeniu katalogu (do 5 minut). Jeśli wiersz z id „essentials” już jest, niczego nie zmienia. Wynik trafia
 * do zakładki Log. Po uruchomieniu ten plik można usunąć.
 */
const ZESTAW_ESSENTIALS_2026_11 = {
  id: 'essentials',
  aktywny: 'TAK',
  nazwa: 'NICCI ESSENTIALS',
  opis: 'Siedem zapachów do sprawdzenia na własnej skórze, od cytrusowego Imagination i drzewnego Aventusa ' +
    'po słodki Chocolate Greedy, ciemną Black Orchid i korzenny Red Tobacco. Po 1 ml każdego, czyli tyle, ' +
    'żeby ponosić zapach przez dzień i wybrać ten, który weźmiesz w większej odlewce.',
  rodzina: '',
  cena: 99,
  sklad: 'p11:1, p01:1, p08:1, p44:1, p29:1, p87:1, p25:1'
};

function zestaw_essentials_2026_11() {
  const z = ZESTAW_ESSENTIALS_2026_11;
  const sh = ss_().getSheetByName(SHEET.ZESTAWY);
  const H = headerMap_(sh);
  const n = sh.getLastRow() - 1;
  const ids = n > 0 ? sh.getRange(2, H.id, n, 1).getValues().map(function (r) { return str_(r[0]); }) : [];
  let tekst;
  if (ids.indexOf(z.id) !== -1) {
    tekst = 'Zestaw NICCI ESSENTIALS już jest w zakładce Zestawy, nic nie zmieniono.';
  } else {
    const brak = Object.keys(z).filter(function (k) { return !H[k]; });
    if (brak.length) throw new Error('W zakładce Zestawy brakuje kolumn: ' + brak.join(', '));
    sh.insertRowAfter(1);
    Object.keys(z).forEach(function (k) {
      const cell = sh.getRange(2, H[k]);
      if (k === 'sklad') cell.setNumberFormat('@');
      cell.setValue(z[k]);
    });
    invalidateCatalog_();
    tekst = 'Dopisany zestaw NICCI ESSENTIALS (7 zapachów po 1 ml, 99 zł) na początku zakładki Zestawy.';
  }
  log_('INFO', 'zestaw_essentials_2026_11', tekst);
  return tekst;
}
