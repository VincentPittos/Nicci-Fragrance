#!/usr/bin/env python3
"""
Generuje apps-script/Aktualizacja_2026_10.gs: jednorazowy skrypt, który doprowadza arkusz sklepu (konto właściciela)
do stanu z dev/dane/arkusz.json, bez dotykania tego, co właściciel zmienił ręcznie.

Arkusz właściciela mógł powstać z dowolnej wcześniejszej wersji importu (wrzesień 2026) albo przejść już poprzednią
aktualizację, więc skrypt nie zakłada jednego stanu wyjściowego. Dla każdej komórki zna wszystkie wartości, które
kiedykolwiek wygenerowaliśmy (historia dev/dane/arkusz.json w gicie). Komórkę zmienia tylko wtedy, gdy jest pusta
albo stoi w niej jedna z tych wartości. Wpis właściciela, którego nigdy nie generowaliśmy, zostaje i trafia do Logu.
Kolumny ml_dostepne (stan prowadzi właściciel) skrypt nie zmienia w istniejących wierszach.

Użycie:
    python3 dev/aktualizacja_arkusza.py
"""
import json
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLIK = 'dev/dane/arkusz.json'
CHRONIONE = {'Produkty': ['ml_dostepne'], 'Zestawy': []}


def tabela(table):
    head = table[0]
    return head, {str(r[0]): dict(zip(head, r)) for r in table[1:]}


def tekst(v):
    """Tak jak str_() w Code.gs: liczby całkowite bez .0, puste jako ''."""
    if v is None:
        return ''
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    return str(v).strip()


