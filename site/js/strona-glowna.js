/**
 * NICCI: strona główna. Pasek zaufania, parallax hero, przejście z ciemnego do jasnego, karuzela rodzin.
 * Katalog (etap 5) i zestawy mają własne pliki; tu tylko to, co żyje na samej stronie głównej.
 */
(function () {
  'use strict';
  var A = window.NicciApp, U = window.NicciUI, M = window.NicciMotion, R = window.NicciRodziny, NUTY = window.NicciNuty;
  var esc = U.esc;

  // ---------- parallax hero: kilkanaście pikseli, tylko dopóki hero jest na ekranie ----------
  function initParallax() {
    var media = document.querySelector('[data-parallax]');
    if (!media || M.reduced()) return;
    var hero = media.parentElement;
    var raf = 0;
    // na telefonie opis leży tuż nad atomizerami, a przyciski tuż pod nimi: przesunięcie zdjęcia by je zbliżyło
    var phone = window.matchMedia('(max-width: 47.99rem)');
    function update() {
      raf = 0;
      if (phone.matches) { M.set(media, { y: 0 }); return; }
      var h = hero.offsetHeight;
      if (window.scrollY > h) return;
      M.set(media, { y: Math.min(12, window.scrollY * 0.03) });
    }
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  }

  // ---------- przejście z sekcji 2 do 3: światło wstaje razem z przewijaniem ----------
  function initHorizon() {
    var el = document.querySelector('[data-horizon]');
    if (!el) return;
    if (M.reduced()) { el.style.setProperty('--p', '0.6'); return; }
    var raf = 0, on = false;
    function update() {
      raf = 0;
      var r = el.getBoundingClientRect(), vh = window.innerHeight;
      // 0: pas dopiero wchodzi od dołu ekranu; 1: jego dół minął 45% wysokości ekranu
      var p = (vh - r.top) / (vh * 0.55 + r.height);
      el.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3));
    }
    function onScroll() { if (on && !raf) raf = requestAnimationFrame(update); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { on = e[0].isIntersecting; if (on) update(); }, { rootMargin: '10% 0px' }).observe(el);
    } else { on = true; }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  // ---------- pasek zaufania: liczba zapachów z katalogu ----------
  function trustCount(catalog) {
    var n = catalog.products.length;
    document.querySelectorAll('[data-count-products]').forEach(function (el) {
      el.textContent = n + ' ' + A.plural(n, ['zapach', 'zapachy', 'zapachów']);
    });
  }

  // ---------- rodziny ----------
  /** Najczęstsze nuty rodziny, które mają miniaturę (bez powtórzeń tej samej miniatury). */
  function familyNotes(items, k) {
    var count = {};
    items.forEach(function (p) {
      ['glowy', 'serca', 'bazy'].forEach(function (t) {
        (p.nuty[t] || []).forEach(function (n) {
          var s = NUTY.slug(n);
          if (s) count[s] = (count[s] || 0) + 1;
        });
      });
    });
    return Object.keys(count).sort(function (a, b) { return count[b] - count[a]; }).slice(0, k);
  }

  function noteList(slugs, label) {
    return '<ul class="note-row" role="list" aria-label="' + esc(label) + '">' + slugs.map(function (s) {
      return '<li><img src="/img/nuty/' + s + '.webp" alt="" width="256" height="256" loading="lazy" decoding="async">' +
        '<span>' + esc(NUTY.NAZWY[s]) + '</span></li>';
    }).join('') + '</ul>';
  }

  function familySlide(g) {
    var slug = R.slug(g.key);
    var n = g.items.length;
    var name = U.cap(g.key);
    var desc = R.opis(g.key);
    var notes = familyNotes(g.items, 5);
    return '<div class="families__slide" data-slide>' +
      '<div class="families__media"><picture>' +
        '<source media="(min-width: 64rem)" srcset="/img/rodziny/' + slug + '-45-640.webp 640w, /img/rodziny/' + slug + '-45-1280.webp 1280w" sizes="(min-width: 80rem) 38rem, 48vw">' +
        '<img src="/img/rodziny/' + slug + '-43-800.webp" srcset="/img/rodziny/' + slug + '-43-800.webp 800w, /img/rodziny/' + slug + '-43-1200.webp 1200w"' +
        ' sizes="(min-width: 48rem) 80vw, 86vw" width="800" height="600" alt="" loading="lazy" decoding="async" draggable="false">' +
      '</picture></div>' +
      '<div class="families__panel">' +
        '<p class="t-eyebrow">Rodzina zapachowa</p>' +
        '<h3 class="families__name">' + esc(name) + '</h3>' +
        '<p class="families__count">' + n + ' ' + A.plural(n, ['zapach', 'zapachy', 'zapachów']) + ' w katalogu</p>' +
        (notes.length ? noteList(notes, 'Typowe nuty tej rodziny') : '') +
        (desc ? '<p class="families__desc">' + esc(desc) + '</p>' : '') +
        '<div class="families__cta">' +
          '<a class="btn btn--primary" href="' + A.url('/quiz?rodzina=' + slug) + '">Dobierz zapach w minutę</a>' +
          '<a class="link" href="' + A.url('/?rodzina=' + slug) + '#katalog" data-filter-family="' + esc(g.key) + '">Zobacz zapachy z tej rodziny</a>' +
        '</div>' +
      '</div></div>';
  }

  function quizSlide(total) {
    var collage = ['cytryna', 'roza', 'drewno', 'wanilia', 'bergamotka', 'skora', 'szafran', 'mieta', 'ambra'];
    return '<div class="families__slide families__slide--quiz" data-slide>' +
      '<div class="families__media families__collage" aria-hidden="true">' + collage.map(function (s, k) {
        return '<img src="/img/nuty/' + s + '.webp" alt="" width="256" height="256" loading="lazy" decoding="async" draggable="false" style="--k:' + k + '">';
      }).join('') + '</div>' +
      '<div class="families__panel">' +
        '<p class="t-eyebrow">Quiz zapachowy</p>' +
        '<h3 class="families__name">Nie wiesz, do której należysz?</h3>' +
        '<p class="families__desc">Pięć pytań, około minuty. Sprawdzimy ' + total + ' ' + A.plural(total, ['zapach', 'zapachy', 'zapachów']) +
        ' i pokażemy trzy, które najbardziej pasują do Twoich odpowiedzi.</p>' +
        '<div class="families__cta"><a class="btn btn--primary" href="' + A.url('/quiz') + '">Dobierz zapach w minutę</a></div>' +
      '</div></div>';
  }

  function renderFamilies(catalog) {
    var root = document.querySelector('.families [data-carousel]');
    var track = root && root.querySelector('[data-families]');
    if (!track) return;
    // tylko rodziny obecne w katalogu, od najliczniejszej
    var groups = window.Nicci.groupProducts(catalog.products, 'rodzina').filter(function (g) { return g.items.length; })
      .sort(function (a, b) { return b.items.length - a.items.length || a.key.localeCompare(b.key, 'pl'); });
    track.innerHTML = groups.map(familySlide).join('') + quizSlide(catalog.products.length);
    var labels = groups.map(function (g) { return U.cap(g.key); }).concat(['Quiz']);
    window.NicciCarousel.mount(root, { label: function (k) { return labels[k]; } });

    track.addEventListener('click', function (e) {
      var link = e.target.closest('[data-filter-family]');
      if (!link || !document.querySelector('[data-catalog]')) return;
      // na stronie głównej filtr ustawiamy bez przeładowania; katalog słucha tego zdarzenia (etap 5)
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('nicci:filter', { detail: { rodzina: [link.dataset.filterFamily] } }));
      var target = document.getElementById('katalog');
      target.scrollIntoView({ behavior: M.reduced() ? 'auto' : 'smooth', block: 'start' });
    });
  }

  function familiesError() {
    var track = document.querySelector('[data-families]');
    if (!track) return;
    track.innerHTML = '<div class="families__slide families__slide--quiz" data-slide><div class="families__panel">' +
      '<h3 class="families__name">Rodziny zapachowe chwilowo się nie wczytały</h3>' +
      '<p class="families__desc">Odśwież stronę za moment. Quiz działa tak jak zawsze.</p>' +
      '<div class="families__cta"><a class="btn btn--primary" href="' + A.url('/quiz') + '">Dobierz zapach w minutę</a></div></div></div>';
  }

  function init() {
    initParallax();
    initHorizon();
    A.catalog().then(function (catalog) {
      trustCount(catalog);
      renderFamilies(catalog);
      document.dispatchEvent(new CustomEvent('nicci:catalog-ready', { detail: catalog }));
    }, familiesError);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
