/**
 * NICCI: szuflada koszyka, dostępna z każdej podstrony ([data-open-cart]).
 * Pozycje z Nicci.cart.summary(catalog). Zmiana ilości aktualizuje wiersz w miejscu, bez przebudowy listy.
 * Pasek do darmowej dostawy (summary.toFreeShipping), pozycja niedostępna blokuje dalszy krok,
 * dopóki klient jej nie usunie. Pusty koszyk: jedno zdanie i przycisk do quizu.
 */
(function () {
  'use strict';
  var N = window.Nicci, A = window.NicciApp, U = window.NicciUI, C = window.NicciCard, M = window.NicciMotion;
  var esc = U.esc;
  var MAX = 5;
  var drawer = null, catalog = null;

  function lineMedia(item) {
    if (item.type === 'set') return '<span class="cl__ph cl__ph--set" aria-hidden="true">' + window.NicciIkony.svg('atomizer', { size: 28 }) + '</span>';
    var p = N.findProduct(catalog, item.id);
    if (!p) return '<span class="cl__ph" aria-hidden="true"></span>';
    return '<span class="cl__media">' + C.media(p, { sizes: '4.5rem' }) + '</span>';
  }

  function lineHtml(l, idx) {
    var item = l.item;
    return '<li class="cl" data-index="' + idx + '"' + (l.available ? '' : ' data-unavailable') + '>' +
      lineMedia(item) +
      '<div class="cl__main">' +
        '<p class="cl__name">' + esc(l.nazwa) + '</p>' +
        '<p class="cl__opt">' + esc(l.opis) + ', ' + U.price(l.price) + ' za sztukę</p>' +
        (l.available ? '' : '<p class="cl__warn">Tej pozycji właśnie zabrakło. Usuń ją, żeby przejść dalej.</p>') +
        '<div class="cl__row">' +
          (l.available
            ? '<div class="stepper stepper--sm" role="group" aria-label="Ilość: ' + esc(l.nazwa + ', ' + l.opis) + '">' +
                '<button type="button" data-step="-1" aria-label="Odejmij jedną sztukę">&minus;</button>' +
                '<output aria-live="polite">' + item.qty + '</output>' +
                '<button type="button" data-step="1" aria-label="Dodaj jedną sztukę"' + (item.qty >= MAX ? ' disabled' : '') + '>+</button></div>'
            : '<span></span>') +
          '<button type="button" class="link cl__remove" data-remove>Usuń</button>' +
        '</div>' +
      '</div>' +
      '<p class="cl__sum" data-line-sum>' + U.price(l.total) + '</p>' +
      '</li>';
  }

  function freeShipping(sum) {
    if (sum.toFreeShipping === null) return '';
    var from = catalog.freeShippingFrom;
    var done = sum.toFreeShipping === 0;
    var pct = Math.min(1, sum.subtotal / from);
    return '<div class="cart-free" data-free>' +
      '<p>' + (done ? 'Masz darmową dostawę.' : 'Brakuje <b>' + U.price(sum.toFreeShipping) + '</b> do darmowej dostawy.') + '</p>' +
      '<span class="cart-free__bar" aria-hidden="true"><span style="transform:scaleX(' + pct.toFixed(3) + ')"></span></span></div>';
  }

  function footHtml(sum) {
    var blocked = sum.lines.some(function (l) { return !l.available; });
    var ship = catalog.shipping || {};
    var cheapest = Math.min.apply(null, Object.keys(ship).map(function (k) { return ship[k]; }).filter(function (v) { return v > 0; }).concat([Infinity]));
    return freeShipping(sum) +
      '<div class="cart-total"><span>Razem za zapachy</span><b class="num" data-subtotal>' + U.price(sum.subtotal) + '</b></div>' +
      '<p class="cart-note">' + (sum.toFreeShipping === 0 ? 'Dostawa gratis.' : isFinite(cheapest) ? 'Dostawa od ' + U.price(cheapest) + ', wybierzesz ją w następnym kroku.' : 'Dostawę wybierzesz w następnym kroku.') + '</p>' +
      '<a class="btn btn--primary btn--block" href="' + A.url('/zamowienie') + '"' + (blocked ? ' aria-disabled="true" data-blocked' : '') + '>Przejdź do zamówienia</a>' +
      '<p class="cart-note cart-note--calm">' + (blocked ? 'Najpierw usuń pozycję, której zabrakło.' : 'Teraz nic nie płacisz. Po złożeniu zamówienia trzymamy zapachy przez 24 godziny.') + '</p>';
  }

  function emptyHtml() {
    return '<div class="cart-empty"><p class="cart-empty__title">Koszyk jest pusty</p>' +
      '<p>Nie wiesz, od czego zacząć? Pięć pytań i pokażemy trzy zapachy, które do Ciebie pasują.</p>' +
      '<a class="btn btn--primary" href="' + A.url('/quiz') + '">Dobierz zapach w minutę</a>' +
      '<a class="link" href="' + A.url('/#katalog') + '" data-close-cart>Przejrzyj katalog</a></div>';
  }

  function render() {
    if (!drawer) return;
    var sum = N.cart.summary(catalog);
    if (!sum.lines.length) {
      drawer.body.innerHTML = emptyHtml();
      drawer.foot.hidden = true;
      return;
    }
    drawer.body.innerHTML = '<ul class="cart-list" role="list">' + sum.lines.map(lineHtml).join('') + '</ul>';
    drawer.foot.hidden = false;
    drawer.foot.innerHTML = footHtml(sum);
  }

  /** Po zmianie ilości: tylko liczby w wierszu i stopka, lista zostaje na miejscu (fokus też). */
  function refreshInPlace() {
    var sum = N.cart.summary(catalog);
    if (!sum.lines.length) { render(); return; }
    var rows = drawer.body.querySelectorAll('.cl');
    if (rows.length !== sum.lines.length) { render(); return; }
    sum.lines.forEach(function (l, i) {
      var row = rows[i];
      var out = row.querySelector('output');
      if (out) out.textContent = l.item.qty;
      var plus = row.querySelector('[data-step="1"]');
      if (plus) plus.disabled = l.item.qty >= MAX;
      row.querySelector('[data-line-sum]').textContent = U.price(l.total);
    });
    drawer.foot.innerHTML = footHtml(sum);
  }

  function open(trigger) {
    A.catalog().then(function (c) {
      catalog = c;
      drawer = window.NicciDrawer.open({
        title: 'Koszyk', body: '', trigger: trigger,
        onClose: function () { drawer = null; }
      });
      drawer.root.classList.add('drawer--cart');
      drawer.panel.classList.add('theme-light');
      drawer.foot.classList.add('cart-foot');
      render();
      drawer.root.addEventListener('click', onClick);
    }, function () {
      U.announce('Koszyk chwilowo się nie wczytał. Spróbuj za moment.');
    });
  }

  function onClick(e) {
    if (e.target.closest('[data-close-cart]')) { drawer.close(true); return; }
    var go = e.target.closest('[data-blocked]');
    if (go) { e.preventDefault(); return; }
    var row = e.target.closest('.cl');
    if (!row) return;
    var idx = Number(row.dataset.index);
    var item = N.cart.items()[idx];
    if (!item) return;
    var step = e.target.closest('[data-step]');
    if (step) {
      var next = item.qty + Number(step.dataset.step);
      if (next <= 0) { removeRow(row, idx); return; }
      N.cart.setQty(idx, Math.min(MAX, next));
      refreshInPlace();
      if (Number(step.dataset.step) > 0) U.bumpCart();
      U.announce('Ilość: ' + Math.min(MAX, next) + '.');
      document.dispatchEvent(new CustomEvent('nicci:cart-sync'));
      return;
    }
    if (e.target.closest('[data-remove]')) removeRow(row, idx);
  }

  function removeRow(row, idx) {
    var name = row.querySelector('.cl__name').textContent;
    var finish = function () {
      N.cart.remove(idx);
      render();
      document.dispatchEvent(new CustomEvent('nicci:cart-sync'));
      U.announce('Usunięto z koszyka: ' + name + '.');
      var rows = drawer && drawer.body.querySelectorAll('.cl');
      var focus = rows && rows.length ? rows[Math.min(idx, rows.length - 1)].querySelector('[data-remove]') : drawer && drawer.body.querySelector('a, button');
      if (focus) focus.focus({ preventScroll: true });
    };
    if (M.reduced()) { finish(); return; }
    M.animate(row, { opacity: 0, x: 24 }, { preset: 'snappy', onDone: finish });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-open-cart]');
    if (!b) return;
    e.preventDefault();
    open(b);
  });
  // inna karta albo inny moduł zmienił koszyk, gdy szuflada jest otwarta
  document.addEventListener('nicci:cart-sync', function () { if (drawer && catalog && !drawer.root.contains(document.activeElement)) render(); });

  window.NicciKoszyk = { open: open };
})();
