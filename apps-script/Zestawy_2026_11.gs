/**
 * NICCI: zestawy w zakładce Zestawy (listopad 2026, decyzja 99).
 *
 * Uruchom raz funkcję zestawy_2026_11 z edytora Apps Script. Działa z obecnym Code.gs i nie wymaga nowego
 * wdrożenia. Zmienia trzy komórki „aktywny”:
 *   z01 LV DISCOVERY SET i z03 NOUS TOUS DISCOVERY SET: NIE (zdjęte ze sprzedaży),
 *   p60 Hugo Boss Bottled Absolu: TAK, bo bez niego WINTER DISCOVERY SET (z07) jest niedostępny.
 * Uwaga: p60 pojawi się też w katalogu jako osobny zapach (ceny 10 i 20 ml z arkusza, bez zdjęcia na stronie).
 * Opisy zestawów strona pokazuje sama, dopóki kolumna „opis” w zakładce Zestawy jest pusta (site/js/app.js);
 * ten skrypt ich nie wpisuje. Wynik trafia do zakładki Log. Po uruchomieniu ten plik można usunąć.
 */
const ZESTAWY_2026_11 = [
  { arkusz: 'ZESTAWY', id: 'z01', aktywny: 'NIE' },
  { arkusz: 'ZESTAWY', id: 'z03', aktywny: 'NIE' },
  { arkusz: 'PRODUKTY', id: 'p60', aktywny: 'TAK' }
];

function zestawy_2026_11() {
  const wynik = [];
  ZESTAWY_2026_11.forEach(function (z) {
    const sh = ss_().getSheetByName(SHEET[z.arkusz]);
    const H = headerMap_(sh);
    const n = sh.getLastRow() - 1;
    const ids = n > 0 ? sh.getRange(2, H.id, n, 1).getValues().map(function (r) { return str_(r[0]); }) : [];
    const i = ids.indexOf(z.id);
    if (i === -1) { wynik.push(z.id + ': nie ma w arkuszu, pominięty'); return; }
    const cell = sh.getRange(i + 2, H.aktywny);
    const przed = str_(cell.getValue());
    if (przed.toUpperCase() === z.aktywny) { wynik.push(z.id + ': już ' + z.aktywny); return; }
    cell.setValue(z.aktywny);
    wynik.push(z.id + ': ' + (przed || 'puste') + ' → ' + z.aktywny);
  });
  invalidateCatalog_();
  const tekst = 'Zestawy (decyzja 99): ' + wynik.join('; ');
  log_('INFO', 'zestawy_2026_11', tekst);
  return tekst;
}
