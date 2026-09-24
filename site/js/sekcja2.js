/**
 * Sekcja 2 „Jak to działa”: skrypt z artifactu właściciela bez zmian w zachowaniu kart.
 * Usunięte: odliczanie rezerwacji (decyzja właściciela, zasada „bez sztucznych liczników”).
 * Dodane: jednorazowe wejście kart na sprężynie i kropki pod przewijanym rzędem na telefonie.
 */
(function () {
  var root = document.querySelector('.nf-how');
  if (!root) return;
  var M = window.NicciMotion;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = false;
  var holdUntil = { quiz: 0, cart: 0 };
  function now() { return Date.now(); }

  // --- widoczność: animacje działają tylko, gdy sekcja jest na ekranie ---
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      root.classList.toggle('is-paused', !visible);
      if (visible) root.classList.add('is-live');
    }, { threshold: 0.15 }).observe(root);
  } else { visible = true; root.classList.add('is-live'); }
  if (reduce) root.classList.add('is-live');

  // --- wejście: karty wachlarzem, raz, gdy sekcja pojawia się na ekranie ---
  var steps = root.querySelectorAll('.nf-step');
  if (M && 'IntersectionObserver' in window && !reduce) {
    var first = root.querySelector('.nf-steps');
    if (first.getBoundingClientRect().top > window.innerHeight * 0.9) {
      steps.forEach(function (s) { M.set(s, { opacity: 0, y: 28 }); });
      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        steps.forEach(function (s, k) {
          // preset bez odbicia: sprężyna z odbiciem w trakcie przewijania wyglądała jak drganie kart
          setTimeout(function () { M.animate(s, { opacity: 1, y: 0 }, { preset: 'ui' }); }, k * 80);
        });
      }, { threshold: 0.2 });
      io.observe(first);
    }
  }

  // --- 1. quiz: ciepły / chłodny ---
  var tiles = root.querySelectorAll('.nf-tile');
  function pick(el) { tiles.forEach(function (t) { t.setAttribute('aria-pressed', String(t === el)); }); }
  tiles.forEach(function (t) {
    t.addEventListener('click', function () { pick(t); holdUntil.quiz = now() + 10000; });
  });

  // --- 2. koszyk: pojemności ---
  var groups = root.querySelectorAll('.nf-ml');
  groups.forEach(function (g) {
    g.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        g.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        holdUntil.cart = now() + 10000;
      });
    });
  });

  // --- 3. odznaka ml ---
  var mlEl = root.querySelector('[data-ml]');
  var mls = ['5 ml', '10 ml', '20 ml'], mlI = 1;

  // --- 4. status dostawy ---
  var track = root.querySelectorAll('.nf-track li');
  var fill = root.querySelector('.nf-track__fill');
  var locker = root.querySelector('.nf-locker');
  var tI = -1;
  function setTrack(i) {
    track.forEach(function (li, k) { li.classList.toggle('done', k <= i); li.classList.toggle('now', k === i && i < track.length - 1); });
    var last = track[Math.max(0, i)];
    var ol = root.querySelector('.nf-track');
    fill.style.height = i < 0 ? '0px' : (ol.offsetTop + last.offsetTop - 8) + 'px';
    locker.classList.toggle('on', i === track.length - 1);
  }

  // --- telefon: kropki pod przewijanym rzędem kroków ---
  var row = root.querySelector('.nf-steps');
  var dots = document.createElement('div');
  dots.className = 'nf-steps-dots';
  dots.setAttribute('aria-hidden', 'true');
  steps.forEach(function () { dots.appendChild(document.createElement('span')); });
  row.after(dots);
  function syncDots() {
    var mid = row.scrollLeft + row.clientWidth / 2, best = 0, d = Infinity;
    steps.forEach(function (s, k) { var c = s.offsetLeft + s.offsetWidth / 2, dd = Math.abs(c - mid); if (dd < d) { d = dd; best = k; } });
    dots.querySelectorAll('span').forEach(function (s, k) { s.toggleAttribute('data-on', k === best); });
  }
  var raf = 0;
  row.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; syncDots(); }); }, { passive: true });
  syncDots();

  if (reduce) { setTrack(track.length - 1); return; }

  var tick = 0;
  setInterval(function () {
    if (!visible) return;
    tick++;
    if (tick % 3 === 0 && now() > holdUntil.quiz) {
      var cur = root.querySelector('.nf-tile[aria-pressed="true"]');
      pick(cur === tiles[0] ? tiles[1] : tiles[0]);
    }
    if (tick % 2 === 0 && now() > holdUntil.cart) {
      var g = groups[(tick / 2) % groups.length];
      var bs = g.querySelectorAll('button'), on = 0;
      bs.forEach(function (b, k) { if (b.getAttribute('aria-pressed') === 'true') on = k; });
      var next = (on + 1) % bs.length;
      bs.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === next)); });
    }
    if (tick % 3 === 1) {
      mlI = (mlI + 1) % mls.length;
      mlEl.classList.remove('flip'); void mlEl.offsetWidth; mlEl.classList.add('flip');
      setTimeout(function () { mlEl.textContent = mls[mlI]; }, 250);
    }
    if (tick % 2 === 0) {
      tI = tI >= track.length + 1 ? -1 : tI + 1;
      setTrack(Math.min(tI, track.length - 1));
    }
  }, 900);
})();
