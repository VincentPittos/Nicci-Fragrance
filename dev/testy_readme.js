// Testy przed startem z refs/README.md (1, 2, 3 i 7) na całej ścieżce: przeglądarka, formularz, atrapa backendu
// z funkcjami Code.gs. Maili nie wysyłamy (to sprawdza się po wdrożeniu), resztę tak.
//
//   node dev/testy_readme.js
//
// Skrypt sam uruchamia dev/serwer.py na porcie 8790 z NICCI_STAN="p06=40" (40 ml jednego zapachu)
// i tymczasowym plikiem zamówień, więc nie rusza dev/zamowienia-dev.json ani serwera na 8766.
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

const ROOT = path.resolve(__dirname, '..');
const PORT = 8790;
const BASE = 'http://127.0.0.1:' + PORT;
const ORDERS = path.join(os.tmpdir(), 'nicci-testy-readme-' + process.pid + '.json');
const ID = 'p06';

let passed = 0, failed = 0;
function check(name, ok, info) {
  if (ok) { passed++; console.log('ok   ' + name); }
  else { failed++; console.log('BŁĄD ' + name + (info ? '\n     ' + info : '')); }
}

async function api(query) {
  const r = await fetch(BASE + '/__dev/api?' + query);
  return r.json();
}

function product(cat, id) { return cat.data.products.filter((p) => p.id === id)[0]; }

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(BASE + '/quiz'); if (r.ok) return; } catch (e) { /* jeszcze wstaje */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('serwer testowy nie wstał');
}

async function addToCart(page, id, ml, qty) {
  const card = page.locator('.cat-group .card[data-id="' + id + '"]');
  await card.scrollIntoViewIfNeeded();
  await card.locator('.seg__opt:has(input[value="' + ml + '"])').click();
  await card.locator('[data-add]').click();
  for (let i = 1; i < qty; i++) await card.locator('[data-qty="1"]').click();
}

async function fillForm(page) {
  await page.fill('#f-name', 'Anna Testowa');
  await page.fill('#f-email', 'anna@example.com');
  await page.fill('#f-phone', '500 600 700');
  await page.fill('#f-paczkomat', 'WAW12M');
  await page.check('input[name="regulamin"]', { force: true });
  await page.check('input[name="prywatnosc"]', { force: true });
}

function orders() { try { return JSON.parse(fs.readFileSync(ORDERS, 'utf8')); } catch (e) { return []; } }

