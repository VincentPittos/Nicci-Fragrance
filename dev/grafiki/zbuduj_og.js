// Grafika Open Graph 1200×630: kadr z refs/hero-czysty.webp, wektorowe logo i jedna linia tekstu,
// renderowane w Chromium z fontami strony. Wynik: site/img/og.jpg
// Użycie: node dev/grafiki/zbuduj_og.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

const ROOT = path.resolve(__dirname, '..', '..');
const logo = fs.readFileSync(path.join(ROOT, 'site/img/marka/logo-pelne.svg'), 'utf8').replace(/currentColor/g, '#D5A865');
const fontsCss = fs.readFileSync(path.join(ROOT, 'site/css/fonts.css'), 'utf8')
  .replace(/url\((['"]?)\.\.\/fonts\//g, `url($1file://${ROOT}/site/fonts/`);
const TEKST = 'Oryginalne perfumy w&nbsp;odlewkach 5,&nbsp;10 i&nbsp;20&nbsp;ml'; // twarde spacje: bez „w” i „i” na końcu wiersza

const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><style>
${fontsCss}
html,body{margin:0;width:1200px;height:630px;background:#040404;overflow:hidden}
.hero{position:absolute;inset:0;background:url('file://${ROOT}/refs/hero-czysty.webp') 62% 55%/auto 700px no-repeat}
.shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,4,4,.92) 0%,rgba(4,4,4,.7) 30%,rgba(4,4,4,0) 52%)}
.brand{position:absolute;left:72px;top:0;bottom:0;width:340px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:30px}
.brand svg{width:220px;height:auto}
.brand p{margin:0;font:italic 500 30px/1.25 'Cormorant Garamond',serif;color:#E8D7C3;text-align:center;letter-spacing:.005em;font-variant-numeric:lining-nums}
</style></head><body><div class="hero"></div><div class="shade"></div>
<div class="brand">${logo}<p>${TEKST}</p></div></body></html>`;

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const tmp = path.join(__dirname, 'zrodla', 'og.html');
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, html);
  await page.goto('file://' + tmp);
  await page.evaluate(() => document.fonts.ready);
  const out = path.join(ROOT, 'site/img/og.jpg');
  await page.screenshot({ path: out, type: 'jpeg', quality: 86 });
  await browser.close();
  console.log(out, fs.statSync(out).size, 'B');
})();
