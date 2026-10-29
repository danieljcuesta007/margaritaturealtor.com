import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, loadIdentity, loadListings, llmsTxt, assertSafeOutDir, parseArgs, GUIDE_PDF, webpIndex } from '../src/build.mjs';
import { spawnSync } from 'node:child_process';
import { COPY } from '../src/copy.mjs';
import { GUIDE } from '../src/guide.mjs';
import { nextOpenHouse, esc, renderLanguage } from '../src/render.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const identity = loadIdentity(ROOT);
const listings = loadListings(ROOT);
const NOW = new Date('2026-10-12T12:00:00-04:00'); // before the 31 Oct open house
let out, pages;

before(() => {
  out = mkdtempSync(join(tmpdir(), 'mc-site-'));
  ({ pages } = build({ outDir: out, root: ROOT, identity, listings, now: NOW, lastmod: new Date('2026-10-12') }));
});

const graphOf = (html) => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const visibleText = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
const tmp = (p) => mkdtempSync(join(tmpdir(), p));

test('builds home, work-with-me and privacy in English and Spanish', () => {
  assert.deepEqual(Object.keys(pages).sort(), ['/', '/es/', '/es/privacidad/', '/es/trabajar-conmigo/', '/privacy/', '/work-with-me/']);
  assert.match(readFileSync(join(out, 'index.html'), 'utf8'), /<html lang="en-US">/);
  assert.match(readFileSync(join(out, 'es', 'trabajar-conmigo', 'index.html'), 'utf8'), /<html lang="es-US">/);
});

test('Margarita is defined once per page, with the same @id everywhere', () => {
  const ids = Object.values(pages).map((html) => {
    const people = graphOf(html).filter((n) => [].concat(n['@type']).includes('Person'));
    assert.equal(people.length, 1, 'exactly one Person node');
    return people[0]['@id'];
  });
  assert.equal(new Set(ids).size, 1);
});

test('sameAs lists the profiles in identity.json, and LinkedIn is not on the site', () => {
  for (const html of Object.values(pages)) {
    const person = graphOf(html).find((n) => n['@type'] === 'Person');
    assert.deepEqual(person.sameAs, identity.profiles.map((p) => p.url));
    assert.doesNotMatch(html, /linkedin\.com/i);
  }
});

