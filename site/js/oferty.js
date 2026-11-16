/**
 * NICCI: strona ofert specjalnych /oferty. Kampanię i fazę wybiera js/oferty-kampanie.js (daty w jednym miejscu).
 * Licznik w hero, siatka zapachów z obniżką (produkty z „promocja” > 0 z arkusza, od największej obniżki)
 * z przełącznikiem wysokości rabatu, a w Święta zestawy prezentowe (zestawy.js, data-sets-only).
 *
 * Podgląd do akceptacji: ?podglad=1 dokłada PRZYKŁADOWE obniżki i zestawy prezentowe, wyłącznie w przeglądarce
 * oglądającego (nic nie trafia do arkusza ani do zamówień) i pokazuje o tym pasek na dole ekranu.
 */
(function () {
  'use strict';
  var A = window.NicciApp, U = window.NicciUI, C = window.NicciCard, K = window.NicciKampanie;
  if (!A || !K) return;
  var params = new URLSearchParams(location.search);
  var PODGLAD = params.has('podglad');
  var KAMP = K.kampania || 'brak';

  var TEKSTY = {
    'black-weeks': {
      theme: 'theme-dark', eyebrow: 'Oferty Black Weeks', title: 'Do −50% na wybrane zapachy',
      lead: 'Ceny obowiązują do 29 listopada do północy. Przy każdej obniżce widzisz cenę sprzed niej.',
      przed: 'Lista ofert pojawi się tutaj 23 listopada o północy.',
      rules: 'Obniżka dotyczy pojemności oznaczonych na karcie zapachu i trwa do 29 listopada do północy. ' +
        'Przy każdej obniżce podajemy cenę sprzed obniżki i najniższą cenę z 30 dni przed nią.'
    },
    christmas: {
      theme: 'theme-light', eyebrow: 'Świąteczne obniżki', title: '−20% na wybrane perfumy',
      lead: 'Odlewka ulubionego zapachu to też dobry prezent. Ceny obowiązują do 24 grudnia.',
      przed: 'Lista świątecznych obniżek pojawi się tutaj 30 listopada.',
      rules: 'Obniżka dotyczy pojemności oznaczonych na karcie zapachu i trwa do 24 grudnia. ' +
        'Przy każdej obniżce podajemy cenę sprzed obniżki i najniższą cenę z 30 dni przed nią.'
    },
    brak: {
      theme: 'theme-dark', eyebrow: 'Oferty', title: 'Zapachy w obniżonych cenach', lead: '', przed: '',
      rules: 'Przy każdej obniżce podajemy cenę sprzed obniżki i najniższą cenę z 30 dni przed nią.'
    }
  };
  var T = TEKSTY[KAMP];

  // ---------- licznik ----------
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function words(n, forms) { return n + ' ' + A.plural(n, forms); }
  var lastMin = -1;
  function tick() {
    if (!K.cel) return;
    var left = Math.max(0, K.cel.getTime() - (Date.now() + K.przesuniecie));
    var s = Math.floor(left / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    document.querySelectorAll('[data-countdown]').forEach(function (box) {
      box.querySelector('[data-cd-d]').textContent = two(d);
      box.querySelector('[data-cd-d-u]').textContent = A.plural(d, ['dzień', 'dni', 'dni']);
      box.querySelector('[data-cd-h]').textContent = two(h);
      box.querySelector('[data-cd-m]').textContent = two(m);
      box.querySelector('[data-cd-s]').textContent = two(sec);
      if (m !== lastMin) {
        box.querySelector('[data-cd-text]').textContent = (K.faza === 'przed' ? 'Do startu zostało ' : 'Zostało ') +
          words(d, ['dzień', 'dni', 'dni']) + ', ' + words(h, ['godzina', 'godziny', 'godzin']) + ' i ' + words(m, ['minuta', 'minuty', 'minut']) + '.';
      }
    });
    lastMin = m;
    if (left === 0 && !PODGLAD && !params.has('teraz')) setTimeout(function () { location.reload(); }, 1500); // start albo koniec kampanii
  }

  // ---------- podgląd: przykładowe obniżki i zestawy prezentowe ----------
  var PRZYKLAD = {
    'black-weeks': { p06: 50, p43: 30, p10: 30, p45: 30, p16: 25, p11: 20, p35: 20, p01: 20 },
    christmas: { p43: 20, p05: 20, p87: 20, p86: 20, p08: 20, p11: 20, p01: 20, p35: 20 }
  };
  var PREZENTY = [
    ['dla-niego', 'DLA NIEGO', 'Trzy męskie zapachy po 5 ml w jednym pudełku.', ['p11', 'p01', 'p35']],
    ['dla-niej', 'DLA NIEJ', 'Trzy zapachy z damskiej półki po 5 ml w jednym pudełku.', ['p43', 'p92', 'p99']],
    ['dla-taty', 'DLA TATY', 'Klasyka na co dzień i do garnituru, po 5 ml.', ['p16', 'p54', 'p75']],
    ['dla-mamy', 'DLA MAMY', 'Kwiaty, owoce i ciepłe drewno, po 5 ml.', ['p91', 'p94', 'p08']]
  ];
  function podglad(c) {
    if (!c || c.__podglad) return c;
    c.__podglad = true;
    var P = {};
    (c.products || []).forEach(function (p) { P[p.id] = p; });
    var promo = PRZYKLAD[KAMP] || {};
    Object.keys(promo).forEach(function (id) {
      var p = P[id]; if (!p) return;
      p.promocja = promo[id];
      (p.variants || []).forEach(function (v) {
        if (v.ml < 10 || !v.available) return; // jak w promocji z decyzji 84: bez 5 ml
        v.wasPrice = v.price;
        v.price = Math.round(v.price * (100 - promo[id]) / 10000) * 100;
      });
    });
    if (KAMP === 'christmas') {
      PREZENTY.forEach(function (g) {
        var sklad = g[3].map(function (id) { var p = P[id]; return p && { id: id, marka: p.marka, nazwa: p.nazwa, ml: 5, available: !U.isSoldOut(p) }; }).filter(Boolean);
        var osobno = g[3].reduce(function (t, id) {
          var v = P[id] && (P[id].variants || []).filter(function (x) { return x.ml === 5; })[0];
          return t + (v ? (v.wasPrice || v.price) : 0);
        }, 0);
        c.sets = (c.sets || []).concat([{ id: g[0], nazwa: g[1], opis: g[2], rodzina: '', sklad: sklad,
          price: Math.round(osobno * 0.85 / 1000) * 1000, cenaOsobno: osobno, available: sklad.every(function (x) { return x.available; }) }]);
      });
    }
    return c;
  }
  if (PODGLAD) {
    var orig = A.catalog, origOn = A.onCatalog;
    A.catalog = function () { return orig.apply(A, arguments).then(podglad); };
    A.onCatalog = function (fn) { return origOn.call(A, function (c) { fn(podglad(c)); }); };
  }

  // ---------- siatka obniżek ----------
  var section = document.getElementById('oferty');
  var grid = section.querySelector('[data-offers-grid]');
  var tabs = section.querySelector('[data-offers-tabs]');
  var empty = section.querySelector('[data-offers-empty]');
  var SIZES = '(min-width: 80rem) 20rem, (min-width: 56rem) 30vw, 46vw';
  var filter = 0;
  var list = [];

  function head() {
    section.classList.add(T.theme);
    section.querySelector('[data-offers-eyebrow]').textContent = T.eyebrow;
    section.querySelector('[data-offers-title]').textContent = T.title;
    var lead = section.querySelector('[data-offers-lead]');
    lead.textContent = T.lead; lead.hidden = !T.lead;
    section.querySelector('[data-offers-rules]').textContent = T.rules;
  }

  function cards() {
    var shown = filter ? list.filter(function (p) { return p.promocja === filter; }) : list;
    grid.innerHTML = shown.map(function (p) { return C.render(p, { sizes: SIZES }); }).join('');
    C.mount(grid, shown);
  }

  function renderTabs() {
    var levels = [];
    list.forEach(function (p) { if (levels.indexOf(p.promocja) === -1) levels.push(p.promocja); });
    levels.sort(function (a, b) { return b - a; });
    tabs.hidden = levels.length < 2;
    if (tabs.hidden) return;
    var tab = function (v, label, n) {
      return '<button type="button" class="offers__tab" data-level="' + v + '" aria-pressed="' + (filter === v) + '">' + label + '<span>' + n + '</span></button>';
    };
    tabs.innerHTML = tab(0, 'Wszystkie', list.length) + levels.map(function (v) {
      return tab(v, '−' + String(v).replace('.', ',') + '%', list.filter(function (p) { return p.promocja === v; }).length);
    }).join('');
  }

  function render(catalog) {
    if (K.faza === 'przed') {
      grid.hidden = true; tabs.hidden = true;
      empty.textContent = T.przed; empty.hidden = !T.przed;
      return;
    }
    list = (catalog.products || []).filter(function (p) { return p.promocja > 0 && !U.isSoldOut(p); })
      .sort(function (a, b) { return b.promocja - a.promocja || (a.kolejnosc || 0) - (b.kolejnosc || 0); });
    if (!list.length) {
      grid.hidden = true; tabs.hidden = true;
      empty.innerHTML = 'Teraz nie mamy obniżek. Wszystkie zapachy znajdziesz w&nbsp;<a class="link" href="' + A.url('/katalog') + '">katalogu</a>.';
      empty.hidden = false;
      return;
    }
    grid.hidden = false; empty.hidden = true;
    if (filter && !list.some(function (p) { return p.promocja === filter; })) filter = 0;
    renderTabs();
    cards();
  }

  tabs.addEventListener('click', function (e) {
    var b = e.target.closest('[data-level]'); if (!b) return;
    filter = Number(b.getAttribute('data-level'));
    tabs.querySelectorAll('[data-level]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    cards();
  });

  // ---------- newsletter: przyciski „Chcę kod” i „Przypomnij mi o starcie” ----------
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-nl-open]')) return;
    if (window.NicciNewsletter) window.NicciNewsletter.open();
  });
  function newsletterReady() {
    if (window.NicciNewsletter && window.NicciNewsletter.enabled) return;
    // bez popupu (brak adresu zapisu) przyciski prowadzą do katalogu, a pas newslettera znika
    document.querySelectorAll('[data-nl-open]').forEach(function (b) {
      var a = document.createElement('a');
      a.className = b.className; a.href = A.url('/katalog'); a.textContent = 'Zobacz katalog';
      if (b.hasAttribute('data-tylko')) a.setAttribute('data-tylko', b.getAttribute('data-tylko'));
      b.replaceWith(a);
    });
    var band = document.querySelector('.offer-nl'); if (band) band.hidden = true;
  }

  function banner() {
    var el = document.createElement('p');
    el.className = 'offers-preview';
    el.textContent = 'Podgląd: obniżki, ich wysokość i składy zestawów prezentowych są przykładowe.';
    var main = document.getElementById('main');
    main.insertBefore(el, main.firstChild);
  }

  function init() {
    head();
    tick();
    if (K.cel) setInterval(function () { if (!document.hidden) tick(); }, 1000);
    A.catalog().then(render, function () {
      grid.hidden = true; empty.textContent = 'Oferty chwilowo się nie wczytały. Odśwież stronę za moment.'; empty.hidden = false;
    });
    A.onCatalog(render);
    // newsletter.js ładuje się po tym pliku: sprawdzamy go, gdy wszystkie skrypty już działają
    if (document.readyState === 'complete') newsletterReady(); else window.addEventListener('load', newsletterReady);
    if (PODGLAD) banner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
