/**
 * NICCI: promocja z 23.10.2026. Uruchom raz funkcję promocja_2026_10 z edytora, po wklejeniu nowego Code.gs.
 *
 * W zakładce Produkty wpisuje przy sześciu zapachach promocja 10 i promocja_ml „10, 20”: cena 10 i 20 ml niższa
 * o 10%, zaokrąglona w dół do pełnych złotych; 5 ml bez zmian. Brakujące kolumny promocja i promocja_ml dopisuje
 * na końcu nagłówka. Inne wiersze i komórki zostają bez zmian. Ponowne uruchomienie wpisuje to samo.
 * Koniec promocji: wyczyść komórki promocja w tych wierszach (strona wróci do zwykłych cen w ciągu 5 minut).
 * Po uruchomieniu ten plik można usunąć.
 */
const PROMOCJA_2026_10 = {
  p05: 'Louis Vuitton Ombre Nomade',
  p08: 'Xerjoff Erba Pura',
  p16: 'Amouage Reflection Man',
  p29: 'Montale Chocolate Greedy',
  p46: 'Nous Tous Casa di Capri',
  p98: 'Bohoboco Wet Cherry Liquor'
};

function promocja_2026_10() {
  const sh = ensureSheet_(ss_(), SHEET.PRODUKTY, HEADERS.Produkty);
  const H = headerMap_(sh);
  const n = sh.getLastRow() - 1;
  const ids = n > 0 ? sh.getRange(2, H.id, n, 1).getValues().map(function (r) { return str_(r[0]); }) : [];
  const wpisane = [];
  const brak = [];
  Object.keys(PROMOCJA_2026_10).forEach(function (id) {
    const i = ids.indexOf(id);
    if (i === -1) { brak.push(id + ' ' + PROMOCJA_2026_10[id]); return; }
    sh.getRange(i + 2, H.promocja).setValue(10);
    // jako tekst: w polskich ustawieniach arkusz zamieniłby „10,20” na liczbę 10,2
    sh.getRange(i + 2, H.promocja_ml).setNumberFormat('@').setValue('10, 20');
    wpisane.push(PROMOCJA_2026_10[id]);
  });
  invalidateCatalog_();
  const tekst = 'Promocja 10% na 10 i 20 ml: ' + wpisane.join(', ') + '.' + (brak.length ? ' Nie ma w arkuszu: ' + brak.join(', ') + '.' : '');
  log_('INFO', 'promocja_2026_10', tekst);
  return tekst;
}
