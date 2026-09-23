/**
 * NICCI: quiz na osobnej podstronie. Pytania i ich kolejność wyłącznie z Nicci.quiz.questions.
 * Jedno pytanie na ekran, pasek postępu, kafle z ikoną, nazwą i jedną linią doprecyzowania.
 * Wybór pojedynczy przechodzi dalej sam po krótkiej pauzie, wielokrotny (klimat, do dwóch) czeka na „Dalej”.
 * Stan w sessionStorage (nicci_quiz_state): powrót z /wynik przywraca odpowiedzi i ostatni ekran.
 * ?rodzina=drzewna zaznacza klimat, do którego ta rodzina należy, i mówi o tym na pierwszym ekranie.
 */
(function () {
  'use strict';
  var N = window.Nicci, A = window.NicciApp, M = window.NicciMotion, I = window.NicciIkony, R = window.NicciRodziny;
  var Q = N.quiz.questions;
  var KEY = 'nicci_quiz_state';
  var AUTO_MS = 380;

  // ikona i jedna linia doprecyzowania dla każdej odpowiedzi z API (tekst odpowiedzi zostaje z API)
  var META = {
    profil: { meski: ['q-meski', 'Męskie klasyki i zapachy dla każdego'], damski: ['q-damski', 'Kobiece i te dla każdego'], unisex: ['q-unisex', 'Pokażemy wszystko, co pasuje'] },
    klimat: {
      swiezy: ['k-swiezy', 'Cytrusy, bergamotka, zioła'], drzewny: ['k-drzewny', 'Cedr, wetyweria, skóra'],
      slodki: ['k-slodki', 'Wanilia, ambra, przyprawy'], kwiatowy: ['k-kwiatowy', 'Jaśmin, kwiat pomarańczy, irys']
    },
    pora: { 'dzień': ['dzien', 'Praca, uczelnia, spacer'], 'wieczór': ['wieczor', 'Kolacja, randka, koncert'], uniwersalna: ['uniwersalna', 'Jeden zapach na każdą okazję'] },
    sezon: { cieplo: ['lato', 'Wiosna i lato'], chlodno: ['zima', 'Jesień i zima'], caly: ['caly-rok', 'Bez względu na pogodę'] },
    intensywnosc: { 1: ['int-1', 'Poczuje go ktoś, kto stoi blisko'], 2: ['int-2', 'Czuć go, gdy z kimś rozmawiasz'], 3: ['int-3', 'Zostaje w pamięci po wyjściu'] }
  };

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l'); }
  function load() { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* tryb prywatny: quiz działa bez pamięci */ } }

  var state = load() || { answers: {}, step: 0 };
  if (state.done) { state.done = false; state.step = Q.length - 1; } // powrót z wyniku: ostatnie pytanie z zaznaczeniem
  var preset = null;

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }

  /** Przymiotnik rodziny w dopełniaczu: cytrusowa → cytrusowej, słodka → słodkiej; nazwy nieodmienne zostają. */
  function genitive(name) {
    var n = String(name || '').toLowerCase();
    if (/[kg]a$/.test(n)) return n.slice(0, -1) + 'iej';
    if (/a$/.test(n)) return n.slice(0, -1) + 'ej';
    return n;
  }

  // ---------- ?rodzina= z karuzeli ----------
  (function () {
    var fam = new URLSearchParams(location.search).get('rodzina');
    if (!fam) return;
    var klimat = Q.filter(function (q) { return q.id === 'klimat'; })[0];
    var opt = klimat && klimat.opcje.filter(function (o) { return o.rodziny.some(function (r) { return norm(r) === norm(fam) || R.slug(r) === fam; }); })[0];
    if (!opt) return;
    var name = opt.rodziny.filter(function (r) { return norm(r) === norm(fam) || R.slug(r) === fam; })[0];
    preset = { rodzina: name, opcja: opt.t };
    var cur = [].concat(state.answers.klimat || []);
    if (cur.indexOf(opt.v) === -1) { cur = [opt.v].concat(cur).slice(0, klimat.multi || 1); }
    state.answers.klimat = cur;
    if (!load()) state.step = 0;
    save();
  })();

  var els = {
    stage: document.querySelector('[data-stage]'),
    bar: document.querySelector('[data-bar]'),
    count: document.querySelector('[data-step-count]'),
    back: document.querySelector('[data-back]'),
    next: document.querySelector('[data-next]'),
    home: document.querySelector('[data-home]')
  };
  var barSpring = M.value(0, function (v) { els.bar.style.transform = 'scaleX(' + v.toFixed(4) + ')'; }, { preset: 'ui' });
  var current = null, busy = false, autoTimer = null;

  function selected(q) {
    var v = state.answers[q.id];
    return q.multi ? [].concat(v || []) : (v === undefined ? [] : [v]);
  }

  function screen(i) {
    var q = Q[i];
    var sel = selected(q);
    var el = document.createElement('section');
    el.className = 'q';
    el.setAttribute('aria-labelledby', 'q-t-' + i);
    var html = '<p class="q__step">Pytanie ' + (i + 1) + ' z ' + Q.length + '</p>' +
      '<h1 class="q__title" id="q-t-' + i + '" tabindex="-1">' + q.pytanie + '</h1>';
    if (i === 0 && preset) {
      html += '<p class="q__preset">Zaczynasz od rodziny ' + esc(genitive(preset.rodzina)) + ', więc w pytaniu o klimat zaznaczyliśmy już „' + esc(preset.opcja) + '”. Możesz to zmienić.</p>';
    }
    if (q.multi) html += '<p class="q__hint" id="q-h-' + i + '">Możesz wybrać ' + (q.multi === 2 ? 'dwa' : q.multi) + '. <span data-counter></span></p>';
    html += '<div class="q__tiles" role="group" aria-labelledby="q-t-' + i + '"' + (q.multi ? ' aria-describedby="q-h-' + i + '"' : '') + '>';
    q.opcje.forEach(function (o) {
      var meta = (META[q.id] || {})[o.v] || [];
      var on = sel.some(function (s) { return String(s) === String(o.v); });
      html += '<button type="button" class="tile" data-v="' + o.v + '" aria-pressed="' + on + '">' +
        '<span class="tile__icon">' + (meta[0] ? I.svg(meta[0], { size: 40 }) : '') + '</span>' +
        '<span class="tile__text"><span class="tile__name">' + o.t + '</span>' + (meta[1] ? '<span class="tile__sub">' + meta[1] + '</span>' : '') + '</span>' +
        '<span class="tile__check" aria-hidden="true"><svg viewBox="0 0 12 12" width="12" height="12"><path d="M2 6.5 5 9l5-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
        '</button>';
    });
    html += '</div><p class="q__msg" role="status" aria-live="polite" data-msg></p>';
    el.innerHTML = html;
    return el;
  }

  function paintMulti(el, q) {
    if (!q.multi) return;
    var n = selected(q).length;
    var c = el.querySelector('[data-counter]');
    if (c) c.textContent = 'Wybrane: ' + n + ' z ' + q.multi + '.';
    el.querySelectorAll('.tile').forEach(function (t) {
      var full = n >= q.multi && t.getAttribute('aria-pressed') !== 'true';
      if (full) t.setAttribute('aria-disabled', 'true'); else t.removeAttribute('aria-disabled');
    });
    els.next.disabled = n === 0;
  }

  function chrome(i) {
    var q = Q[i];
    barSpring.to((i + 1) / Q.length);
    els.count.textContent = (i + 1) + ' z ' + Q.length;
    els.next.hidden = !q.multi;
    els.back.hidden = i === 0;
    els.home.hidden = i !== 0;
    if (q.multi) els.next.disabled = selected(q).length === 0;
  }

  function show(i, dir) {
    state.step = i;
    save();
    var next = screen(i);
    var prev = current;
    current = next;
    els.stage.appendChild(next);
    chrome(i);
    paintMulti(next, Q[i]);
    if (prev && !M.reduced()) {
      busy = true;
      M.set(next, { x: 48 * dir, opacity: 0 });
      M.animate(next, { x: 0, opacity: 1 }, { preset: 'ui' });
      M.animate(prev, { x: -48 * dir, opacity: 0 }, { preset: 'snappy', onDone: function () { prev.remove(); busy = false; } });
      setTimeout(function () { if (prev.parentNode) prev.remove(); busy = false; }, 700);
    } else if (prev) {
      prev.remove();
    }
    // po przejściu fokus na pytanie, żeby czytnik je odczytał; przy pierwszym wejściu zostawiamy stronę w spokoju
    if (prev) next.querySelector('.q__title').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function go(i, dir) {
    clearTimeout(autoTimer);
    if (i >= Q.length) { finish(); return; }
    show(Math.max(0, i), dir);
  }

  // ---------- wybór ----------
  els.stage.addEventListener('click', function (e) {
    var t = e.target.closest('.tile');
    if (!t || !current || !current.contains(t)) return;
    var q = Q[state.step];
    var v = t.dataset.v;
    var val = q.id === 'intensywnosc' ? Number(v) : v;
    var msg = current.querySelector('[data-msg]');
    if (q.multi) {
      var list = selected(q);
      var at = list.indexOf(val);
      if (at !== -1) {
        list.splice(at, 1);
        t.setAttribute('aria-pressed', 'false');
        msg.textContent = '';
      } else if (list.length >= q.multi) {
        // trzeci kafel zablokowany z wyjaśnieniem, bez cichego ignorowania
        msg.textContent = 'Możesz wybrać najwyżej dwa klimaty. Odznacz jeden, żeby wybrać inny.';
        if (!M.reduced()) {
          M.animate(t, { x: 6 }, { preset: 'press', onDone: function () { M.animate(t, { x: 0 }, { preset: 'lift' }); } });
        }
        return;
      } else {
        list.push(val);
        t.setAttribute('aria-pressed', 'true');
        msg.textContent = '';
      }
      state.answers[q.id] = list;
      save();
      paintMulti(current, q);
      return;
    }
    if (busy) return;
    state.answers[q.id] = val;
    save();
    current.querySelectorAll('.tile').forEach(function (x) { x.setAttribute('aria-pressed', String(x === t)); });
    clearTimeout(autoTimer);
    // krótka pauza: widać zaznaczenie, zanim ekran pojedzie dalej
    autoTimer = setTimeout(function () { go(state.step + 1, 1); }, M.reduced() ? 150 : AUTO_MS);
  });

  els.next.addEventListener('click', function () {
    var q = Q[state.step];
    if (!selected(q).length) return;
    go(state.step + 1, 1);
  });
  els.back.addEventListener('click', function () { if (state.step > 0) go(state.step - 1, -1); });

  // ---------- ekran przejściowy i wynik ----------
  function finish() {
    state.done = true;
    save();
    var box = document.createElement('section');
    box.className = 'q q--loading';
    box.setAttribute('role', 'status');
    var draw = function (total) {
      box.innerHTML = '<div class="q-load__ring" aria-hidden="true">' +
        ['cytryna', 'drewno', 'wanilia', 'roza', 'bergamotka', 'skora'].map(function (s, k) {
          return '<img src="/img/nuty/' + s + '.webp" alt="" width="256" height="256" style="--k:' + k + '">';
        }).join('') + '</div>' +
        '<p class="q-load__title">Sprawdzamy, co z ' + (total ? total + ' ' + A.plural(total, ['zapachu', 'zapachów', 'zapachów']) : 'naszych zapachów') + ' pasuje do Twoich odpowiedzi</p>' +
        '<span class="q-load__line" aria-hidden="true"><span></span></span>';
    };
    draw(0);
    var prev = current;
    current = box;
    els.stage.appendChild(box);
    if (prev) prev.remove();
    els.back.hidden = true; els.next.hidden = true; els.home.hidden = true;
    barSpring.to(1);
    var started = Date.now();
    var minMs = M.reduced() ? 300 : 1200; // nie udajemy dłuższego liczenia, niż trzeba
    A.catalog().then(function (c) { draw(c.products.length); }, function () {}).then(function () {
      setTimeout(function () { location.href = A.url('/wynik'); }, Math.max(0, minMs - (Date.now() - started)));
    });
  }

  // ---------- start ----------
  go(Math.min(state.step || 0, Q.length - 1), 1);
})();
