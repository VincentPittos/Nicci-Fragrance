#!/usr/bin/env node
// Składa dev/etap-2/index.html w jeden plik (CSS, JS, fonty i obrazy w środku) do publikacji jako podgląd.
// Użycie: node dev/etap-2/zbuduj_podglad.js <plik wyjściowy>
'use strict';
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const out = process.argv[2];
if (!out) { console.error('Podaj plik wyjściowy'); process.exit(1); }
const read = (p) => fs.readFileSync(path.resolve(dir, p), 'utf8');
const b64 = (p, mime) => 'data:' + mime + ';base64,' + fs.readFileSync(p).toString('base64');

let html = read('index.html');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => {
  let css = read(href);
  const cssDir = path.dirname(path.resolve(dir, href));
  css = css.replace(/url\('([^']+\.woff2)'\)/g, (mm, u) => "url('" + b64(path.resolve(cssDir, u), 'font/woff2') + "')");
  return '<style>\n' + css + '\n</style>';
});
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => '<script>\n' + read(src).replace(/<\/script/gi, '<\\/script') + '\n</script>');
html = html.replace(/'img\/packshot-zastepczy\.webp'/g, "'" + b64(path.resolve(dir, 'img/packshot-zastepczy.webp'), 'image/webp') + "'");
// szkielet dokładany przy publikacji: bez doctype, html, head i body
html = html.replace(/<!doctype html>\s*/i, '').replace(/<html[^>]*>\s*/i, '').replace(/<\/html>\s*$/i, '')
  .replace(/<head>\s*/i, '').replace(/<\/head>\s*/i, '').replace(/<body>\s*/i, '').replace(/<\/body>\s*/i, '')
  .replace(/<meta charset="utf-8">\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '');
fs.writeFileSync(out, html);
console.log(out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
