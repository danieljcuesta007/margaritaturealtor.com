import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, loadIdentity, llmsTxt } from '../src/build.mjs';
import { COPY } from '../src/copy.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const identity = loadIdentity(ROOT);
let out, pages;

before(() => {
  out = mkdtempSync(join(tmpdir(), 'mc-site-'));
  ({ pages } = build({ outDir: out, root: ROOT, identity, today: new Date('2026-10-12') }));
});

const graphOf = (html) => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const visibleText = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');

test('builds an English page at / and a Spanish page at /es/', () => {
  assert.match(readFileSync(join(out, 'index.html'), 'utf8'), /<html lang="en-US">/);
  assert.match(readFileSync(join(out, 'es', 'index.html'), 'utf8'), /<html lang="es-US">/);
});

test('Margarita is defined once per page, with the same @id in both languages', () => {
  const ids = Object.values(pages).map((html) => {
    const people = graphOf(html).filter((n) => [].concat(n['@type']).includes('Person'));
    assert.equal(people.length, 1, 'exactly one Person node');
    return people[0]['@id'];
  });
  assert.equal(new Set(ids).size, 1);
  assert.equal(ids[0], `${identity.site}/#margarita`);
});

test('sameAs lists every profile in identity.json and nothing else', () => {
  const person = graphOf(pages.en).find((n) => n['@type'] === 'Person');
  assert.deepEqual(person.sameAs, identity.profiles.map((p) => p.url));
});

test('every reference to a node by @id points at a node that exists', () => {
  for (const html of Object.values(pages)) {
    const graph = graphOf(html);
    const defined = new Set(graph.map((n) => n['@id']));
    const refs = JSON.stringify(graph).match(/\{"@id":"[^"]+"\}/g) || [];
    for (const r of refs) assert.ok(defined.has(JSON.parse(r)['@id']), `dangling ${r}`);
  }
});

// NC Real Estate Commission rules: advertising must name the firm. The license
// number and the Equal Housing Opportunity mark are standard practice too.
test('every page names the firm and shows the license and Equal Housing Opportunity', () => {
  for (const [lang, html] of Object.entries(pages)) {
    const text = visibleText(html);
    assert.ok(text.includes(identity.firm.displayWithTeam), `${lang}: firm name`);
    assert.ok(text.includes(identity.license.number), `${lang}: license number`);
    assert.ok(text.includes(COPY[lang].footer.eho), `${lang}: EHO statement`);
    assert.match(html, /aria-label="Equal Housing Opportunity"/);
  }
});

// Name, address, phone must read identically everywhere or local search treats
// them as different businesses. Only her number and the team office number may appear.
test('every phone number on the site is one of the two canonical numbers', () => {
  const allowed = new Set([identity.contact.phoneDisplay, identity.team.phoneDisplay]);
  for (const html of Object.values(pages)) {
    for (const m of visibleText(html).match(/\(\d{3}\) \d{3}-\d{4}|\b\d{3}[-. ]\d{3}[-. ]\d{4}\b/g) || []) {
      assert.ok(allowed.has(m), `unexpected phone format or number: ${m}`);
    }
    for (const m of html.match(/tel:[^"]+/g)) {
      assert.ok([identity.contact.phoneE164, identity.team.phoneE164].includes(m.slice(4)), m);
    }
  }
});

test('hreflang alternates are reciprocal and the sitemap lists both pages', () => {
  for (const html of Object.values(pages)) {
    assert.ok(html.includes(`hreflang="en-US" href="${identity.site}/"`));
    assert.ok(html.includes(`hreflang="es-US" href="${identity.site}/es/"`));
    assert.ok(html.includes(`hreflang="x-default" href="${identity.site}/"`));
  }
  const sitemap = readFileSync(join(out, 'sitemap.xml'), 'utf8');
  assert.ok(sitemap.includes(`<loc>${identity.site}/</loc>`));
  assert.ok(sitemap.includes(`<loc>${identity.site}/es/</loc>`));
});

test('every local file a page references exists in the build', () => {
  for (const [lang, html] of Object.entries(pages)) {
    const base = lang === 'en' ? out : join(out, 'es');
    const refs = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g), ...html.matchAll(/srcset="([^"]+)"/g)]
      .flatMap((m) => m[1].split(',').map((s) => s.trim().split(' ')[0]))
      .filter((r) => r && !r.startsWith('/') && !r.startsWith('http'));
    for (const r of refs) assert.ok(existsSync(join(base, r)), `${lang}: missing ${r}`);
  }
});

test('English and Spanish copy have the same shape', () => {
  const shape = (v) =>
    Array.isArray(v) ? v.map(shape) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, shape(v[k])])) : typeof v;
  assert.deepEqual(shape(COPY.es), shape(COPY.en));
});

test('the FAQ in the schema matches the FAQ on the page, placeholders filled', () => {
  for (const [lang, html] of Object.entries(pages)) {
    const faq = graphOf(html).find((n) => n['@type'] === 'FAQPage');
    assert.equal(faq.mainEntity.length, COPY[lang].faq.items.length);
    assert.equal((html.match(/<details>/g) || []).length, COPY[lang].faq.items.length);
    assert.doesNotMatch(html, /\{(phone|email|license)\}/);
  }
});

test('llms.txt carries her name, license, languages and phone', () => {
  const txt = llmsTxt(identity);
  for (const s of [identity.name, identity.license.number, 'English and Spanish', identity.contact.phoneDisplay]) assert.ok(txt.includes(s), s);
});

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

test('no hardcoded home directories anywhere, and no emoji in what visitors see', () => {
  const files = [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'data')), ...walk(out).filter((f) => /\.(html|txt|xml)$/.test(f))];
  for (const f of files) {
    const s = readFileSync(f, 'utf8');
    assert.doesNotMatch(s, /\/Users\/|\/home\/[a-z]/, `home path in ${f}`);
    // © ® ™ are typographic marks, not emoji, and REALTOR® needs one.
    if (f.startsWith(out)) assert.doesNotMatch(s.replace(/[©®™]/g, ''), /\p{Extended_Pictographic}/u, `emoji in ${f}`);
  }
});
