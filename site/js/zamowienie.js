/**
 * NICCI: formularz /zamowienie.
 * Walidacja lustrzana do validateOrder_ w apps-script/Code.gs: te same reguły, nazwy pól i limity.
 * Sprawdzamy pole po opuszczeniu (blur), a po pierwszej próbie wysłania także w trakcie poprawiania.
 * Błędy przy polach i jedno podsumowanie u góry. Przycisk zablokowany na czas wysyłki.
 * Odpowiedzi: ok → /potwierdzenie, validation → pola z res.fields, out_of_stock → lista braków
 * z podobnymi i odświeżony katalog, reszta → res.message z nicci-api.js.
 */
(function () {
  'use strict';
  var N = window.Nicci, A = window.NicciApp, U = window.NicciUI, C = window.NicciCard;
  var esc = U.esc;
  var form = document.querySelector('[data-order-form]');
  if (!form) return;
  // podsumowanie na komputerze (z boku) i na telefonie (zwinięte u góry): ta sama treść w obu miejscach
  var summaryBox = { set innerHTML(h) { document.querySelectorAll('[data-order-summary], [data-order-summary-mobile]').forEach(function (b) { b.innerHTML = h; }); } };
  var errorBox = document.querySelector('[data-error-summary]');
  var alertBox = document.querySelector('[data-order-alert]');
  var submit = form.querySelector('[data-submit]');
  var catalog = null;
  var tried = false;

  function clean(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max); }
  function val(name) { var el = form.elements[name]; return el ? (el.type === 'checkbox' ? el.checked : el.value) : ''; }
  function method() { var r = form.querySelector('input[name="delivery"]:checked'); return r ? r.value : ''; }
  function payment() { var r = form.querySelector('input[name="payment"]:checked'); return r ? r.value : ''; }
  function voucherCode() { return String(val('voucher')).toUpperCase().replace(/\s+/g, ''); }
  var voucherRejected = '', voucherRejectedMsg = ''; // kod odrzucony przez backend i powód po polsku

  // ---------- reguły jak w Code.gs ----------
  var RULES = {
    name: function () { return clean(val('name'), 100).length >= 3; },
    email: function () { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean(val('email'), 120).toLowerCase()); },
    phone: function () { var d = clean(val('phone'), 30).replace(/\D/g, ''); return d.length >= 9 && d.length <= 15; },
    instagram: function () { var v = clean(val('instagram'), 60).replace(/^@+/, ''); return !v || /^[A-Za-z0-9._]{1,30}$/.test(v); },
    delivery: function () { return method() === 'paczkomat' || method() === 'kurier'; },
    paczkomat: function () { return method() !== 'paczkomat' || /^[A-Z0-9-]{4,12}$/.test(clean(val('paczkomat'), 20).toUpperCase().replace(/\s+/g, '')); },
    street: function () { return method() !== 'kurier' || clean(val('street'), 120).length >= 3; },
    postcode: function () { return method() !== 'kurier' || /^\d{2}-\d{3}$/.test(clean(val('postcode'), 10)); },
    city: function () { return method() !== 'kurier' || clean(val('city'), 60).length >= 2; },
    payment: function () { return payment() === 'blik' || payment() === 'przelew'; },
    note: function () { return String(val('note')).replace(/\r\n/g, '\n').length <= 300; },
    voucher: function () {
      var v = voucherCode();
      MSG.voucher = v && v === voucherRejected ? voucherRejectedMsg : VOUCHER_FORMAT;
      if (v && v === voucherRejected) return false;
      return !v || /^[A-Z0-9-]{4,20}$/.test(v);
    },
    regulamin: function () { return val('regulamin') === true; },
    prywatnosc: function () { return val('prywatnosc') === true; }
  };
  var MSG = {
    name: 'Wpisz imię i nazwisko, tak jak ma być na paczce.',
    email: 'Sprawdź adres e-mail. Wyślemy na niego dane do płatności.',
    phone: 'Wpisz numer telefonu, co najmniej 9 cyfr. Na ten numer przyjdzie kod odbioru paczki.',
    instagram: 'Nazwa na Instagramie może mieć tylko litery, cyfry, kropkę i podkreślnik.',
    delivery: 'Wybierz sposób dostawy.',
    paczkomat: 'Wpisz kod paczkomatu, na przykład WAW12M.',
    street: 'Wpisz ulicę i numer domu.',
    postcode: 'Wpisz kod pocztowy w formacie 00-000.',
    city: 'Wpisz miejscowość.',
    payment: 'Wybierz sposób płatności.',
    note: 'Uwagi mogą mieć najwyżej 300 znaków.',
    voucher: '',
    regulamin: 'Zaakceptuj regulamin, żeby złożyć zamówienie.',
    prywatnosc: 'Potwierdź, że znasz politykę prywatności.',
    items: 'Koszyk jest pusty albo nieaktualny. Wróć do katalogu i dodaj zapachy jeszcze raz.'
  };
  var LABEL = {
    name: 'Imię i nazwisko', email: 'E-mail', phone: 'Telefon', instagram: 'Instagram', delivery: 'Dostawa',
    paczkomat: 'Kod paczkomatu', street: 'Ulica i numer', postcode: 'Kod pocztowy', city: 'Miejscowość',
    payment: 'Płatność', note: 'Uwagi', voucher: 'Kod bonu', regulamin: 'Regulamin', prywatnosc: 'Polityka prywatności', items: 'Koszyk'
  };

  var VOUCHER_FORMAT = 'Kod bonu ma od 4 do 20 znaków: litery, cyfry i łączniki, tak jak w mailu od nas.';
  MSG.voucher = VOUCHER_FORMAT;
  /** Komunikat dla bonu odrzuconego przez backend. */
  function voucherMsg(v) {
    if (v.reason === 'wykorzystany') return 'Ten bon został już wykorzystany.';
    if (v.reason === 'wygasl') return 'Ten bon stracił ważność.';
    if (v.reason === 'prog') return 'Bon działa, gdy zapachy kosztują co najmniej ' + U.price(v.prog) + '. Brakuje ' + U.price(v.brakuje) + '.';
    return 'Nie znamy tego kodu. Sprawdź, czy jest przepisany tak jak w mailu od nas.';
  }

  function fieldBox(name) { return form.querySelector('[data-field="' + name + '"]'); }

  function setError(name, bad) {
    var box = fieldBox(name);
    if (!box) return;
    var input = box.querySelector('input, textarea, select');
    var err = box.querySelector('.field__error');
    if (bad) {
      box.setAttribute('data-invalid', '');
      if (err) err.textContent = MSG[name];
      box.querySelectorAll('input, textarea').forEach(function (i) { i.setAttribute('aria-invalid', 'true'); });
    } else {
      box.removeAttribute('data-invalid');
      box.querySelectorAll('input, textarea').forEach(function (i) { i.removeAttribute('aria-invalid'); });
    }
    return input;
  }

  function check(name) {
    if (!RULES[name]) return true;
    var ok = RULES[name]();
    setError(name, !ok);
    refreshSummary();
    return ok;
  }

  function checkAll() { return Object.keys(RULES).filter(function (n) { return !check(n); }); }

  function showSummary(bad, quiet) {
    if (!bad.length) { errorBox.hidden = true; errorBox.innerHTML = ''; return; }
    errorBox.innerHTML = '<h2 class="err-sum__title" tabindex="-1">Popraw ' + bad.length + ' ' + A.plural(bad.length, ['pole', 'pola', 'pól']) + ', żeby złożyć zamówienie</h2>' +
      '<ul role="list">' + bad.map(function (n) {
        return '<li><a href="#f-' + n + '" data-jump="' + n + '">' + LABEL[n] + ': ' + MSG[n] + '</a></li>';
      }).join('') + '</ul>';
    errorBox.hidden = false;
    if (!quiet) errorBox.querySelector('.err-sum__title').focus();
  }

  /** Po pierwszej próbie wysłania podsumowanie nadąża za poprawkami: znika pozycja, a na końcu całe pole. */
  function refreshSummary() {
    if (!tried || errorBox.hidden) return;
    var bad = Object.keys(RULES).filter(function (n) { return !RULES[n](); });
    showSummary(bad, true);
  }

  errorBox.addEventListener('click', function (e) {
    var a = e.target.closest('[data-jump]');
    if (!a) return;
    e.preventDefault();
    var box = fieldBox(a.dataset.jump);
    var input = box && box.querySelector('input:not([type="hidden"]), textarea');
    if (input) { input.focus(); input.scrollIntoView({ block: 'center' }); }
  });

  // ---------- zachowanie pól ----------
  form.addEventListener('focusout', function (e) {
    var name = e.target.name;
    if (!name || !RULES[name] || e.target.type === 'radio' || e.target.type === 'checkbox') return;
    // pusty opcjonalny Instagram i pola, których jeszcze nie ruszano, nie dostają błędu przed czasem
    if (!tried && !e.target.value) return;
    check(name);
  });
  form.addEventListener('input', function (e) {
    var t = e.target;
    if (t.name === 'paczkomat' || t.name === 'voucher') { var p = t.selectionStart; t.value = t.value.toUpperCase(); t.setSelectionRange(p, p); }
    if (t.name === 'voucher') renderSummary();
    if (t.name === 'postcode') {
      var d = t.value.replace(/\D/g, '').slice(0, 5);
      t.value = d.length > 2 ? d.slice(0, 2) + '-' + d.slice(2) : d;
    }
    if (t.name === 'note') {
      var left = 300 - t.value.length;
      form.querySelector('[data-note-count]').textContent = left >= 0 ? 'Zostało ' + left + ' ' + A.plural(left, ['znak', 'znaki', 'znaków']) : 'O ' + (-left) + ' za dużo';
    }
    if (tried || (fieldBox(t.name) && fieldBox(t.name).hasAttribute('data-invalid'))) check(t.name);
  });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'delivery') { syncDelivery(); renderSummary(); }
    if (e.target.type === 'checkbox' || e.target.type === 'radio') { if (tried || fieldBox(e.target.name).hasAttribute('data-invalid')) check(e.target.name); }
  });

  function syncDelivery() {
    var m = method();
    form.querySelectorAll('[data-for-delivery]').forEach(function (el) {
      var on = el.dataset.forDelivery === m;
      el.hidden = !on;
      el.querySelectorAll('input').forEach(function (i) { i.required = on && i.hasAttribute('data-required'); });
    });
    ['paczkomat', 'street', 'postcode', 'city'].forEach(function (n) { if (!fieldBox(n) || fieldBox(n).closest('[hidden]')) setError(n, false); });
  }

  // ---------- podsumowanie ----------
  function renderSummary() {
    if (!catalog) return;
    var m = method();
    var sum = N.cart.summary(catalog, m || null);
    var n = N.cart.count();
    // bon: podgląd rabatu z ustawień katalogu; ostatecznie kod i kwotę sprawdza backend przy składaniu zamówienia
    var code = voucherCode(), bon = catalog.bon, disc = 0, bonRow = '';
    if (bon && bon.prog) document.querySelectorAll('[data-bon-prog]').forEach(function (el) { el.textContent = U.price(bon.prog); });
    if (code && RULES.voucher() && bon && bon.kwota) {
      if (sum.subtotal >= bon.prog) disc = Math.min(bon.kwota, sum.subtotal);
      bonRow = '<div class="os__bon"><dt>Bon ' + esc(code) + '</dt><dd>' + (disc ? '−' + U.price(disc) : 'od ' + U.price(bon.prog) + ' za zapachy') + '</dd></div>';
    }
    var total = sum.total - disc;
    document.querySelectorAll('[data-sum-count]').forEach(function (el) { el.textContent = n + ' szt.'; });
    document.querySelectorAll('[data-sum-total]').forEach(function (el) { el.textContent = U.price(total); });
    if (!sum.lines.length) {
      summaryBox.innerHTML = '<p class="os__empty">Koszyk jest pusty.</p><a class="btn btn--primary btn--block" href="' + A.url('/#katalog') + '">Wróć do katalogu</a>';
      submit.disabled = true;
      return;
    }
    submit.disabled = false;
    var blocked = sum.lines.some(function (l) { return !l.available; });
    summaryBox.innerHTML =
      '<ul class="os__list" role="list">' + sum.lines.map(function (l) {
        var p = l.item.type === 'decant' ? N.findProduct(catalog, l.item.id) : null;
        return '<li class="os__line"' + (l.available ? '' : ' data-unavailable') + '>' +
          (p ? '<span class="os__media">' + C.media(p, { sizes: '3.5rem' }) + '</span>' : '<span class="os__media os__media--set" aria-hidden="true">' + window.NicciIkony.svg('atomizer', { size: 24 }) + '</span>') +
          '<span class="os__name">' + esc(l.nazwa) + '<small>' + esc(l.opis) + (l.item.qty > 1 ? ', ' + l.item.qty + ' szt.' : '') + (l.available ? '' : ', zabrakło') + '</small></span>' +
          '<span class="os__price">' + U.price(l.total) + '</span></li>';
      }).join('') + '</ul>' +
      '<dl class="os__totals">' +
        '<div><dt>Zapachy</dt><dd>' + U.price(sum.subtotal) + '</dd></div>' +
        '<div><dt>Dostawa' + (m ? (m === 'paczkomat' ? ', paczkomat' : ', kurier') : '') + '</dt><dd>' + (sum.shipping === null ? 'wybierz niżej' : sum.shipping === 0 ? 'gratis' : U.price(sum.shipping)) + '</dd></div>' +
        bonRow +
        '<div class="os__grand"><dt>Do zapłaty</dt><dd>' + U.price(total) + '</dd></div>' +
      '</dl>' +
      (sum.toFreeShipping ? '<p class="os__free">Dodaj zapachy za ' + U.price(sum.toFreeShipping) + ', a dostawa będzie gratis.</p>' : '') +
      (blocked ? '<p class="os__warn">W koszyku jest pozycja, której zabrakło. Usuń ją w koszyku, żeby złożyć zamówienie.</p>' : '') +
      '<button type="button" class="link" data-open-cart>Zmień koszyk</button>';
    submit.disabled = blocked;
    // ceny dostawy przy wyborze metody
    Object.keys(catalog.shipping || {}).forEach(function (k) {
      var el = form.querySelector('[data-ship-price="' + k + '"]');
      if (!el) return;
      var free = catalog.freeShippingFrom > 0 && sum.subtotal >= catalog.freeShippingFrom;
      el.textContent = free ? 'gratis' : U.price(catalog.shipping[k]);
    });
  }

  // ---------- wysyłka ----------
  function payload() {
    return {
      customer: { name: val('name'), email: val('email'), phone: val('phone'), instagram: String(val('instagram')).replace(/^@+/, '') },
      delivery: { method: method(), paczkomat: val('paczkomat'), street: val('street'), postcode: val('postcode'), city: val('city') },
      payment: payment(),
      consents: { regulamin: val('regulamin') === true, prywatnosc: val('prywatnosc') === true },
      note: val('note'),
      voucher: voucherCode(),
      website: val('website')
    };
  }

  function busy(on) {
    submit.disabled = on;
    if (on) submit.setAttribute('aria-busy', 'true'); else submit.removeAttribute('aria-busy');
    form.toggleAttribute('data-sending', on);
  }

  function showAlert(html) {
    alertBox.innerHTML = html;
    alertBox.hidden = !html;
    if (html) { alertBox.setAttribute('tabindex', '-1'); alertBox.focus(); }
  }

  function shortagesHtml(list) {
    return '<h2 class="oa__title">Części zapachów mamy mniej, niż jest w koszyku</h2>' +
      '<p>Stany zmieniają się na bieżąco. Zmień ilość albo wybierz podobny zapach i złóż zamówienie jeszcze raz.</p>' +
      '<ul class="oa__list" role="list">' + list.map(function (s) {
        return '<li><b>' + esc(s.nazwa) + '</b>: ' + (s.zostalo > 0 ? 'zostało ' + s.zostalo + '&nbsp;ml, a w koszyku potrzeba ' + s.potrzeba + '&nbsp;ml' : 'nie ma go już na stanie') +
          (s.podobne && s.podobne.length ? '<span class="oa__alt">Podobne: ' + s.podobne.map(function (p) {
            return '<a class="link" href="' + A.url('/?produkt=' + encodeURIComponent(p.id)) + '#katalog">' + esc(p.nazwa) + '</a>';
          }).join(', ') + '</span>' : '') + '</li>';
      }).join('') + '</ul><button type="button" class="btn btn--outline" data-open-cart>Otwórz koszyk</button>';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    tried = true;
    showAlert('');
    var bad = checkAll();
    if (!N.cart.items().length) bad.push('items');
    if (bad.length) { showSummary(bad); return; }
    showSummary([]);
    busy(true);
    N.createOrder(payload()).then(function (res) {
      if (res.ok) {
        A.dropCatalog();
        location.href = A.url('/potwierdzenie');
        return;
      }
      busy(false);
      if (res.error === 'validation') {
        if (res.voucher && res.voucher.reason) { voucherRejected = voucherCode(); voucherRejectedMsg = MSG.voucher = voucherMsg(res.voucher); renderSummary(); }
        var fields = (res.fields || []).filter(function (f) { return MSG[f]; });
        fields.forEach(function (f) { setError(f, true); });
        showSummary(fields.length ? fields : ['items']);
        return;
      }
      if (res.error === 'out_of_stock') {
        showAlert(shortagesHtml(res.shortages || []));
        A.dropCatalog();
        A.catalog(true).then(function (c) { catalog = c; renderSummary(); }, function () {});
        return;
      }
      showAlert('<h2 class="oa__title">Zamówienie jeszcze nie poszło</h2><p>' + esc(res.message || 'Spróbuj ponownie za chwilę.') + '</p>');
    });
  });

  // ---------- start ----------
  N.cart.onChange(renderSummary);
  document.addEventListener('nicci:cart-sync', renderSummary);
  syncDelivery();
  // podsumowanie od razu z zapisanego katalogu, potem świeże ceny i stany przed złożeniem zamówienia
  A.catalog().then(function (c) {
    catalog = c; renderSummary();
    A.catalog(true).then(function (f) { catalog = f; renderSummary(); }, function () {});
  }, function () {
    summaryBox.innerHTML = '<p class="os__empty">Podsumowanie chwilowo się nie wczytało. Odśwież stronę, koszyk jest zapisany.</p>';
  });
})();
