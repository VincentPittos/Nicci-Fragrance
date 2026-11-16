/**
 * NICCI: popup newslettera z kodem −99% na zestaw NICCI ESSENTIALS (do zamówienia z odlewką 20 ml).
 *
 * Kiedy się pokazuje: po 25 s na stronie albo po przewinięciu 45% strony, a na komputerze także, gdy kursor
 * wychodzi nad pasek przeglądarki (najwcześniej po 8 s). Nie na zamówieniu, potwierdzeniu, regulaminie i polityce
 * prywatności, nie przy otwartym koszyku. Raz na wizytę; po „Nie, dziękuję” albo zamknięciu wraca po 14 dniach,
 * po zapisie nigdy. Pamięć w localStorage (bez ciasteczek).
 *
 * Wysyłka: ENDPOINT (adres do ustalenia z właścicielem: backend w Apps Script albo webhook GHL). Dopóki jest pusty,
 * popup działa tylko w podglądzie (?popup=1, ?popup=gotowe) i niczego nie wysyła.
 */
(function () {
  'use strict';
  var ENDPOINT = '';
  var KEY = 'nicci-newsletter';
  var BACK_AFTER = 14 * 24 * 3600 * 1000;
  var SKIP = /^\/(zamowienie|potwierdzenie|regulamin|prywatnosc)(\.html)?\/?$/;
  var M = window.NicciMotion;
  var params = new URLSearchParams(location.search);
  var preview = params.get('popup');

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(state) { try { localStorage.setItem(KEY, JSON.stringify({ stan: state, czas: Date.now() })); } catch (e) { /* tryb prywatny */ } }
  function allowed() {
    if (SKIP.test(location.pathname)) return false;
    var s = load();
    if (s.stan === 'zapisany') return false;
    if (s.stan === 'odrzucony' && Date.now() - s.czas < BACK_AFTER) return false;
    try { if (sessionStorage.getItem(KEY)) return false; } catch (e) { /* bez sesji pokazujemy */ }
    return true;
  }

  var ICON_X = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  var ICON_OK = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function src(name, w, ext) { return '/img/kampanie/' + name + '-' + w + '.' + ext + ' ' + w + 'w'; }
  function set(name, widths, ext) { return widths.map(function (w) { return src(name, w, ext); }).join(', '); }

  var HTML =
    '<div class="nl__card">' +
      '<button type="button" class="nl__close" data-nl-close aria-label="Zamknij">' + ICON_X + '</button>' +
      // grafika z napisem −99% schowanym za flakonami (wersja 3: Anton, krem; dev/grafiki/napis_99.py); napisy z grafiki są w alt
      '<div class="nl__media">' +
        '<picture>' +
          '<source type="image/avif" srcset="' + set('essentials-99', [480, 720, 960, 1080], 'avif') + '" sizes="(min-width: 52rem) 29rem, 100vw">' +
          '<img src="/img/kampanie/essentials-99-720.webp" srcset="' + set('essentials-99', [480, 720, 960, 1080], 'webp') + '" sizes="(min-width: 52rem) 29rem, 100vw" width="1080" height="1350" ' +
            'alt="NICCI ESSENTIALS −99%, 7 zapachów po 1 ml. Siedem flakonów z zestawu na czarnej skale, przed nimi siedem odlewek po 1 ml z logo Nicci.">' +
        '</picture>' +
      '</div>' +
      '<div class="nl__body">' +
        '<div class="nl__start">' +
          '<h2 class="nl__title" id="nl-t">Siedem zapachów za&nbsp;złotówkę</h2>' +
          '<p class="nl__desc" id="nl-d">Zapisz się do newslettera, a wyślemy Ci kod −99% na zestaw Nicci Essentials: ' +
            'Aventus, Imagination, Erba Pura, Bois Impérial, Chocolate Greedy, Black Orchid i&nbsp;Red Tobacco, każdy po 1&nbsp;ml. ' +
            'Kod działa do zamówienia z&nbsp;dowolną odlewką 20&nbsp;ml.</p>' +
          '<div class="nl__step1">' +
            '<button type="button" class="btn btn--primary btn--block" data-nl-next>Chcę kod −99%</button>' +
            '<button type="button" class="nl__decline" data-nl-close>Nie, dziękuję</button>' +
          '</div>' +
          '<form class="nl__form" novalidate>' +
            '<div class="nl__fields">' +
              '<div class="field" data-nl-field="imie"><label for="nl-imie">Imię</label>' +
                '<input id="nl-imie" name="imie" type="text" autocomplete="given-name" maxlength="60" required></div>' +
              '<div class="field" data-nl-field="email"><label for="nl-email">Adres e-mail</label>' +
                '<input id="nl-email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" maxlength="120" required></div>' +
            '</div>' +
            '<label class="nl__check" data-nl-field="zgoda"><input type="checkbox" name="zgoda" required><span class="nl__box" aria-hidden="true"></span>' +
              '<span>Chcę dostawać newsletter Nicci Fragrance z&nbsp;ofertami i&nbsp;nowościami. Zgodę mogę wycofać w&nbsp;każdej chwili. ' +
              'Zasady w&nbsp;<a class="link" href="/prywatnosc" target="_blank">Polityce prywatności</a>.</span></label>' +
            '<p class="nl__error" role="alert" hidden></p>' +
            '<button type="submit" class="btn btn--primary btn--block nl__submit">Wyślij mi kod</button>' +
            '<button type="button" class="nl__decline" data-nl-close>Nie, dziękuję</button>' +
          '</form>' +
        '</div>' +
        '<div class="nl__done" tabindex="-1" hidden>' +
          '<span class="nl__done-mark">' + ICON_OK + '</span>' +
          '<h2 class="nl__title" id="nl-t2">Gotowe</h2>' +
          '<p class="nl__desc">Kod jest już w&nbsp;drodze na Twój e-mail. Jeśli go nie widzisz, zajrzyj do zakładki Oferty albo do spamu.</p>' +
          '<a class="btn btn--primary btn--block" href="/katalog">Wybierz odlewkę 20&nbsp;ml</a>' +
          '<button type="button" class="nl__decline" data-nl-close>Wróć do strony</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  var dlg = null, shown = false, opener = null;

  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 'nl theme-dark';
    dlg.setAttribute('aria-labelledby', 'nl-t');
    dlg.setAttribute('aria-describedby', 'nl-d');
    dlg.innerHTML = HTML;
    document.body.appendChild(dlg);
    dlg.addEventListener('click', function (e) {
      if (e.target.closest('[data-nl-next]')) step2();
      else if (e.target.closest('[data-nl-close]')) close();
      else if (e.target === dlg) close(); // kliknięcie w tło
    });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); }); // Esc
    dlg.querySelector('form').addEventListener('submit', submit);
    dlg.querySelectorAll('input').forEach(function (i) {
      i.addEventListener('input', function () { clearError(i.closest('[data-nl-field]')); });
      i.addEventListener('change', function () { clearError(i.closest('[data-nl-field]')); });
    });
  }

  function open(state) {
    if (shown && !state) return;
    if (dlg && dlg.open) return;
    shown = true;
    if (!dlg) build();
    try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* nic */ }
    opener = document.activeElement;
    var sbw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--sbw', sbw + 'px');
    document.documentElement.classList.add('nl-open');
    dlg.showModal();
    if (state === 'gotowe') done(true);
    requestAnimationFrame(function () { requestAnimationFrame(function () { dlg.classList.add('is-open'); }); });
  }

  function close() {
    if (!dlg || !dlg.open) return;
    if (load().stan !== 'zapisany') save('odrzucony');
    dlg.classList.remove('is-open');
    var finish = function () {
      dlg.close();
      document.documentElement.classList.remove('nl-open');
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    };
    if (M && M.reduced && M.reduced()) finish(); else setTimeout(finish, 260);
  }

  // telefon: drugi krok to opis z warunkami i formularz
  function step2() {
    dlg.setAttribute('data-krok', '2');
    dlg.scrollTop = 0;
    dlg.querySelector('#nl-imie').focus();
  }

  // ---------- formularz ----------
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function field(name) { return dlg.querySelector('[data-nl-field="' + name + '"]'); }
  function clearError(f) {
    if (!f) return;
    f.removeAttribute('data-invalid');
    var c = f.querySelector('input'); if (c) c.removeAttribute('aria-invalid');
    var err = dlg.querySelector('.nl__error'); err.hidden = true; err.textContent = '';
  }
  function fail(name, msg) {
    var f = field(name);
    f.setAttribute('data-invalid', '');
    var input = f.querySelector('input'); input.setAttribute('aria-invalid', 'true');
    var err = dlg.querySelector('.nl__error'); err.textContent = msg; err.hidden = false;
    input.focus();
  }

  function submit(e) {
    e.preventDefault();
    var form = e.target;
    var imie = form.imie.value.trim(), email = form.email.value.trim();
    if (!imie) return fail('imie', 'Wpisz swoje imię, żebyśmy wiedzieli, jak się do Ciebie zwracać.');
    if (!EMAIL.test(email)) return fail('email', 'Sprawdź adres e-mail, na który mamy wysłać kod.');
    if (!form.zgoda.checked) return fail('zgoda', 'Zaznacz zgodę na newsletter, bo kod wysyłamy w nim mailem.');
    var btn = form.querySelector('.nl__submit');
    btn.setAttribute('aria-busy', 'true'); btn.disabled = true;
    send({ imie: imie, email: email, zgoda: true, zrodlo: 'popup-essentials', strona: location.pathname })
      .then(function () { save('zapisany'); done(false); }, function () {
        var err = dlg.querySelector('.nl__error');
        err.textContent = 'Nie udało się zapisać. Spróbuj ponownie za chwilę.'; err.hidden = false;
      })
      .then(function () { btn.removeAttribute('aria-busy'); btn.disabled = false; });
  }

  function send(data) {
    if (!ENDPOINT) return new Promise(function (resolve) { setTimeout(resolve, 600); }); // podgląd: bez wysyłki
    return fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r; });
  }

  function done(instant) {
    dlg.setAttribute('data-krok', 'gotowe'); // telefon: bez grafiki, jak w kroku 2
    dlg.querySelector('.nl__start').hidden = true;
    var d = dlg.querySelector('.nl__done'); d.hidden = false;
    dlg.removeAttribute('aria-describedby');
    dlg.setAttribute('aria-labelledby', 'nl-t2');
    if (!instant) d.focus();
  }

  // ---------- kiedy pokazać ----------
  function busy() { return document.documentElement.classList.contains('drawer-open') || !!document.querySelector('dialog[open]'); }
  function tryOpen() { if (shown) return; if (busy()) { setTimeout(tryOpen, 4000); return; } open(); }

  function arm() {
    var t0 = Date.now();
    setTimeout(tryOpen, 25000);
    var onScroll = function () {
      var max = document.documentElement.scrollHeight - innerHeight;
      if (max > 0 && scrollY / max >= 0.45) { removeEventListener('scroll', onScroll); tryOpen(); }
    };
    addEventListener('scroll', onScroll, { passive: true });
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.addEventListener('mouseout', function (e) {
        if (!e.relatedTarget && e.clientY <= 0 && Date.now() - t0 > 8000) tryOpen();
      });
    }
  }

  // przyciski „Chcę kod” na innych stronach (np. /oferty) otwierają popup na żądanie
  window.NicciNewsletter = {
    enabled: typeof HTMLDialogElement !== 'undefined' && !!(ENDPOINT || preview || params.has('podglad')),
    open: function () { if (this.enabled) open(true); }
  };

  function init() {
    if (typeof HTMLDialogElement === 'undefined') return;
    if (preview) { open(preview === 'gotowe' ? 'gotowe' : null); return; }
    if (!ENDPOINT || !allowed()) return;
    arm();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
