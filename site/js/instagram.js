/**
 * NICCI: sekcja 4 strony głównej, rolki z Instagrama (decyzja 88).
 * Boxy 9:16 stoją w HTML (index.html) i unoszą się lekko w CSS, każdy w innym rytmie; tu tylko przewijanie strzałkami
 * i wideo. Box z data-wideo (plik mp4 rolki) odtwarza ją bez dźwięku: na komputerze po najechaniu, na telefonie gdy
 * jest w większości na ekranie. Kliknięcie zawsze otwiera Instagram (rolkę albo profil).
 */
(function () {
  'use strict';
  var M = window.NicciMotion;
  var rail = document.querySelector('[data-ig-rail]');
  if (!rail) return;
  var section = rail.closest('section');
  var prev = section.querySelector('[data-ig-prev]');
  var next = section.querySelector('[data-ig-next]');

  function update() {
    var max = rail.scrollWidth - rail.clientWidth;
    if (prev) prev.disabled = rail.scrollLeft < 4;
    if (next) next.disabled = max <= 4 || rail.scrollLeft > max - 4;
  }
  function step(dir) {
    var item = rail.querySelector('.ig__item');
    var w = item ? item.getBoundingClientRect().width : rail.clientWidth / 2;
    rail.scrollBy({ left: dir * Math.max(1, Math.floor(rail.clientWidth / w) - 1 || 1) * w, behavior: M && M.reduced() ? 'auto' : 'smooth' });
  }
  var raf = 0;
  rail.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; update(); }); }, { passive: true });
  window.addEventListener('resize', update);
  if (prev) prev.addEventListener('click', function () { step(-1); });
  if (next) next.addEventListener('click', function () { step(1); });
  update();

  // ---------- wideo rolek (gdy box ma data-wideo) ----------
  var boxes = Array.prototype.slice.call(rail.querySelectorAll('.ig__box[data-wideo]'));
  if (!boxes.length || (M && M.reduced())) return;
  var touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  boxes.forEach(function (box) {
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
    v.setAttribute('aria-hidden', 'true');
    v.src = box.dataset.wideo;
    box.insertBefore(v, box.firstChild.nextSibling);
    var play = function () { box.dataset.playing = ''; var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    var stop = function () { delete box.dataset.playing; v.pause(); };
    if (!touch) {
      box.addEventListener('mouseenter', play);
      box.addEventListener('mouseleave', stop);
      box.addEventListener('focus', play);
      box.addEventListener('blur', stop);
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { if (e[0].intersectionRatio > 0.6) play(); else stop(); }, { threshold: [0, 0.6, 1] }).observe(box);
    }
  });
})();
