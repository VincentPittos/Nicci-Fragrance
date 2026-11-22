"""Generuje site/js/ceny-30dni.js: dawne ceny (zł) do wymogu „najniższa cena z 30 dni przed obniżką” (decyzja 116).

Źródła: dev/dane/ceny_historia_2026_11.json (ceny sprzed podwyżek z decyzji 114 i 115) i promocja z decyzji 83
(23.10 do 4.11.2026, −10% na 10 i 20 ml sześciu zapachów, na stronie od 24.10). „do” to chwila, w której cena
przestała obowiązywać, przesunięta ostrożnie w przód: dłużej w oknie 30 dni znaczy niższa najniższa cena,
czyli mniejszy pokazany procent obniżki, nigdy większy niż w rzeczywistości.
Użycie: python3 dev/generuj_ceny_30dni.py"""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
h = json.load(open(os.path.join(ROOT, 'dev', 'dane', 'ceny_historia_2026_11.json'), encoding='utf-8'))

PROMO_PAZDZIERNIK = {  # decyzja 83, ceny po obniżce w zł
    'p05': {'10': 207, '20': 360}, 'p08': {'10': 90, '20': 171}, 'p16': {'10': 180, '20': 342},
    'p29': {'10': 72, '20': 130}, 'p46': {'10': 108, '20': 198}, 'p98': {'10': 180, '20': 333},
}
# Start obniżki dla okna 30 dni: początek trwającej kampanii (te same daty co site/js/oferty-kampanie.js).
KAMPANIE = [
    {'id': 'black-weeks', 'od': '2026-11-23T00:00:00+01:00', 'do': '2026-11-30T00:00:00+01:00'},
    {'id': 'christmas', 'od': '2026-11-30T00:00:00+01:00', 'do': '2026-12-25T00:00:00+01:00'},
]
okresy = [
    {'opis': 'ceny przed drugą podwyżką (decyzja 115)', 'do': '2026-11-22T12:00:00+01:00',
     'produkty': h['przed_druga_podwyzka']['produkty'], 'zestawy': h['przed_druga_podwyzka'].get('zestawy', {})},
    {'opis': 'ceny przed pierwszą podwyżką (decyzja 114)', 'do': '2026-11-21T12:00:00+01:00',
     'produkty': h['przed_pierwsza_podwyzka']['produkty'], 'zestawy': h['przed_pierwsza_podwyzka'].get('zestawy', {})},
    {'opis': 'promocja −10% z 23.10 (decyzja 83, koniec 4.11)', 'do': '2026-11-05T00:00:00+01:00',
     'produkty': PROMO_PAZDZIERNIK, 'zestawy': {}},
]
js = ('/* NICCI: dawne ceny w zł do wymogu „najniższa cena z 30 dni przed obniżką” (decyzja 116). Generuje\n'
      '   dev/generuj_ceny_30dni.py z dev/dane/ceny_historia_2026_11.json; nie edytuj ręcznie. site/js/app.js porównuje\n'
      '   cenę po obniżce z najniższą ceną z 30 dni przed startem obniżki i od niej liczy przekreśloną cenę i procent. */\n'
      'window.NicciCeny30 = ' + json.dumps({'kampanie': KAMPANIE, 'okresy': okresy}, ensure_ascii=False, separators=(',', ':')) + ';\n')
out = os.path.join(ROOT, 'site', 'js', 'ceny-30dni.js')
open(out, 'w', encoding='utf-8').write(js)
print('zapisano', out, len(js), 'B')
