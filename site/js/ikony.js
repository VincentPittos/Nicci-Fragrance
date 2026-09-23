/**
 * NICCI: ikony rysowane pod markę. Siatka 32×32, obrys 1,5 px, zaokrąglone końce, bez wypełnień,
 * kolor z currentColor. Żadnych bibliotek ikon.
 *   NicciIkony.svg('jesien', {size: 28, cls: 'x'}) → '<svg ...>'
 * Etap 6 dopisze tu ikony odpowiedzi quizu, żeby cały zestaw był w jednym miejscu.
 */
(function () {
  'use strict';

  var P = {
    // piramida nut
    glowa: '<path d="M11 26c-2.2-3 2.2-5.2 0-8.2s2.2-5.2 0-8.2M16 26c-2.2-3 2.2-5.2 0-8.2s2.2-5.2 0-8.2s2.2-3.8 0-5.6M21 26c-2.2-3 2.2-5.2 0-8.2s2.2-5.2 0-8.2"/>',
    serce: '<path d="M16 26.5s-9.5-5.6-9.5-12.6a5.2 5.2 0 0 1 9.5-2.9 5.2 5.2 0 0 1 9.5 2.9c0 7-9.5 12.6-9.5 12.6Z"/>',
    baza: '<path d="M5.5 25.5h21M8 20.5h16M10.5 15.5h11M13 10.5h6"/>',
    // pory roku
    wiosna: '<path d="M16 28V17"/><path d="M16 17c-4.2 0-6.5-3.2-6.5-7.5 3.2 0 5.6 1.8 6.5 4.6.9-2.8 3.3-4.6 6.5-4.6 0 4.3-2.3 7.5-6.5 7.5Z"/><path d="M16 23c-2.2-2.4-4.8-2.8-6.5-2.3M16 22c1.8-1.8 3.8-2.1 5.5-1.6"/>',
    lato: '<path d="M9.5 18.5a6.5 6.5 0 0 1 13 0"/><path d="M16 6.5v2.5M8.1 9.7l1.8 1.8M23.9 9.7l-1.8 1.8M5 18.5h2.5M24.5 18.5H27"/><path d="M5 23c1.8 0 1.8-1.4 3.7-1.4s1.8 1.4 3.7 1.4 1.8-1.4 3.6-1.4 1.8 1.4 3.7 1.4 1.8-1.4 3.6-1.4S25.1 23 27 23M8.5 27c1.6 0 1.6-1.2 3.3-1.2s1.6 1.2 3.3 1.2 1.6-1.2 3.3-1.2 1.6 1.2 3.3 1.2"/>',
    jesien: '<path d="M7.5 24.5C7.5 13.5 13.5 7.5 25 7.5c0 11.5-6 17-17.5 17Z"/><path d="M7.5 24.5 19 13M12.5 19.5l-.5-4.5M15.7 16.3l4.3.5"/>',
    zima: '<path d="M16 4.5v23M6 10.2l20 11.6M26 10.2 6 21.8"/><path d="m12.8 6.8 3.2 3 3.2-3M12.8 25.2l3.2-3 3.2 3M6.3 14.6l4.2-1.3-1-4.2M25.7 17.4l-4.2 1.3 1 4.2M9.5 22.9l1-4.2-4.2-1.3M22.5 9.1l-1 4.2 4.2 1.3"/>',
    // pora dnia
    dzien: '<circle cx="16" cy="16" r="5"/><path d="M16 4.5v3M16 24.5v3M4.5 16h3M24.5 16h3M7.9 7.9 10 10M22 22l2.1 2.1M7.9 24.1 10 22M22 10l2.1-2.1"/>',
    wieczor: '<path d="M20.5 5.8A10.5 10.5 0 1 0 26.2 21a8.6 8.6 0 0 1-5.7-15.2Z"/>',
    uniwersalna: '<circle cx="11.5" cy="12" r="4"/><path d="M11.5 3.5v2M11.5 18.5v2M3 12h2M5.5 6l1.4 1.4M16.1 6.6 17.5 5.2M5.5 18l1.4-1.4"/><path d="M24 14.5a7.2 7.2 0 1 0 3.9 10.4 5.9 5.9 0 0 1-3.9-10.4Z"/>',
    // interfejs
    szukaj: '<circle cx="14" cy="14" r="8"/><path d="m20 20 6.5 6.5"/>',
    filtry: '<path d="M5 9h14M24 9h3M5 16h4M14 16h13M5 23h11M21 23h6"/><circle cx="21.5" cy="9" r="2.5"/><circle cx="11.5" cy="16" r="2.5"/><circle cx="18.5" cy="23" r="2.5"/>',
    instagram: '<rect x="6" y="6" width="20" height="20" rx="6"/><circle cx="16" cy="16" r="4.5"/><path d="M21.6 10.4h.01"/>',
    strzalka: '<path d="M7 16h18M19 10l6 6-6 6"/>',
    zamknij: '<path d="m9 9 14 14M23 9 9 23"/>',
    atomizer: '<rect x="12" y="11" width="8" height="17" rx="1.5"/><path d="M14 11V7.5h4V11M16 7.5V5M14 17h4"/>'
  };

  function svg(name, opts) {
    opts = opts || {};
    var s = opts.size || 32;
    var body = P[name];
    if (!body) return '';
    return '<svg class="ikona' + (opts.cls ? ' ' + opts.cls : '') + '" viewBox="0 0 32 32" width="' + s + '" height="' + s + '" aria-hidden="true" focusable="false"' +
      ' fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
  }

  window.NicciIkony = { svg: svg, add: function (name, body) { P[name] = body; }, has: function (n) { return !!P[n]; }, names: function () { return Object.keys(P); } };
})();
