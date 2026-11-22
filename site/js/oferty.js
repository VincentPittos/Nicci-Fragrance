/**
 * NICCI: strona ofert specjalnych /oferty w stylu katalogu (decyzja 100). Kampanię, fazę i daty wybiera
 * js/oferty-kampanie.js. Tu: teksty nagłówka, widget odliczania (cyfry z animacją przy zmianie, pasek dni kampanii,
 * dzisiejszy dzień wypełnia się z upływem godzin), tekst pustej listy dla katalogu (katalog.js w trybie
 * data-catalog-promocje) i zakładka zestawów prezentowych w Święta.
 *
 * Podgląd do akceptacji: ?podglad=1 dokłada PRZYKŁADOWE obniżki i zestawy prezentowe, wyłącznie w przeglądarce
 * oglądającego (nic nie trafia do arkusza ani do zamówień) i pokazuje o tym pasek na górze strony.
 * ?kampania=black-weeks|christmas wymusza kampanię, ?teraz=2026-11-25T19:42 udaje inny moment.
 */
(function () {
  'use strict';
  var A = window.NicciApp, U = window.NicciUI, K = window.NicciKampanie;
  if (!A || !K) return;
  var params = new URLSearchParams(location.search);
  var PODGLAD = params.has('podglad');
  var KAMP = K.kampania || 'brak';
  var KDEF = (K.lista || []).filter(function (x) { return x.id === KAMP; })[0] || null;
  var DZIEN = 86400000;

  var TEKSTY = {
    'black-weeks': {
      eyebrow: 'Oferty specjalne',
      // wiersze nagłówka (właściciel 22.11: dwa wiersze, nie trzy); oferty.css dobiera rozmiar do szerokości kolumny
      title: ['Zapachy z najwyższej półki', 'nawet o połowę taniej'],
      lead: 'Wybrane zapachy taniej przez siedem dni. Przy każdej obniżce pokazujemy najniższą cenę z 30 dni przed nią.',
      timer: { przed: 'Do startu Black Weeks', trwa: 'Do końca Black Weeks' },
      note: { przed: 'Start 23 listopada o północy.', trwa: 'Ceny Black Weeks obowiązują do 29 listopada do północy.' },
      pustoTytul: { przed: 'Oferty pojawią się 23 listopada', trwa: 'Oferty chwilowo się wyprzedały' },
      pusto: { przed: 'Lista obniżek pojawi się tutaj o północy, gdy zacznie się Black Weeks.', trwa: 'Wszystkie zapachy znajdziesz w katalogu.' },
      rules: 'Obniżka dotyczy pojemności oznaczonych na karcie zapachu i trwa do 29 listopada do północy.'
    },
    christmas: {
      eyebrow: 'Oferty specjalne',
      title: 'Luksus pod choinkę',
      lead: '−20% na wybrane perfumy i zestawy prezentowe dla niego, dla niej, dla taty i dla mamy. Prezent, który zachwyca od pierwszej nuty.',
      timer: { przed: 'Do startu świątecznych ofert', trwa: 'Do Wigilii' },
      note: { przed: 'Start 30 listopada o północy.', trwa: 'Świąteczne ceny obowiązują do 24 grudnia.' },
      pustoTytul: { przed: 'Świąteczne oferty pojawią się 30 listopada', trwa: 'Oferty chwilowo się wyprzedały' },
      pusto: { przed: 'Lista obniżek pojawi się tutaj o północy, gdy zaczną się świąteczne oferty.', trwa: 'Wszystkie zapachy znajdziesz w katalogu.' },
      rules: 'Obniżka dotyczy pojemności oznaczonych na karcie zapachu i trwa do 24 grudnia.'
    },
    brak: {
      eyebrow: 'Oferty specjalne',
      title: 'Następna oferta już wkrótce',
      lead: 'O nowych obniżkach piszemy najpierw w newsletterze. Zapisz się, a od razu dostaniesz kod −99% na zestaw NICCI ESSENTIALS.',
      pustoTytul: { po: 'Teraz nie mamy obniżek' },
      pusto: { po: 'Wszystkie zapachy znajdziesz w katalogu.' },
      rules: ''
    }
  };
  var T = TEKSTY[KAMP];
  var FAZA = K.faza; // przed, trwa albo po

  // ---------- nagłówek i teksty dla katalogu (katalog.js czyta je przy pierwszym renderze) ----------
  function head() {
    document.querySelector('[data-offers-eyebrow]').textContent = T.eyebrow;
    var tytul = document.querySelector('[data-offers-title]');
    tytul.innerHTML = [].concat(T.title).map(function (w) { return '<span class="offers__line">' + U.esc(w) + '</span>'; }).join(' ');
    var lead = document.querySelector('[data-offers-lead]');
    lead.textContent = T.lead; lead.hidden = !T.lead;
    // jak liczymy procent: według trybu z js/rabaty-kampanii.js (decyzja 116)
    var zasada = (window.NicciRabaty || {}).PROCENT === 'od-najnizszej-30'
      ? 'Przekreślona cena przy obniżce to najniższa cena z 30 dni przed nią i od niej liczymy procent obniżki.'
      : 'Procent obniżki liczymy od ceny sprzed obniżki. Przy każdej obniżce podajemy też najniższą cenę z 30 dni przed nią.';
    document.querySelector('[data-offers-rules]').textContent = (T.rules ? T.rules + ' ' : '') + zasada;
    var cat = document.querySelector('[data-catalog]');
    if (cat) {
      cat.setAttribute('data-pusto-tytul', (T.pustoTytul || {})[FAZA] || 'Teraz nie mamy obniżek');
      cat.setAttribute('data-pusto', ((T.pusto || {})[FAZA] || '').replace('w katalogu', 'w <a class="link" href="' + A.url('/katalog') + '">katalogu</a>'));
    }
    // zestawy prezentowe tylko w trwających Świętach
    var tabsBox = document.querySelector('[data-offers-tabs-box]');
    if (tabsBox) tabsBox.hidden = !(KAMP === 'christmas' && FAZA === 'trwa');
  }
  head();

  // ---------- widget odliczania ----------
  var box = document.querySelector('[data-timer]');
  var DNI_TYG = ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb'];
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function words(n, forms) { return n + ' ' + A.plural(n, forms); }
  function now() { return Date.now() + K.przesuniecie; }

  var days = [];
  function buildDays() {
    if (!KDEF) return;
    var od = new Date(KDEF.od).getTime(), koniec = new Date(KDEF.do).getTime();
    var n = Math.round((koniec - od) / DZIEN);
    var list = box.querySelector('[data-timer-days]');
    list.style.setProperty('--n', n);
    list.classList.toggle('offer-timer__days--many', n > 10);
    var html = '';
    for (var i = 0; i < n; i++) {
      // data w czasie polskim (CET): południe danego dnia, żeby strefa przeglądarki nie przesuwała daty
      var pl = new Date(od + i * DZIEN + 13 * 3600000);
      var nr = pl.getUTCDate(), tyg = DNI_TYG[pl.getUTCDay()];
      var label = n > 10 ? nr + '.' + two(pl.getUTCMonth() + 1) : String(nr); // przy wielu dniach CSS pokazuje tylko pierwszy, ostatni i dzisiejszy
      html += '<li class="offer-timer__dd">' +
        '<span class="offer-timer__dn">' + label + '</span>' + (n <= 10 ? '<span class="offer-timer__dw">' + tyg + '</span>' : '') + '</li>';
    }
    list.innerHTML = html;
    days = Array.prototype.slice.call(list.children);
    days.od = od; days.n = n; days.koniec = koniec;
    box.querySelector('[data-timer-track]').setAttribute('data-faza', FAZA);
  }

  function setDigit(el, v) {
    if (el.textContent === v) return;
    el.textContent = v;
    el.classList.remove('is-tick');
    void el.offsetWidth; // ponowne uruchomienie animacji
    el.classList.add('is-tick');
  }

  var lastMin = -1;
  function tick() {
    var t = now();
    var left = Math.max(0, K.cel.getTime() - t);
    var s = Math.floor(left / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    setDigit(box.querySelector('[data-t="d"]'), two(d));
    box.querySelector('[data-tu="d"]').textContent = A.plural(d, ['dzień', 'dni', 'dni']);
    setDigit(box.querySelector('[data-t="h"]'), two(h));
    setDigit(box.querySelector('[data-t="m"]'), two(m));
    setDigit(box.querySelector('[data-t="s"]'), two(sec));
    if (days.length) {
      var idx = FAZA === 'trwa' ? Math.floor((t - days.od) / DZIEN) : -1;
      days.forEach(function (li, i) {
        li.classList.toggle('is-past', i < idx);
        li.classList.toggle('is-today', i === idx);
      });
      var p = FAZA === 'trwa' ? Math.min(1, Math.max(0, (t - days.od) / (days.koniec - days.od))) : 0;
      box.querySelector('[data-timer-track]').style.setProperty('--p', p.toFixed(4));
      var dayEl = box.querySelector('[data-timer-day]');
      dayEl.textContent = FAZA === 'trwa' && idx >= 0 ? 'Dzień ' + (idx + 1) + ' z ' + days.n : '';
      dayEl.hidden = !dayEl.textContent;
    }
    if (m !== lastMin) {
      box.querySelector('[data-timer-text]').textContent = (FAZA === 'przed' ? 'Do startu zostało ' : 'Do końca zostało ') +
        words(d, ['dzień', 'dni', 'dni']) + ', ' + words(h, ['godzina', 'godziny', 'godzin']) + ' i ' + words(m, ['minuta', 'minuty', 'minut']) + '.';
      lastMin = m;
    }
    if (left === 0 && !PODGLAD && !params.has('teraz')) setTimeout(function () { location.reload(); }, 1500); // start albo koniec kampanii
  }

  function initTimer() {
    if (!box || !KDEF || !K.cel || FAZA === 'po' || !T.timer) return;
    box.hidden = false;
    box.querySelector('[data-timer-label]').textContent = T.timer[FAZA];
    box.querySelector('[data-timer-note]').textContent = T.note[FAZA];
    box.classList.add('offer-timer--' + KAMP);
    buildDays();
    tick();
    setInterval(function () { if (!document.hidden) tick(); }, 1000);
  }

  // ---------- podgląd: przykładowe obniżki i zestawy prezentowe ----------
  var PRZYKLAD = {
    'black-weeks': { p06: 50, p43: 30, p10: 30, p45: 30, p16: 25, p11: 20, p35: 20, p01: 20, p24: 40, p29: 40, p87: 30, p52: 25 },
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

  // ---------- newsletter: przyciski „Chcę kod” ----------
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
    initTimer();
    // newsletter.js ładuje się po tym pliku: sprawdzamy go, gdy wszystkie skrypty już działają
    if (document.readyState === 'complete') newsletterReady(); else window.addEventListener('load', newsletterReady);
    if (PODGLAD) banner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
