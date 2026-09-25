/**
 * NICCI: dane strukturalne schema.org (JSON-LD) na stronie głównej.
 *   OnlineStore i WebSite: nazwa, adres strony, logo, profil na Instagramie (gdy IG_HANDLE jest ustawiony).
 *   FAQPage: pytania i odpowiedzi czytane z sekcji FAQ na stronie. Pytanie z choćby jednym znacznikiem {TODO}
 *   nie trafia do danych (wycięcie TODO ze środka zdania zmienia jego sens). Po uzupełnieniu odpowiedzi
 *   przez właściciela pytanie wchodzi do danych samo, a dane zawsze zgadzają się z treścią strony.
 *   ItemList z Product: produkty z katalogu z ofertami dla każdej pojemności (cena w PLN i dostępność),
 *   tylko gdy sprzedaż jest włączona (zakładka Sklep w arkuszu).
 *   Bez ocen i gwiazdek: nie mamy recenzji, więc nie ma aggregateRating ani review.
 * Adresy bezwzględne z location.origin, więc działają na każdej domenie bez zmian w kodzie.
 */
(function () {
  'use strict';
  var A = window.NicciApp;
  var origin = location.origin;

  function put(id, data) {
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }

  function text(node) {
    return node.textContent.replace(/\s+/g, ' ').trim();
  }

  function store() {
    var h = A.igHandle();
    var desc = document.querySelector('meta[name="description"]');
    var org = {
      '@type': 'OnlineStore',
      '@id': origin + '/#sklep',
      name: 'Nicci Fragrance',
      url: origin + '/',
      logo: origin + '/img/marka/apple-touch-icon.png',
      image: origin + '/img/og.jpg',
      description: desc ? desc.content : undefined,
      paymentAccepted: 'BLIK, przelew bankowy',
      currenciesAccepted: 'PLN'
    };
    if (h) org.sameAs = ['https://www.instagram.com/' + h + '/'];
    put('ld-sklep', {
      '@context': 'https://schema.org',
      '@graph': [org, { '@type': 'WebSite', '@id': origin + '/#strona', name: 'Nicci Fragrance', url: origin + '/', inLanguage: 'pl-PL', publisher: { '@id': origin + '/#sklep' } }]
    });
  }

  function faq() {
    var items = [];
    document.querySelectorAll('#faq details').forEach(function (d) {
      if (d.querySelector('[data-todo]')) return;
      var q = d.querySelector('summary');
      var body = d.cloneNode(true);
      body.querySelector('summary').remove();
      var answer = text(body);
      if (q && answer) items.push({ '@type': 'Question', name: text(q), acceptedAnswer: { '@type': 'Answer', text: answer } });
    });
    if (items.length) put('ld-faq', { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items });
  }

  function products(catalog) {
    // sprzedaż wstrzymana: bez listy produktów z cenami i dostępnością, żeby wyszukiwarka nie pokazywała ofert
    if (!A.salesOpen(catalog)) { var old = document.getElementById('ld-produkty'); if (old) old.remove(); return; }
    var list = (catalog.products || []).map(function (p, i) {
      var url = origin + '/?produkt=' + encodeURIComponent(p.id);
      var item = {
        '@type': 'Product',
        name: p.marka + ' ' + p.nazwa + ', odlewka',
        brand: { '@type': 'Brand', name: p.marka },
        url: url,
        sku: p.id,
        category: 'Perfumy'
      };
      if (p.zdjecie) item.image = origin + p.zdjecie;
      if (p.opis) item.description = p.opis;
      var offers = (p.variants || []).filter(function (v) { return v.price > 0; }).map(function (v) {
        return {
          '@type': 'Offer',
          name: v.ml + ' ml',
          sku: p.id + '-' + v.ml,
          price: (v.price / 100).toFixed(2),
          priceCurrency: 'PLN',
          availability: v.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: url
        };
      });
      if (offers.length) item.offers = offers;
      return { '@type': 'ListItem', position: i + 1, item: item };
    });
    if (list.length) put('ld-produkty', { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Katalog Nicci Fragrance', itemListElement: list });
  }

  store();
  faq();
  A.catalog().then(products, function () {});
})();
