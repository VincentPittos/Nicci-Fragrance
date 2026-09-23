/**
 * NICCI: wspólne narzędzia widoku. Formatowanie i etykiety, bez logiki biznesowej
 * (koszyk, ceny i quiz są w nicci-api.js).
 */
(function () {
  'use strict';

  var NBSP = ' ';

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /** Grosze → „110 zł” albo „110,50 zł”. */
  function price(grosze) {
    var zl = grosze / 100;
    var txt = Math.round(zl) === zl ? String(zl) : zl.toFixed(2).replace('.', ',');
    return txt.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) + NBSP + 'zł';
  }

  function cap(s) {
    s = String(s || '').trim();
    return s ? s.charAt(0).toLocaleUpperCase('pl') + s.slice(1) : s;
  }

  var PORA = { 'dzień': 'Na dzień', 'wieczór': 'Na wieczór', 'uniwersalna': 'Dzień i wieczór' };
  var PROFIL = { 'męski': 'Męski', 'damski': 'Damski', 'unisex': 'Unisex' };

  /** Etykiety zamiast gwiazdek: rodzina, pora dnia, profil. Puste pola nie dają etykiety. */
  function tags(p) {
    var out = [];
    if (p.rodzina) out.push(cap(p.rodzina));
    if (PORA[p.pora]) out.push(PORA[p.pora]);
    if (PROFIL[p.profil]) out.push(PROFIL[p.profil]);
    return out;
  }

  /**
   * Cztery kluczowe nuty: na przemian z głowy, serca i bazy, żeby karta pokazała cały przebieg zapachu.
   * Dopisek w nawiasie zostaje w piramidzie w szczegółach, na karcie skracamy etykietę.
   */
  function keyNotes(p, n) {
    n = n || 4;
    var tiers = [p.nuty.glowy || [], p.nuty.serca || [], p.nuty.bazy || []];
    var out = [], seen = {};
    for (var i = 0; out.length < n && i < 12; i++) {
      var tier = tiers[i % 3], note = tier[Math.floor(i / 3)];
      if (!note) continue;
      var label = cap(note.replace(/\s*\(.*?\)\s*/g, ' ').trim());
      var key = label.toLocaleLowerCase('pl');
      if (seen[key]) continue;
      seen[key] = true;
      out.push(label);
    }
    return out;
  }

  function availableVariants(p) { return p.variants.filter(function (v) { return v.available; }); }
  function isSoldOut(p) { return availableVariants(p).length === 0; }

  // ---------- koszyk: odczyt stanu pozycji (logika zostaje w Nicci.cart) ----------
  function cartIndex(id, ml) {
    var items = window.Nicci.cart.items();
    for (var i = 0; i < items.length; i++) {
      if (items[i].type === 'decant' && items[i].id === id && items[i].ml === ml) return i;
    }
    return -1;
  }
  function cartQty(id, ml) {
    var i = cartIndex(id, ml);
    return i === -1 ? 0 : window.Nicci.cart.items()[i].qty;
  }

  // ---------- komunikaty dla czytników ekranu ----------
  var live;
  function announce(msg) {
    if (!live) {
      live = document.createElement('div');
      live.className = 'visually-hidden';
      live.setAttribute('aria-live', 'polite');
      live.setAttribute('role', 'status');
      document.body.appendChild(live);
    }
    live.textContent = '';
    setTimeout(function () { live.textContent = msg; }, 30);
  }

  // ---------- ikona koszyka: licznik i ruch po dodaniu ----------
  function syncCartCount() {
    var n = window.Nicci.cart.count();
    document.querySelectorAll('[data-cart-count]').forEach(function (el) { el.textContent = n ? String(n) : ''; });
    document.querySelectorAll('[data-cart-button]').forEach(function (b) {
      b.setAttribute('aria-label', n ? 'Koszyk, ' + n + ' szt.' : 'Koszyk, pusty');
    });
  }

  function bumpCart() {
    var M = window.NicciMotion;
    document.querySelectorAll('[data-cart-button] svg').forEach(function (icon) {
      M.animate(icon, { scale: 1.14, rotate: -7 }, { preset: 'snappy', onDone: function () {
        M.animate(icon, { scale: 1, rotate: 0 }, { preset: 'lift' });
      } });
    });
  }

  function initCart() {
    syncCartCount();
    window.Nicci.cart.onChange(syncCartCount);
    // inna karta przeglądarki zmieniła koszyk
    window.addEventListener('storage', function (e) {
      if (e.key === window.Nicci.CONFIG.CART_KEY) {
        syncCartCount();
        document.dispatchEvent(new CustomEvent('nicci:cart-sync'));
      }
    });
  }

  window.NicciUI = {
    esc: esc, price: price, cap: cap, tags: tags, keyNotes: keyNotes, availableVariants: availableVariants,
    isSoldOut: isSoldOut, cartIndex: cartIndex, cartQty: cartQty, announce: announce,
    syncCartCount: syncCartCount, bumpCart: bumpCart, initCart: initCart
  };
})();
