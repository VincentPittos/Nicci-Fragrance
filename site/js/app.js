/**
 * NICCI: powłoka każdej podstrony.
 *   NicciApp.src()            źródło wejścia z tej sesji (?src=reel12)
 *   NicciApp.url(path)        adres wewnętrzny z doklejonym src
 *   NicciApp.catalog(force)   katalog z sessionStorage, odświeżany w tle po 2 minutach (Promise)
 *   NicciApp.onCatalog(fn)    powiadomienie, gdy przyjdzie świeższy katalog w tle
 *   NicciApp.dropCatalog()    wymusza pobranie przy następnym wywołaniu (po zamówieniu, po braku stanu)
 * Nagłówek: przezroczysty nad hero, po przewinięciu ciemny z rozmyciem. Menu na telefonie w szufladzie.
 */
(function () {
  'use strict';
  var N = window.Nicci;
  var SRC_KEY = 'nicci_src';
  var CAT_KEY = 'nicci_catalog_v1';
  // Zapisany katalog pokazujemy od razu; starszy niż 2 minuty dodatkowo odświeżamy w tle (onCatalog).
  // Backend trzyma katalog w cache 5 minut (CONFIG.CACHE_SECONDS), więc zmiana ceny w arkuszu dociera na stronę w tym czasie.
  var FRESH_MS = 2 * 60 * 1000;

  function ss(method, key, value) {
    try { return method === 'get' ? sessionStorage.getItem(key) : method === 'set' ? sessionStorage.setItem(key, value) : sessionStorage.removeItem(key); }
    catch (e) { return null; } // tryb prywatny: działamy bez pamięci sesji
  }

  // ---------- źródło wejścia ----------
  // nicci-api.js zapisuje src do zamówienia (readUrlParams). Tu pilnujemy, żeby przetrwał każdy link w sesji.
  var params = N.readUrlParams();
  if (new URLSearchParams(location.search).get('src')) ss('set', SRC_KEY, params.src);
  function src() { return ss('get', SRC_KEY) || ''; }

  function url(path) {
    var s = src();
    var u = new URL(path, location.href);
    if (u.origin !== location.origin || !s || u.searchParams.has('src')) return u.origin === location.origin ? u.pathname + u.search + u.hash : u.href;
    u.searchParams.set('src', s);
    return u.pathname + u.search + u.hash;
  }

  function decorate(a) {
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto|tel|javascript|sms):/i.test(href)) return;
    var u = new URL(a.href);
    if (u.origin !== location.origin) return;
    var next = url(u.pathname + u.search + u.hash);
    if (next !== href) a.setAttribute('href', next);
  }
  function decorateAll(root) { (root || document).querySelectorAll('a[href]').forEach(decorate); }
  // linki dodane później (karty, szuflady) dostają src w chwili kliknięcia
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (a) decorate(a);
  }, true);

  // ---------- podgląd lokalny ----------
  // Dopóki API_URL w nicci-api.js nie jest uzupełnione, zapytania do niego idą do atrapy backendu na
  // lokalnym serwerze (dev/serwer.py → dev/atrapa_backendu.js, te same funkcje co Code.gs). Na produkcji,
  // z prawdziwym API_URL, ten fragment nic nie robi.
  if (/UZUPELNIJ/.test(N.CONFIG.API_URL) && window.fetch) {
    var realFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var u = typeof input === 'string' ? input : input && input.url;
      if (u && u.indexOf(N.CONFIG.API_URL) === 0) return realFetch('/__dev/api' + u.slice(N.CONFIG.API_URL.length), init);
      return realFetch(input, init);
    };
  }

  // ---------- katalog ----------
  var memory = null;
  var listeners = [];
  var inflight = null;

  function isDev() { return /UZUPELNIJ/.test(N.CONFIG.API_URL); }

  function fetchFresh(force) {
    if (inflight && !force) return inflight;
    var p = N.fetchCatalog(force);
    inflight = p.then(function (data) {
      memory = data;
      ss('set', CAT_KEY, JSON.stringify({ t: Date.now(), data: data }));
      inflight = null;
      return data;
    }, function (err) { inflight = null; throw err; });
    return inflight;
  }

  function catalog(force) {
    if (force) return fetchFresh(true);
    if (memory) return Promise.resolve(memory);
    var saved = null;
    try { saved = JSON.parse(ss('get', CAT_KEY) || 'null'); } catch (e) { saved = null; }
    if (saved && saved.data) {
      memory = saved.data;
      if (Date.now() - saved.t > FRESH_MS) {
        fetchFresh(true).then(function (d) { listeners.forEach(function (fn) { fn(d); }); }, function () {});
      }
      return Promise.resolve(memory);
    }
    return fetchFresh(false);
  }
  function onCatalog(fn) { listeners.push(fn); }
  function dropCatalog() { memory = null; ss('remove', CAT_KEY); }

  // ---------- liczebniki ----------
  /** plural(64, ['zapach','zapachy','zapachów']) → „zapachy” */
  function plural(n, forms) {
    var d = n % 10, dd = n % 100;
    if (n === 1) return forms[0];
    if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return forms[1];
    return forms[2];
  }

  // ---------- nagłówek ----------
  function initHeader() {
    var header = document.querySelector('[data-header]');
    if (!header) return;
    var ticking = false;
    function update() {
      ticking = false;
      header.toggleAttribute('data-scrolled', window.scrollY > 8);
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();

    var menuBtn = header.querySelector('[data-menu]');
    var nav = header.querySelector('[data-nav]');
    if (menuBtn && nav && window.NicciDrawer) {
      menuBtn.addEventListener('click', function () {
        var list = nav.querySelector('ul').cloneNode(true);
        list.className = 'menu-list';
        list.removeAttribute('id');
        var d = window.NicciDrawer.open({
          title: 'Menu', body: list, trigger: menuBtn, side: 'right',
          onClose: function () { menuBtn.setAttribute('aria-expanded', 'false'); }
        });
        d.root.classList.add('drawer--menu');
        d.panel.classList.add('theme-dark');
        menuBtn.setAttribute('aria-expanded', 'true');
        list.addEventListener('click', function (e) {
          var a = e.target.closest('a');
          if (!a) return;
          var hash = a.hash && a.pathname === location.pathname ? a.hash : '';
          if (hash) {
            e.preventDefault();
            d.close(true);
            var target = document.querySelector(hash);
            if (target) {
              target.scrollIntoView({ behavior: window.NicciMotion.reduced() ? 'auto' : 'smooth', block: 'start' });
              history.replaceState(null, '', hash);
            }
          }
        });
      });
    }
  }

  // ---------- stopka: rok i Instagram z konfiguracji ----------
  function igHandle() {
    var h = N.CONFIG.IG_HANDLE;
    return h && !/UZUPELNIJ/.test(h) ? h : '';
  }
  function initFooter() {
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
    var h = igHandle();
    document.querySelectorAll('[data-ig]').forEach(function (a) { if (h) a.href = 'https://instagram.com/' + h; });
    document.querySelectorAll('[data-ig-dm]').forEach(function (a) { if (h) a.href = 'https://ig.me/m/' + h; });
  }

  function init() {
    decorateAll();
    initHeader();
    initFooter();
    if (window.NicciUI) window.NicciUI.initCart();
    if (window.NicciMotion) window.NicciMotion.reveal(document.querySelectorAll('[data-reveal]'));
  }

  window.NicciApp = {
    src: src, url: url, decorate: decorateAll, catalog: catalog, onCatalog: onCatalog, dropCatalog: dropCatalog,
    plural: plural, params: params, isDev: isDev, igHandle: igHandle
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
