/**
 * NICCI: karuzela z pędem.
 *   var c = NicciCarousel.mount(root, {label: n => 'Drzewna', onChange: i => {}})
 *   c.go(i), c.index(), c.refresh()
 * Struktura: [data-carousel] > [data-viewport] > [data-track] > [data-slide]*, opcjonalnie [data-prev],
 * [data-next], [data-dots], [data-progress]. Przeciąganie 1:1 palcem albo myszą, po puszczeniu rzut
 * z prędkością gestu i przyciąganie do najbliższego slajdu, opór za krawędziami. Strzałki klawiatury,
 * kropki, złota kreska postępu. Pionowe przewijanie strony na telefonie zostaje nietknięte.
 */
(function () {
  'use strict';
  var M = window.NicciMotion;

  function mount(root, opts) {
    opts = opts || {};
    var viewport = root.querySelector('[data-viewport]');
    var track = root.querySelector('[data-track]');
    var slides = Array.prototype.slice.call(track.querySelectorAll('[data-slide]'));
    var prev = root.querySelector('[data-prev]');
    var next = root.querySelector('[data-next]');
    var dotsBox = root.querySelector('[data-dots]');
    var bar = root.querySelector('[data-progress]');
    var n = slides.length;
    var i = 0, x = 0, offsets = [];

    var driver = M.value(0, function (v) { x = v; M.set(track, { x: v }); }, { preset: 'momentum' });
    var barSpring = bar ? M.value(1 / n, function (v) { bar.style.transform = 'scaleX(' + v.toFixed(4) + ')'; }, { preset: 'ui' }) : null;

    function measure() {
      var base = slides[0].offsetLeft;
      offsets = slides.map(function (s) { return s.offsetLeft - base; });
    }
    function maxX() { return 0; }
    function minX() { return -offsets[n - 1]; } // ostatni slajd dochodzi do lewej krawędzi, jak każdy inny
    function xFor(k) { return Math.max(minX(), -offsets[k]); }
    function nearest(pos) {
      var best = 0, d = Infinity;
      for (var k = 0; k < n; k++) { var dd = Math.abs(xFor(k) - pos); if (dd < d) { d = dd; best = k; } }
      return best;
    }

    // ---------- kropki i dostępność ----------
    var dots = [];
    if (dotsBox) {
      slides.forEach(function (s, k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'carousel__dot';
        b.setAttribute('aria-label', 'Slajd ' + (k + 1) + ' z ' + n + (opts.label ? ': ' + opts.label(k) : ''));
        b.addEventListener('click', function () { go(k); });
        dotsBox.appendChild(b);
        dots.push(b);
      });
    }
    slides.forEach(function (s, k) {
      s.setAttribute('role', 'group');
      s.setAttribute('aria-roledescription', 'slajd');
      s.setAttribute('aria-label', (k + 1) + ' z ' + n + (opts.label ? ': ' + opts.label(k) : ''));
    });

    function paint() {
      slides.forEach(function (s, k) {
        var on = k === i;
        s.toggleAttribute('data-current', on);
        // zasłonięte slajdy poza zasięgiem klawiatury i czytnika; widoczny skrawek następnego zaprasza do przesunięcia
        s.inert = !on;
      });
      dots.forEach(function (d, k) { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === n - 1;
      if (barSpring) barSpring.to((i + 1) / n);
      if (opts.onChange) opts.onChange(i);
    }

    function go(k, velocity) {
      k = Math.max(0, Math.min(n - 1, k));
      var changed = k !== i;
      i = k;
      driver.to(xFor(i), velocity || 0);
      if (changed) paint();
    }

    if (prev) prev.addEventListener('click', function () { go(i - 1); });
    if (next) next.addEventListener('click', function () { go(i + 1); });
    root.addEventListener('keydown', function (e) {
      if (e.target.closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); focusCurrent(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); focusCurrent(); }
    });
    function focusCurrent() {
      // fokus zostaje przy nawigacji, jeśli był na kropce; w przeciwnym razie na aktualnym slajdzie
      if (dots.indexOf(document.activeElement) !== -1) { dots[i].focus({ preventScroll: true }); return; }
      if (viewport.contains(document.activeElement)) { slides[i].setAttribute('tabindex', '-1'); slides[i].focus({ preventScroll: true }); }
    }

    // ---------- gest ----------
    var drag = null;
    var tracker = M.tracker();
    var suppressClick = false;

    viewport.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, from: x, active: false, type: e.pointerType };
      tracker.reset();
      tracker.push(e.clientX);
    });
    viewport.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.active) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) { drag = null; return; } // pion: przewijanie strony
        drag.active = true;
        driver.stop();
        drag.from = x;
        drag.sx = e.clientX;
        dx = 0;
        try { viewport.setPointerCapture(e.pointerId); } catch (err) { /* stary Safari */ }
        root.setAttribute('data-dragging', '');
      }
      e.preventDefault();
      var pos = drag.from + dx;
      var lo = minX(), hi = maxX();
      if (pos > hi) pos = hi + M.rubberband(pos - hi, viewport.clientWidth);
      else if (pos < lo) pos = lo + M.rubberband(pos - lo, viewport.clientWidth);
      x = pos;
      M.set(track, { x: pos });
      tracker.push(e.clientX);
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var was = drag.active;
      drag = null;
      root.removeAttribute('data-dragging');
      if (!was) return;
      suppressClick = true;
      setTimeout(function () { suppressClick = false; }, 0);
      var v = tracker.velocity();
      var target = nearest(x + M.project(v, 0.995));
      // lekki rzut zawsze przesuwa o jeden slajd, nawet gdy nie przekroczył połowy
      if (target === i && Math.abs(v) > 350) target = i + (v < 0 ? 1 : -1);
      driver.stop();
      driver = M.value(x, function (val) { x = val; M.set(track, { x: val }); }, { preset: 'momentum' });
      go(target, v);
    }
    viewport.addEventListener('pointerup', end);
    viewport.addEventListener('pointercancel', end);
    viewport.addEventListener('click', function (e) { if (suppressClick) { e.preventDefault(); e.stopPropagation(); } }, true);
    viewport.addEventListener('dragstart', function (e) { e.preventDefault(); });

    function refresh() { measure(); driver.stop(); M.set(track, { x: xFor(i) }); x = xFor(i); }
    // tylko zmiana szerokości: przeglądarki Instagrama i Messengera zmieniają wysokość widoku przy przewijaniu,
    // a przeliczenie zatrzymywało wtedy trwający przesuw slajdu i ustawiało go od nowa
    var rt, lastW = viewport.clientWidth;
    window.addEventListener('resize', function () {
      if (viewport.clientWidth === lastW) return;
      lastW = viewport.clientWidth;
      clearTimeout(rt); rt = setTimeout(refresh, 80);
    });

    measure();
    paint();
    return { go: go, index: function () { return i; }, refresh: refresh };
  }

  window.NicciCarousel = { mount: mount };
})();
