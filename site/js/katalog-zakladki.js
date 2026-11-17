/**
 * NICCI: zakładki „Zapachy” i „Zestawy” na /katalog (decyzja 99).
 * Wzorzec ARIA tabs: strzałki w lewo i w prawo, Home i End przełączają zakładki, aktywna ma tabindex 0.
 * /katalog#zestawy (link w menu i stopce wszystkich stron) otwiera zestawy; wybór zakładki zapisuje się w adresie,
 * więc przycisk Wstecz i udostępniony link prowadzą do tej samej zakładki. Liczby przy zakładkach z katalogu.
 */
(function () {
  'use strict';
  var A = window.NicciApp;
  var bar = document.querySelector('[data-cat-tabs]');
  if (!bar) return;
  var tabs = Array.prototype.slice.call(bar.querySelectorAll('[role="tab"]'));

  function panel(tab) { return document.getElementById(tab.getAttribute('aria-controls')); }

  function select(name, opts) {
    opts = opts || {};
    tabs.forEach(function (t) {
      var on = t.dataset.tab === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panel(t).hidden = !on;
      if (on && opts.focus) t.focus();
    });
    if (opts.history) {
      var hash = name === 'zestawy' ? '#zestawy' : '';
      if (location.hash !== hash) history.replaceState(null, '', location.pathname + location.search + hash);
    }
    if (opts.scroll) requestAnimationFrame(function () { bar.scrollIntoView({ block: 'start' }); });
  }

  bar.addEventListener('click', function (e) {
    var t = e.target.closest('[role="tab"]');
    if (t) select(t.dataset.tab, { history: true });
  });
  bar.addEventListener('keydown', function (e) {
    var i = tabs.indexOf(document.activeElement);
    if (i === -1) return;
    var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    var t = tabs[(next + tabs.length) % tabs.length];
    select(t.dataset.tab, { focus: true, history: true });
  });
  // link „zakładce Zestawy” we wstępie i #zestawy w menu tej samej strony
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-tab-link], a[href="#zestawy"], a[href="/katalog#zestawy"]');
    if (!a) return;
    e.preventDefault();
    select(a.dataset.tabLink || 'zestawy', { history: true, scroll: true });
  });
  window.addEventListener('hashchange', function () { select(location.hash === '#zestawy' ? 'zestawy' : 'zapachy', { scroll: location.hash === '#zestawy' }); });

  if (location.hash === '#zestawy') select('zestawy', { scroll: true });

  function counts(c) {
    var n = { zapachy: (c.products || []).length, zestawy: (c.sets || []).length };
    bar.querySelectorAll('[data-tab-n]').forEach(function (el) { el.textContent = n[el.dataset.tabN] || ''; });
  }
  if (A) { A.catalog().then(counts, function () {}); A.onCatalog(counts); }
})();