test('every @id reference points at a node in the same graph', () => {
  for (const html of Object.values(pages)) {
    const graph = graphOf(html);
    const defined = new Set(graph.map((n) => n['@id']).filter(Boolean));
    for (const r of JSON.stringify(graph).match(/\{"@id":"[^"]+"\}/g) || []) assert.ok(defined.has(JSON.parse(r)['@id']), `dangling ${r}`);
  }
});

// Daniel, 12 Oct 2026: "We don't want her to send people to Corrales ... make sure the
// funnel isn't going to Corrales, but it's going to her calendar or her email or her number."
test('the funnel goes to Margarita: no Corrales links, and every tel: link is her number', () => {
  for (const [path, html] of Object.entries(pages)) {
    assert.doesNotMatch(html, /href="https?:\/\/[^"]*corralesre\.com/i, `${path} links to corralesre.com`);
    const markup = html.replace(/<script[\s\S]*?<\/script>/g, '');
    for (const m of markup.match(/tel:[^"]+/g)) assert.equal(m.slice(4), identity.contact.phoneE164, `${path}: ${m}`);
    for (const m of markup.match(/mailto:[^"?]+/g) || []) assert.equal(m.slice(7), identity.contact.email);
  }
});

test('every page names the firm and shows the license and Equal Housing Opportunity', () => {
  for (const [path, html] of Object.entries(pages)) {
    const text = visibleText(html);
    const lang = path.startsWith('/es/') ? 'es' : 'en';
    assert.ok(text.includes(identity.firm.displayWithTeam), `${path}: firm name`);
    assert.ok(text.includes(identity.license.number), `${path}: license`);
    assert.ok(text.includes(COPY[lang].footer.eho), `${path}: EHO`);
  }
});

test('every phone number shown is her canonical number', () => {
  for (const html of Object.values(pages)) {
    for (const m of visibleText(html).match(/\(\d{3}\) \d{3}-\d{4}|\b\d{3}[-. ]\d{3}[-. ]\d{4}\b/g) || []) assert.equal(m, identity.contact.phoneDisplay);
  }
});

test('the site has no pharmaceutical history (her call, 12 Oct 2026)', () => {
  for (const html of Object.values(pages)) assert.doesNotMatch(html, /pharma|Teva|ADMA|Healthcare Businesswomen|Manufacturers Association/i);
  assert.doesNotMatch(llmsTxt(identity, listings), /pharma|Teva|ADMA/i);
});

test('the next open house is announced, and disappears once it is over', () => {
  assert.match(pages['/'], /class="announce"/);
  // No Event schema: a static page would keep an expired event after the date.
  assert.doesNotMatch(pages['/'], /"@type":"Event"/);
  const oh = listings[0].openHouses[0];
  const after = new Date(new Date(oh.end).getTime() + 60000);
  assert.equal(nextOpenHouse(listings, after), undefined);
  const { pages: p } = build({ outDir: tmp('mc-after-'), root: ROOT, identity, listings, now: after });
  assert.doesNotMatch(p['/'], /class="announce"/);
});

test('build CLI accepts --base=/x and --base /x, and rejects anything else', () => {
  assert.deepEqual(parseArgs(['out', '--preview', '--base', '/margaritaturealtor-preview/']), { outDir: 'out', base: '/margaritaturealtor-preview', preview: true });
  assert.deepEqual(parseArgs(['--base=/x']), { outDir: undefined, base: '/x', preview: false });
  assert.throws(() => parseArgs(['--base']), /--base needs/);
  assert.throws(() => parseArgs(['--base', 'no-slash']), /--base needs/);
  assert.throws(() => parseArgs(['a', 'b']), /Two output folders/);
});

test('publish-preview.sh refuses any project not named *-preview', () => {
  const r = spawnSync('bash', [join(ROOT, 'scripts', 'publish-preview.sh')], { env: { ...process.env, PREVIEW_PROJECT: 'margaritaturealtor' }, encoding: 'utf8' });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Refusing/);
});

test('hreflang alternates are reciprocal and the sitemap lists every page', () => {
  const site = identity.site;
  for (const key of ['home', 'work', 'privacy']) {
    for (const c of Object.values(COPY)) {
      const html = pages[c.paths[key]];
      for (const x of Object.values(COPY)) assert.ok(html.includes(`hreflang="${x.htmlLang}" href="${site}${x.paths[key]}"`), `${c.paths[key]} -> ${x.paths[key]}`);
    }
  }
  const sitemap = readFileSync(join(out, 'sitemap.xml'), 'utf8');
  for (const path of Object.keys(pages)) assert.ok(sitemap.includes(`<loc>${site}${path}</loc>`), path);
});

test('every local file a page references exists in the build', () => {
  for (const [path, html] of Object.entries(pages)) {
    const refs = [...html.matchAll(/(?:src|href)="(\/[^"#?]*)"/g), ...html.matchAll(/srcset="([^"]+)"/g), ...html.matchAll(/data-pdf="([^"]+)"/g)]
      .flatMap((m) => m[1].split(',').map((s) => s.trim().split(' ')[0]))
      .filter((r) => r.startsWith('/'));
    for (const r of refs) {
      const f = join(out, r.endsWith('/') ? `${r}index.html` : r);
      assert.ok(existsSync(f), `${path}: missing ${r}`);
    }
  }
});

test('a preview under a base path prefixes every internal link and is never indexed', () => {
  const dir = tmp('mc-preview-');
  const { pages: p } = build({ outDir: dir, root: ROOT, identity, listings, now: NOW, base: '/margaritaturealtor-preview', preview: true });
  for (const html of Object.values(p)) {
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
    for (const [, ref] of html.matchAll(/(?:src|href|data-pdf)="(\/[^"]*)"/g)) assert.ok(ref.startsWith('/margaritaturealtor-preview/'), ref);
  }
  assert.match(readFileSync(join(dir, 'robots.txt'), 'utf8'), /Disallow: \//);
  assert.doesNotMatch(pages['/'], /noindex/);
});

test('a preview sends a noindex header on every file; the real build does not', () => {
  const dir = tmp('mc-preview-');
  build({ outDir: dir, root: ROOT, identity, listings, now: NOW, preview: true });
  assert.match(readFileSync(join(dir, '_headers'), 'utf8'), /^\/\*\n  X-Robots-Tag: noindex, nofollow\n/);
  assert.doesNotMatch(readFileSync(join(out, '_headers'), 'utf8'), /noindex/);
});

test('the free guide exists as a real PDF in both languages, and both say the same number of things', () => {
  for (const f of Object.values(GUIDE_PDF)) {
    const b = readFileSync(join(ROOT, f));
    assert.equal(b.subarray(0, 5).toString(), '%PDF-', f);
    assert.ok(b.length > 50000, `${f} looks empty`);
  }
  assert.equal(GUIDE.en.items.length, 10);
  assert.equal(GUIDE.es.items.length, 10);
});

test('the intake asks nothing Fair Housing protects', () => {
  for (const c of Object.values(COPY)) {
    const words = JSON.stringify(c.work).toLowerCase();
    for (const banned of ['religion', 'religión', 'race', 'raza', 'national origin', 'disability', 'discapacidad', 'children', 'hijos', 'married', 'casado', 'familial'])
      assert.ok(!words.includes(banned), `${c.lang}: "${banned}" in intake`);
  }
});

test('English and Spanish copy have the same shape', () => {
  const shape = (v) =>
    Array.isArray(v) ? v.map(shape) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, shape(v[k])])) : typeof v;
  assert.deepEqual(shape(COPY.es), shape(COPY.en));
  assert.deepEqual(shape(GUIDE.es), shape(GUIDE.en));
});

/** Width from a WebP header: lossy (VP8), lossless (VP8L) or extended (VP8X). */
function webpWidth(file) {
  const b = readFileSync(file);
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8 ') return b.readUInt16LE(26) & 0x3fff;
  if (kind === 'VP8L') return 1 + (((b[22] & 0x3f) << 8) | b[21]);
  if (kind === 'VP8X') return 1 + b.readUIntLE(24, 3);
  throw new Error(`not a WebP: ${file}`);
}

/** Width of a JPEG from its SOF marker (stdlib only). */
function jpegWidth(file) {
  const b = readFileSync(file);
  for (let i = 2; i < b.length; ) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return b.readUInt16BE(i + 7);
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`no SOF in ${file}`);
}

test('every srcset width descriptor matches the real image width', () => {
  for (const html of Object.values(pages)) {
    for (const [, set] of html.matchAll(/srcset="([^"]+)"/g)) {
      for (const cand of set.split(',')) {
        const [src, w] = cand.trim().split(/\s+/);
        const f = join(out, src);
        assert.equal(`${src.endsWith('.webp') ? webpWidth(f) : jpegWidth(f)}w`, w, `${src} is not ${w}`);
      }
    }
  }
});

test('the office address on the page always comes from identity.json', () => {
  const moved = structuredClone(identity);
  moved.team.address = { ...moved.team.address, street: '9 Test Way' };
  const { pages: p } = build({ outDir: tmp('mc-moved-'), root: ROOT, identity: moved, listings, now: NOW });
  for (const html of Object.values(p)) {
    assert.doesNotMatch(html, /1715 Pacific/);
    assert.ok(visibleText(html).includes('9 Test Way'));
  }
});

test('build refuses to empty the project folder or a folder that is not a build', () => {
  assert.throws(() => assertSafeOutDir(ROOT, ROOT), /contains the project/);
  assert.throws(() => assertSafeOutDir(dirname(ROOT), ROOT), /contains the project/);
  assert.throws(() => assertSafeOutDir(join(ROOT, 'src'), ROOT), /does not look like a previous build/);
  assert.doesNotThrow(() => assertSafeOutDir(out, ROOT));
});

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

test('no hardcoded home directories anywhere, and no emoji in what visitors see', () => {
  const files = [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'data')), ...walk(join(ROOT, 'scripts')), ...walk(out).filter((f) => /\.(html|txt|xml)$/.test(f))];
  for (const f of files) {
    const s = readFileSync(f, 'utf8');
    assert.doesNotMatch(s, /\/Users\/|\/home\/[a-z]/, `home path in ${f}`);
    // © ® ™ are typographic marks, not emoji, and REALTOR® needs one.
    if (f.startsWith(out)) assert.doesNotMatch(s.replace(/[©®™]/g, ''), /\p{Extended_Pictographic}/u, `emoji in ${f}`);
  }
});

test('home shows the Sequoia band with her co-ownership disclosure, and a Calendly discovery button', () => {
  for (const [path, lang] of [['/', 'en'], ['/es/', 'es']]) {
    const html = pages[path];
    assert.ok(visibleText(html).includes(COPY[lang].sequoia.disclosure), `${path}: disclosure`);
    assert.ok(html.includes(identity.ventures[0].url), `${path}: Sequoia link`);
    assert.match(html, /data-book-call[^>]*>|href="https:\/\/calendly\.com\/margarita-corralesre\/discovery"/);
  }
});

test('booking config notes ($-keys) never reach the page, and a plain string still works', async () => {
  assert.doesNotMatch(pages['/work-with-me/'], /created 12 Oct/);
  const { bookingMap } = await import('../src/render.mjs');
  assert.deepEqual(bookingMap({ links: { booking: 'https://x/y' } }), { discovery: 'https://x/y' });
});

// Audit 14 Oct 2026, P0: the popup promised "unsubscribe anytime" with nothing to subscribe to.
test('the welcome window only promises email when there is a backend to send it', () => {
  const html = pages['/'];
  assert.ok(!identity.api.subscribe || html.includes(COPY.en.popup.privacy));
  const offline = build({ outDir: tmp('mc-noapi-'), root: ROOT, identity: { ...identity, api: { leads: '', subscribe: '' } }, listings, now: NOW, lastmod: new Date('2026-10-12') }).pages;
  const online = build({ outDir: tmp('mc-api-'), root: ROOT, identity: { ...identity, api: { leads: 'https://api.x/api/lead', subscribe: 'https://api.x/api/subscribe' } }, listings, now: NOW, lastmod: new Date('2026-10-12') }).pages;
  for (const [pages, want, not] of [[offline, 'privacyLocal', 'privacy'], [online, 'privacy', 'privacyLocal']]) {
    for (const lang of ['en', 'es']) {
      const v = visibleText(pages[COPY[lang].paths.home]);
      assert.ok(v.includes(COPY[lang].popup[want]), `${lang} ${want}`);
      assert.ok(!v.includes(COPY[lang].popup[not]), `${lang} not ${not}`);
    }
  }
  assert.match(online['/'], /data-api="https:\/\/api\.x\/api\/subscribe"/);
});

test('every page links the privacy notice in its own language', () => {
  for (const [path, html] of Object.entries(pages)) {
    const lang = path.startsWith('/es/') ? 'es' : 'en';
    assert.ok(html.includes(`href="${COPY[lang].paths.privacy}"`), path);
  }
  assert.match(visibleText(pages['/privacy/']), new RegExp(identity.contact.phoneDisplay.replace(/[()]/g, '\\$&')));
});

test('"Get new listings first" starts a buyer request instead of opening the guide', () => {
  for (const lang of ['en', 'es']) {
    const html = pages[COPY[lang].paths.home];
    const a = html.match(new RegExp(`<a[^>]*>${COPY[lang].listings.alerts}`));
    assert.ok(a, lang);
    assert.match(a[0], new RegExp(`href="${COPY[lang].paths.work}\\?goal=buy"`));
  }
});

test('the listing feature shows every fact and the showing button with nothing hidden behind a flip', () => {
  const html = pages['/'];
  const f = html.match(/<article class="feature[\s\S]*?<\/article>/)[0];
  const l = listings.find((x) => x.status === 'active');
  assert.match(f, new RegExp(`<strong>${l.beds}</strong> beds`));
  assert.match(f, new RegExp(`<strong>${l.baths}</strong> baths`));
  assert.ok(f.includes(l.highlights.en));
  assert.match(f, /class="btn btn-ink" href="\/work-with-me\/\?goal=buy&amp;listing=/);
  assert.equal((f.match(/class="thumb[ "]/g) || []).length, l.photos.length);
  assert.doesNotMatch(html, /data-flip|flip-btn/);
});

test('fine print meets 4.5:1 contrast on every ground it sits on', () => {
  const css = readFileSync(join(ROOT, 'src', 'styles.css'), 'utf8');
  const v = (n) => css.match(new RegExp(`--${n}: (#[0-9A-Fa-f]{6})`))[1];
  const lum = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)).reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  for (const g of ['paper', 'paper-2', 'tiff-wash']) assert.ok(ratio(v('ink-3'), v(g)) >= 4.5, `ink-3 on ${g}`);
});

test('GSAP loads only on the page that animates with it', () => {
  for (const [path, html] of Object.entries(pages)) assert.equal(/gsap-[\d.]+\.min\.js/.test(html), path === '/' || path === '/es/', path);
});

// Step 6 (Addisuna-grade audit, 19 Oct 2026): mobile speed, accessibility, AI search.
test('pages load nothing from third parties: fonts and GSAP are self-hosted', () => {
  for (const [path, html] of Object.entries(pages)) {
    const markup = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
    const loading = markup.match(/<(?:script|img|source)[^>]*>|<link(?![^>]*rel="(?:canonical|alternate)")[^>]*>/g) || [];
    for (const tag of loading) assert.doesNotMatch(tag, /(?:src|href|srcset)="https?:\/\//, `${path}: ${tag}`);
    assert.doesNotMatch(markup, /fonts\.googleapis|fonts\.gstatic|cdnjs/, path);
  }
  const css = readFileSync(join(ROOT, 'src', 'styles.css'), 'utf8');
  for (const [, f] of css.matchAll(/url\(\/(assets\/fonts\/[^)]+)\)/g)) assert.ok(existsSync(join(ROOT, f)), f);
});

test('the hero photo is served as WebP and preloaded on the home page', () => {
  for (const lang of ['en', 'es']) {
    const html = pages[COPY[lang].paths.home];
    assert.match(html, /<link rel="preload" as="image" imagesrcset="[^"]*portrait-480\.webp 480w/);
    assert.match(html, /<picture><source type="image\/webp" srcset="[^"]*portrait-480\.webp[^>]*><img[^>]*fetchpriority="high"/);
  }
});

