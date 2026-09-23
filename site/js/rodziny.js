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
    gourmand: 'Wanilia, tonka i kawa, ale bez cukierni w tle. Pachnie jak ciepły sweter i deser jedzony powoli, przy dobrej rozmowie. Dla Ciebie, jeśli lubisz, gdy ktoś przysuwa się trochę bliżej.',
    orientalna: 'Szafran, róża i żywice, które z każdą godziną rozgrzewają się na skórze. Gęsto, złoto, wieczornie. Dla osób, które chcą zostawić po sobie wyraźny ślad.',
    aromatyczna: 'Gałązka rozmarynu, roztarty liść geranium i jasne drewno. Zapach świeżo wyprasowanej koszuli, który pasuje do biura i do weekendu. Dla Ciebie, jeśli chcesz pachnieć dobrze, a nie głośno.',
    ambrowa: 'Ciepła żywica, wanilia i drewno sandałowe, które mięknie z godziny na godzinę. Pachnie jak skóra po całym dniu w słońcu. Dla osób, które szukają otulenia bez ciężaru.',
    'skórzana': 'Miękka skóra, szczypta szafranu i ciemne owoce. Zapach nowej kurtki i wieczoru, który zaczyna się bez planu. Dla Ciebie, jeśli chcesz pachnieć pewnie i trochę przekornie.',
    'świeża': 'Bergamotka, zielona herbata i biały kwiat tuż po deszczu. Lekko i czysto, bez wysiłku. Dla osób, które lubią zapach, który się czuje, a nie słyszy.',
    kwiatowa: 'Kwiat pomarańczy, jaśmin i irys, jasne i żywe, z pieprzną iskrą. Kwiaty bez pudru i bez bukietu z kwiaciarni. Dla Ciebie, jeśli lubisz kwiaty, ale nie chcesz pachnieć jak ogród.',
    'słodka': 'Marakuja, szafran i wanilia, soczyście i trochę zuchwale. Słodycz z charakterem, nie z cukiernicy. Dla osób, które lubią, gdy zapach zauważa się już od progu.'
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
