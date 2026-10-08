/**
 * NICCI: pytania quizu i dobór zapachów (październik 2026, decyzja 75).
 *   NicciDobor.questions                pytania i odpowiedzi (te same id co w Nicci.quiz z nicci-api.js)
 *   NicciDobor.recommend(catalog, ans)  {top: [3 produkty], set: zestaw|null, partial, klimaty}
 *   NicciDobor.klimaty(p)               klimaty zapachu z arkusza (kolumna klimat) albo z rodziny
 *
 * nicci-api.js zostaje bez zmian (zmieniamy w nim tylko API_URL i IG_HANDLE), więc nowy dobór żyje tutaj, a odpowiedzi
 * zapisujemy pod tym samym kluczem co moduł (nicci_quiz_v1), żeby trafiały do zamówienia.
 *
 * Jak liczymy dopasowanie:
 *   profil       filtr: „Dla niego” to zapachy męskie i unisex, „Dla niej” damskie i unisex; dopasowany profil +1,5
 *   klimat       kolumna klimat z arkusza (pierwszy klimat główny): trafienie w główny +7, w dodatkowy +4,
 *                oba wybrane klimaty naraz +2; zapachy bez trafienia biorą udział tylko wtedy, gdy trafiających jest za mało
 *   pora         ta sama +2, któraś uniwersalna +1, przeciwna -1
 *   sezon        lato albo zima w pełni +2, wiosna albo jesień +1, przeciwny sezon -2; „cały rok”: zapach na 3+ pory +1,5
 *   moc          ta sama +2, o jeden stopień +0,5, skrajnie inna -1,5
 *   jakość       bestseller +2, renoma 1 do 3 (kolumna renoma): -1, 0, +1
 * Trójka: najlepszy wynik, potem po jednym zapachu z każdego wybranego klimatu, którego jeszcze nie ma, potem reszta
 * według wyniku; najwyżej jeden zapach z tej samej linii (np. Sauvage, Aventus, Angels' Share) i dwa z jednej marki.
 * Zestaw: liczymy zapachy, dla których wybrany klimat jest główny (1) albo dodatkowy (0,5); pokazujemy zestaw z wynikiem
 * co najmniej 2,5 z 5, pasujący do profilu; przy remisie wygrywa ten z bestsellerami, wyższą renomą i zapachami z trójki.
 */