test('without WebP files the pages fall back to plain JPEG images', () => {
  assert.deepEqual(webpIndex(tmp('mc-nowebp-')), {});
  const html = renderLanguage({ identity, listings, copy: COPY.en, all: [COPY.en, COPY.es], css: '', script: '', now: NOW, guidePdf: GUIDE_PDF, journeyImages: [], webp: {} })['/'];
  assert.doesNotMatch(html, /<picture>|\.webp|image\/webp/);
  assert.match(html, /<img src="\/assets\/img\/margarita-cuesta-portrait-1200\.jpg"/);
});

test('the FAQ schema repeats the questions on the page word for word, in each language', () => {
  for (const lang of ['en', 'es']) {
    const html = pages[COPY[lang].paths.home];
    const faq = graphOf(html).find((n) => n['@type'] === 'FAQPage');
    assert.ok(faq, lang);
    // Look only at the printed FAQ section, never at the JSON-LD the questions came from.
    const section = html.match(/<section id="faq"[\s\S]*?<\/section>/)[0];
    assert.equal(faq.mainEntity.length, COPY[lang].faq.items.length);
    for (const q of faq.mainEntity) {
      assert.ok(section.includes(`<summary>${esc(q.name)}</summary>`), q.name);
      assert.ok(section.includes(`<p>${esc(q.acceptedAnswer.text)}</p>`), q.name);
    }
  }
  assert.ok(!graphOf(pages['/work-with-me/']).some((n) => n['@type'] === 'FAQPage'), 'FAQ schema only where the FAQ is');
});

