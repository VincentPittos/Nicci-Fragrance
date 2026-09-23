/**
 * NICCI: szuflada szczegółów produktu i lista podobnych.
 * Otwiera się na nicci:open-product {id, trigger} i nicci:similar {id, trigger}. Adres dostaje ?produkt=id,
 * żeby link dało się wysłać w DM; wejście z takim adresem otwiera szufladę od razu.
 * Dane tylko z katalogu: puste pole nie renderuje elementu. Trwałość i projekcja jako paski wyłącznie,
 * gdy wartość jest liczbą w skali 1 do 5; inaczej sam tekst.
 */
(function () {
  'use strict';
  var N = window.Nicci, A = window.NicciApp, U = window.NicciUI, C = window.NicciCard, I = window.NicciIkony, NUTY = window.NicciNuty;
  var esc = U.esc;
  var catalog = null;
  var firstTrigger = null; // karta, na którą wraca fokus, także po przejściu do podobnego zapachu
  var active = null;       // znacznik bieżącej szuflady: zamknięcie zastąpionej nie czyści adresu

  var SEZONY = [['wiosna', 'Wiosna'], ['lato', 'Lato'], ['jesień', 'Jesień'], ['zima', 'Zima']];
  var PORY = [['dzień', 'Dzień', 'dzien'], ['wieczór', 'Wieczór', 'wieczor']];
  var TIERS = [['glowy', 'Głowa', 'glowa', 'pierwsze minuty'], ['serca', 'Serce', 'serce', 'po kwadransie'], ['bazy', 'Baza', 'baza', 'zostaje na godziny']];

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function setUrl(id) {
    var u = new URL(location.href);
    if (id) u.searchParams.set('produkt', id); else u.searchParams.delete('produkt');
    history.replaceState(history.state, '', u.pathname + u.search + u.hash);
  }

  // ---------- części szuflady ----------
  function pyramid(p) {
    var rows = TIERS.filter(function (t) { return (p.nuty[t[0]] || []).length; });
    if (!rows.length) return '';
    return '<section class="pd__block" aria-labelledby="pd-nuty"><h3 class="pd__h" id="pd-nuty">Piramida nut</h3>' + rows.map(function (t) {
      return '<div class="pd__tier">' + I.svg(t[2], { size: 28, cls: 'pd__tier-icon' }) +
        '<div><p class="pd__tier-name">' + t[1] + ' <span>' + t[3] + '</span></p><ul class="pd__notes" role="list">' +
        p.nuty[t[0]].map(function (n) {
          var s = NUTY.slug(n);
          return '<li class="pd__note">' + (s ? '<img src="/img/nuty/' + s + '.webp" alt="" width="256" height="256" loading="lazy" decoding="async">' : '') +
            '<span>' + esc(U.cap(n)) + '</span></li>';
        }).join('') + '</ul></div></div>';
    }).join('') + '</section>';
  }

  function when(p) {
    var ps = (p.sezon || []).map(norm);
    var pora = norm(p.pora);
    if (!ps.length && !pora) return '';
    var onAttr = function (on) { return on ? ' data-on' : ''; };
    var seasons = SEZONY.map(function (s) {
      var on = ps.indexOf(norm(s[0])) !== -1;
      return '<li class="pd__when"' + onAttr(on) + '>' + I.svg(norm(s[0]), { size: 28 }) +
        '<span>' + s[1] + '</span></li>';
    }).join('');
    var day = PORY.map(function (d) {
      var on = pora === norm(d[0]) || pora === 'uniwersalna';
      return '<li class="pd__when"' + onAttr(on) + '>' + I.svg(d[2], { size: 28 }) + '<span>' + d[1] + '</span></li>';
    }).join('');
    var seasonTxt = SEZONY.filter(function (s) { return ps.indexOf(norm(s[0])) !== -1; }).map(function (s) { return s[1].toLowerCase(); }).join(', ');
    var dayTxt = pora === 'uniwersalna' ? 'na dzień i na wieczór' : pora === 'dzien' ? 'na dzień' : pora === 'wieczor' ? 'na wieczór' : '';
    return '<section class="pd__block" aria-labelledby="pd-kiedy"><h3 class="pd__h" id="pd-kiedy">Kiedy nosić</h3>' +
      (ps.length ? '<p class="visually-hidden">Pory roku: ' + esc(seasonTxt) + '.</p><ul class="pd__whens" role="list" aria-hidden="true">' + seasons + '</ul>' : '') +
      (dayTxt ? '<p class="visually-hidden">Pora dnia: ' + dayTxt + '.</p><ul class="pd__whens pd__whens--day" role="list" aria-hidden="true">' + day + '</ul>' : '') +
      '</section>';
  }

  function bar(label, v) {
    if (v === '' || v == null) return '';
    var num = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
    if (!isFinite(num) || num < 0 || num > 5) {
      return '<div class="pd__meter"><p class="pd__meter-label">' + label + '</p><p class="pd__meter-txt">' + esc(v) + '</p></div>';
    }
    var txt = String(num).replace('.', ',');
    return '<div class="pd__meter"><p class="pd__meter-label">' + label + ' <span>' + txt + ' z 5</span></p>' +
      '<span class="pd__bar" role="img" aria-label="' + label + ': ' + txt + ' z 5"><span style="--v:' + (num / 5).toFixed(3) + '"></span></span></div>';
  }

  function strength(p) {
    var a = bar('Trwałość', p.trwalosc), b = bar('Projekcja', p.projekcja);
    if (!a && !b) return '';
    return '<section class="pd__block" aria-labelledby="pd-moc"><h3 class="pd__h" id="pd-moc">Trwałość i projekcja</h3>' + a + b +
      '<p class="pd__note-small">Orientacyjnie. Na każdej skórze zapach zachowuje się trochę inaczej.</p></section>';
  }

  function mini(p) {
    var price = U.availableVariants(p).map(function (v) { return v.price; }).sort(function (a, b) { return a - b; })[0];
    return '<li><button type="button" class="mini" data-open-id="' + esc(p.id) + '">' +
      '<span class="mini__media">' + C.media(p, { sizes: '9rem' }) + '</span>' +
      '<span class="mini__brand">' + esc(p.marka) + '</span><span class="mini__name">' + esc(p.nazwa) + '</span>' +
      '<span class="mini__price">' + (price ? 'od ' + U.price(price) : 'Wyprzedane') + '</span></button></li>';
  }

  function similarList(p) {
    var list = (p.podobne || []).map(function (id) { return N.findProduct(catalog, id); }).filter(Boolean);
    // dostępne najpierw
    list.sort(function (a, b) { return Number(U.isSoldOut(a)) - Number(U.isSoldOut(b)); });
    return list;
  }

  function similar(p) {
    var list = similarList(p);
    if (!list.length) return '';
    return '<section class="pd__block" aria-labelledby="pd-podobne"><h3 class="pd__h" id="pd-podobne">Podobne w naszym katalogu</h3>' +
      '<ul class="mini-row" role="list">' + list.map(mini).join('') + '</ul></section>';
  }

  function igLink() {
    var h = A.igHandle();
    return '<a class="btn btn--outline btn--block pd__ig" href="' + (h ? 'https://ig.me/m/' + esc(h) : 'https://instagram.com/') + '" target="_blank" rel="noopener">' +
      I.svg('instagram', { size: 22 }) + 'Zapytaj nas na Instagramie</a>';
  }

  function body(p) {
    var tags = U.tags(p);
    var photo = p.zdjecie ? C.media(p, { sizes: '(min-width: 48rem) 30rem, 100vw' }).replace(' loading="lazy"', '') : C.media(p, {});
    return '<div class="pd">' +
      '<div class="pd__media">' + photo + '</div>' +
      '<div class="pd__head"><p class="pd__brand">' + esc(p.marka) + '</p><p class="pd__name">' + esc(p.nazwa) + '</p></div>' +
      (tags.length ? '<ul class="chips pd__chips" aria-label="Charakter zapachu">' + tags.map(function (t) { return '<li class="chip">' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
      (p.malo && p.zostalo ? '<p class="scarcity">Zostało ' + p.zostalo + '&nbsp;ml tego zapachu</p>' : '') +
      (U.isSoldOut(p) ? '<p class="pd__soldout">Ten zapach właśnie się skończył.' + (similarList(p).length ? ' Niżej są podobne z naszego katalogu.' : '') + '</p>' : '') +
      (p.opis ? '<p class="pd__desc">' + esc(p.opis) + '</p>' : '') +
      pyramid(p) + when(p) + strength(p) + similar(p) +
      '<div class="pd__block">' + igLink() + '<p class="pd__note-small">Wahasz się między kilkoma zapachami? Napisz, doradzimy przed zamówieniem.</p></div>' +
      '</div>';
  }

  // ---------- otwieranie ----------
  function open(id, trigger) {
    var p = catalog && N.findProduct(catalog, id);
    if (!p) return;
    var t = firstTrigger && document.contains(firstTrigger) ? firstTrigger : (trigger || document.activeElement);
    var token = {};
    active = token;
    var foot = document.createElement('div');
    foot.className = 'pd__foot';
    foot.setAttribute('data-card', '');
    foot.dataset.id = p.id;
    foot.innerHTML = C.buy(p, 'pd' + Date.now());
    var d = window.NicciDrawer.open({
      title: p.marka + ' ' + p.nazwa, body: body(p), foot: foot, trigger: t,
      onClose: function () { if (active === token) { setUrl(''); firstTrigger = null; active = null; } }
    });
    firstTrigger = t;
    d.root.classList.add('drawer--product');
    d.panel.classList.add('theme-graphite');
    C.mount(foot, [p]);
    setUrl(p.id);
    d.body.addEventListener('click', function (e) {
      var b = e.target.closest('[data-open-id]');
      if (b) open(b.dataset.openId, firstTrigger);
    });
  }

  function openSimilar(id, trigger) {
    var p = catalog && N.findProduct(catalog, id);
    if (!p) return;
    var list = similarList(p);
    var t = trigger || document.activeElement;
    var token = {};
    active = token;
    var html = '<p class="pd__desc">' + esc(p.marka + ' ' + p.nazwa) + ' właśnie się skończył. Te zapachy są do niego najbliższe i mamy je na miejscu.</p>' +
      (list.length ? '<ul class="mini-grid" role="list">' + list.map(mini).join('') + '</ul>'
        : '<p class="pd__desc">Nie mamy teraz podobnych na stanie. Napisz do nas, podpowiemy coś z katalogu.</p>' + igLink());
    var d = window.NicciDrawer.open({ title: 'Podobne zapachy', body: html, trigger: t,
      onClose: function () { if (active === token) { firstTrigger = null; active = null; } } });
    firstTrigger = t;
    d.root.classList.add('drawer--product');
    d.panel.classList.add('theme-graphite');
    d.body.addEventListener('click', function (e) {
      var b = e.target.closest('[data-open-id]');
      if (b) open(b.dataset.openId, firstTrigger);
    });
  }

  document.addEventListener('nicci:open-product', function (e) { open(e.detail.id, e.detail.trigger); });
  document.addEventListener('nicci:similar', function (e) { openSimilar(e.detail.id, e.detail.trigger); });

  A.catalog().then(function (c) {
    catalog = c;
    var id = new URLSearchParams(location.search).get('produkt');
    if (id && N.findProduct(c, id)) {
      // karta w katalogu jest celem powrotu fokusu po zamknięciu, jeśli już jest na stronie
      setTimeout(function () {
        var card = document.querySelector('[data-card][data-id="' + id + '"] [data-open]');
        open(id, card || null);
      }, 50);
    }
  }, function () {});
  A.onCatalog(function (c) { catalog = c; });

  window.NicciProdukt = { open: open };
})();
