/**
 * NICCI: sekcja 4 strony głównej, rolki z Instagrama (decyzje 88 i 93).
 * Boxy 9:16 stoją w HTML (index.html) i unoszą się lekko w CSS, każdy w innym rytmie. Tu:
 *  1) karuzela bez końca: lista rolek jest skopiowana przed i za oryginałem (kopie bez fokusu i ukryte przed czytnikiem
 *     ekranu), a po zakończeniu przewijania pozycja przeskakuje o długość jednej listy, czego nie widać;
 *  2) zajawki: każdy widoczny box z data-wideo sam odtwarza w pętli 6 s bez dźwięku, wszystkie naraz. Żeby nie
 *     spowalniać strony, nic nie jest pobierane przy wczytywaniu: element <video> i plik (100 do 240 KB) powstają
 *     dopiero po zdarzeniu load, gdy box jest na ekranie (lub 300 px przed nim); box poza ekranem jest wstrzymany.
 *     Bez zajawek przy ograniczonym ruchu i oszczędzaniu danych (Save-Data): wtedy zostają okładki;
 *  3) kliknięcie boxa z data-film otwiera cały film z dźwiękiem w oknie (natywny <dialog>); bez JavaScriptu link
 *     prowadzi do profilu na Instagramie.
 */
(function () {
  'use strict';
  var M = window.NicciMotion;
  var rail = document.querySelector('[data-ig-rail]');
  if (!rail) return;
  var track = rail.querySelector('[data-ig-track]');
  var section = rail.closest('section');
  var prev = section.querySelector('[data-ig-prev]');
  var next = section.querySelector('[data-ig-next]');
  var reduced = !!(M && M.reduced && M.reduced());

  // ---------- karuzela bez końca ----------
  var originals = Array.prototype.slice.call(track.children);
  var n = originals.length;
  function copy(li, i) {
    var c = li.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.setAttribute('data-kopia', '');
    c.style.setProperty('--i', i);
    c.querySelectorAll('a, button').forEach(function (el) { el.setAttribute('tabindex', '-1'); });
    return c;
  }
  if (n > 1) {
    var before = document.createDocumentFragment(), after = document.createDocumentFragment();
    originals.forEach(function (li, i) { before.appendChild(copy(li, i + n)); after.appendChild(copy(li, i + 2 * n)); });
    track.insertBefore(before, track.firstChild);
    track.appendChild(after);
  }
  function setWidth() { var it = track.children; return n > 1 ? it[n].offsetLeft - it[0].offsetLeft : 0; }
  function normalize() {
    var w = setWidth();
    if (!w) return;
    var x = rail.scrollLeft;
    if (x < w * 0.5) rail.scrollLeft = x + w;
    else if (x >= w * 1.5) rail.scrollLeft = x - w;
  }
  function start() { var w = setWidth(); if (w) rail.scrollLeft = w; }
  start();
  window.addEventListener('load', function () { if (rail.scrollLeft < 4) start(); }, { once: true });

  var timer = 0;
  if ('onscrollend' in window) rail.addEventListener('scrollend', normalize);
  else rail.addEventListener('scroll', function () { clearTimeout(timer); timer = setTimeout(normalize, 160); }, { passive: true });
  var rw = 0;
  window.addEventListener('resize', function () { cancelAnimationFrame(rw); rw = requestAnimationFrame(normalize); });

  function step(dir) {
    var it = track.children;
    var w = n > 1 ? it[1].offsetLeft - it[0].offsetLeft : rail.clientWidth / 2;
    var per = Math.max(1, Math.floor(rail.clientWidth / w) - 1);
    rail.scrollBy({ left: dir * per * w, behavior: reduced ? 'auto' : 'smooth' });
  }
  if (prev) prev.addEventListener('click', function () { step(-1); });
  if (next) next.addEventListener('click', function () { step(1); });

  // ---------- cały film po kliknięciu (zmienne potrzebne też zajawkom) ----------
  var film = null, filmVideo = null, filmCap = null, filmIg = null, opener = null;

  // ---------- zajawki w boxach: autoodtwarzanie widocznych, ładowane po wczytaniu strony ----------
  var previews = [];
  var visible = [];
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var ICON_MUTED = '<svg class="ig__mute" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  function video(box) {
    if (box._v) return box._v;
    var v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    v.preload = 'auto';
    v.addEventListener('playing', function () { box.dataset.playing = ''; });
    v.src = box.dataset.wideo;
    var pic = box.querySelector('picture');
    box.insertBefore(v, pic ? pic.nextSibling : box.firstChild); // nad okładką, pod ikoną i podpisem
    var icon = box.querySelector('.ig__play');
    if (icon) icon.insertAdjacentHTML('beforeend', ICON_MUTED);
    previews.push(v);
    return (box._v = v);
  }
  function play(box) {
    if (film && film.open) return;
    var p = video(box).play(); if (p && p.catch) p.catch(function () {});
  }
  function pause(box) { if (box._v) box._v.pause(); }
  function armPreviews() {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var box = e.target, i = visible.indexOf(box);
        if (e.isIntersecting) { if (i < 0) visible.push(box); play(box); }
        else { if (i >= 0) visible.splice(i, 1); pause(box); }
      });
    }, { rootMargin: '300px 0px' });
    Array.prototype.forEach.call(track.querySelectorAll('.ig__box[data-wideo]'), function (box) { io.observe(box); });
    document.addEventListener('visibilitychange', function () {
      visible.forEach(function (box) { if (document.hidden) pause(box); else play(box); });
    });
  }
  if (!reduced && !saveData) {
    var go = function () {
      if (window.requestIdleCallback) window.requestIdleCallback(armPreviews, { timeout: 2000 });
      else setTimeout(armPreviews, 200);
    };
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
  }

  var ICON_X = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  function build() {
    film = document.createElement('dialog');
    film.className = 'ig-film theme-dark';
    film.setAttribute('aria-label', 'Film z Instagrama Nicci Fragrance');
    film.innerHTML =
      '<div class="ig-film__inner">' +
        '<div class="ig-film__frame"><video class="ig-film__video" controls playsinline preload="none"></video>' +
          '<button type="button" class="ig-film__close" aria-label="Zamknij film">' + ICON_X + '</button></div>' +
        '<p class="ig-film__cap"></p>' +
        '<a class="ig-film__ig" target="_blank" rel="noopener">Więcej na naszym Instagramie</a>' +
      '</div>';
    document.body.appendChild(film);
    filmVideo = film.querySelector('video');
    filmCap = film.querySelector('.ig-film__cap');
    filmIg = film.querySelector('.ig-film__ig');
    film.addEventListener('click', function (e) {
      if (e.target === film || e.target.closest('.ig-film__close')) close();
    });
    film.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
  }
  function open(box) {
    if (!film) build();
    opener = box;
    previews.forEach(function (v) { v.pause(); });
    var img = box.querySelector('img');
    filmVideo.poster = img ? img.getAttribute('src').replace('-320.', '-640.') : '';
    filmVideo.src = box.dataset.film;
    filmCap.textContent = (box.querySelector('.ig__cap') || {}).textContent || '';
    filmIg.href = box.href;
    var sbw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--sbw', sbw + 'px');
    document.documentElement.classList.add('ig-open');
    film.showModal();
    var p = filmVideo.play(); if (p && p.catch) p.catch(function () {});
  }
  function close() {
    if (!film || !film.open) return;
    filmVideo.pause();
    filmVideo.removeAttribute('src');
    filmVideo.load(); // przerywa pobieranie filmu
    film.close();
    document.documentElement.classList.remove('ig-open');
    if (opener && !opener.closest('[data-kopia]')) opener.focus({ preventScroll: true });
    visible.forEach(play);
  }
  track.addEventListener('click', function (e) {
    var box = e.target.closest('.ig__box[data-film]');
    if (!box || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open(box);
  });
})();