test('her Person node names Sequoia Builders, the business she co-owns', () => {
  const person = graphOf(pages['/']).find((n) => n['@type'] === 'Person');
  assert.equal(person.affiliation[0].name, identity.ventures[0].name);
});

test('llms.txt carries the FAQ, the toolkit and the privacy notice', () => {
  const t = readFileSync(join(out, 'llms.txt'), 'utf8');
  for (const [q] of COPY.en.faq.items) assert.ok(t.includes(`### ${q}`), q);
  assert.ok(t.includes(GUIDE_PDF.en) && t.includes(COPY.en.paths.privacy));
});

test('every piece of content sits inside a landmark (open-house bar, call button)', () => {
  const html = pages['/'];
  assert.match(html, /<aside class="announce"[^>]*aria-label=/);
  assert.match(html, /<a class="float-call"[^>]*>[\s\S]*?<\/a>\s*<\/footer>/);
  assert.doesNotMatch(pages['/work-with-me/'], /<aside class="work-side"/);
});

test('a WebP set whose JPEG has changed is skipped, so a replaced photo never shows the old one', () => {
  const root = tmp('mc-stale-');
  mkdirSync(join(root, 'assets', 'img', 'w'), { recursive: true });
  writeFileSync(join(root, 'assets', 'img', 'a.jpg'), 'new photo');
  writeFileSync(join(root, 'assets', 'img', 'b.jpg'), 'same photo');
  for (const n of ['a-640', 'b-640']) writeFileSync(join(root, 'assets', 'img', 'w', `${n}.webp`), '');
  const sha = (t) => createHash('sha256').update(t).digest('hex');
  writeFileSync(join(root, 'assets', 'img', 'w', 'sources.json'), JSON.stringify({ a: { file: 'a.jpg', sha256: sha('old photo') }, b: { file: 'b.jpg', sha256: sha('same photo') } }));
  assert.deepEqual(webpIndex(root), { b: [640] });
});

