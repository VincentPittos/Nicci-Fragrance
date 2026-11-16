/**
 * NICCI: półka katalogu na stronie głównej (sekcja 3, decyzja 88).
 * Poziomy rząd kart: najpierw promocje, bestsellery i nowości, potem reszta w kolejności z arkusza, tylko dostępne.
 * Przewijanie palcem, kółkiem i klawiaturą (natywne, z przyciąganiem do kart), strzałki na komputerze, złota kreska
 * postępu. Ostatni kafel i przycisk pod półką prowadzą do pełnego katalogu z wyszukiwarką i filtrami (/katalog).
 */
(function () {
  'use strict';
  var A = window.NicciApp, U = window.NicciUI, C = window.NicciCard, M = window.NicciMotion;
  var rail = document.querySelector('[data-shelf]');
  if (!rail) return;
  var track = rail.querySelector('[data-shelf-track]');
  var section = rail.closest('section');
  var bar = section.querySelector('[data-shelf-progress]');
  var prev = section.querySelector('[data-shelf-prev]');
  var next = section.querySelector('[data-shelf-next]');
  var allBtn = section.querySelector('[data-shelf-all]');
  var LIMIT = 16;
  // szerokość karty na półce (strona.css, .shelf__item): telefon 62vw, od 40rem 15rem, od 64rem 16rem
  var SIZES = '(min-width: 64rem) 16rem, (min-width: 40rem) 15rem, 62vw';

  function zapachy(n) { return n + ' ' + A.plural(n, ['zapach', 'zapachy', 'zapachów']); }

  function pick(products) {
    var score = function (p) { return (p.promocja ? 4 : 0) + (p.bestseller ? 2 : 0) + (p.nowosc ? 1 : 0); };
    return products.filter(function (p) { return !U.isSoldOut(p); })
      .map(function (p, i) { return { p: p, s: score(p), i: i }; })
      .sort(function (a, b) { return b.s - a.s || (a.p.kolejnosc || 0) - (b.p.kolejnosc || 0) || a.i - b.i; })
      .slice(0, LIMIT).map(function (x) { return x.p; });
  }

  function render(catalog) {
    var list = pick(catalog.products || []);
    var total = (catalog.products || []).length;
    track.innerHTML = list.map(function (p) {
      return '<li class="shelf__item">' + C.render(p, { sizes: SIZES }) + '</li>';
    }).join('') +
      '<li class="shelf__item shelf__item--all"><a class="shelf__all theme-graphite" href="' + A.url('/katalog') + '">' +
        '<span class="shelf__all-n">' + total + '</span>' +
        '<span class="shelf__all-t">' + U.esc(A.plural(total, ['zapach', 'zapachy', 'zapachów'])) + ' w katalogu</span>' +
        '<span class="shelf__all-cta">Zobacz wszystkie</span></a></li>';
    C.mount(track, list);
    if (allBtn) allBtn.textContent = 'Zobacz wszystkie ' + zapachy(total);
    update();
  }

  function error() {
    track.innerHTML = '<li class="shelf__item shelf__item--msg"><p>Zapachy chwilowo się nie wczytały. Odśwież stronę za moment albo ' +
      '<a class="link" href="' + A.url('/katalog') + '">przejdź do katalogu</a>.</p></li>';
  }

  // ---------- postęp i strzałki ----------
  var raf = 0;
  function update() {
    raf = 0;
    var max = rail.scrollWidth - rail.clientWidth;
    var seen = rail.scrollWidth ? rail.clientWidth / rail.scrollWidth : 1;
    var p = max > 0 ? rail.scrollLeft / max : 0;
    if (bar) bar.style.transform = 'translateX(' + (p * (1 - seen) / seen * 100).toFixed(2) + '%) scaleX(1)';
    if (bar) bar.style.width = (seen * 100).toFixed(2) + '%';
    if (prev) prev.disabled = rail.scrollLeft < 4;
    if (next) next.disabled = rail.scrollLeft > max - 4;
  }
  function step(dir) {
    var item = track.querySelector('.shelf__item');
    var w = item ? item.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : rail.clientWidth * 0.8;
    var n = Math.max(1, Math.floor(rail.clientWidth / w));
    rail.scrollBy({ left: dir * n * w, behavior: M.reduced() ? 'auto' : 'smooth' });
  }
  rail.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  window.addEventListener('resize', function () { if (!raf) raf = requestAnimationFrame(update); });
  if (prev) prev.addEventListener('click', function () { step(-1); });
  if (next) next.addEventListener('click', function () { step(1); });

  function init() {
    A.catalog().then(render, error);
    A.onCatalog(render);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
