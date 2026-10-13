#!/usr/bin/env node
/**
 * Renders the free guide (src/guide.mjs) to PDF in both languages:
 *   assets/guides/before-you-buy-triangle.pdf
 *   assets/guides/antes-de-comprar-triangulo.pdf
 * Needs Google Chrome (set CHROME=/path/to/chrome if it is elsewhere).
 */
import { writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { GUIDE } from '../src/guide.mjs';
import { GUIDE_PDF, loadIdentity } from '../src/build.mjs';
import { esc } from '../src/render.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const identity = loadIdentity(ROOT);
const CHROME = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
if (!CHROME) {
  console.error('Chrome not found; set CHROME=/path/to/chrome');
  process.exit(1);
}

const asset = (p) => pathToFileURL(join(ROOT, p)).href;

function html(g, lang) {
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;600;700&display=swap">
<style>
@page { size: Letter; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font: 400 11.5pt/1.55 Manrope, sans-serif; color: #0F2236; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 8.5in; height: 11in; padding: .75in .8in; position: relative; page-break-after: always; overflow: hidden; }
.cover { background: #81D8D0; display: flex; flex-direction: column; justify-content: space-between; }
.cover .num { font: italic 400 220pt/.8 'Instrument Serif', serif; margin: 0; }
.cover h1 { font: 400 54pt/1 'Instrument Serif', serif; margin: 0 0 12pt; }
.cover p.sub { font: 400 20pt/1.25 'Instrument Serif', serif; max-width: 5.4in; margin: 0; }
.by { display: flex; align-items: center; gap: 16pt; }
.by img { width: 64pt; height: 64pt; border-radius: 50%; object-fit: cover; object-position: 50% 15%; }
.by b { display: block; font: 400 18pt/1.1 'Instrument Serif', serif; }
.eyebrow { font: 700 8pt/1 Manrope; letter-spacing: .18em; text-transform: uppercase; color: #0D6F69; }
.intro { font: 400 15pt/1.4 'Instrument Serif', serif; margin: 10pt 0 22pt; }
ol { list-style: none; padding: 0; margin: 0; counter-reset: m; }
li { counter-increment: m; display: grid; grid-template-columns: 40pt 1fr; padding: 11pt 0; border-top: 1px solid #DDE9E7; break-inside: avoid; }
li::before { content: counter(m, decimal-leading-zero); font: italic 400 20pt/1 'Instrument Serif', serif; color: #0D6F69; }
li h2 { font: 400 15pt/1.15 'Instrument Serif', serif; margin: 0 0 3pt; }
li p { margin: 0; color: #4A5A6B; font-size: 10.5pt; }
.close { margin-top: 18pt; background: #EAF8F6; border-radius: 14pt; padding: 18pt 20pt; display: grid; grid-template-columns: 1fr auto; gap: 16pt; align-items: center; }
.close h2 { font: 400 20pt/1.1 'Instrument Serif', serif; margin: 0 0 6pt; }
.close p { margin: 0 0 6pt; font-size: 10.5pt; }
.card { font-size: 10pt; line-height: 1.5; }
.card b { font: 400 15pt/1 'Instrument Serif', serif; display: block; margin-bottom: 4pt; }
.legal { position: absolute; left: .8in; right: .8in; bottom: .45in; font-size: 7.5pt; color: #7A8896; }
</style></head><body>
<section class="page cover">
  <p class="eyebrow" style="color:#0F2236">${lang === 'es' ? 'Guía gratis' : 'Free guide'} · Raleigh · Durham · ${lang === 'es' ? 'el Triángulo' : 'the Triangle'}</p>
  <div>
    <p class="num">10</p>
    <h1>${esc(g.title)}</h1>
    <p class="sub">${esc(g.subtitle)}</p>
  </div>
  <div class="by"><img src="${asset(identity.images.portraitSmall)}" alt=""><div><b>${esc(identity.name)}</b>REALTOR® · ${identity.contact.phoneDisplay} · ${identity.contact.email}</div></div>
</section>
<section class="page">
  <p class="eyebrow">${esc(g.title)}</p>
  <p class="intro">${esc(g.intro)}</p>
  <ol>${g.items.slice(0, 5).map(([t, b]) => `<li><div><h2>${esc(t)}</h2><p>${esc(b)}</p></div></li>`).join('')}</ol>
</section>
<section class="page">
  <ol style="counter-reset: m 5">${g.items.slice(5).map(([t, b]) => `<li><div><h2>${esc(t)}</h2><p>${esc(b)}</p></div></li>`).join('')}</ol>
  <div class="close">
    <div><h2>${esc(g.closeTitle)}</h2><p>${esc(g.closeBody)}</p><p><b>${esc(g.cta)}</b></p></div>
    <div class="card"><b>${esc(identity.name)}</b>REALTOR® · ${lang === 'es' ? 'Lic.' : 'License'} #${identity.license.number}<br>${identity.contact.phoneDisplay} (WhatsApp)<br>${identity.contact.email}</div>
  </div>
  <p class="legal">${esc(g.disclaimer)} ${esc(identity.firm.displayWithTeam)}, ${esc(identity.team.address.street)}, ${esc(identity.team.address.locality)}, NC ${esc(identity.team.address.postalCode)}. ${lang === 'es' ? 'Igualdad de oportunidades en la vivienda.' : 'Equal Housing Opportunity.'}</p>
</section>
</body></html>`;
}

const tmp = mkdtempSync(join(tmpdir(), 'mc-guide-'));
try {
  for (const lang of Object.keys(GUIDE)) {
    const src = join(tmp, `${lang}.html`);
    writeFileSync(src, html(GUIDE[lang], lang));
    const out = join(ROOT, GUIDE_PDF[lang]);
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--no-pdf-header-footer', '--virtual-time-budget=5000', `--print-to-pdf=${out}`, pathToFileURL(src).href], { stdio: 'ignore', timeout: 60000 });
    console.log(`Wrote ${GUIDE_PDF[lang]}`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
