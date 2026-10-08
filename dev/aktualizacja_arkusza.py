#!/usr/bin/env python3
"""
Generuje apps-script/Aktualizacja_2026_10.gs: jednorazowy skrypt, który w arkuszu sklepu (konto właściciela)
dopisuje zapachy dodane w październiku 2026 i uzupełnia nowe kolumny, bez dotykania cen i stanów wpisanych
przez właściciela.

Źródło: dev/dane/arkusz.json (wynik dev/konwersja_arkusza.py) i jego poprzednia wersja z gita (do porównania
kolumny podobne).

Użycie:
    python3 dev/aktualizacja_arkusza.py [rewizja_gita_z_poprzednim_importem]   # domyślnie dce7735
"""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NOWE_ID = ['p56'] + [f'p{n}' for n in range(72, 101)]
ZESTAWY = {'z04': ['p34', 'p98']}  # Sweet & Spicy: Lost Cherry → Wet Cherry Liquor (właściciel)


def rows(table):
    head = table[0]
    return {r[0]: dict(zip(head, r)) for r in table[1:]}


def main():
    rev = sys.argv[1] if len(sys.argv) > 1 else 'dce7735'
    teraz = json.load(open(os.path.join(ROOT, 'dev', 'dane', 'arkusz.json'), encoding='utf-8'))
    przed = json.loads(subprocess.check_output(['git', 'show', f'{rev}:dev/dane/arkusz.json'], cwd=ROOT))
    P, P0 = rows(teraz['Produkty']), rows(przed['Produkty'])

    nowe = [P[i] for i in NOWE_ID]
    quiz = {i: [p['bestseller'], p['klimat'], p['renoma']] for i, p in P.items() if p['nazwa']}
    podobne = {i: [P0[i]['podobne'], P[i]['podobne']] for i in P
               if i in P0 and P0[i]['nazwa'] and P0[i]['podobne'] != P[i]['podobne']}
    dane = {'nowe': nowe, 'quiz': quiz, 'podobne': podobne, 'zestawy': ZESTAWY}

    js = """/**
 * NICCI: jednorazowa aktualizacja arkusza, październik 2026. Wygenerowane przez dev/aktualizacja_arkusza.py.
 *
 * Co robi (uruchom raz funkcję aktualizacja_2026_10 z edytora, po wklejeniu nowego Code.gs i uruchomieniu setup):
 *   1. Dopisuje do zakładki Produkty zapachy, których jeszcze nie ma (Lp. 56 i 72 do 100 w arkuszu doradcy).
 *      Wiersz z tym samym id, ale bez nazwy (np. p56), uzupełnia. Istniejących zapachów nie zmienia.
 *   2. Uzupełnia nowe kolumny bestseller, klimat i renoma, ale tylko w pustych komórkach.
 *   3. Zmienia kolumnę podobne w zapachach, w których arkusz doradcy ją poprawił, o ile w arkuszu sklepu jest
 *      jeszcze stara wartość (Twoje własne zmiany zostają).
 *   4. W zestawie Sweet & Spicy zamienia Lost Cherry (niedostępny) na Wet Cherry Liquor.
 * Wynik trafia do zakładki Log. Ponowne uruchomienie niczego nie dubluje. Po aktualizacji ten plik można usunąć.
 */
const AKTUALIZACJA_2026_10 = %s;

function aktualizacja_2026_10() {
  const ss = ss_();
  const D = AKTUALIZACJA_2026_10;
  ensureSheet_(ss, SHEET.PRODUKTY, HEADERS.Produkty);
  const sh = ss.getSheetByName(SHEET.PRODUKTY);
  const H = headerMap_(sh);
  const width = sh.getLastColumn();
  const wiersz = function (p) {
    const row = new Array(width).fill('');
    Object.keys(p).forEach(function (k) { if (H[k]) row[H[k] - 1] = p[k]; });
    return row;
  };
  const kolumna = function (name) {
    const n = sh.getLastRow() - 1;
    return n > 0 ? sh.getRange(2, H[name], n, 1).getValues().map(function (r) { return r[0]; }) : [];
  };

  // 1. nowe zapachy
  let ids = kolumna('id').map(str_);
  const nazwy = kolumna('nazwa').map(str_);
  let dodane = 0, uzupelnione = 0;
  D.nowe.forEach(function (p) {
    const i = ids.indexOf(p.id);
    if (i === -1) { sh.appendRow(wiersz(p)); ids.push(p.id); dodane++; }
    else if (!nazwy[i]) { sh.getRange(i + 2, 1, 1, width).setValues([wiersz(p)]); uzupelnione++; }
  });

  // 2. bestseller, klimat, renoma: tylko puste komórki
  ids = kolumna('id').map(str_);
  let quiz = 0;
  [['bestseller', 0], ['klimat', 1], ['renoma', 2]].forEach(function (k) {
    const vals = kolumna(k[0]);
    let zmiana = false;
    ids.forEach(function (id, i) {
      const v = D.quiz[id] ? D.quiz[id][k[1]] : '';
      if (v !== '' && str_(vals[i]) === '') { vals[i] = v; zmiana = true; quiz++; }
    });
    if (zmiana) sh.getRange(2, H[k[0]], vals.length, 1).setValues(vals.map(function (v) { return [v]; }));
  });

  // 3. podobne: tylko tam, gdzie jest jeszcze stara wartość
  const pod = kolumna('podobne');
  let podobne = 0;
  const pominiete = [];
  ids.forEach(function (id, i) {
    const z = D.podobne[id];
    if (!z) return;
    if (str_(pod[i]) === z[0]) { sh.getRange(i + 2, H.podobne).setValue(z[1]); podobne++; }
    else if (str_(pod[i]) !== z[1]) pominiete.push(id);
  });

  // 4. zestawy
  const zs = ss.getSheetByName(SHEET.ZESTAWY);
  const HZ = headerMap_(zs);
  let zestawy = 0;
  if (zs.getLastRow() > 1) {
    const zr = zs.getRange(2, 1, zs.getLastRow() - 1, zs.getLastColumn()).getValues();
    zr.forEach(function (r, i) {
      const z = D.zestawy[str_(r[HZ.id - 1])];
      const sklad = str_(r[HZ.sklad - 1]);
      if (!z || sklad.indexOf(z[0] + ':') === -1) return;
      zs.getRange(i + 2, HZ.sklad).setValue(sklad.split(z[0] + ':').join(z[1] + ':'));
      zestawy++;
    });
  }

  invalidateCatalog_();
  const opis = 'Dodane zapachy: ' + dodane + ', uzupełnione puste wiersze: ' + uzupelnione +
    ', uzupełnione komórki bestseller/klimat/renoma: ' + quiz + ', zmienione podobne: ' + podobne +
    (pominiete.length ? ' (pominięte, bo zmienione ręcznie: ' + pominiete.join(', ') + ')' : '') +
    ', zmienione zestawy: ' + zestawy + '.';
  log_('INFO', 'aktualizacja_2026_10', opis);
  return opis;
}
""" % json.dumps(dane, ensure_ascii=False, indent=1)
    out = os.path.join(ROOT, 'apps-script', 'Aktualizacja_2026_10.gs')
    open(out, 'w', encoding='utf-8').write(js)
    print(out, '| nowe:', len(nowe), '| quiz:', len(quiz), '| podobne:', sorted(podobne), '| zestawy:', ZESTAWY)


if __name__ == '__main__':
    main()