test('the committed WebP sets all match their JPEGs, and the hero offers 1200w for sharp phones', () => {
  const idx = webpIndex(ROOT);
  assert.deepEqual(idx['margarita-cuesta-portrait'], [480, 720, 960, 1200]);
  for (const l of listings) assert.ok(idx[l.photos[0].replace(/^.*\/|\.jpg$/g, '')], l.id);
});

// Step 7 (design, 19 Oct 2026)
test('Around the Triangle: one card per area, linking to an intake that names the area, and nothing Fair Housing protects', () => {
  const areas = JSON.parse(readFileSync(join(ROOT, 'data', 'areas.json'), 'utf8')).areas;
  for (const lang of ['en', 'es']) {
    const sec = pages[COPY[lang].paths.home].match(/<section id="areas"[\s\S]*?<\/section>/)[0];
    assert.equal((sec.match(/<article class="area">/g) || []).length, areas.length);
    for (const a of areas) assert.ok(sec.includes(`?goal=buy&amp;area=${encodeURIComponent(a.name)}`), a.id);
  }
  const words = JSON.stringify(areas).toLowerCase();
  for (const w of ['school', 'safe', 'crime', 'family-friendly', 'families', 'church', 'diverse', 'ethnic', 'hispanic', 'latino', 'young', 'retire']) assert.ok(!words.includes(w), `areas mention "${w}"`);
  assert.ok(readFileSync(join(out, 'llms.txt'), 'utf8').includes('## Around the Triangle'));
});