def main():
    teraz = json.load(open(os.path.join(ROOT, PLIK), encoding='utf-8'))
    rewizje = subprocess.check_output(['git', 'log', '--format=%h', '--', PLIK], cwd=ROOT, text=True).split()
    historia_wersji = [json.loads(subprocess.check_output(['git', 'show', f'{r}:{PLIK}'], cwd=ROOT)) for r in rewizje]

    dane = {}
    for zakladka in ('Produkty', 'Zestawy'):
        head, wiersze = tabela(teraz[zakladka])
        historia = {}
        for wersja in historia_wersji:
            if zakladka not in wersja:
                continue
            _, stare = tabela(wersja[zakladka])
            for id_, rec in stare.items():
                for pole in head:
                    if pole == 'id' or id_ not in wiersze:
                        continue
                    v = tekst(rec.get(pole))
                    if v and v != tekst(wiersze[id_][pole]):  # pustą komórkę skrypt i tak uzupełnia
                        historia.setdefault(id_, {}).setdefault(pole, [])
                        if v not in historia[id_][pole]:
                            historia[id_][pole].append(v)
        dane[zakladka] = {
            'kolumny': head,
            'wiersze': [[r.get(k, '') for k in head] for r in wiersze.values()],
            'historia': historia,
            'chronione': CHRONIONE[zakladka],
        }

    js = """/**
 * NICCI: jednorazowa aktualizacja arkusza, październik 2026. Wygenerowane przez dev/aktualizacja_arkusza.py.
 *
 * Uruchom raz funkcję aktualizacja_2026_10 z edytora, po wklejeniu nowego Code.gs i uruchomieniu setup.
 *   1. Dopisuje brakujące zapachy i zestawy. Wiersz z tym samym id, ale bez nazwy (np. p56), uzupełnia.
 *   2. W istniejących wierszach zmienia komórkę tylko wtedy, gdy jest pusta albo stoi w niej wartość z naszego
 *      wcześniejszego importu (opisy, podobne, profil, zdjęcia, nowe kolumny bestseller, klimat, renoma,
 *      nowosc i odbior, skład Sweet & Spicy). Twoje własne wpisy zostają, a ich lista trafia do zakładki Log.
 *   3. Kolumny ml_dostepne w istniejących wierszach nie zmienia.
 * Działa tak samo, czy uruchamiasz ją pierwszy raz, czy po poprzedniej wersji tego pliku. Ponowne uruchomienie
 * niczego nie dubluje. Po aktualizacji ten plik można usunąć.
 */
const AKTUALIZACJA_2026_10 = %s;

function aktualizacja_2026_10() {
  const ss = ss_();
  const opis = [];
  ['Produkty', 'Zestawy'].forEach(function (nazwa) {
    opis.push(aktualizujZakladke_2026_10_(ss, nazwa, AKTUALIZACJA_2026_10[nazwa]));
  });
  invalidateCatalog_();
  const tekst = opis.join(' ');
  log_('INFO', 'aktualizacja_2026_10', tekst);
  return tekst;
}

function aktualizujZakladke_2026_10_(ss, nazwa, D) {
  const sh = ensureSheet_(ss, SHEET[nazwa === 'Produkty' ? 'PRODUKTY' : 'ZESTAWY'], HEADERS[nazwa]);
  const H = headerMap_(sh);
  const width = sh.getLastColumn();
  const n = sh.getLastRow() - 1;
  const rows = n > 0 ? sh.getRange(2, 1, n, width).getValues() : [];
  const kol = function (pole) { return H[pole] - 1; };
  const indeks = {};
  rows.forEach(function (r, i) { if (str_(r[kol('id')])) indeks[str_(r[kol('id')])] = i; });

  const zmienione = {};   // numery kolumn do zapisania
  const pola = {};        // licznik zmian według kolumny
  const dopisane = [];
  const pominiete = [];
  let uzupelnione = 0;

  D.wiersze.forEach(function (w) {
    const rec = {};
    D.kolumny.forEach(function (k, j) { rec[k] = w[j]; });
    const id = str_(rec.id);
    const i = indeks[id];
    if (i === undefined) {
      const row = new Array(width).fill('');
      D.kolumny.forEach(function (k) { if (H[k]) row[H[k] - 1] = rec[k]; });
      dopisane.push(row);
      return;
    }
    const r = rows[i];
    if (nazwa === 'Produkty' && !str_(r[kol('nazwa')]) && str_(rec.nazwa)) {
      D.kolumny.forEach(function (k) {
        if (!H[k] || (k === 'ml_dostepne' && str_(r[kol(k)]) !== '')) return;
        r[kol(k)] = rec[k];
        zmienione[H[k]] = true;
      });
      uzupelnione++;
      return;
    }
    D.kolumny.forEach(function (k) {
      if (k === 'id' || !H[k] || D.chronione.indexOf(k) !== -1) return;
      const obecna = str_(r[kol(k)]);
      if (obecna === str_(rec[k])) return;
      const stare = (D.historia[id] && D.historia[id][k]) || [];
      if (obecna === '' || stare.indexOf(obecna) !== -1) {
        r[kol(k)] = rec[k];
        zmienione[H[k]] = true;
        pola[k] = (pola[k] || 0) + 1;
      } else {
        pominiete.push(id + '.' + k);
      }
    });
  });

  Object.keys(zmienione).forEach(function (c) {
    const c1 = Number(c);
    sh.getRange(2, c1, rows.length, 1).setValues(rows.map(function (r) { return [r[c1 - 1]]; }));
  });
  if (dopisane.length) sh.getRange(sh.getLastRow() + 1, 1, dopisane.length, width).setValues(dopisane);

  return nazwa + ': dopisane ' + dopisane.length + ', uzupełnione puste wiersze ' + uzupelnione +
    ', zmienione komórki ' + (Object.keys(pola).map(function (k) { return k + ' ' + pola[k]; }).join(', ') || '0') +
    (pominiete.length ? '; zostawione Twoje wpisy: ' + pominiete.join(', ') : '') + '.';
}
""" % json.dumps(dane, ensure_ascii=False, separators=(',', ':'))
    out = os.path.join(ROOT, 'apps-script', 'Aktualizacja_2026_10.gs')
    open(out, 'w', encoding='utf-8').write(js)
    for z in dane:
        print(out, '|', z, 'wierszy:', len(dane[z]['wiersze']), '| historia dla', len(dane[z]['historia']), 'id')


if __name__ == '__main__':
    main()
