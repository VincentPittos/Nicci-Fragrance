/**
 * NICCI: /potwierdzenie. Dane z Nicci.lastOrder() (przetrwają odświeżenie strony).
 * Karta płatności wybranej metody z kopiowaniem każdego pola, druga metoda zwinięta niżej.
 * Termin rezerwacji jako data i godzina (terminTxt z backendu), bez odliczania sekund.
 * Przycisk Instagrama jest dodatkiem i niczego nie blokuje.
 */
(function () {
  'use strict';
  var N = window.Nicci, A = window.NicciApp, U = window.NicciUI;
  var esc = U.esc;
  var root = document.querySelector('[data-confirm]');
  if (!root) return;
  var o = N.lastOrder();

  if (!o || !o.numer) {
    root.innerHTML = '<div class="confirm__empty"><h1 class="order__title">Nie widzimy tu zamówienia</h1>' +
      '<p>Jeśli zamówienie zostało złożone, dane do płatności są w mailu od nas. Nie ma go? Zajrzyj do folderu Oferty albo Spam.</p>' +
      '<p class="confirm__actions"><a class="btn btn--primary" href="' + A.url('/#katalog') + '">Wróć do katalogu</a></p></div>';
    return;
  }

  var amount = (o.kwota / 100).toFixed(2).replace('.', ','); // do pola kwoty w aplikacji banku, bez „zł”
  var d = o.dane || {};

  function row(label, value, copyValue) {
    return '<div class="pay__row"><dt>' + label + '</dt><dd><span class="pay__val">' + esc(value) + '</span>' +
      '<button type="button" class="pay__copy" data-copy="' + esc(copyValue == null ? value : copyValue) + '" aria-label="Kopiuj: ' + esc(label) + '">Kopiuj</button></dd></div>';
  }

  function card(method, open) {
    if (method === 'blik') {
      var b = d.blik || {};
      return '<section class="pay' + (open ? ' pay--main' : '') + '" aria-labelledby="pay-blik">' +
        '<h2 class="pay__title" id="pay-blik">Zapłać BLIKiem na telefon</h2>' +
        '<p class="pay__how">W aplikacji banku wybierz przelew na telefon BLIK i przepisz te dane.</p>' +
        '<dl class="pay__list">' +
          row('Numer telefonu', b.telefon || '', String(b.telefon || '').replace(/\s/g, '')) +
          row('Kwota', o.kwotaTxt, amount) +
          row('Tytuł', o.tytul) +
          row('Odbiorca', b.odbiorca || '') +
        '</dl></section>';
    }
    var p = d.przelew || {};
    return '<section class="pay' + (open ? ' pay--main' : '') + '" aria-labelledby="pay-przelew">' +
      '<h2 class="pay__title" id="pay-przelew">Zapłać przelewem</h2>' +
      '<p class="pay__how">Zwykły przelew na konto. Tytuł to numer zamówienia, po nim rozpoznamy Twoją wpłatę.</p>' +
      '<dl class="pay__list">' +
        row('Numer konta', p.konto || '', String(p.konto || '').replace(/\s/g, '')) +
        row('Odbiorca', p.odbiorca || '') +
        row('Kwota', o.kwotaTxt, amount) +
        row('Tytuł', o.tytul) +
      '</dl></section>';
  }

  var main = o.platnosc === 'przelew' ? 'przelew' : 'blik';
  var other = main === 'blik' ? 'przelew' : 'blik';

  root.innerHTML =
    '<header class="confirm__head">' +
      '<p class="t-eyebrow t-eyebrow--rule">Zamówienie przyjęte</p>' +
      '<h1 class="order__title">Zamówienie <span class="num">' + esc(o.numer) + '</span></h1>' +
      '<p class="confirm__lead">Zarezerwowaliśmy Twoje zapachy do ' + esc(o.terminTxt) + '. Zapłać do tego czasu, a zaczniemy odlewać.</p>' +
    '</header>' +
    '<div class="confirm__grid">' +
      '<div class="confirm__pay">' +
        card(main, true) +
        '<details class="pay-alt"><summary>' + (other === 'blik' ? 'Wolisz BLIK na telefon?' : 'Wolisz zwykły przelew?') + '</summary>' + card(other, false) + '</details>' +
        '<p class="confirm__mail">To samo wysłaliśmy na <b>' + esc(o.email) + '</b>. Jeśli maila nie widać, zajrzyj do folderu Oferty albo Spam.</p>' +
      '</div>' +
      '<aside class="confirm__side">' +
        '<section class="confirm__box" aria-labelledby="c-sum"><h2 class="confirm__h" id="c-sum">Co zamawiasz</h2>' +
          '<ul class="os__list" role="list">' + (o.pozycje || []).map(function (l) {
            return '<li class="os__line os__line--text"><span class="os__name">' + esc(l.nazwa) + '<small>' + esc(l.opis) + (l.ilosc > 1 ? ', ' + l.ilosc + ' szt.' : '') + '</small></span><span class="os__price">' + U.price(l.suma) + '</span></li>';
          }).join('') + '</ul>' +
          '<dl class="os__totals">' +
            '<div><dt>Zapachy</dt><dd>' + U.price(o.wartoscProduktow) + '</dd></div>' +
            '<div><dt>Dostawa</dt><dd>' + (o.kosztDostawy ? U.price(o.kosztDostawy) : 'gratis') + '</dd></div>' +
            (o.rabat ? '<div><dt>Bon ' + esc(o.bon) + '</dt><dd>−' + U.price(o.rabat) + '</dd></div>' : '') +
            '<div class="os__grand"><dt>Do zapłaty</dt><dd>' + esc(o.kwotaTxt) + '</dd></div>' +
          '</dl>' +
          (o.dostawa && o.dostawa.opis ? '<p class="confirm__ship">' + esc(o.dostawa.opis) + '</p>' : '') +
        '</section>' +
        '<section class="confirm__box" aria-labelledby="c-next"><h2 class="confirm__h" id="c-next">Co dalej</h2>' +
          '<p>Gdy zobaczymy wpłatę, potwierdzimy ją mailem i zaczniemy odlewać Twoje zapachy. Po nadaniu paczki dostaniesz numer przesyłki z linkiem do śledzenia.</p>' +
        '</section>' +
        '<section class="confirm__box confirm__box--ig" aria-labelledby="c-ig"><h2 class="confirm__h" id="c-ig">Wolisz pisać na Instagramie?</h2>' +
          '<p>Możesz wysłać nam zamówienie w wiadomości. Nie musisz, płatność działa tak samo.</p>' +
          '<button type="button" class="btn btn--outline btn--block" data-ig-send>' + window.NicciIkony.svg('instagram', { size: 22 }) + 'Wyślij zamówienie do nas na Instagramie</button>' +
          '<p class="confirm__hint" data-ig-hint aria-live="polite">Skopiujemy treść zamówienia, wystarczy ją wkleić i wysłać.</p>' +
        '</section>' +
      '</aside>' +
    '</div>';

  // ---------- kopiowanie ----------
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return N.copy(text);
    // zapas dla starszych przeglądarek i podglądu bez HTTPS
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return Promise.resolve(ok);
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]');
    if (b) {
      var label = b.getAttribute('aria-label').replace('Kopiuj: ', '');
      copyText(b.dataset.copy).then(function (ok) {
        b.textContent = ok ? 'Skopiowano' : 'Zaznacz i skopiuj';
        b.toggleAttribute('data-done', ok);
        U.announce(ok ? label + ': skopiowano.' : 'Nie udało się skopiować. Zaznacz tekst i skopiuj ręcznie.');
        clearTimeout(b._t);
        b._t = setTimeout(function () { b.textContent = 'Kopiuj'; b.removeAttribute('data-done'); }, 2200);
      });
      return;
    }
    if (e.target.closest('[data-ig-send]')) {
      var hint = root.querySelector('[data-ig-hint]');
      N.sendOrderToInstagram(o).then(function (copied) {
        if (hint) hint.textContent = copied ? 'Treść zamówienia jest skopiowana, wystarczy ją wkleić i wysłać.' : 'Otworzyliśmy Instagram. Wpisz numer zamówienia ' + o.numer + ', a resztę sprawdzimy sami.';
      });
    }
  });

  document.title = 'Zamówienie ' + o.numer + ': dane do płatności | Nicci Fragrance';
})();
