import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, loadIdentity, loadListings, llmsTxt, assertSafeOutDir, parseArgs, GUIDE_PDF } from '../src/build.mjs';
import { spawnSync } from 'node:child_process';
import { COPY } from '../src/copy.mjs';
import { GUIDE } from '../src/guide.mjs';
import { nextOpenHouse } from '../src/render.mjs';

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

test('builds home and work-with-me in English and Spanish', () => {
  assert.deepEqual(Object.keys(pages).sort(), ['/', '/es/', '/es/trabajar-conmigo/', '/work-with-me/']);
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
  assert.deepEqual(parseArgs(['out', '--preview', '--base', '/margaritacuesta-preview/']), { outDir: 'out', base: '/margaritacuesta-preview', preview: true });
  assert.deepEqual(parseArgs(['--base=/x']), { outDir: undefined, base: '/x', preview: false });
  assert.throws(() => parseArgs(['--base']), /--base needs/);
  assert.throws(() => parseArgs(['--base', 'no-slash']), /--base needs/);
  assert.throws(() => parseArgs(['a', 'b']), /Two output folders/);
});

test('publish-preview.sh refuses any repo not named *-preview', () => {
  const r = spawnSync('bash', [join(ROOT, 'scripts', 'publish-preview.sh')], { env: { ...process.env, PREVIEW_REPO: 'someone/margaritacuesta.com' }, encoding: 'utf8' });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Refusing/);
});

test('hreflang alternates are reciprocal and the sitemap lists all four pages', () => {
  const site = identity.site;
  for (const key of ['home', 'work']) {
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

test('a GitHub Pages preview prefixes every internal link and is never indexed', () => {
  const dir = tmp('mc-preview-');
  const { pages: p } = build({ outDir: dir, root: ROOT, identity, listings, now: NOW, base: '/margaritacuesta-preview', preview: true });
  for (const html of Object.values(p)) {
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
    for (const [, ref] of html.matchAll(/(?:src|href|data-pdf)="(\/[^"]*)"/g)) assert.ok(ref.startsWith('/margaritacuesta-preview/'), ref);
  }
  assert.match(readFileSync(join(dir, 'robots.txt'), 'utf8'), /Disallow: \//);
  assert.doesNotMatch(pages['/'], /noindex/);
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
        assert.equal(`${jpegWidth(join(out, src))}w`, w, `${src} is not ${w}`);
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