test('the timeline has the same six steps in both languages', () => {
  for (const lang of ['en', 'es']) {
    const sec = pages[COPY[lang].paths.home].match(/<section id="process"[\s\S]*?<\/section>/)[0];
    assert.equal((sec.match(/<li>/g) || []).length, 6);
  }
});

test('the hello video shows a "coming soon" frame until a video is set, then plays it', () => {
  assert.match(pages['/'], /<figure class="hello is-soon">[\s\S]*?Video coming soon/);
  const withVideo = renderLanguage({ identity: { ...identity, video: { en: 'assets/video/hello.mp4', es: '' } }, listings, copy: COPY.es, all: [COPY.en, COPY.es], css: '', script: '', now: NOW, guidePdf: GUIDE_PDF, journeyImages: [], webp: {} })['/es/'];
  assert.match(withVideo, /<video controls preload="none"[^>]*src="\/assets\/video\/hello\.mp4"/);
});

test('Spanish pages show the reviews translated, marked as translations, with the original one tap away', () => {
  const sec = pages['/es/'].match(/<section id="reviews"[\s\S]*?<\/section>/)[0];
  for (const t of identity.testimonials) {
    assert.ok(t.es, `${t.name} has no translation`);
    assert.ok(sec.includes(esc(t.es)), t.name);
    assert.ok(sec.includes(esc(t.text)), `${t.name} original kept`);
  }
  assert.equal((sec.match(/Traducido del inglés/g) || []).length, identity.testimonials.length);
  assert.match(sec, /<blockquote lang="es">/);
  assert.doesNotMatch(pages['/'].match(/<section id="reviews"[\s\S]*?<\/section>/)[0], /quote-orig/, 'English page shows the originals only');
});

