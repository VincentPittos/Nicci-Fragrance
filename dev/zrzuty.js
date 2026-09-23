// Zrzuty ekranu i błędy konsoli z lokalnego podglądu (dev/serwer.py musi działać).
// Użycie: node dev/zrzuty.js <katalog_wyjścia> [ścieżka=/] [szerokości=390,1440] [--pelne] [--przewin=px] [--klik=selektor]
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

const args = process.argv.slice(2);
const out = args[0];
const route = args[1] && !args[1].startsWith('--') ? args[1] : '/';
const widths = (args[2] && !args[2].startsWith('--') ? args[2] : '390,1440').split(',').map(Number);
const full = args.includes('--pelne');
const scrollArg = args.find(a => a.startsWith('--przewin='));
const clickArg = args.find(a => a.startsWith('--klik='));
const reduced = args.includes('--reduced');

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const w of widths) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: w < 700 ? 844 : 900 },
      deviceScaleFactor: 1,
      reducedMotion: reduced ? 'reduce' : 'no-preference',
      hasTouch: w < 700, isMobile: w < 700,
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));
    await page.goto('http://127.0.0.1:8766' + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    if (scrollArg) {
      await page.evaluate(y => window.scrollTo(0, y), Number(scrollArg.split('=')[1]));
      await page.waitForTimeout(900);
    }
    if (clickArg) {
      await page.click(clickArg.split('=').slice(1).join('='));
      await page.waitForTimeout(900);
    }
    if (full) {
      // wszystkie obrazy leniwe: przewijamy stronę, żeby się wczytały, potem wracamy
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(800);
    }
    const file = path.join(out, `w${w}${scrollArg ? '-y' + scrollArg.split('=')[1] : ''}${clickArg ? '-klik' : ''}.png`);
    await page.screenshot({ path: file, fullPage: full });
    const metrics = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth,
      h: document.body.scrollHeight,
    }));
    console.log(file, JSON.stringify(metrics), errors.length ? '\n  ' + errors.join('\n  ') : '');
    await ctx.close();
  }
  await browser.close();
})();
