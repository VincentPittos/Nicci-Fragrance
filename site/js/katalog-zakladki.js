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
    // na stronie ofert link do zestawów w menu prowadzi do katalogu, nie do zakładki zestawów prezentowych
    if (a.getAttribute('href') === '/katalog#zestawy' && !/^\/katalog(\.html)?$/.test(location.pathname)) return;
    e.preventDefault();
    select(a.dataset.tabLink || 'zestawy', { history: true, scroll: true });
  });
  window.addEventListener('hashchange', function () { select(location.hash === '#zestawy' ? 'zestawy' : 'zapachy', { scroll: location.hash === '#zestawy' }); });

  if (location.hash === '#zestawy') select('zestawy', { scroll: true });

  function counts(c) {
    var cat = document.querySelector('[data-catalog]'), sets = document.querySelector('[data-sets]');
    var only = sets && sets.getAttribute('data-sets-only') ? sets.getAttribute('data-sets-only').split(',') : null;
    var n = {
      zapachy: (c.products || []).filter(function (p) { return !(cat && cat.hasAttribute('data-catalog-promocje')) || p.promocja > 0; }).length,
      zestawy: (c.sets || []).filter(function (s) { return !only || only.indexOf(s.id) !== -1; }).length
    };
    bar.querySelectorAll('[data-tab-n]').forEach(function (el) { el.textContent = n[el.dataset.tabN] || ''; });
  }
  // pasek zestawów nad listą zapachów (decyzja 113): tylko dostępne zestawy, przycisk przełącza zakładkę
  function strip(c) {
    var el = document.querySelector('[data-sets-strip]'), U = window.NicciUI;
    if (!el || !U) return;
    var list = (c.sets || []).filter(function (s) { return s.available; });
    if (!list.length) { el.hidden = true; return; }
    var min = Math.min.apply(null, list.map(function (s) { return s.price; }));
    var pic = function (s) {
      if (!s.zdjecie) return '';
      var base = s.zdjecie.replace(/-800\.webp$/, '');
      return '<picture><source type="image/avif" srcset="' + U.esc(base + '-400.avif') + '">' +
        '<img src="' + U.esc(base + '-400.webp') + '" alt="" width="400" height="500" loading="lazy" decoding="async"></picture>';
    };
    el.innerHTML = '<div class="sets-strip__thumbs" aria-hidden="true">' + list.map(pic).join('') + '</div>' +
      '<div class="sets-strip__text"><p class="t-eyebrow">Zestawy odkrywców</p>' +
      '<p class="sets-strip__title">' + list.length + ' ' + A.plural(list.length, ['zestaw', 'zestawy', 'zestawów']) + ' od ' + U.price(min) + '</p></div>' +
      '<a class="btn btn--primary sets-strip__btn" href="#zestawy" data-tab-link="zestawy">Zobacz zestawy</a>';
    el.hidden = false;
  }
  if (A) {
    A.catalog().then(function (c) { counts(c); strip(c); }, function () {});
    A.onCatalog(function (c) { counts(c); strip(c); });
  }
})();
