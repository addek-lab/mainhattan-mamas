// Alle Seiten prüfen: seitliches Überstehen (Mobil/Desktop), HTTP-/Konsolenfehler, externe Hosts.
// node check.js [basisURL]   (Standard: http://localhost:8787, live: https://mainhattan-mamas.de)
const { chromium } = require('playwright-core');
const base = process.argv[2] || 'http://localhost:8787';
const pages = ['index', 'angebote_mamas', 'angebote_einrichtungen', 'mitmachen', 'vision', 'projekte', 'unterstuetzen', 'kontakt', 'impressum', 'datenschutz'];
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9333');
  const p = b.contexts()[0].pages()[0] || await b.contexts()[0].newPage();
  const host = new URL(base).hostname;
  let problems = 0;
  for (const [tag, w, h] of [['desk', 1440, 900], ['mob', 390, 844]]) {
    await p.setViewportSize({ width: w, height: h });
    for (const n of pages) {
      const errs = [], ext = new Set();
      const onResp = r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); };
      const onReq = r => { const hn = new URL(r.url()).hostname; if (hn !== host && !hn.endsWith('.' + host)) ext.add(hn); };
      const onCons = m => { if (m.type() === 'error') errs.push(m.text()); };
      p.on('response', onResp); p.on('request', onReq); p.on('console', onCons);
      await p.goto(`${base}/${n}.html`, { waitUntil: 'networkidle' });
      const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      p.off('response', onResp); p.off('request', onReq); p.off('console', onCons);
      const bad = ov > 0 || errs.length || ext.size;
      if (bad) problems++;
      console.log((bad ? '✗' : '✓'), tag, n.padEnd(24), 'overflow=' + ov, ext.size ? 'extern=' + [...ext] : '', errs.join(' | '));
    }
  }
  console.log(problems ? `${problems} Probleme` : 'Alles in Ordnung');
  process.exit(problems ? 1 : 0);
})();
