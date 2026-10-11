// Ein Element im sichtbaren Chrome ansteuern und fotografieren.
// node shot.js <seite.html> <breite> "<css-/playwright-selector>" <ausgabe.png> [basisURL]
const { chromium } = require('playwright-core');
const [page, width, sel, out, base = 'http://localhost:8787'] = process.argv.slice(2);
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9333');
  const p = b.contexts()[0].pages()[0] || await b.contexts()[0].newPage();
  await p.setViewportSize({ width: +width, height: +width < 600 ? 844 : 900 });
  await p.goto(`${base}/${page}`, { waitUntil: 'networkidle' });
  const el = p.locator(sel).first();
  await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
  await el.screenshot({ path: out });
  process.exit(0);
})();
