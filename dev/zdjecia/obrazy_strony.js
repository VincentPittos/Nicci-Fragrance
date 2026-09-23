// Renderuje stronę produktu w Chromium i zbiera kandydatów na packshot: og:image, obrazy z JSON-LD
// i duże <img> widoczne po załadowaniu. Dla stron, które budują treść skryptem (Azzaro, Rabanne).
// Użycie: node dev/zdjecia/obrazy_strony.js <url> [<url> ...]  → JSON na stdout
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}) });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    viewport: { width: 1440, height: 1000 },
    locale: 'en-US',
  });
  const out = {};
  for (const url of process.argv.slice(2)) {
    const page = await ctx.newPage();
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(6000);
      const data = await page.evaluate(() => {
        const og = [...document.querySelectorAll('meta[property="og:image"],meta[name="og:image"]')].map(m => m.content).filter(Boolean);
        const ld = [];
        document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
          try {
            const walk = o => {
              if (!o || typeof o !== 'object') return;
              if (o.image) [].concat(o.image).forEach(i => ld.push(typeof i === 'string' ? i : i.url || i.contentUrl));
              Object.values(o).forEach(walk);
            };
            walk(JSON.parse(s.textContent));
          } catch (e) {}
        });
        const img = [...document.images]
          .filter(i => i.naturalWidth >= 500)
          .map(i => ({ src: i.currentSrc || i.src, w: i.naturalWidth, h: i.naturalHeight, alt: i.alt }));
        return { title: document.title, og, ld: ld.filter(Boolean), img };
      });
      out[url] = { status: res && res.status(), ...data };
    } catch (e) {
      out[url] = { error: String(e).slice(0, 160) };
    }
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 1));
})();
