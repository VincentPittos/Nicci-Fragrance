/**
 * NICCI FRAGRANCES: moduł integracji strony z backendem (Apps Script)
 * Działa bez frameworka. Po załadowaniu dostępny jako window.Nicci.
 *
 * Użycie:
 *   <script src="nicci-api.js"></script>
 *   const catalog = await Nicci.fetchCatalog();
 *   Nicci.cart.addDecant('p01', 10);
 *   const recs = Nicci.quiz.recommend(catalog, answers);
 *   const res = await Nicci.createOrder({...});
 */
(function () {
  'use strict';

  // ============ KONFIGURACJA ============
  const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/UZUPELNIJ/exec',
    IG_HANDLE: 'UZUPELNIJ',
    CART_KEY: 'nicci_cart_v1',
    ORDER_KEY: 'nicci_last_order_v1',
    SRC_KEY: 'nicci_src_v1',
    QUIZ_KEY: 'nicci_quiz_v1'
  };

  // ============ NARZĘDZIA ============
  function pln(grosze) {
    return (grosze / 100).toFixed(2).replace('.', ',') + ' zł';
  }

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').trim();
  }

  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* tryb prywatny */ }
  }

  function load(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }

  // Zapamiętuje źródło wejścia (?src=reel12) i preset filtra (?rodzina=drzewna)
  function readUrlParams() {
    const p = new URLSearchParams(location.search);
    if (p.get('src')) store(CONFIG.SRC_KEY, p.get('src'));
    return { src: p.get('src') || load(CONFIG.SRC_KEY, ''), rodzina: p.get('rodzina') || '', marka: p.get('marka') || '' };
  }

  // ============ KATALOG ============
  let catalogPromise = null;

  function fetchCatalog(force) {
    if (catalogPromise && !force) return catalogPromise;
    catalogPromise = fetch(CONFIG.API_URL + '?action=catalog')
      .then(r => r.json())
      .then(j => {
        if (!j.ok) throw new Error(j.error || 'catalog_error');
        return j.data;
      })
      .catch(err => { catalogPromise = null; throw err; });
    return catalogPromise;
  }

  function findProduct(catalog, id) { return catalog.products.find(p => p.id === id) || null; }
  function findSet(catalog, id) { return catalog.sets.find(s => s.id === id) || null; }

  /** Grupowanie do widoku katalogu: by = 'rodzina' | 'marka' */
  function groupProducts(products, by) {
    const groups = {};
    products.forEach(p => {
      const key = by === 'marka' ? p.marka : (p.rodzina || 'inne');
      (groups[key] = groups[key] || []).push(p);
    });
    return Object.keys(groups).sort((a, b) => a.localeCompare(b, 'pl')).map(k => ({ key: k, items: groups[k] }));
  }

  /** Filtry: {rodzina:[], marka:[], pora:'', sezon:'', tylkoDostepne:true, szukaj:''} */
  function filterProducts(products, f) {
    f = f || {};
    const q = norm(f.szukaj);
    return products.filter(p => {
      if (f.tylkoDostepne && !p.variants.some(v => v.available)) return false;
      if (f.rodzina && f.rodzina.length && f.rodzina.map(norm).indexOf(norm(p.rodzina)) === -1) return false;
      if (f.marka && f.marka.length && f.marka.indexOf(p.marka) === -1) return false;
      if (f.pora && norm(p.pora) !== norm(f.pora) && norm(p.pora) !== 'uniwersalna') return false;
      if (f.sezon && p.sezon.map(norm).indexOf(norm(f.sezon)) === -1) return false;
      if (q) {
        const hay = norm([p.marka, p.nazwa, p.rodzina].concat(p.nuty.glowy, p.nuty.serca, p.nuty.bazy).join(' '));
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  // ============ KOSZYK ============
  // Pozycja: {type:'decant', id, ml, qty} lub {type:'set', id, qty}
  const listeners = [];

  const cart = {
    items: function () { return load(CONFIG.CART_KEY, []); },
    save: function (items) { store(CONFIG.CART_KEY, items); listeners.forEach(fn => fn(items)); },
    onChange: function (fn) { listeners.push(fn); },
    addDecant: function (id, ml, qty) {
      const items = cart.items();
      const hit = items.find(i => i.type === 'decant' && i.id === id && i.ml === ml);
      if (hit) hit.qty = Math.min(5, hit.qty + (qty || 1));
      else items.push({ type: 'decant', id: id, ml: ml, qty: qty || 1 });
      cart.save(items);
    },
    addSet: function (id, qty) {
      const items = cart.items();
      const hit = items.find(i => i.type === 'set' && i.id === id);
      if (hit) hit.qty = Math.min(5, hit.qty + (qty || 1));
      else items.push({ type: 'set', id: id, qty: qty || 1 });
      cart.save(items);
    },
    setQty: function (index, qty) {
      const items = cart.items();
      if (!items[index]) return;
      if (qty <= 0) items.splice(index, 1);
      else items[index].qty = Math.min(5, qty);
      cart.save(items);
    },
    remove: function (index) { cart.setQty(index, 0); },
    clear: function () { cart.save([]); },
    count: function () { return cart.items().reduce((s, i) => s + i.qty, 0); },

    /** Podsumowanie do wyświetlenia. Ostateczną kwotę liczy serwer. */
    summary: function (catalog, deliveryMethod) {
      const lines = cart.items().map(i => {
        if (i.type === 'set') {
          const s = findSet(catalog, i.id);
          return s ? { item: i, nazwa: s.nazwa, opis: 'zestaw', price: s.price, total: s.price * i.qty, available: s.available } : null;
        }
        const p = findProduct(catalog, i.id);
        const v = p && p.variants.find(x => x.ml === i.ml);
        return v ? { item: i, nazwa: p.marka + ' ' + p.nazwa, opis: i.ml + ' ml', price: v.price, total: v.price * i.qty, available: v.available } : null;
      }).filter(Boolean);
      const subtotal = lines.reduce((s, l) => s + l.total, 0);
      const free = catalog.freeShippingFrom > 0 && subtotal >= catalog.freeShippingFrom;
      const shipping = deliveryMethod ? (free ? 0 : catalog.shipping[deliveryMethod]) : null;
      return {
        lines: lines,
        subtotal: subtotal,
        shipping: shipping,
        total: subtotal + (shipping || 0),
        toFreeShipping: catalog.freeShippingFrom > 0 ? Math.max(0, catalog.freeShippingFrom - subtotal) : null
      };
    }
  };

  // ============ QUIZ ============
  const QUIZ = [
    {
      id: 'profil', pytanie: 'Dla kogo szukasz zapachu?',
      opcje: [{ v: 'meski', t: 'Dla niego' }, { v: 'damski', t: 'Dla niej' }, { v: 'unisex', t: 'Bez znaczenia' }]
    },
    {
      id: 'klimat', pytanie: 'Który klimat jest Ci najbliższy?', multi: 2,
      opcje: [
        { v: 'swiezy', t: 'Świeżo i czysto', rodziny: ['świeża', 'cytrusowa', 'aromatyczna', 'wodna'] },
        { v: 'drzewny', t: 'Drzewnie i elegancko', rodziny: ['drzewna', 'skórzana', 'szyprowa'] },
        { v: 'slodki', t: 'Słodko i otulająco', rodziny: ['słodka', 'orientalna', 'ambrowa', 'gourmand'] },
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

  const SEZONY = { cieplo: ['wiosna', 'lato'], chlodno: ['jesien', 'zima'], caly: ['wiosna', 'lato', 'jesien', 'zima'] };

  /**
   * answers: {profil:'meski', klimat:['drzewny','slodki'], pora:'wieczór', sezon:'chlodno', intensywnosc:3}
   * Zwraca {top: [produkt x3], set: zestaw|null, rodziny: [...]} tylko z dostępnych pozycji.
   */
  function recommend(catalog, answers, n) {
    n = n || 3;
    const klimatQ = QUIZ[1];
    const chosen = [].concat(answers.klimat || []);
    const fams = new Set();
    klimatQ.opcje.filter(o => chosen.indexOf(o.v) !== -1).forEach(o => o.rodziny.forEach(r => fams.add(norm(r))));
    const want = SEZONY[answers.sezon] || SEZONY.caly;

    const scored = catalog.products
      .filter(p => p.variants.some(v => v.available))
      .map(p => {
        let s = 0;
        if (fams.has(norm(p.rodzina))) s += 5;
        const pp = norm(p.pora);
        if (pp === norm(answers.pora)) s += 2;
        else if (pp === 'uniwersalna' || answers.pora === 'uniwersalna') s += 1;
        const ps = p.sezon.map(norm);
        if (want.some(x => ps.indexOf(x) !== -1)) s += 2;
        const d = Math.abs((p.intensywnosc || 2) - Number(answers.intensywnosc || 2));
        s += d === 0 ? 2 : d === 1 ? 1 : 0;
        const pr = norm(p.profil);
        if (answers.profil === 'unisex' || pr === 'unisex' || pr === answers.profil) s += 1;
        else s -= 3;
        return { p: p, s: s };
      })
      .sort((a, b) => b.s - a.s || a.p.kolejnosc - b.p.kolejnosc);

    const top = scored.slice(0, n).map(x => x.p);
    const set = catalog.sets.find(z => z.available && fams.has(norm(z.rodzina))) || null;
    store(CONFIG.QUIZ_KEY, answers);
    return { top: top, set: set, rodziny: Array.from(fams) };
  }

  // ============ ZAMÓWIENIE ============
  const ERRORS = {
    validation: 'Sprawdź zaznaczone pola formularza.',
    out_of_stock: 'Część zapachów właśnie się skończyła. Zaznaczyliśmy je w koszyku i podpowiadamy podobne.',
    rate_limited: 'Zamówienie z tego adresu wpadło przed chwilą. Odczekaj minutę.',
    busy: 'Mamy teraz dużo zamówień. Spróbuj ponownie za kilka sekund.',
    invalid_item: 'Jedna z pozycji w koszyku jest nieaktualna. Odśwież stronę.',
    server_error: 'Coś poszło nie tak po naszej stronie. Spróbuj ponownie albo napisz do nas na Instagramie.',
    network: 'Brak połączenia. Sprawdź internet i spróbuj ponownie.'
  };

  /**
   * payload: {
   *   customer:{name,email,phone,instagram},
   *   delivery:{method:'paczkomat'|'kurier', paczkomat, street, postcode, city},
   *   payment:'blik'|'przelew',
   *   consents:{regulamin:true, prywatnosc:true},
   *   note, website (honeypot, zostaw puste)
   * }
   * Pozycje koszyka, źródło i odpowiedzi z quizu dokłada sam moduł.
   */
  function createOrder(payload) {
    const body = Object.assign({}, payload, {
      action: 'createOrder',
      items: cart.items(),
      src: load(CONFIG.SRC_KEY, ''),
      quiz: load(CONFIG.QUIZ_KEY, null)
    });
    // text/plain bez nagłówków = brak preflight CORS, Apps Script to akceptuje
    return fetch(CONFIG.API_URL, { method: 'POST', body: JSON.stringify(body) })
      .then(r => r.json())
      .catch(() => ({ ok: false, error: 'network' }))
      .then(res => {
        if (res.ok && res.numer) {
          store(CONFIG.ORDER_KEY, res);
          cart.clear();
          catalogPromise = null;
        } else {
          res.message = ERRORS[res.error] || ERRORS.server_error;
        }
        return res;
      });
  }

  function lastOrder() { return load(CONFIG.ORDER_KEY, null); }

  // ============ INSTAGRAM ============
  /** Kopiuje treść zamówienia i otwiera DM. Zwraca true, jeśli kopiowanie się udało. */
  function sendOrderToInstagram(order) {
    const handle = (order && order.igHandle) || CONFIG.IG_HANDLE;
    const text = order ? order.igMessage : '';
    const open = () => { window.location.href = 'https://ig.me/m/' + handle; };
    if (navigator.clipboard && text) {
      return navigator.clipboard.writeText(text).then(() => { open(); return true; }, () => { open(); return false; });
    }
    open();
    return Promise.resolve(false);
  }

  function copy(text) {
    if (navigator.clipboard) return navigator.clipboard.writeText(text).then(() => true, () => false);
    return Promise.resolve(false);
  }

  window.Nicci = {
    CONFIG: CONFIG,
    pln: pln,
    readUrlParams: readUrlParams,
    fetchCatalog: fetchCatalog,
    findProduct: findProduct,
    findSet: findSet,
    groupProducts: groupProducts,
    filterProducts: filterProducts,
    cart: cart,
    quiz: { questions: QUIZ, recommend: recommend },
    createOrder: createOrder,
    lastOrder: lastOrder,
    sendOrderToInstagram: sendOrderToInstagram,
    copy: copy
  };
})();
