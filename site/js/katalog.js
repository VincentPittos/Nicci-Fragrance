/**
 * NICCI: katalog na stronie głównej.
 * Wyszukiwarka, grupowanie (rodziny albo marki), filtry, usuwalne chipy, licznik, stan pusty, szkielety.
 * Filtry: rodzina, marka, pora dnia, sezon (Nicci.filterProducts), profil (tu, w warstwie strony),
 * „tylko dostępne” domyślnie włączone. Komputer: panel filtrów z boku. Telefon i tablet: szuflada.
 * Wstępne ustawienia z adresu (?rodzina=, ?marka=) i ze zdarzenia nicci:filter (karuzela rodzin).
 */
(function () {
  'use strict';
  var N = window.Nicci, A = window.NicciApp, U = window.NicciUI, C = window.NicciCard, I = window.NicciIkony, M = window.NicciMotion;
  var esc = U.esc;
  var root = document.querySelector('[data-catalog]');
  if (!root) return;

  var catalog = null;
  var state = { by: 'rodzina', szukaj: '', rodzina: [], marka: [], pora: '', sezon: '', profil: '', tylkoDostepne: true };
  var drawer = null;
  var MARKI_NA_START = 8;

  var PORA = [['dzień', 'Na dzień'], ['wieczór', 'Na wieczór']];
  var SEZON = [['wiosna', 'Wiosna'], ['lato', 'Lato'], ['jesień', 'Jesień'], ['zima', 'Zima']];
  var PROFIL = { 'męski': 'Męski', 'damski': 'Damski', 'unisex': 'Unisex' };

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l'); }
  function zapachy(n) { return n + ' ' + A.plural(n, ['zapach', 'zapachy', 'zapachów']); }

  // ---------- szkielet ----------
  function skeleton() {
    var card = '<div class="card card--grafit theme-graphite skeleton" aria-hidden="true"><div class="card__media"></div>' +
      '<div class="card__body"><span class="sk" style="width:55%;margin-inline:auto"></span><span class="sk" style="width:75%;margin-inline:auto"></span>' +
      '<span class="sk" style="height:2.75rem"></span><span class="sk" style="height:3.25rem"></span></div></div>';
    root.innerHTML = '<p class="visually-hidden" role="status">Wczytujemy katalog…</p><div class="grid grid--4">' + new Array(7).join(card) + '</div>';
  }

  // ---------- szkielet interfejsu ----------
  function shell() {
    root.innerHTML =
      '<div class="cat">' +
        '<aside class="cat__side" aria-label="Filtry" data-side></aside>' +
        '<div class="cat__main">' +
          '<div class="cat__tools">' +
            '<div class="cat__search">' +
              '<label for="cat-q">Szukaj po nazwie, marce albo nucie</label>' +
              '<div class="cat__search-box">' + I.svg('szukaj', { size: 20 }) +
                '<input id="cat-q" type="search" autocomplete="off" enterkeyhint="search" spellcheck="false" placeholder="np. wanilia, Xerjoff, Aventus" data-q>' +
              '</div>' +
            '</div>' +
            '<div class="cat__switch" role="radiogroup" aria-label="Grupuj według" data-by>' +
              '<button type="button" role="radio" data-by-value="rodzina">Rodziny zapachowe</button>' +
              '<button type="button" role="radio" data-by-value="marka">Marki</button>' +
            '</div>' +
            '<button type="button" class="btn btn--outline cat__filters-btn" data-open-filters aria-haspopup="dialog">' +
              I.svg('filtry', { size: 20 }) + '<span>Filtry</span><span class="cat__badge" data-filter-count></span></button>' +
          '</div>' +
          '<div class="cat__status">' +
            '<p class="cat__count" data-count role="status" aria-live="polite"></p>' +
            '<ul class="cat__active" role="list" data-active></ul>' +
          '</div>' +
          '<div class="cat__results" data-results></div>' +
        '</div>' +
      '</div>';
    root.querySelector('[data-side]').appendChild(filtersForm('side'));
  }

  // ---------- formularz filtrów (ten sam w panelu bocznym i w szufladzie) ----------
  function counts(key) {
    var c = {};
    catalog.products.forEach(function (p) {
      var v = p[key];
      [].concat(v || []).forEach(function (x) { c[x] = (c[x] || 0) + 1; });
    });
    return c;
  }

  function checkList(name, legend, items, limit) {
    var h = '<fieldset class="flt" data-group="' + name + '"><legend class="flt__legend">' + legend + '</legend><ul class="flt__list" role="list">';
    items.forEach(function (it, k) {
      h += '<li' + (limit && k >= limit ? ' data-more hidden' : '') + '><label class="check"><input type="checkbox" name="' + name + '" value="' + esc(it[0]) + '">' +
        '<span class="check__box" aria-hidden="true"></span><span class="check__text">' + esc(it[1]) + '</span><span class="check__n">' + it[2] + '</span></label></li>';
    });
    h += '</ul>';
    if (limit && items.length > limit) {
      h += '<button type="button" class="link flt__more" data-more-toggle aria-expanded="false">Pokaż wszystkie (' + items.length + ')</button>';
    }
    return h + '</fieldset>';
  }

  function radioChips(name, legend, items, anyLabel) {
    var h = '<fieldset class="flt" data-group="' + name + '"><legend class="flt__legend">' + legend + '</legend><div class="pills">';
    [['', anyLabel]].concat(items).forEach(function (it) {
      h += '<label class="pill"><input type="radio" name="' + name + '" value="' + esc(it[0]) + '"><span>' + esc(it[1]) + '</span></label>';
    });
    return h + '</div></fieldset>';
  }

  var formUid = 0;
  function filtersForm(where) {
    var f = document.createElement('form');
    f.className = 'flt-form';
    f.setAttribute('data-filters', where);
    f.addEventListener('submit', function (e) { e.preventDefault(); });
    formUid++;
    var rc = counts('rodzina');
    var rodziny = Object.keys(rc).sort(function (a, b) { return rc[b] - rc[a]; }).map(function (r) { return [r, U.cap(r), rc[r]]; });
    var mc = counts('marka');
    var marki = Object.keys(mc).sort(function (a, b) { return a.localeCompare(b, 'pl'); }).map(function (m) { return [m, m, mc[m]]; });
    var pc = counts('profil');
    var profile = Object.keys(PROFIL).filter(function (k) { return pc[k]; }).map(function (k) { return [k, PROFIL[k]]; });

    f.innerHTML =
      '<label class="toggle"><input type="checkbox" name="tylkoDostepne" role="switch"><span class="toggle__track" aria-hidden="true"></span><span>Tylko dostępne</span></label>' +
      checkList('rodzina', 'Rodzina zapachowa', rodziny) +
      radioChips('pora', 'Pora dnia', PORA, 'Każda') +
      radioChips('sezon', 'Pora roku', SEZON, 'Każda') +
      (profile.length > 1 ? radioChips('profil', 'Profil', profile, 'Każdy') : '') +
      checkList('marka', 'Marka', marki, MARKI_NA_START);
    // unikalne nazwy radia w każdym formularzu (panel i szuflada mogą istnieć naraz)
    f.querySelectorAll('input[type="radio"]').forEach(function (r) { r.name = r.name + '-' + formUid; r.dataset.key = r.name.split('-')[0]; });
    f.querySelectorAll('input[type="checkbox"]').forEach(function (c) { c.dataset.key = c.name; });

    f.addEventListener('change', function (e) {
      var t = e.target, key = t.dataset.key;
      if (!key) return;
      if (key === 'tylkoDostepne') state.tylkoDostepne = t.checked;
      else if (t.type === 'checkbox') {
        var list = state[key];
        var i = list.indexOf(t.value);
        if (t.checked && i === -1) list.push(t.value);
        if (!t.checked && i !== -1) list.splice(i, 1);
      } else state[key] = t.value;
      update();
    });
    f.addEventListener('click', function (e) {
      var more = e.target.closest('[data-more-toggle]');
      if (!more) return;
      var open = more.getAttribute('aria-expanded') !== 'true';
      more.closest('.flt').querySelectorAll('[data-more]').forEach(function (li) { li.hidden = !open; });
      more.setAttribute('aria-expanded', String(open));
      more.textContent = open ? 'Pokaż mniej' : 'Pokaż wszystkie (' + more.closest('.flt').querySelectorAll('li').length + ')';
    });
    sync(f);
    return f;
  }

  function sync(f) {
    f.querySelectorAll('input').forEach(function (i) {
      var key = i.dataset.key;
      if (key === 'tylkoDostepne') i.checked = state.tylkoDostepne;
      else if (i.type === 'checkbox') i.checked = state[key].indexOf(i.value) !== -1;
      else if (i.type === 'radio') i.checked = (state[key] || '') === i.value;
    });
    // zaznaczona marka spoza pierwszych ośmiu: pokaż pełną listę
    f.querySelectorAll('[data-more] input:checked').forEach(function (i) {
      var t = i.closest('.flt').querySelector('[data-more-toggle]');
      if (t && t.getAttribute('aria-expanded') !== 'true') t.click();
    });
  }

  // ---------- filtrowanie ----------
  function filtered() {
    var list = N.filterProducts(catalog.products, {
      rodzina: state.rodzina, marka: state.marka, pora: state.pora, sezon: state.sezon,
      tylkoDostepne: state.tylkoDostepne, szukaj: state.szukaj
    });
    if (state.profil) list = list.filter(function (p) { return p.profil === state.profil; });
    // zapachy ze zdjęciem na początku grupy (do czasu zdjęć wszystkich flakonów), potem kolejność z arkusza
    return list.sort(function (a, b) { return Number(!a.zdjecie) - Number(!b.zdjecie) || (a.kolejnosc || 0) - (b.kolejnosc || 0); });
  }

  function activeFilters() {
    var out = [];
    state.rodzina.forEach(function (v) { out.push({ key: 'rodzina', value: v, label: U.cap(v) }); });
    if (state.pora) out.push({ key: 'pora', value: state.pora, label: PORA.filter(function (x) { return x[0] === state.pora; })[0][1] });
    if (state.sezon) out.push({ key: 'sezon', value: state.sezon, label: U.cap(state.sezon) });
    if (state.profil) out.push({ key: 'profil', value: state.profil, label: PROFIL[state.profil] });
    state.marka.forEach(function (v) { out.push({ key: 'marka', value: v, label: v }); });
    if (state.szukaj) out.push({ key: 'szukaj', value: state.szukaj, label: '„' + state.szukaj + '”' });
    if (!state.tylkoDostepne) out.push({ key: 'tylkoDostepne', value: '', label: 'Także wyprzedane' });
    return out;
  }

  function removeFilter(key, value) {
    if (key === 'rodzina' || key === 'marka') state[key] = state[key].filter(function (v) { return v !== value; });
    else if (key === 'tylkoDostepne') state.tylkoDostepne = true;
    else state[key] = '';
    if (key === 'szukaj') root.querySelector('[data-q]').value = '';
  }

  function clearAll() {
    state.rodzina = []; state.marka = []; state.pora = ''; state.sezon = ''; state.profil = ''; state.szukaj = ''; state.tylkoDostepne = true;
    var q = root.querySelector('[data-q]');
    if (q) q.value = '';
  }

  // ---------- widok ----------
  function groupsFor(list) {
    var groups = N.groupProducts(list, state.by);
    if (state.by === 'rodzina') groups.sort(function (a, b) { return b.items.length - a.items.length || a.key.localeCompare(b.key, 'pl'); });
    return groups;
  }

  function renderResults(list) {
    var box = root.querySelector('[data-results]');
    if (!list.length) {
      box.innerHTML = '<div class="cat-empty">' +
        '<p class="cat-empty__title">Nic nie pasuje do tych filtrów</p>' +
        '<p>Zdejmij jeden albo dwa filtry. Możesz też odpowiedzieć na pięć pytań, a my dobierzemy zapach za Ciebie.</p>' +
        '<div class="cat-empty__actions"><button type="button" class="btn btn--outline" data-clear>Wyczyść filtry</button>' +
        '<a class="link" href="' + A.url('/quiz') + '">Dobierz zapach w minutę</a></div></div>';
      return;
    }
    var html = groupsFor(list).map(function (g, k) {
      var gid = 'grp-' + k;
      var title = state.by === 'rodzina' ? U.cap(g.key) : g.key;
      var n = g.items.length; // liczba rzędów przy 2 i 3 kolumnach: szacunek wysokości grupy poza ekranem (katalog.css)
      return '<section class="cat-group" aria-labelledby="' + gid + '" style="--r2:' + Math.ceil(n / 2) + ';--r3:' + Math.ceil(n / 3) + '">' +
        '<h3 class="cat-group__h" id="' + gid + '"><span>' + esc(title) + '</span><span class="cat-group__n">' + zapachy(g.items.length) + '</span></h3>' +
        '<div class="grid grid--cat">' + g.items.map(function (p) { return C.render(p, { hl: 4 }); }).join('') + '</div></section>';
    }).join('');
    box.innerHTML = html;
    C.mount(box, catalog.products);
  }

  function renderStatus(list) {
    var total = catalog.products.length;
    var active = activeFilters();
    var hidden = active.length ? '' : '';
    root.querySelector('[data-count]').textContent = list.length === total ? zapachy(total) : zapachy(list.length) + ' z ' + total;
    var box = root.querySelector('[data-active]');
    box.innerHTML = active.map(function (a) {
      return '<li><button type="button" class="chip chip--remove" data-remove="' + esc(a.key) + '" data-value="' + esc(a.value) + '" aria-label="Usuń filtr: ' + esc(a.label) + '">' +
        esc(a.label) + I.svg('zamknij', { size: 14 }) + '</button></li>';
    }).join('') + (active.length > 1 ? '<li><button type="button" class="link cat__clear" data-clear>Wyczyść wszystko</button></li>' : '') + hidden;
    var n = active.filter(function (a) { return a.key !== 'szukaj'; }).length;
    root.querySelectorAll('[data-filter-count]').forEach(function (b) { b.textContent = n ? '(' + n + ')' : ''; });
    var fb = root.querySelector('[data-open-filters]');
    if (fb) fb.setAttribute('aria-label', 'Filtry' + (n ? ', aktywne: ' + n : ''));
    root.querySelectorAll('[data-by-value]').forEach(function (b) {
      b.setAttribute('aria-checked', String(b.dataset.byValue === state.by));
      b.tabIndex = b.dataset.byValue === state.by ? 0 : -1;
    });
    if (drawer) {
      var btn = drawer.foot.querySelector('[data-show]');
      if (btn) btn.textContent = list.length ? 'Pokaż ' + zapachy(list.length) : 'Brak wyników';
    }
  }

  function update() {
    var list = filtered();
    renderResults(list);
    renderStatus(list);
    root.querySelectorAll('[data-filters]').forEach(sync);
    if (drawer) drawer.body.querySelectorAll('[data-filters]').forEach(sync);
  }

  // ---------- szuflada filtrów (telefon, tablet) ----------
  function openFilters(trigger) {
    var form = filtersForm('drawer');
    var foot = document.createElement('div');
    foot.className = 'flt-foot';
    foot.innerHTML = '<button type="button" class="link" data-clear>Wyczyść</button><button type="button" class="btn btn--primary" data-show></button>';
    drawer = window.NicciDrawer.open({ title: 'Filtry', body: form, foot: foot, trigger: trigger, onClose: function () { drawer = null; } });
    drawer.panel.classList.add('theme-light');
    foot.addEventListener('click', function (e) {
      if (e.target.closest('[data-show]')) {
        var d = drawer;
        d.close();
        setTimeout(function () { document.getElementById('katalog').scrollIntoView({ behavior: 'auto', block: 'start' }); }, 0);
      }
      if (e.target.closest('[data-clear]')) { clearAll(); update(); }
    });
    renderStatus(filtered());
  }

  // ---------- zdarzenia ----------
  function bind() {
    var q = root.querySelector('[data-q]');
    var t;
    q.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () { state.szukaj = q.value.trim(); update(); }, 180);
    });
    root.addEventListener('click', function (e) {
      var by = e.target.closest('[data-by-value]');
      if (by) { state.by = by.dataset.byValue; update(); by.focus(); return; }
      var rm = e.target.closest('[data-remove]');
      if (rm) {
        var list = root.querySelectorAll('[data-remove]');
        var idx = Array.prototype.indexOf.call(list, rm);
        removeFilter(rm.dataset.remove, rm.dataset.value);
        update();
        // fokus na sąsiedni chip albo na wyszukiwarkę, żeby klawiatura nie zgubiła miejsca
        var next = root.querySelectorAll('[data-remove]')[Math.max(0, idx - 1)] || q;
        next.focus();
        return;
      }
      if (e.target.closest('[data-clear]')) { clearAll(); update(); q.focus(); return; }
      var of = e.target.closest('[data-open-filters]');
      if (of) openFilters(of);
    });
    // przełącznik grupowania jako radiogroup: strzałki zmieniają wybór
    root.querySelector('[data-by]').addEventListener('keydown', function (e) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) === -1) return;
      e.preventDefault();
      state.by = state.by === 'rodzina' ? 'marka' : 'rodzina';
      update();
      root.querySelector('[data-by-value="' + state.by + '"]').focus();
    });
    document.addEventListener('nicci:filter', function (e) {
      var d = e.detail || {};
      if (d.rodzina) state.rodzina = d.rodzina.slice();
      if (d.marka) state.marka = d.marka.slice();
      state.by = 'rodzina';
      update();
    });
  }

  /** ?rodzina=skorzana (slug) albo nazwa, ?marka=Xerjoff */
  function presets() {
    var p = A.params || {};
    if (p.rodzina) {
      var fams = Object.keys(counts('rodzina'));
      var hit = fams.filter(function (f) { return norm(f) === norm(p.rodzina) || window.NicciRodziny.slug(f) === p.rodzina; })[0];
      if (hit) state.rodzina = [hit];
    }
    if (p.marka) {
      var brands = Object.keys(counts('marka'));
      var b = brands.filter(function (x) { return norm(x) === norm(p.marka); })[0];
      if (b) { state.marka = [b]; state.by = 'marka'; }
    }
  }

  function error() {
    root.innerHTML = '<div class="cat-empty"><p class="cat-empty__title">Katalog chwilowo się nie wczytał</p>' +
      '<p>To zwykle chwilowy problem z połączeniem. Spróbuj ponownie za moment.</p>' +
      '<div class="cat-empty__actions"><button type="button" class="btn btn--outline" data-retry>Spróbuj ponownie</button></div></div>';
    root.querySelector('[data-retry]').addEventListener('click', function () { skeleton(); load(true); });
  }

  function load(force) {
    A.catalog(force).then(function (c) {
      catalog = c;
      presets();
      shell();
      bind();
      update();
      document.dispatchEvent(new CustomEvent('nicci:catalog-shown', { detail: c }));
    }, error);
  }

  A.onCatalog(function (c) { if (catalog) { catalog = c; update(); } });

  skeleton();
  load(false);
  window.NicciKatalog = { state: state, update: function () { if (catalog) update(); } };
})();
