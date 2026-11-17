/**
 * NICCI: kalendarz kampanii strony /oferty. Ładowany w <head> bez defer (mały), żeby przed pierwszym malowaniem
 * ustawić <html data-kampania data-faza>: CSS pokazuje wtedy od razu właściwe treści, bez mignięcia innej kampanii.
 * Daty w czasie polskim (CET, +01:00). Licznik w hero odlicza do startu (faza „przed”) albo do celu kampanii.
 *
 * Podgląd: ?kampania=black-weeks|christmas wymusza kampanię, ?teraz=2026-11-25T19:42 udaje inny moment.
 */
window.NicciKampanie = (function () {
  'use strict';
  var LISTA = [
    { id: 'black-weeks', od: '2026-11-23T00:00:00+01:00', do: '2026-11-30T00:00:00+01:00', licznik: '2026-11-30T00:00:00+01:00' },
    { id: 'christmas', od: '2026-11-30T00:00:00+01:00', do: '2026-12-25T00:00:00+01:00', licznik: '2026-12-24T00:00:00+01:00' }
  ];
  var q = new URLSearchParams(location.search);
  var teraz = new Date();
  if (q.get('teraz')) { var t = new Date(q.get('teraz') + (/[+Z]/.test(q.get('teraz').slice(10)) ? '' : '+01:00')); if (!isNaN(t)) teraz = t; }
  var ms = function (s) { return new Date(s).getTime(); };
  var now = teraz.getTime();

  var k = null, faza = 'po';
  var wymuszona = LISTA.filter(function (x) { return x.id === q.get('kampania'); })[0];
  if (wymuszona) { k = wymuszona; faza = now < ms(k.od) ? 'przed' : 'trwa'; }
  else {
    k = LISTA.filter(function (x) { return now >= ms(x.od) && now < ms(x.do); })[0] || null;
    if (k) faza = 'trwa';
    else { k = LISTA.filter(function (x) { return now < ms(x.od); })[0] || null; if (k) faza = 'przed'; }
  }

  var html = document.documentElement;
  html.setAttribute('data-kampania', k ? k.id : 'brak');
  html.setAttribute('data-faza', faza);

  return {
    lista: LISTA,
    teraz: teraz,
    przesuniecie: teraz.getTime() - Date.now(), // podgląd z ?teraz= liczy dalej od udawanego momentu
    kampania: k ? k.id : null,
    faza: faza,
    cel: k ? new Date(faza === 'przed' ? k.od : k.licznik) : null,
    od: k ? new Date(k.od) : null
  };
})();
