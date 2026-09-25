// Sprzedaż wstrzymana (zakładka Sklep w arkuszu: sprzedaz NIE): strona pokazuje katalog i koszyk, ale nie prowadzi
// do zamówienia, formularz jest wyłączony, backend odrzuca zamówienie, a dane strukturalne nie mają ofert.
//
//   node dev/testy_wstrzymanie.js
//
// Skrypt sam uruchamia dev/serwer.py na porcie 8791 z NICCI_SPRZEDAZ=NIE i tymczasowym plikiem zamówień.
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

const ROOT = path.resolve(__dirname, '..');
const PORT = 8791;
const BASE = 'http://127.0.0.1:' + PORT;
const ORDERS = path.join(os.tmpdir(), 'nicci-testy-wstrzymanie-' + process.pid + '.json');

let passed = 0, failed = 0;
function check(name, ok, info) {
  if (ok) { passed++; console.log('ok   ' + name); }
  else { failed++; console.log('BŁĄD ' + name + (info ? '\n     ' + info : '')); }
}

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(BASE + '/quiz'); if (r.ok) return; } catch (e) { /* jeszcze wstaje */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('serwer testowy nie wstał');
}

(async () => {
  const server = spawn('python3', [path.join(ROOT, 'dev', 'serwer.py'), String(PORT)], {
    env: Object.assign({}, process.env, { NICCI_SPRZEDAZ: 'NIE', NICCI_ZAMOWIENIA: ORDERS }), stdio: 'ignore'
  });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  try {
    await waitForServer();
    const cat = await (await fetch(BASE + '/__dev/api?action=catalog')).json();
    check('katalog działa i ma sprzedaz: false', cat.ok && cat.data.products.length > 0 && cat.data.sprzedaz === false, JSON.stringify(cat).slice(0, 120));

    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.Nicci.cart.addDecant('p06', 10, 1));
    check('dane strukturalne bez listy produktów z ofertami', await page.locator('#ld-produkty').count() === 0);

    await page.evaluate(() => document.querySelector('[data-cart-open], [data-open-cart]').click());
    const go = page.locator('.cart-foot .btn');
    await go.waitFor({ timeout: 10000 });
    check('koszyk: przycisk „Zamówienia ruszą wkrótce” wyłączony', (await go.textContent()).includes('Zamówienia ruszą wkrótce') && await go.getAttribute('aria-disabled') === 'true');
    check('koszyk: informacja, że koszyk zostaje zapisany', /Jeszcze nie przyjmujemy zamówień/.test(await page.locator('.cart-foot').textContent()));
    await go.click({ force: true }); // Playwright nie klika elementów z aria-disabled bez force, klient może
    await page.waitForTimeout(400);
    check('koszyk: kliknięcie nie prowadzi do formularza', !/zamowienie/.test(page.url()), page.url());

    await page.goto(BASE + '/zamowienie', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-order-alert]:not([hidden])', { timeout: 10000 });
    check('formularz: komunikat „Zamówienia ruszą wkrótce” nad formularzem', /Zamówienia ruszą wkrótce/.test(await page.locator('[data-order-alert]').textContent()));
    check('formularz: przycisk i pola wyłączone', await page.locator('[data-submit]').isDisabled() && await page.locator('#f-email').isDisabled());

    // zamówienie wysłane z pominięciem strony (np. ze starego katalogu) backend i tak odrzuca
    const res = await page.evaluate(() => window.Nicci.createOrder({
      customer: { name: 'Anna Testowa', email: 'anna@example.com', phone: '500600700', instagram: '' },
      delivery: { method: 'paczkomat', paczkomat: 'WAW12M' }, payment: 'blik',
      consents: { regulamin: true, prywatnosc: true }, note: '', voucher: '', website: ''
    }));
    check('backend: zamówienie odrzucone (sprzedaz_wstrzymana), nic nie zapisane', res.error === 'sprzedaz_wstrzymana' && !fs.existsSync(ORDERS), JSON.stringify(res));
    check('koszyk po odrzuceniu dalej zapisany', await page.evaluate(() => window.Nicci.cart.count()) === 1);
    check('bez błędów JavaScript', errors.length === 0, errors.join(' | '));
    await ctx.close();
  } catch (e) {
    failed++;
    console.log('BŁĄD przebiegu: ' + (e && e.message));
  } finally {
    await browser.close();
    server.kill();
    try { fs.unlinkSync(ORDERS); } catch (e) { /* nie powstał */ }
  }
  console.log('\n' + passed + '/' + (passed + failed) + ' testów przeszło');
  process.exitCode = failed ? 1 : 0;
})();
