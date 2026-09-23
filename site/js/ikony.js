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
    // quiz: dla kogo
    'q-meski': '<rect x="9" y="12.5" width="14" height="14.5" rx="1.5"/><path d="M13 12.5V9h6v3.5M14.5 9V6.2h3V9"/><rect x="12.5" y="17.5" width="7" height="5" rx=".6"/>',
    'q-damski': '<path d="M16 12.5c4.9 0 7.5 3.3 7.5 7.1S20.6 27 16 27s-7.5-3.6-7.5-7.4 2.6-7.1 7.5-7.1Z"/><path d="M13.6 12.5V9.4h4.8v3.1M15 9.4V6.4h2v3"/>',
    'q-unisex': '<rect x="5" y="14" width="10" height="13" rx="1.2"/><path d="M8 14v-3h4v3M9.2 11V8.8h1.6"/><path d="M22.2 15c3.4 0 4.8 2.4 4.8 5.1S24.9 27 22.2 27s-4.8-2.9-4.8-5.9 1.4-6.1 4.8-6.1Z"/><path d="M20.6 15v-2.6h3.2V15M21.4 12.4v-1.9h1.6"/>',
    // quiz: klimat
    'k-swiezy': '<circle cx="16" cy="16" r="10.5"/><circle cx="16" cy="16" r="8"/><path d="M16 8.5v15M8.5 16h15M10.7 10.7l10.6 10.6M21.3 10.7 10.7 21.3"/>',
    'k-drzewny': '<path d="M16 5.5c6.1 0 10.5 4.6 10.5 10.4S22.1 26.5 16 26.5 5.5 21.8 5.5 16 9.9 5.5 16 5.5Z"/><path d="M16.2 9.4c3.9 0 6.6 2.9 6.6 6.5s-2.8 6.5-6.7 6.5-6.6-2.9-6.6-6.4 2.8-6.6 6.7-6.6Z"/><path d="M16.1 13.3c1.6 0 2.8 1.2 2.8 2.7s-1.2 2.7-2.8 2.7-2.8-1.2-2.8-2.7 1.2-2.7 2.8-2.7Z"/><path d="M16 5.5l1.1 3.9M26.3 18.5l-3.6-.8"/>',
    'k-slodki': '<path d="M16 4.8c4.6 6.3 8.2 10.6 8.2 15.1a8.2 8.2 0 0 1-16.4 0c0-4.5 3.6-8.8 8.2-15.1Z"/><path d="M12.3 19.6c.2-2.1 1.2-4.1 2.8-5.9"/>',
    'k-kwiatowy': '<path d="M16 28V15.5"/><path d="M16 15.5c-4.6 0-7-3.2-7-8.3 2.5 0 4.6 1 5.6 3 .5-2.5 1.4-4 1.4-4s.9 1.5 1.4 4c1-2 3.1-3 5.6-3 0 5.1-2.4 8.3-7 8.3Z"/><path d="M16 23.2c-2.5-2.6-5.4-3.1-7.6-2.5 1.2 2.4 4.1 3.4 7.6 2.5Z"/>',
    // quiz: sezon (ciepło = lato, chłodno = zima, cały rok = obieg)
    'caly-rok': '<path d="M24.9 13.2A9.5 9.5 0 0 0 7.6 11.3"/><path d="M7.1 18.8a9.5 9.5 0 0 0 17.3 1.9"/><path d="m8.2 6.7-.6 4.6 4.5.7M23.8 25.3l.6-4.6-4.5-.7"/><circle cx="16" cy="16" r="2.4"/>',
    // quiz: intensywność, łuki wokół punktu
    'int-1': '<circle cx="10" cy="16" r="1.8"/><path d="M14.2 12.2a5.4 5.4 0 0 1 0 7.6"/>',
    'int-2': '<circle cx="10" cy="16" r="1.8"/><path d="M14.2 12.2a5.4 5.4 0 0 1 0 7.6M18.1 8.4a10.8 10.8 0 0 1 0 15.2"/>',
    'int-3': '<circle cx="10" cy="16" r="1.8"/><path d="M14.2 12.2a5.4 5.4 0 0 1 0 7.6M18.1 8.4a10.8 10.8 0 0 1 0 15.2M22 4.6a16.2 16.2 0 0 1 0 22.8"/>',
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
