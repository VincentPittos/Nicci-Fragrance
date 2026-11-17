/**
 * NICCI: zestawy odkrywców. Poziomy rząd kart na kremie.
 * Oszczędność pokazujemy tylko, gdy backend policzył cenę składników osobno (cenaOsobno) i jest wyższa.
 * Zestaw bez któregoś składnika jest niedostępny i mówi, którego brakuje.
 */
(function () {
  'use strict';
  var N = window.Nicci, A = window.NicciApp, U = window.NicciUI, M = window.NicciMotion;
  var esc = U.esc;
  var root = document.querySelector('[data-sets]');
  if (!root) return;
  var MAX = 5;
  // /katalog, zakładka „Zestawy” (decyzja 99): siatka kart w stylu kart zapachów zamiast poziomego rzędu
  var GRID = root.hasAttribute('data-sets-grid');
  // strona ofert pokazuje tylko wybrane zestawy (data-sets-only="id1,id2", w tej kolejności) z własnym nadtytułem
  var ONLY = (root.getAttribute('data-sets-only') || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
  var EYEBROW = root.getAttribute('data-sets-eyebrow') || 'Zestaw odkrywców';
  var sets = [];
  var cat = null;

  function qty(id) {
    var it = N.cart.items().filter(function (i) { return i.type === 'set' && i.id === id; })[0];
    return it ? it.qty : 0;
  }
  function index(id) {
    var items = N.cart.items();
    for (var i = 0; i < items.length; i++) if (items[i].type === 'set' && items[i].id === id) return i;
    return -1;
  }

  function action(s) {
    if (!s.available) return '<button type="button" class="btn btn--outline btn--block" disabled>Chwilowo niedostępny</button>';
    var q = qty(s.id);
    if (!q) return '<button type="button" class="btn btn--primary btn--block" data-add-set>Dodaj do koszyka</button>';
    return '<div class="card__incart"><p>W koszyku<span>zmień ilość tutaj</span></p>' +
      '<div class="stepper" role="group" aria-label="Ilość zestawu">' +
      '<button type="button" data-set-qty="-1" aria-label="Odejmij jeden zestaw">&minus;</button>' +
      '<output aria-live="polite">' + q + '</output>' +
      '<button type="button" data-set-qty="1" aria-label="Dodaj jeden zestaw"' + (q >= MAX ? ' disabled' : '') + '>+</button></div></div>';
  }

  function card(s) {
    var missing = (s.sklad || []).filter(function (x) { return !x.available; });
    var save = s.cenaOsobno && s.cenaOsobno > s.price ? s.cenaOsobno - s.price : 0;
    var totalMl = (s.sklad || []).reduce(function (t, x) { return t + (x.ml || 0); }, 0);
    return '<article class="set-card" data-set-id="' + esc(s.id) + '" aria-labelledby="set-' + esc(s.id) + '"' + (s.available ? '' : ' data-soldout') + '>' +
      '<p class="t-eyebrow">' + esc(EYEBROW) + '</p>' +
      '<h3 class="set-card__name" id="set-' + esc(s.id) + '">' + esc(s.nazwa) + '</h3>' +
      (s.opis ? '<p class="set-card__desc">' + esc(s.opis) + '</p>' : '') +
      '<p class="set-card__meta">' + s.sklad.length + ' ' + A.plural(s.sklad.length, ['zapach', 'zapachy', 'zapachów']) + ', razem ' + totalMl + '&nbsp;ml</p>' +
      '<ul class="set-card__list" role="list">' + (s.sklad || []).map(function (x) {
        var label = '<span><b>' + esc(x.marka) + '</b> ' + esc(x.nazwa) + '</span>';
        // składnik spoza aktywnego katalogu nie ma szczegółów do pokazania
        var inCatalog = cat && N.findProduct(cat, x.id);
        return '<li' + (x.available ? '' : ' data-missing') + '>' +
          (inCatalog ? '<button type="button" class="set-card__item" data-open-product="' + esc(x.id) + '" aria-haspopup="dialog">' + label + '</button>'
            : '<span class="set-card__item">' + label + '</span>') +
          '<span class="set-card__ml">' + x.ml + '&nbsp;ml</span></li>';
      }).join('') + '</ul>' +
      '<div class="set-card__buy">' +
        '<p class="price">' + U.price(s.price) + '</p>' +
        (save ? '<p class="set-card__save">Osobno ' + U.price(s.cenaOsobno) + ', oszczędzasz ' + U.price(save) + '</p>' : '') +
        (missing.length ? '<p class="set-card__missing">Chwilowo brakuje: ' + missing.map(function (x) { return esc(x.marka + ' ' + x.nazwa); }).join(', ') + '</p>' : '') +
        '<div class="card__action" data-set-action>' + action(s) + '</div>' +
      '</div></article>';
  }

  /** „SWEET & SPICY SET” → „Sweet & Spicy Set”; NICCI zostaje wielkimi literami. */
  function nazwa(s) {
    return String(s || '').split(/\s+/).map(function (w) {
      return w === 'NICCI' || w === '&' ? w : w.charAt(0) + w.slice(1).toLowerCase();
    }).join(' ');
  }
  function zawartosc(s) {
    var sk = s.sklad || [];
    var ml = sk.map(function (x) { return x.ml; });
    var same = ml.length && ml.every(function (m) { return m === ml[0]; });
    var n = sk.length + ' ' + A.plural(sk.length, ['zapach', 'zapachy', 'zapachów']);
    return same ? n + ' po ' + ml[0] + '&nbsp;ml' : n + ', razem ' + ml.reduce(function (t, m) { return t + (m || 0); }, 0) + '&nbsp;ml';
  }
  function media(s) {
    if (!s.zdjecie) return '<span class="card__ph" aria-hidden="true"><span class="card__ph-mark" data-t="N"></span><span class="card__ph-brand" data-t="Nicci"></span></span>';
    var base = s.zdjecie.replace(/-800\.webp$/, '');
    var sizes = '(min-width: 90rem) 22vw, (min-width: 64rem) 30vw, 50vw';
    var set = function (ext) { return [400, 600, 800].map(function (w) { return base + '-' + w + '.' + ext + ' ' + w + 'w'; }).join(', '); };
    return '<picture class="pic"><source type="image/avif" srcset="' + esc(set('avif')) + '" sizes="' + sizes + '">' +
      '<img src="' + esc(base + '-400.webp') + '" srcset="' + esc(set('webp')) + '" sizes="' + sizes + '" alt="" width="800" height="1000" loading="lazy" decoding="async"></picture>';
  }
  function gridCard(s) {
    var missing = (s.sklad || []).filter(function (x) { return !x.available; });
    var save = s.cenaOsobno && s.cenaOsobno > s.price ? s.cenaOsobno - s.price : 0;
    var id = 'set-' + esc(s.id);
    return '<article class="card card--grafit theme-graphite card--set" data-set-id="' + esc(s.id) + '" aria-labelledby="' + id + '"' + (s.available ? '' : ' data-soldout') + '>' +
      '<div class="card__media">' + media(s) +
        (s.available ? '<span class="card__flag card__flag--set">Zestaw</span>' : '<span class="card__flag">Chwilowo niedostępny</span>') + '</div>' +
      '<div class="card__body">' +
        '<header class="card__head"><h3 class="card__brand" id="' + id + '">' + esc(nazwa(s.nazwa)) + '</h3>' +
          '<p class="card__name">' + zawartosc(s) + '</p></header>' +
        (s.opis ? '<p class="card__desc card__desc--full">' + esc(s.opis) + '</p>' : '') +
        '<ul class="set-card__list" role="list" aria-label="Skład zestawu">' + (s.sklad || []).map(function (x) {
          var label = '<span><b>' + esc(x.marka) + '</b> ' + esc(x.nazwa) + '</span>';
          var inCatalog = cat && N.findProduct(cat, x.id);
          return '<li' + (x.available ? '' : ' data-missing') + '>' +
            (inCatalog ? '<button type="button" class="set-card__item" data-open-product="' + esc(x.id) + '" aria-haspopup="dialog">' + label + '</button>'
              : '<span class="set-card__item">' + label + '</span>') +
            '<span class="set-card__ml">' + x.ml + '&nbsp;ml</span></li>';
        }).join('') + '</ul>' +
        '<div class="card__buy">' +
          '<div class="card__row"><p class="price">' + U.price(s.price) + '</p></div>' +
          (save ? '<p class="set-card__save">Osobno ' + U.price(s.cenaOsobno) + ', oszczędzasz ' + U.price(save) + '</p>' : '') +
          (missing.length ? '<p class="set-card__missing">Chwilowo brakuje: ' + missing.map(function (x) { return esc(x.marka + ' ' + x.nazwa); }).join(', ') + '</p>' : '') +
          '<div class="card__action" data-set-action>' + action(s) + '</div>' +
        '</div></div></article>';
  }

  function render(catalog) {
    cat = catalog;
    sets = catalog.sets || [];
    if (ONLY.length) sets = ONLY.map(function (id) { return sets.filter(function (s) { return s.id === id; })[0]; }).filter(Boolean);
    var section = root.closest('section');
    if (!sets.length) {
      if (GRID) { root.innerHTML = '<p class="cat-empty">Teraz nie mamy zestawów w sprzedaży. Zajrzyj do zakładki Zapachy.</p>'; return; }
      if (section) section.hidden = true;
      return;
    }
    // dostępne najpierw, potem kolejność z arkusza
    var list = ONLY.length ? sets.slice() : sets.slice().sort(function (a, b) { return Number(b.available) - Number(a.available); });
    root.innerHTML = GRID
      ? '<div class="grid grid--4 grid--sets">' + list.map(gridCard).join('') + '</div>'
      : '<ul class="set-row" role="list">' + list.map(function (s) { return '<li>' + card(s) + '</li>'; }).join('') + '</ul>';
    jump();
  }

  // Wejście z linku /katalog#zestawy: przeglądarka przewija do kotwicy, zanim katalog nad zestawami się wczyta,
  // więc po wczytaniu przewijamy jeszcze raz (raz na wejście).
  var jumped = false;
  function jump() {
    if (GRID || jumped || location.hash !== '#zestawy') return; // w katalogu przewija skrypt zakładek
    jumped = true;
    var section = root.closest('section');
    if (section) requestAnimationFrame(function () { section.scrollIntoView({ block: 'start' }); });
  }

  function swap(el, animate) {
    var s = sets.filter(function (x) { return x.id === el.dataset.setId; })[0];
    var slot = el.querySelector('[data-set-action]');
    slot.innerHTML = action(s);
    if (animate && slot.firstElementChild) {
      M.set(slot.firstElementChild, { opacity: 0, scale: 0.96 });
      M.animate(slot.firstElementChild, { opacity: 1, scale: 1 }, { preset: 'snappy' });
    }
  }

  root.addEventListener('click', function (e) {
    var el = e.target.closest('[data-set-id]');
    if (!el) return;
    var s = sets.filter(function (x) { return x.id === el.dataset.setId; })[0];
    var open = e.target.closest('[data-open-product]');
    if (open) {
      document.dispatchEvent(new CustomEvent('nicci:open-product', { detail: { id: open.dataset.openProduct, trigger: open } }));
      return;
    }
    if (e.target.closest('[data-add-set]')) {
      N.cart.addSet(s.id, 1);
      swap(el, true);
      var plus = el.querySelector('[data-set-qty="1"]');
      if (plus) plus.focus({ preventScroll: true });
      U.bumpCart();
      U.announce('Dodano do koszyka: ' + s.nazwa + '.');
      return;
    }
    var q = e.target.closest('[data-set-qty]');
    if (q) {
      var i = index(s.id);
      if (i === -1) return;
      var next = N.cart.items()[i].qty + Number(q.dataset.setQty);
      N.cart.setQty(i, Math.min(MAX, next));
      swap(el, next <= 0);
      var f = el.querySelector('[data-set-qty="' + q.dataset.setQty + '"]:not([disabled])') || el.querySelector('[data-add-set]') || el.querySelector('[data-set-qty]');
      if (f) f.focus({ preventScroll: true });
      if (Number(q.dataset.setQty) > 0) U.bumpCart();
      U.announce(next <= 0 ? 'Usunięto zestaw z koszyka.' : 'W koszyku ' + Math.min(MAX, next) + ' szt. zestawu.');
    }
  });

  document.addEventListener('nicci:cart-sync', function () { root.querySelectorAll('[data-set-id]').forEach(function (el) { swap(el, false); }); });
  A.catalog().then(render, function () { root.innerHTML = ''; });
  A.onCatalog(render);
})();