(function () {
  'use strict';

  var QUESTIONS = [
    {
      id: 'profil', pytanie: 'Dla kogo szukasz zapachu?',
      opcje: [{ v: 'meski', t: 'Dla niego' }, { v: 'damski', t: 'Dla niej' }, { v: 'unisex', t: 'Bez znaczenia' }]
    },
    {
      id: 'klimat', pytanie: 'Który klimat jest Ci najbliższy?', multi: 2,
      opcje: [
        { v: 'cytrusowy', t: 'Cytrusowo i owocowo', rodziny: ['cytrusowa', 'świeża', 'wodna'] },
        { v: 'aromatyczny', t: 'Aromatycznie i korzennie', rodziny: ['aromatyczna'] },
        { v: 'drzewny', t: 'Drzewnie i elegancko', rodziny: ['drzewna', 'skórzana', 'szyprowa'] },
        { v: 'slodki', t: 'Słodko i otulająco', rodziny: ['słodka', 'gourmand'] },
        { v: 'orientalny', t: 'Orientalnie', rodziny: ['orientalna', 'ambrowa'] },
        { v: 'kwiatowy', t: 'Kwiatowo', rodziny: ['kwiatowa'] }
      ]
    },
    {
      id: 'pora', pytanie: 'Kiedy chcesz go nosić?',
      opcje: [{ v: 'dzień', t: 'Na co dzień' }, { v: 'wieczór', t: 'Wieczorem i na wyjścia' }, { v: 'uniwersalna', t: 'Do wszystkiego' }]
    },
    {
      id: 'sezon', pytanie: 'W jakiej porze roku?',
      opcje: [{ v: 'cieplo', t: 'Ciepłe miesiące' }, { v: 'chlodno', t: 'Chłodne miesiące' }, { v: 'caly', t: 'Cały rok' }]
    },
    {
      id: 'intensywnosc', pytanie: 'Jak mocny ma być?',
      opcje: [{ v: 1, t: 'Blisko skóry' }, { v: 2, t: 'Wyczuwalny' }, { v: 3, t: 'Zostawia ślad' }]
    }
  ];

  var QUIZ_KEY = 'nicci_quiz_v1';
  // odpowiedzi zapisane przed październikiem 2026 („Świeżo i czysto”) liczymy jako cytrusowe
  var ALIAS = { swiezy: 'cytrusowy' };

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l'); }

  var KLIMAT_Z_RODZINY = {};
  QUESTIONS[1].opcje.forEach(function (o) { o.rodziny.forEach(function (r) { KLIMAT_Z_RODZINY[norm(r)] = o.v; }); });

  function klimaty(p) {
    var k = (p.klimat || []).map(norm).filter(function (x) { return QUESTIONS[1].opcje.some(function (o) { return o.v === x; }); });
    if (k.length) return k;
    var z = KLIMAT_Z_RODZINY[norm(p.rodzina)];
    return z ? [z] : [];
  }

  function chosenKlimaty(answers) {
    return [].concat(answers.klimat || []).map(function (v) { return ALIAS[v] || v; });
  }

  function allowed(p, profil) {
    var pr = norm(p.profil);
    if (profil === 'meski') return pr !== 'damski';
    if (profil === 'damski') return pr !== 'meski';
    return true;
  }

  function available(p) { return (p.variants || []).some(function (v) { return v.available; }); }

  function score(p, a, chosen) {
    var tags = klimaty(p);
    var k = 0, hits = 0;
    chosen.forEach(function (c) {
      var i = tags.indexOf(c);
      if (i === 0) { k += 7; hits++; } else if (i > 0) { k += 4; hits++; }
    });
    if (chosen.length > 1 && hits === chosen.length) k += 2;

    var pp = norm(p.pora), ap = norm(a.pora);
    var pora = pp === ap ? 2 : (pp === 'uniwersalna' || ap === 'uniwersalna') ? 1 : pp ? -1 : 0;

    var ps = (p.sezon || []).map(norm), s = 0;
    if (a.sezon === 'cieplo') s = ps.indexOf('lato') !== -1 ? 2 : ps.indexOf('wiosna') !== -1 ? 1 : ps.length ? -2 : 0;
    else if (a.sezon === 'chlodno') s = ps.indexOf('zima') !== -1 ? 2 : ps.indexOf('jesien') !== -1 ? 1 : ps.length ? -2 : 0;
    else s = ps.length >= 3 ? 1.5 : ps.length ? 0.5 : 0;

    var d = Math.abs((p.intensywnosc || 2) - Number(a.intensywnosc || 2));
    var moc = d === 0 ? 2 : d === 1 ? 0.5 : -1.5;

    var pr = norm(p.profil);
    var g = (a.profil === 'meski' && pr === 'meski') || (a.profil === 'damski' && pr === 'damski') ? 1.5 : 0;

    var q = (p.bestseller ? 2 : 0) + ((p.renoma || 2) - 2);
    var primary = chosen.indexOf(tags[0]) !== -1 ? 1 : 0;
    var fit = primary || (hits ? 0.5 : 0); // dopasowanie do zestawu: klimat główny 1, dodatkowy 0,5
    return { p: p, hits: hits, fit: fit, q: q, total: k + pora + s + moc + g + q, tags: tags };
  }

  // linia zapachu: wersje tego samego flakonu (Sauvage Parfum i Elixir, Aventus i Absolu Aventus) nie zajmują dwóch miejsc
  var LINIE = [/sauvage/, /aventus/, /angels/, /bottled/, /eros/, /wanted/, /orchid/, /interlude/, /intense (cafe|pepper)/];
  function line(p) {
    var n = norm(p.nazwa);
    for (var i = 0; i < LINIE.length; i++) if (LINIE[i].test(n)) return norm(p.marka) + '|' + LINIE[i].source;
    return norm(p.marka) + '|' + n;
  }

  function better(a, b) {
    return b.total - a.total || (b.p.renoma || 2) - (a.p.renoma || 2) || Number(!!b.p.bestseller) - Number(!!a.p.bestseller) ||
      (a.p.kolejnosc || 9999) - (b.p.kolejnosc || 9999);
  }

  function pickTop(pool, chosen, n) {
    var picked = [], lines = {}, brands = {};
    function ok(x) { return !lines[line(x.p)] && (brands[norm(x.p.marka)] || 0) < 2 && picked.indexOf(x) === -1; }
    function take(x) { picked.push(x); lines[line(x.p)] = 1; brands[norm(x.p.marka)] = (brands[norm(x.p.marka)] || 0) + 1; }
    if (pool.length) take(pool[0]);
    // każdy wybrany klimat ma swojego przedstawiciela, zanim trójkę dopełni sam wynik
    chosen.forEach(function (c) {
      if (picked.length >= n || picked.some(function (x) { return x.tags.indexOf(c) !== -1; })) return;
      var best = pool.filter(function (x) { return ok(x) && x.tags.indexOf(c) !== -1; })[0];
      if (best) take(best);
    });
    pool.forEach(function (x) { if (picked.length < n && ok(x)) take(x); });
    // jeśli reguły różnorodności zostawiły pustkę (mały katalog), dobieramy bez nich
    pool.forEach(function (x) { if (picked.length < n && picked.indexOf(x) === -1) take(x); });
    return picked.sort(better);
  }

  function pickSet(catalog, a, chosen, scoredById, topIds, partial) {
    var best = null;
    (catalog.sets || []).forEach(function (s) {
      if (!s.available || !s.sklad || !s.sklad.length) return;
      var comps = s.sklad.map(function (c) { return scoredById[c.id]; });
      if (comps.some(function (x) { return !x; })) return;
      var fit = comps.filter(function (x) { return allowed(x.p, a.profil); }).length / comps.length;
      if (fit < 0.8) return;
      var hits = comps.reduce(function (t, x) { return t + x.fit; }, 0);
      if (!partial && hits < 2.5) return;
      var overlap = comps.filter(function (x) { return topIds.indexOf(x.p.id) !== -1; }).length;
      var quality = comps.reduce(function (t, x) { return t + x.q; }, 0) / comps.length;
      var val = hits * 3 + overlap * 1.5 + quality;
      if (!best || val > best.val) best = { s: s, val: val };
    });
    return best ? best.s : null;
  }

  function recommend(catalog, answers, n) {
    n = n || 3;
    var chosen = chosenKlimaty(answers);
    var scored = (catalog.products || []).filter(available).map(function (p) { return score(p, answers, chosen); });
    var byId = {};
    scored.forEach(function (x) { byId[x.p.id] = x; });
    var candidates = scored.filter(function (x) { return allowed(x.p, answers.profil); }).sort(better);
    var matching = candidates.filter(function (x) { return x.hits > 0; });
    var partial = !matching.length;
    var pool = matching.length >= n ? matching : matching.concat(candidates.filter(function (x) { return x.hits === 0; }));
    var top = pickTop(pool, chosen, n);
    var topIds = top.map(function (x) { return x.p.id; });
    try { localStorage.setItem(QUIZ_KEY, JSON.stringify(answers)); } catch (e) { /* tryb prywatny */ }
    return {
      top: top.map(function (x) { return x.p; }),
      set: pickSet(catalog, answers, chosen, byId, topIds, partial),
      partial: partial,
      klimaty: chosen
    };
  }

  window.NicciDobor = { questions: QUESTIONS, recommend: recommend, klimaty: klimaty };
})();
