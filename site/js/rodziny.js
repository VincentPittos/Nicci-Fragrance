/**
 * NICCI: rodziny zapachowe na stronie. Opisy są naszym tekstem (nie ma ich w arkuszu), dlatego żyją tu,
 * a lista rodzin i liczba zapachów zawsze przychodzą z katalogu. Rodzina bez opisu dostaje sam tytuł.
 *   NicciRodziny.slug('skórzana') → 'skorzana'   (adresy, pliki kadrów, filtr)
 *   NicciRodziny.opis('drzewna')  → tekst albo ''
 */
(function () {
  'use strict';

  var OPISY = {
    cytrusowa: 'Skórka cytryny pęka w palcach i w powietrzu zostaje coś jasnego, lekko gorzkiego. Budzi szybciej niż kawa i nie męczy nawet w upale. Dla Ciebie, jeśli chcesz pachnieć świeżo od rana do ostatniego spotkania.',
    drzewna: 'Ciepłe drewno, szczypta pieprzu i coś żywicznego pod spodem. Ten zapach nie wchodzi pierwszy do pokoju, ale zostaje w nim najdłużej. Dla osób, które lubią, gdy ktoś pyta, czym pachną, dopiero po godzinie rozmowy.',
    gourmand: 'Pachnie jak ciepły sweter i deser jedzony powoli, przy dobrej rozmowie. Wanilia i tonka, czasem kawa albo liść tytoniu, a wszystko miękkie jak krem. Dla Ciebie, jeśli lubisz, gdy ktoś przysuwa się trochę bliżej.',
    orientalna: 'Szafran i róża na ciemnej żywicy, która z każdą godziną rozgrzewa się na skórze. To zapach na wieczór przy świecach, gęsty i złoty. Dla osób, które chcą zostawić po sobie wyraźny ślad.',
    aromatyczna: 'Liść geranium roztarty w palcach, trochę mięty i jasne drewno cedru. Pachnie jak świeżo wyprasowana koszula i pasuje tak samo do biura, jak do weekendu. Dla Ciebie, jeśli lubisz pachnieć schludnie i bez przesady.',
    ambrowa: 'Ciepła żywica i wanilia na drewnie sandałowym, które mięknie z godziny na godzinę. Pachnie jak skóra po całym dniu w słońcu. Dla osób, które lubią zapach, w który można się otulić.',
    'skórzana': 'Pachnie jak nowa skórzana kurtka, z odrobiną szafranu i ciemnych owoców w tle. To zapach wieczoru, który zaczyna się bez planu. Dla Ciebie, jeśli chcesz pachnieć pewnie i trochę przekornie.',
    'świeża': 'Pachnie jak poranek po deszczu, kiedy otwierasz okno. W tle zielona herbata i bergamotka, jasne i czyste. Dla osób, które chcą pachnieć świeżo w każdej sytuacji, od biura po siłownię.',
    kwiatowa: 'Kwiat pomarańczy i jaśmin w porannym słońcu, z iskrą różowego pieprzu i gałązką rozmarynu. Kwiaty są tu jasne i żywe, pełne soku. Dla Ciebie, jeśli lubisz kwiaty z odrobiną pazura.',
    'słodka': 'Dojrzała marakuja z nutą szafranu, soczysta i trochę zuchwała. Wanilia pod spodem z czasem ją zaokrągla. Dla osób, które lubią, gdy zapach zauważa się już od progu.'
  };

  function slug(name) {
    return String(name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function opis(name) {
    var key = String(name || '').toLowerCase();
    if (OPISY[key]) return OPISY[key];
    var s = slug(name);
    for (var k in OPISY) if (slug(k) === s) return OPISY[k];
    return '';
  }

  window.NicciRodziny = { slug: slug, opis: opis };
})();
