/**
 * NICCI: szuflada i sheet. Koszyk, szczegóły produktu, filtry.
 *   var d = NicciDrawer.open({title, body (Node|string HTML), foot, trigger, label, onClose, side})
 *   d.close()
 * Telefon: sheet od dołu. Od 48rem: panel z prawej. Zamyka się tą samą drogą, którą przyszedł.
 * Gest: przeciąganie 1:1, po puszczeniu rzut z prędkością palca. Esc, klik w tło, przycisk.
 * Strona pod spodem: przyciemnienie, lekkie odsunięcie w głąb, inert, blokada przewijania.
 */
(function () {
  'use strict';
  var M = window.NicciMotion;
  var current = null;
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function side() { return window.matchMedia('(min-width: 48rem)').matches ? 'right' : 'bottom'; }

  function open(opts) {
    if (current) current.close(true);
    opts = opts || {};
    var mode = opts.side || side();
    var axis = mode === 'right' ? 'x' : 'y';
    var trigger = opts.trigger || document.activeElement;
    var pageRoot = document.querySelector('[data-page-root]');
    var titleId = 'drawer-t-' + Date.now();

    var root = document.createElement('div');
    root.className = 'drawer drawer--' + mode;
    root.innerHTML =
      '<div class="drawer__scrim" data-drawer-close></div>' +
      '<div class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="' + titleId + '" tabindex="-1">' +
        (mode === 'bottom' ? '<div class="drawer__grip" data-drawer-drag aria-hidden="true"></div>' : '') +
        '<header class="drawer__head" data-drawer-drag>' +
          '<h2 class="drawer__title t-h4" id="' + titleId + '"></h2>' +
          '<button type="button" class="drawer__close" data-drawer-close aria-label="Zamknij">' +
            '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
          '</button>' +
        '</header>' +
        '<div class="drawer__body"></div>' +
        '<footer class="drawer__foot" hidden></footer>' +
      '</div>';
    root.querySelector('.drawer__title').textContent = opts.title || '';
    var body = root.querySelector('.drawer__body');
    if (typeof opts.body === 'string') body.innerHTML = opts.body; else if (opts.body) body.appendChild(opts.body);
    var foot = root.querySelector('.drawer__foot');
    if (opts.foot) { foot.hidden = false; if (typeof opts.foot === 'string') foot.innerHTML = opts.foot; else foot.appendChild(opts.foot); }
    document.body.appendChild(root);

    var panel = root.querySelector('.drawer__panel');
    var scrim = root.querySelector('.drawer__scrim');
    var size = function () { return axis === 'x' ? panel.offsetWidth : panel.offsetHeight; };
    var closed = false;

    // strona pod spodem
    var scrollY = window.scrollY;
    var sbw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.classList.add('drawer-open');
    document.documentElement.style.setProperty('--sbw', sbw + 'px');
    if (pageRoot) {
      pageRoot.inert = true;
      // głębia względem środka widocznego ekranu; od góry dokumentu przewinięta strona uciekałaby w górę
      pageRoot.style.transformOrigin = '50% ' + Math.round(scrollY + window.innerHeight / 2) + 'px';
    }

    function depth(progress) {
      // progress 1 = otwarta. Tło przyciemnia się i cofa proporcjonalnie do ruchu panelu.
      M.set(scrim, { opacity: progress });
      if (pageRoot && !M.reduced()) M.set(pageRoot, { scale: 1 - 0.018 * progress });
    }

    var pos = { v: size() };
    var driver = M.value(size(), function (x) {
      pos.v = x;
      if (axis === 'x') M.set(panel, { x: x }); else M.set(panel, { y: x });
      depth(1 - Math.min(1, Math.max(0, x / size())));
    }, { preset: 'sheet' });

    if (M.reduced()) {
      driver.to(0);
      M.set(panel, { opacity: 0 });
      M.animate(panel, { opacity: 1 }, { preset: 'snappy' });
    } else {
      driver.to(0);
    }
    requestAnimationFrame(function () { panel.focus({ preventScroll: true }); });

    function close(immediate, velocity) {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey, true);
      var finish = function () {
        root.remove();
        document.documentElement.classList.remove('drawer-open');
        if (pageRoot) { pageRoot.inert = false; M.set(pageRoot, { scale: 1 }); pageRoot.style.transform = ''; pageRoot.style.transformOrigin = ''; }
        window.scrollTo(0, scrollY);
        if (trigger && document.contains(trigger)) trigger.focus({ preventScroll: true });
        if (current === api) current = null;
        if (opts.onClose) opts.onClose();
      };
      if (immediate || M.reduced()) { finish(); return; }
      var target = size();
      var job = M.value(pos.v, function (x) {
        if (axis === 'x') M.set(panel, { x: x }); else M.set(panel, { y: x });
        depth(1 - Math.min(1, Math.max(0, x / target)));
        if (x >= target - 0.5) { job.stop(); finish(); }
      }, { preset: 'sheet' });
      driver.stop();
      job.to(target, velocity || 0);
      // bezpiecznik, gdyby sprężyna nie doszła do końca w tej karcie przeglądarki
      setTimeout(function () { if (document.contains(root)) finish(); }, 900);
    }

    // ---------- klawiatura: Esc i pułapka fokusu ----------
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(panel.querySelectorAll(FOCUSABLE), function (n) { return n.offsetParent !== null; });
      if (!f.length) { e.preventDefault(); panel.focus(); return; }
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey, true);
    root.addEventListener('click', function (e) { if (e.target.closest('[data-drawer-close]')) close(); });

    // ---------- gest ----------
    var drag = null;
    var tracker = M.tracker();
    panel.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || closed) return;
      var onHandle = e.target.closest('[data-drawer-drag]');
      var atTop = mode === 'bottom' && body.scrollTop <= 0 && body.contains(e.target);
      if (!onHandle && !atTop) return;
      if (e.target.closest('button, a, input, select, textarea, label')) return;
      drag = { id: e.pointerId, start: axis === 'x' ? e.clientX : e.clientY, from: pos.v, active: false };
      tracker.reset();
    });
    panel.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var p = axis === 'x' ? e.clientX : e.clientY;
      var delta = p - drag.start;
      if (!drag.active) {
        if (Math.abs(delta) < 8) return; // histereza, zanim uznamy to za gest
        if (delta < 0 && drag.from <= 0 && body.scrollTop > 0) { drag = null; return; }
        drag.active = true;
        panel.setPointerCapture(e.pointerId);
        driver.stop();
      }
      e.preventDefault();
      var next = drag.from + delta;
      if (next < 0) next = M.rubberband(next, size()); // opór przy przeciąganiu dalej niż pełne otwarcie
      pos.v = next;
      if (axis === 'x') M.set(panel, { x: next }); else M.set(panel, { y: next });
      depth(1 - Math.min(1, Math.max(0, next / size())));
      tracker.push(p);
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var was = drag.active;
      drag = null;
      if (!was) return;
      var v = tracker.velocity();
      var projected = pos.v + M.project(v);
      if (projected > size() * 0.5) {
        close(false, v);
      } else {
        driver.stop();
        driver = M.value(pos.v, function (x) {
          pos.v = x;
          if (axis === 'x') M.set(panel, { x: x }); else M.set(panel, { y: x });
          depth(1 - Math.min(1, Math.max(0, x / size())));
        }, { preset: 'momentum' });
        driver.to(0, v);
      }
    }
    panel.addEventListener('pointerup', end);
    panel.addEventListener('pointercancel', end);

    var api = { close: function (immediate) { close(immediate); }, root: root, panel: panel, body: body, foot: foot };
    current = api;
    return api;
  }

  window.NicciDrawer = { open: open, current: function () { return current; } };
})();