(async () => {
  const server = spawn('python3', [path.join(ROOT, 'dev', 'serwer.py'), String(PORT)], {
    env: Object.assign({}, process.env, { NICCI_STAN: ID + '=40', NICCI_ZAMOWIENIA: ORDERS }), stdio: 'ignore'
  });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  try {
    await waitForServer();
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    // ---------- 1. katalog ----------
    const cat = await api('action=catalog');
    check('1. ?action=catalog zwraca produkty', cat.ok && cat.data.products.length > 0, JSON.stringify(cat).slice(0, 200));
    const p = product(cat, ID);
    const realPrice = p.variants.filter((v) => v.ml === 5)[0].price;
    // stary zapis w sessionStorage z inną ceną: strona pokazuje go od razu, a po odświeżeniu w tle cenę z arkusza
    await page.goto(BASE + '/quiz');
    const stale = JSON.parse(JSON.stringify(cat.data));
    product({ data: stale }, ID).variants.forEach((v) => { v.price = 100; });
    await page.evaluate((s) => sessionStorage.setItem('nicci_catalog_v1', JSON.stringify({ t: Date.now() - 3 * 60 * 1000, data: s })), stale);
    await page.goto(BASE + '/?produkt=' + ID, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const shown = await page.locator('.cat-group .card[data-id="' + ID + '"] [data-price]').textContent();
    check('1. zmiana ceny: katalog starszy niż 2 min odświeża się w tle', shown.replace(/\s/g, '') === (realPrice / 100) + 'zł', 'na karcie: ' + shown + ', w arkuszu: ' + realPrice / 100);
    await page.keyboard.press('Escape');
    // próba kontrolna: świeży zapis (poniżej 2 minut) zostaje bez odświeżania, więc test umie wykryć starą cenę
    await page.evaluate((s) => sessionStorage.setItem('nicci_catalog_v1', JSON.stringify({ t: Date.now(), data: s })), stale);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const control = await page.locator('.cat-group .card[data-id="' + ID + '"] [data-price]').textContent();
    check('1. próba kontrolna: świeży zapis w przeglądarce nie jest pobierany ponownie', control.replace(/\s/g, '') === '1zł', 'na karcie: ' + control);
    await page.evaluate(() => sessionStorage.removeItem('nicci_catalog_v1'));

    // ---------- 2. zamówienie BLIK ----------
    check('2. stan wyjściowy: 40 ml, bez etykiety niedoboru', p.malo === false, JSON.stringify({ malo: p.malo, zostalo: p.zostalo }));
    await page.goto(BASE + '/?src=test2', { waitUntil: 'networkidle' });
    await addToCart(page, ID, 10, 1);
    await page.goto(BASE + '/zamowienie', { waitUntil: 'networkidle' });
    await fillForm(page);
    await page.click('[data-submit]');
    await page.waitForURL(/potwierdzenie/, { timeout: 20000 });
    const numer = await page.locator('.order__title .num').textContent();
    const row = orders().filter((o) => o.numer === numer)[0];
    check('2. zamówienie przyjęte, numer na stronie potwierdzenia', /^NF\d{4}$/.test(numer), numer);
    check('2. wiersz zamówienia zapisany ze źródłem wejścia i statusem NOWE', row && row.status === 'NOWE' && row.src === 'test2', JSON.stringify(row));
    check('2. dane BLIK i kwota widoczne do skopiowania', await page.locator('#pay-blik').count() === 1 && await page.locator('[data-copy]').count() >= 4);
    const after = product(await api('action=catalog'), ID);
    check('2. rezerwacja obniża dostępność o 10 ml (40 → 30, etykieta niedoboru)', after.malo === true && after.zostalo === 30, JSON.stringify({ malo: after.malo, zostalo: after.zostalo }));

    // ---------- 3. zbyt duża ilość ----------
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => { localStorage.removeItem('nicci_cart_v1'); sessionStorage.removeItem('nicci_catalog_v1'); });
    // koszyk z czasu, gdy stan był wyższy: 2 × 20 ml przy 30 ml dostępnych
    await page.evaluate((id) => window.Nicci.cart.addDecant(id, 20, 2), ID);
    await page.goto(BASE + '/zamowienie', { waitUntil: 'networkidle' });
    await fillForm(page);
    const before3 = orders().length;
    await page.click('[data-submit]');
    await page.waitForSelector('[data-order-alert]:not([hidden])', { timeout: 20000 });
    const alert = await page.locator('[data-order-alert]').textContent();
    check('3. brak stanu: komunikat z ilością i podobnymi zapachami', /zostało 30\s*ml, a w koszyku potrzeba 40\s*ml/.test(alert) && /Podobne:/.test(alert), alert.slice(0, 300));
    check('3. zamówienie nie powstało', orders().length === before3);

    // ---------- 7. formularz ----------
    await page.evaluate(() => { localStorage.removeItem('nicci_cart_v1'); });
    await page.evaluate((id) => window.Nicci.cart.addDecant(id, 5, 1), ID);
    await page.goto(BASE + '/zamowienie', { waitUntil: 'networkidle' });
    await fillForm(page);
    await page.click('label.choice:has(input[value="kurier"])');
    await page.fill('#f-street', 'Złota 44');
    await page.fill('#f-postcode', '1234');
    await page.fill('#f-city', 'Warszawa');
    await page.uncheck('input[name="regulamin"]', { force: true });
    const before7 = orders().length;
    await page.click('[data-submit]');
    await page.waitForTimeout(400);
    const summary = await page.locator('[data-error-summary]').textContent();
    check('7. błędny kod pocztowy i brak zgody: błędy przy polach i w podsumowaniu',
      /Kod pocztowy/.test(summary) && /Regulamin/.test(summary) &&
      await page.locator('[data-field="postcode"][data-invalid]').count() === 1, summary.slice(0, 200));
    check('7. przy błędach zamówienie nie zostało wysłane', orders().length === before7);

    // bot wypełnia ukryte pole website: backend odrzuca, zamówienie nie powstaje
    await page.fill('#f-postcode', '00-120');
    await page.check('input[name="regulamin"]', { force: true });
    await page.evaluate(() => { document.getElementById('f-website').value = 'http://spam.example'; });
    await page.click('[data-submit]');
    await page.waitForSelector('[data-order-alert]:not([hidden])', { timeout: 20000 });
    check('7. wypełnione pole website: zamówienie nie powstało', orders().length === before7 && !/potwierdzenie/.test(page.url()));
    const hp = await page.evaluate(() => { const i = document.getElementById('f-website'); const b = i.getBoundingClientRect(); return { tab: i.tabIndex, hidden: i.closest('[aria-hidden="true"]') !== null, w: b.width, h: b.height }; });
    check('7. pole website poza tabulacją i czytnikiem ekranu', hp.tab === -1 && hp.hidden, JSON.stringify(hp));

    check('bez błędów JavaScript na stronach', errors.length === 0, errors.join(' | '));
  } catch (e) {
    failed++;
    console.log('BŁĄD przebiegu: ' + (e && e.stack || e));
  } finally {
    await browser.close();
    server.kill();
    try { fs.unlinkSync(ORDERS); } catch (e) { /* nie było zamówień */ }
  }
  console.log('\n' + passed + '/' + (passed + failed) + ' testów przeszło');
  process.exit(failed ? 1 : 0);
})();
