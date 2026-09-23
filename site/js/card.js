/**
 * NICCI: karta produktu w siatce.
 *   NicciCard.render(product, {variant:'krem'|'grafit', img, imgW, imgH, noteImg}) → HTML
 *   NicciCard.mount(root)  obsługa zdarzeń dla wszystkich kart wewnątrz root (delegacja)
 * Zdarzenia na dokumencie: nicci:open-product {id}, nicci:similar {id}.
 */
(function () {
  'use strict';
  var U = window.NicciUI;
  var M = window.NicciMotion;
  var MAX = 5;
  var uid = 0;

  function defaultVariant(p) {
    var av = U.availableVariants(p);
    return av.length ? av[0].ml : null;
  }

  function actionHtml(p, ml) {
    if (U.isSoldOut(p)) {
      return '<button type="button" class="btn btn--outline btn--block" data-similar>Zobacz podobne</button>';
    }
    var qty = U.cartQty(p.id, ml);
    if (!qty) {
      return '<button type="button" class="btn btn--primary btn--block" data-add>Dodaj do koszyka</button>';
    }
    return '<div class="card__incart">' +
      '<p>W koszyku<span>' + ml + ' ml, zmień ilość tutaj</span></p>' +
      '<div class="stepper" role="group" aria-label="Ilość ' + ml + ' ml">' +
        '<button type="button" data-qty="-1" aria-label="Odejmij jedną sztukę">&minus;</button>' +
        '<output aria-live="polite">' + qty + '</output>' +
        '<button type="button" data-qty="1" aria-label="Dodaj jedną sztukę"' + (qty >= MAX ? ' disabled' : '') + '>+</button>' +
      '</div></div>';
  }

  function render(p, opts) {
    opts = opts || {};
    var variant = opts.variant === 'grafit' ? 'grafit' : 'krem';
    var soldOut = U.isSoldOut(p);
    var ml = defaultVariant(p);
    var v = ml ? p.variants.filter(function (x) { return x.ml === ml; })[0] : null;
    var id = 'c' + (++uid);
    var tags = U.tags(p);
    var notes = U.keyNotes(p, 4);
    var h = [];

    h.push('<article class="card card--' + variant + (variant === 'grafit' ? ' theme-graphite' : '') + '"' +
      ' data-card data-id="' + U.esc(p.id) + '"' + (soldOut ? ' data-soldout' : '') + ' aria-labelledby="' + id + '-t">');
    h.push('<div class="card__media">');
    if (opts.img) {
      h.push('<img src="' + U.esc(opts.img) + '" alt="' + U.esc(p.marka + ' ' + p.nazwa + ', flakon') + '"' +
        ' width="' + (opts.imgW || 800) + '" height="' + (opts.imgH || 1000) + '" loading="lazy" decoding="async">');
    }
    if (soldOut) h.push('<span class="card__flag">Wyprzedane</span>');
    h.push('</div><div class="card__body">');

    h.push('<header class="card__head"><p class="card__brand">' + U.esc(p.marka) + '</p>' +
      '<h3 class="card__name" id="' + id + '-t">' + U.esc(p.nazwa) + '</h3></header>');
    if (tags.length) {
      h.push('<ul class="chips" aria-label="Charakter zapachu">' + tags.map(function (t) {
        return '<li class="chip">' + U.esc(t) + '</li>';
      }).join('') + '</ul>');
    }
    if (p.malo && p.zostalo) {
      h.push('<p class="scarcity">Zostało ' + p.zostalo + '&nbsp;ml z tego flakonu</p>');
    }
    if (notes.length) {
      h.push('<ul class="notes" aria-label="Kluczowe nuty">' + notes.map(function (n) {
        var img = opts.noteImg && opts.noteImg(n);
        return '<li class="note">' + (img
          ? '<img class="note__img" src="' + U.esc(img) + '" alt="" width="104" height="104" loading="lazy">'
          : '<span class="note__ph" aria-hidden="true">' + U.esc(n.charAt(0)) + '</span>') +
          '<span class="note__label">' + U.esc(n) + '</span></li>';
      }).join('') + '</ul>');
    }
    if (p.opis) {
      h.push('<p class="card__desc">' + U.esc(p.opis) + '</p>' +
        '<button type="button" class="link card__more" data-open aria-haspopup="dialog">Rozwiń opis</button>');
    }

    h.push('<div class="card__buy">');
    if (!soldOut && p.variants.length) {
      h.push('<fieldset class="seg"><legend class="visually-hidden">Pojemność</legend>');
      p.variants.forEach(function (x) {
        var tipId = id + '-tip' + x.ml;
        h.push('<label class="seg__opt"><input type="radio" name="' + id + '-ml" value="' + x.ml + '"' +
          (x.ml === ml ? ' checked' : '') +
          (x.available ? '' : ' aria-disabled="true" aria-describedby="' + tipId + '"') + '>' +
          '<span>' + x.ml + '&nbsp;ml</span>' +
          (x.available ? '' : '<span class="seg__tip" role="tooltip" id="' + tipId + '">Tej pojemności chwilowo brakuje</span>') +
          '</label>');
      });
      h.push('</fieldset>');
      h.push('<div class="card__row"><p class="price" data-price aria-live="polite">' + (v ? U.price(v.price) : '') + '</p></div>');
    }
    h.push('<div class="card__action" data-action>' + actionHtml(p, ml) + '</div>');
    h.push('</div></div></article>');
    return h.join('');
  }

  // ---------- zachowanie ----------
  var products = {};
  var priceSprings = new WeakMap();

  function register(list) { list.forEach(function (p) { products[p.id] = p; }); }

  function selectedMl(card) {
    var r = card.querySelector('.seg input:checked');
    return r ? Number(r.value) : null;
  }

  function swapAction(card, animate) {
    var p = products[card.dataset.id];
    var slot = card.querySelector('[data-action]');
    slot.innerHTML = actionHtml(p, selectedMl(card));
    if (animate) {
      var child = slot.firstElementChild;
      M.set(child, { opacity: 0, scale: 0.96 });
      M.animate(child, { opacity: 1, scale: 1 }, { preset: 'snappy' });
    }
  }

  function updatePrice(card) {
    var p = products[card.dataset.id];
    var ml = selectedMl(card);
    var v = p.variants.filter(function (x) { return x.ml === ml; })[0];
    var el = card.querySelector('[data-price]');
    if (!v || !el) return;
    var s = priceSprings.get(el);
    if (!s) {
      var start = Number(el.dataset.value || v.price);
      s = M.value(start, function (x) {
        // w trakcie ruchu pełne złote, w spoczynku dokładna cena (np. 110,50 zł)
        var target = Number(el.dataset.value);
        el.textContent = U.price(x === target ? x : Math.round(x / 100) * 100);
      }, { preset: 'ui' });
      priceSprings.set(el, s);
    }
    el.dataset.value = v.price;
    s.to(v.price);
    // czytnik dostaje dokładną cenę od razu, bez klatek pośrednich
    el.setAttribute('aria-label', 'Cena ' + ml + ' ml: ' + U.price(v.price));
  }

  function onChange(e) {
    var input = e.target;
    if (!input.matches('.seg input')) return;
    var card = input.closest('[data-card]');
    if (input.getAttribute('aria-disabled') === 'true') {
      // wariant niedostępny: wracamy do poprzedniego wyboru
      var prev = card.dataset.ml;
      var back = card.querySelector('.seg input[value="' + prev + '"]');
      if (back) back.checked = true;
      return;
    }
    card.dataset.ml = input.value;
    updatePrice(card);
    swapAction(card, false);
  }

  function onClick(e) {
    var card = e.target.closest('[data-card]');
    if (!card) return;
    if (e.target.matches('.seg input[aria-disabled="true"]')) { e.preventDefault(); return; }
    var p = products[card.dataset.id];
    var ml = selectedMl(card);

    if (e.target.closest('[data-add]')) {
      window.Nicci.cart.addDecant(p.id, ml, 1);
      swapAction(card, true);
      var focusTarget = card.querySelector('[data-qty="1"]');
      if (focusTarget) focusTarget.focus({ preventScroll: true });
      U.bumpCart();
      U.announce('Dodano do koszyka: ' + p.marka + ' ' + p.nazwa + ', ' + ml + ' ml.');
      return;
    }
    var q = e.target.closest('[data-qty]');
    if (q) {
      var idx = U.cartIndex(p.id, ml);
      if (idx === -1) return;
      var next = window.Nicci.cart.items()[idx].qty + Number(q.dataset.qty);
      window.Nicci.cart.setQty(idx, Math.min(MAX, next));
      if (next <= 0) {
        swapAction(card, true);
        var add = card.querySelector('[data-add]');
        if (add) add.focus({ preventScroll: true });
        U.announce('Usunięto z koszyka: ' + p.marka + ' ' + p.nazwa + ', ' + ml + ' ml.');
      } else {
        swapAction(card, false);
        var same = card.querySelector('[data-qty="' + q.dataset.qty + '"]:not([disabled])') || card.querySelector('[data-qty]');
        if (same) same.focus({ preventScroll: true });
        if (Number(q.dataset.qty) > 0) U.bumpCart();
        U.announce('W koszyku ' + Math.min(MAX, next) + ' szt. ' + ml + ' ml.' + (next >= MAX ? ' To maksymalna liczba sztuk.' : ''));
      }
      return;
    }
    if (e.target.closest('[data-open]')) {
      document.dispatchEvent(new CustomEvent('nicci:open-product', { detail: { id: p.id, trigger: e.target.closest('[data-open]') } }));
      return;
    }
    if (e.target.closest('[data-similar]')) {
      document.dispatchEvent(new CustomEvent('nicci:similar', { detail: { id: p.id, trigger: e.target.closest('[data-similar]') } }));
    }
  }

  function mount(root, list) {
    register(list || []);
    root.querySelectorAll('[data-card]').forEach(function (card) {
      var ml = selectedMl(card);
      if (ml) card.dataset.ml = ml;
      var price = card.querySelector('[data-price]');
      var p = products[card.dataset.id];
      var v = p && p.variants.filter(function (x) { return x.ml === ml; })[0];
      if (price && v) price.dataset.value = v.price;
    });
    if (root.dataset.cardsMounted) return;
    root.dataset.cardsMounted = '1';
    root.addEventListener('change', onChange);
    root.addEventListener('click', onClick);
    document.addEventListener('nicci:cart-sync', function () {
      root.querySelectorAll('[data-card]').forEach(function (c) { swapAction(c, false); });
    });
  }

  window.NicciCard = { render: render, mount: mount, register: register };
})();
