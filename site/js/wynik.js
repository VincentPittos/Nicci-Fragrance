/**
 * NICCI: ekran wyniku quizu (/wynik).
 * Rekomendacja wyłącznie z Nicci.quiz.recommend na odpowiedziach z sessionStorage.
 * Nagłówek i uzasadnienia składamy z wybranych odpowiedzi i realnych pól produktu (rodzina, pora,
 * intensywność, nuty), bez wymyślania cech. Dopasowanie częściowe: żadna z trzech nie należy do rodzin
 * z odpowiedzi; wtedy mówimy to wprost i wysuwamy zestaw odkrywców.
 */
(function () {
  'use strict';
  var N = window.Nicci, A = window.NicciApp, U = window.NicciUI, C = window.NicciCard, R = window.NicciRodziny, M = window.NicciMotion;
  var esc = U.esc;
  var KEY = 'nicci_quiz_state';
  var root = document.querySelector('[data-result]');
  if (!root) return;

  var state = null;
  try { state = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { state = null; }
  var answers = state && state.answers;
  var complete = answers && N.quiz.questions.every(function (q) {
    var v = answers[q.id];
    return q.multi ? v && v.length : v !== undefined && v !== '';
  });
  if (!complete) { location.replace(A.url('/quiz')); return; }

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l'); }

  // ---------- linia podsumowania z odpowiedzi ----------
  var KLIMAT = { swiezy: 'świeże', drzewny: 'drzewne', slodki: 'otulające', kwiatowy: 'kwiatowe' };
  var PORA = { 'dzień': 'na co dzień', 'wieczór': 'wieczorowe', uniwersalna: 'na każdą okazję' };
  var SEZON = { cieplo: 'na ciepłe miesiące', chlodno: 'na chłodne miesiące', caly: 'na cały rok' };
  var MOC = { 1: 'blisko skóry', 2: 'wyczuwalne', 3: 'zostawiające ślad' };

  function summary() {
    var k = [].concat(answers.klimat || []).map(function (v) { return KLIMAT[v]; }).filter(Boolean);
    var parts = [];
    if (k.length) parts.push(k.join(' i '));
    if (PORA[answers.pora]) parts.push(PORA[answers.pora]);
    if (MOC[answers.intensywnosc]) parts.push(MOC[answers.intensywnosc]);
    if (SEZON[answers.sezon]) parts.push(SEZON[answers.sezon]);
    var line = parts.join(', ');
    return line.charAt(0).toLocaleUpperCase('pl') + line.slice(1);
  }

  // ---------- jedno zdanie uzasadnienia z pól produktu ----------
  // rodzina w mianowniku (gdy produkt nie ma nut) i w miejscowniku („Paczula i wetyweria w …”)
  var RODZINA = {
    cytrusowa: ['Rześki, cytrusowy zapach', 'w rześkim, cytrusowym zapachu'],
    drzewna: ['Elegancki zapach drzewny', 'w eleganckim zapachu drzewnym'],
    gourmand: ['Otulający zapach deserowy', 'w otulającym zapachu deserowym'],
    orientalna: ['Ciepły zapach orientalny', 'w ciepłym zapachu orientalnym'],
    aromatyczna: ['Ziołowy, aromatyczny zapach', 'w ziołowym, aromatycznym zapachu'],
    ambrowa: ['Ciepły zapach ambrowy', 'w ciepłym zapachu ambrowym'],
    skorzana: ['Skórzany zapach z charakterem', 'w skórzanym zapachu z charakterem'],
    swieza: ['Czysty, lekki zapach', 'w czystym, lekkim zapachu'],
    kwiatowa: ['Zapach kwiatowy', 'w zapachu kwiatowym'],
    slodka: ['Soczysty, słodki zapach', 'w soczystym, słodkim zapachu']
  };
  var PORA_P = { dzien: 'na dzień', wieczor: 'na wieczór', uniwersalna: 'na dzień i na wieczór' };
  var MOC_P = { 1: 'który trzyma się blisko skóry', 2: 'który czuć w rozmowie', 3: 'który zostawia wyraźny ślad' };

  /** Jedno zdanie z realnych pól: „Paczula i wetyweria w eleganckim zapachu drzewnym na wieczór, który zostawia wyraźny ślad.” */
  function why(p) {
    var fam = RODZINA[norm(p.rodzina)] || ['Zapach z rodziny ' + p.rodzina, 'w zapachu z rodziny ' + p.rodzina];
    var notes = C.notes(p, 2).map(function (n) { return n.label.charAt(0).toLocaleLowerCase('pl') + n.label.slice(1); });
    var head = notes.length ? U.cap(notes.join(' i ')) + ' ' + fam[1] : fam[0];
    var bits = [head];
    if (PORA_P[norm(p.pora)]) bits.push(PORA_P[norm(p.pora)]);
    var s = bits.join(' ');
    if (MOC_P[p.intensywnosc]) s += ', ' + MOC_P[p.intensywnosc];
    return s + '.';
  }

  // ---------- widok ----------
  function defaultVariant(p) {
    var av = U.availableVariants(p);
    var five = av.filter(function (v) { return v.ml === 5; })[0];
    return five || av[0] || null;
  }

  function resultCard(p, k) {
    var top = k === 0;
    return '<article class="rc' + (top ? ' rc--top' : '') + '" data-card data-id="' + esc(p.id) + '" aria-labelledby="rc-' + esc(p.id) + '">' +
      (top ? '<p class="rc__label">Najlepsze dopasowanie</p>' : '') +
      '<button type="button" class="rc__media" data-open aria-haspopup="dialog" aria-label="' + esc('Szczegóły: ' + p.marka + ' ' + p.nazwa) + '">' +
        C.media(p, { sizes: top ? '(min-width: 64rem) 30rem, 100vw' : '(min-width: 64rem) 16rem, 50vw' }) + '</button>' +
      '<div class="rc__body">' +
        '<p class="rc__brand">' + esc(p.marka) + '</p>' +
        '<h2 class="rc__name" id="rc-' + esc(p.id) + '">' + esc(p.nazwa) + '</h2>' +
        '<p class="rc__why">' + esc(why(p)) + '</p>' +
        (p.malo && p.zostalo ? '<p class="scarcity">Zostało ' + p.zostalo + '&nbsp;ml tego zapachu</p>' : '') +
        C.buy(p, 'rc' + k) +
        '<button type="button" class="link rc__more" data-open aria-haspopup="dialog">Nuty i szczegóły</button>' +
      '</div></article>';
  }

  function setBlock(s, partial) {
    if (!s) return '';
    var save = s.cenaOsobno && s.cenaOsobno > s.price ? s.cenaOsobno - s.price : 0;
    return '<section class="rs" aria-labelledby="rs-t">' +
      '<p class="t-eyebrow t-eyebrow--rule">' + (partial ? 'Najpewniejsza droga' : 'Chcesz przetestować kilka?') + '</p>' +
      '<h2 class="rs__title" id="rs-t">' + esc(s.nazwa) + '</h2>' +
      '<p class="rs__lead">' + (partial
        ? 'Skoro żaden zapach nie trafia we wszystko naraz, zestaw pozwoli sprawdzić kilka kierunków, zanim wybierzesz swój.'
        : 'Zestaw odkrywców z tej rodziny: kilka odlewek na raz, żeby sprawdzić, który zapach zostaje z Tobą najdłużej.') + '</p>' +
      '<ul class="rs__list" role="list">' + s.sklad.map(function (x) {
        return '<li><span><b>' + esc(x.marka) + '</b> ' + esc(x.nazwa) + '</span><span>' + x.ml + '&nbsp;ml</span></li>';
      }).join('') + '</ul>' +
      '<div class="rs__buy"><p class="price">' + U.price(s.price) + '</p>' +
        (save ? '<p class="rs__save">Osobno ' + U.price(s.cenaOsobno) + ', oszczędzasz ' + U.price(save) + '</p>' : '') +
        '<button type="button" class="btn btn--outline" data-add-set="' + esc(s.id) + '">Dodaj zestaw do koszyka</button></div>' +
      '</section>';
  }

  function render(catalog) {
    var rec = N.quiz.recommend(catalog, answers, 3);
    var top = rec.top;
    if (!top.length) {
      root.innerHTML = '<div class="result__empty"><h1 class="result__title">Na razie nic nie pasuje</h1>' +
        '<p>Wszystkie zapachy z tego kierunku właśnie się skończyły. Napisz do nas, podpowiemy coś podobnego z katalogu.</p>' +
        '<p><a class="btn btn--primary" href="' + A.url('/#katalog') + '">Zobacz katalog</a></p></div>';
      return;
    }
    var fams = rec.rodziny || [];
    var partial = !top.some(function (p) { return fams.indexOf(norm(p.rodzina)) !== -1; });
    var set = rec.set || (partial ? (catalog.sets || []).filter(function (s) { return s.available; })[0] || null : null);
    var family = top[0].rodzina;
    var sum = top.reduce(function (t, p) { var v = defaultVariant(p); return t + (v ? v.price : 0); }, 0);

    root.innerHTML =
      '<header class="result__head">' +
        '<p class="t-eyebrow t-eyebrow--rule">Wynik quizu</p>' +
        '<h1 class="result__title">Twój zestaw <span class="t-accent">dopasowany</span></h1>' +
        '<p class="result__line">' + esc(summary()) + '</p>' +
        (partial ? '<p class="result__partial" role="note">Żaden zapach z naszego katalogu nie spełnia teraz wszystkich Twoich odpowiedzi naraz. Te trzy pasują częściowo i są najbliżej tego, czego szukasz.</p>' : '') +
      '</header>' +
      '<div class="result__cards">' + top.map(resultCard).join('') + '</div>' +
      '<div class="result__all">' +
        '<button type="button" class="btn btn--primary" data-add-all>Dodaj wszystkie trzy do koszyka<span class="result__sum">' + U.price(sum) + '</span></button>' +
        '<a class="btn btn--outline" href="' + A.url('/?rodzina=' + R.slug(family)) + '#katalog">Zobacz wszystkie zapachy z tej rodziny</a>' +
      '</div>' +
      setBlock(set, partial) +
      '<p class="result__links"><a class="link" href="' + A.url('/quiz') + '" data-restart>Zacznij quiz od nowa</a>' +
        '<a class="link" href="https://instagram.com/" data-ig-dm target="_blank" rel="noopener">Zapytaj nas na Instagramie</a></p>';

    var h = A.igHandle();
    root.querySelectorAll('[data-ig-dm]').forEach(function (a) { if (h) a.href = 'https://ig.me/m/' + h; });
    C.mount(root, catalog.products);
    A.decorate(root);

    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-restart]')) {
        try { sessionStorage.removeItem(KEY); } catch (err) { /* nic */ }
        return;
      }
      var all = e.target.closest('[data-add-all]');
      if (all) {
        root.querySelectorAll('.rc[data-card]').forEach(function (card) {
          var p = N.findProduct(catalog, card.dataset.id);
          var sel = card.querySelector('.seg input:checked');
          var ml = sel ? Number(sel.value) : (defaultVariant(p) || {}).ml;
          if (!ml || U.cartQty(p.id, ml)) return; // już w koszyku: nie dublujemy
          N.cart.addDecant(p.id, ml, 1);
        });
        document.dispatchEvent(new CustomEvent('nicci:cart-sync'));
        U.bumpCart();
        U.announce('Dodano trzy zapachy do koszyka.');
        all.disabled = true;
        all.textContent = 'Wszystkie trzy są w koszyku';
        return;
      }
      var s = e.target.closest('[data-add-set]');
      if (s) {
        N.cart.addSet(s.dataset.addSet, 1);
        U.bumpCart();
        U.announce('Dodano zestaw do koszyka.');
        s.textContent = 'Zestaw jest w koszyku';
        s.disabled = true;
      }
    });
    orderBar();
  }

  // ---------- pasek „Przejdź do zamówienia” po dodaniu czegokolwiek ----------
  function orderBar() {
    var bar = document.querySelector('[data-order-bar]');
    if (!bar) return;
    var shown = false;
    function update() {
      var n = N.cart.count();
      if (!n) { bar.hidden = true; shown = false; return; }
      A.catalog().then(function (c) {
        var sum = N.cart.summary(c);
        bar.querySelector('[data-bar-text]').innerHTML = 'W koszyku ' + n + '&nbsp;szt. <b>' + U.price(sum.subtotal) + '</b>';
        if (!shown) {
          bar.hidden = false;
          shown = true;
          if (!M.reduced()) { M.set(bar, { y: 80, opacity: 0 }); M.animate(bar, { y: 0, opacity: 1 }, { preset: 'lift' }); }
        }
      });
    }
    N.cart.onChange(update);
  }

  A.catalog().then(render, function () {
    root.innerHTML = '<div class="result__empty"><h1 class="result__title">Wynik chwilowo się nie wczytał</h1>' +
      '<p>To zwykle chwilowy problem z połączeniem. Twoje odpowiedzi są zapisane, wystarczy odświeżyć stronę.</p>' +
      '<p><button type="button" class="btn btn--primary" onclick="location.reload()">Odśwież</button></p></div>';
  });
})();