test('her mark is the tab icon and sits beside her name in the header and footer', () => {
  const svg = readFileSync(join(ROOT, 'assets', 'favicon.svg'), 'utf8');
  assert.equal(svg, readFileSync(join(ROOT, 'assets', 'mark.svg'), 'utf8'));
  assert.match(pages['/'], /<a class="brand"[^>]*>\s*<svg class="brand-mark"/);
  assert.match(pages['/'], /<p class="foot-name"><svg class="foot-mark"/);
});

test('the hero carries its proof line in both languages', () => {
  for (const lang of ['en', 'es']) for (const x of COPY[lang].hero.proof) assert.ok(pages[COPY[lang].paths.home].includes(`<li>${esc(x)}</li>`), x);
});

test('every inline mark is the drawing in assets/mark.svg', () => {
  const paths = (svg) => [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).join('|');
  const mark = paths(readFileSync(join(ROOT, 'assets', 'mark.svg'), 'utf8'));
  for (const cls of ['brand-mark', 'foot-mark']) assert.equal(paths(pages['/'].match(new RegExp(`<svg class="${cls}"[\\s\\S]*?</svg>`))[0]), mark, cls);
});

test('an area with only a name still builds, and a Spanish page says when the video is in English', () => {
  const r = renderLanguage({ identity: { ...identity, video: { en: 'assets/video/hello.mp4', es: '' } }, listings, copy: COPY.es, all: [COPY.en, COPY.es], css: '', script: '', now: NOW, guidePdf: GUIDE_PDF, journeyImages: [], webp: {}, areas: [{ id: 'x', name: 'Apex' }] })['/es/'];
  assert.match(r, /<h3>Apex<\/h3>/);
  assert.match(r, /Un saludo de Margarita \(en inglés\)/);
});
