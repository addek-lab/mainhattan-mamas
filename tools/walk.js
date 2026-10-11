// Seite im sichtbaren Chrome Bildschirm für Bildschirm durchscrollen und fotografieren.
// node walk.js <seite.html> <breite: 1440|390> <ausgabe-präfix> [maxBilder] [basisURL]
const { chromium } = require('playwright-core');
const [page, width, out, max, base = 'http://localhost:8787'] = process.argv.slice(2);
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9333');
  const p = b.contexts()[0].pages()[0] || await b.contexts()[0].newPage();
  const w = +width, h = w < 600 ? 844 : 900;
  await p.setViewportSize({ width: w, height: h });
  await p.goto(`${base}/${page}`, { waitUntil: 'networkidle' });
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  let i = 0;
  for (let y = 0; y < total && i < (+max || 20); y += h - 80, i++) {
    await p.evaluate(y => window.scrollTo(0, y), y);
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${out}_${String(i).padStart(2, '0')}.png` });
  }
  console.log(page, w, 'Höhe', total, 'Bilder', i);
  process.exit(0);
})();
