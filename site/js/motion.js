/**
 * NICCI: ruch na sprężynach.
 *
 * Parametry jak w Apple: damping (1 = bez przestrzału, < 1 = sprężyste odbicie) i response
 * (w sekundach, im mniej, tym szybciej). Każda animacja startuje od bieżącej wartości na ekranie
 * i zachowuje prędkość, więc da się ją przerwać i odwrócić w dowolnej chwili.
 *
 * API (window.NicciMotion):
 *   animate(el, {x, y, scale, rotate, opacity}, {preset, velocity:{y:px/s}, onDone})
 *   set(el, props)            natychmiast, np. przy przeciąganiu 1:1
 *   get(el, prop)             wartość na ekranie
 *   value(from, onUpdate, opts) → {to(target, velocity), stop(), get()} dla liczb (np. ceny)
 *   tracker()                 → {push(pos), velocity()} prędkość gestu w px/s
 *   project(v, rate)          gdzie zatrzyma się rzut
 *   rubberband(over, size)    opór za krawędzią
 *   reveal(nodes)             jednorazowe wejście sekcji
 *   curve(preset, steps)      krzywa do CSS linear(), używana przy generowaniu tokenów
 */
(function (root) {
  'use strict';

  var PRESETS = {
    ui: { damping: 1, response: 0.35 },       // domyślny: wejścia, zmiany stanu, liczby
    snappy: { damping: 1, response: 0.24 },   // przyciski, licznik koszyka
    press: { damping: 1, response: 0.16 },    // wciśnięcie
    lift: { damping: 0.72, response: 0.34 },  // uniesienie karty, lekki sprężysty powrót
    sheet: { damping: 0.86, response: 0.32 }, // szuflady i sheety po puszczeniu
    momentum: { damping: 0.8, response: 0.4 } // po rzucie: karuzela, przeciągnięty element
  };

  var hasWindow = typeof window !== 'undefined';
  var mq = hasWindow && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() { return !!(mq && mq.matches); }

  function params(opts) {
    var p = (opts && opts.preset && PRESETS[opts.preset]) || PRESETS.ui;
    var damping = opts && opts.damping != null ? opts.damping : p.damping;
    var response = opts && opts.response != null ? opts.response : p.response;
    var w = 2 * Math.PI / response;
    return { k: w * w, c: 2 * damping * w };
  }

  /** Jedna wartość na sprężynie. Całkowanie półjawne z krokiem 1/240 s. */
  function Spring(x) { this.x = x; this.v = 0; this.target = x; this.k = 0; this.c = 0; this.rest = true; }
  Spring.prototype.configure = function (target, opts, velocity) {
    var p = params(opts);
    this.k = p.k; this.c = p.c; this.target = target;
    if (velocity != null) this.v = velocity;
    this.rest = false;
  };
  Spring.prototype.step = function (dt) {
    var h = 1 / 240, left = Math.min(dt, 0.064);
    while (left > 1e-6) {
      var s = Math.min(h, left);
      var a = -this.k * (this.x - this.target) - this.c * this.v;
      this.v += a * s;
      this.x += this.v * s;
      left -= s;
    }
    var scale = Math.max(1, Math.abs(this.target));
    if (Math.abs(this.x - this.target) < 0.0005 * scale && Math.abs(this.v) < 0.01 * scale) {
      this.x = this.target; this.v = 0; this.rest = true;
    }
  };

  // ---------- pętla ----------
  var active = new Set();
  var running = false, last = 0;
  function tick(now) {
    var dt = last ? (now - last) / 1000 : 1 / 60;
    last = now;
    active.forEach(function (job) { if (job.step(dt)) active.delete(job); });
    if (active.size) requestAnimationFrame(tick);
    else { running = false; last = 0; }
  }
  function schedule(job) {
    active.add(job);
    if (!running && hasWindow) { running = true; requestAnimationFrame(tick); }
  }

  // ---------- elementy ----------
  var DEFAULTS = { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 };
  var states = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

  function state(el) {
    var s = states.get(el);
    if (!s) {
      s = { springs: {}, onDone: null };
      s.job = { step: function (dt) {
        var moving = false;
        Object.keys(s.springs).forEach(function (k) {
          var sp = s.springs[k];
          if (!sp.rest) { sp.step(dt); if (!sp.rest) moving = true; }
        });
        render(el, s);
        if (!moving && s.onDone) { var cb = s.onDone; s.onDone = null; cb(); }
        return !moving;
      } };
      states.set(el, s);
    }
    return s;
  }

  function spring(s, el, key) {
    if (!s.springs[key]) {
      var start = DEFAULTS[key];
      if (key === 'opacity' && hasWindow) start = parseFloat(getComputedStyle(el).opacity) || 0;
      s.springs[key] = new Spring(start);
    }
    return s.springs[key];
  }

  function render(el, s) {
    var v = function (k) { return s.springs[k] ? s.springs[k].x : DEFAULTS[k]; };
    var t = '';
    if (s.springs.x || s.springs.y) t += 'translate3d(' + v('x').toFixed(2) + 'px,' + v('y').toFixed(2) + 'px,0)';
    if (s.springs.scale) t += ' scale(' + v('scale').toFixed(4) + ')';
    if (s.springs.rotate) t += ' rotate(' + v('rotate').toFixed(3) + 'deg)';
    el.style.transform = t.trim();
    if (s.springs.opacity) el.style.opacity = String(Math.max(0, Math.min(1, v('opacity'))));
  }

  function animate(el, props, opts) {
    opts = opts || {};
    var s = state(el);
    var vel = opts.velocity || {};
    var rm = reduced();
    Object.keys(props).forEach(function (k) {
      var sp = spring(s, el, k);
      if (rm && k !== 'opacity') { sp.x = props[k]; sp.v = 0; sp.target = props[k]; sp.rest = true; return; }
      sp.configure(props[k], rm ? { preset: 'snappy' } : opts, vel[k]);
    });
    s.onDone = opts.onDone || null;
    render(el, s);
    schedule(s.job);
  }

  function set(el, props) {
    var s = state(el);
    Object.keys(props).forEach(function (k) {
      var sp = spring(s, el, k);
      sp.x = props[k]; sp.target = props[k]; sp.v = 0; sp.rest = true;
    });
    render(el, s);
  }

  function get(el, key) {
    var s = states.get(el);
    return s && s.springs[key] ? s.springs[key].x : DEFAULTS[key];
  }

  /** Liczba na sprężynie, np. cena. onUpdate dostaje bieżącą wartość w każdej klatce. */
  function value(from, onUpdate, opts) {
    var sp = new Spring(from);
    var job = { step: function (dt) { sp.step(dt); onUpdate(sp.x); return sp.rest; } };
    return {
      to: function (target, velocity) {
        if (reduced()) { sp.x = target; sp.v = 0; sp.target = target; sp.rest = true; onUpdate(target); return; }
        sp.configure(target, opts, velocity);
        schedule(job);
      },
      stop: function () { active.delete(job); },
      get: function () { return sp.x; }
    };
  }

  /** Prędkość gestu z ostatnich ~100 ms, w px/s. */
  function tracker() {
    var pts = [];
    return {
      push: function (pos, t) {
        t = t || performance.now();
        pts.push({ p: pos, t: t });
        while (pts.length > 2 && t - pts[0].t > 100) pts.shift();
      },
      velocity: function () {
        if (pts.length < 2) return 0;
        var a = pts[0], b = pts[pts.length - 1];
        var dt = (b.t - a.t) / 1000;
        return dt > 0 ? (b.p - a.p) / dt : 0;
      },
      reset: function () { pts = []; }
    };
  }

  /** Punkt zatrzymania rzutu (funkcja z „Designing Fluid Interfaces”). */
  function project(velocity, rate) {
    rate = rate || 0.998;
    return (velocity / 1000) * rate / (1 - rate);
  }

  function rubberband(overshoot, size, c) {
    c = c || 0.55;
    return (overshoot * size * c) / (size + c * Math.abs(overshoot));
  }

  /** Jednorazowe, delikatne wejście. Bez obserwatora albo przy ograniczonym ruchu treść zostaje widoczna. */
  function reveal(nodes) {
    if (!hasWindow || !('IntersectionObserver' in window)) return;
    var rm = reduced();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        animate(e.target, rm ? { opacity: 1 } : { opacity: 1, y: 0 }, { preset: 'ui' });
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    Array.prototype.forEach.call(nodes, function (n) {
      var r = n.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92) return; // to, co widać od razu, zostaje w spoczynku
      set(n, rm ? { opacity: 0 } : { opacity: 0, y: 14 });
      io.observe(n);
    });
  }

  /** Próbki krzywej 0→1 dla CSS linear() i czas ustalenia w ms. */
  function curve(preset, steps) {
    var sp = new Spring(0);
    sp.configure(1, { preset: preset });
    var dt = 1 / 240, t = 0, pts = [0], samples = [];
    while (!sp.rest && t < 3) { sp.step(dt); t += dt; samples.push(sp.x); }
    var n = steps || 32;
    for (var i = 1; i <= n; i++) pts.push(samples[Math.min(samples.length - 1, Math.round(i / n * (samples.length - 1)))]);
    pts[pts.length - 1] = 1;
    return { ms: Math.round(t * 1000), points: pts };
  }

  var api = { PRESETS: PRESETS, animate: animate, set: set, get: get, value: value, tracker: tracker,
    project: project, rubberband: rubberband, reveal: reveal, reduced: reduced, curve: curve };
  if (hasWindow) root.NicciMotion = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
