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

  // Hero kampanii na stronie głównej (index.html: <html data-hero-kampanii>, css/kampania-hero.css). Zdjęcie ma
  // loading="lazy", żeby poza kampanią się nie pobierało; w trakcie kampanii dokładamy preload zdjęcia i fontu,
  // tak samo jak zwykły hero (media, srcset i sizes muszą zgadzać się z <picture> w index.html).
  var bw4 = '/img/kampanie/bw-hero-4x5-', bw21 = '/img/kampanie/bw-hero-21x9-';
  var HERO = {
    'black-weeks': [
      { as: 'image', type: 'image/avif', media: '(max-width: 63.99rem)', fetchpriority: 'high', imagesizes: '100vw',
        imagesrcset: bw4 + '640.avif 640w, ' + bw4 + '960.avif 960w, ' + bw4 + '1280.avif 1280w, ' + bw4 + '1856.avif 1856w' },
      { as: 'image', type: 'image/avif', media: '(min-width: 64rem)', fetchpriority: 'high', imagesizes: '(max-width: 84rem) 84rem, 100vw',
        imagesrcset: bw21 + '1280.avif 1280w, ' + bw21 + '1920.avif 1920w, ' + bw21 + '2560.avif 2560w, ' + bw21 + '3168.avif 3168w' },
      { as: 'font', type: 'font/woff2', href: '/fonts/anton-pl-c3f82c.woff2', crossorigin: '' }
    ]
  };
  if (k && faza === 'trwa' && HERO[k.id] && html.hasAttribute('data-hero-kampanii') && document.head) {
    HERO[k.id].forEach(function (a) {
      var l = document.createElement('link');
      l.rel = 'preload';
      Object.keys(a).forEach(function (n) { l.setAttribute(n, a[n]); });
      document.head.appendChild(l);
    });
  }

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
