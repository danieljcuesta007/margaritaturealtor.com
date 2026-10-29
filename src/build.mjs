#!/usr/bin/env node
/**
 * Builds the static site into dist/. Node standard library only.
 *
 *   node src/build.mjs                         -> ./dist for the real domain
 *   node src/build.mjs --preview              -> a noindex preview (Cloudflare Pages)
 *   node src/build.mjs --preview --base=/name  -> the same, served under /name/
 *   node src/build.mjs some/dir                -> into some/dir
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COPY, LANGS } from './copy.mjs';
import { renderLanguage, officeLine, activeListings } from './render.mjs';
import * as client from './client.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const GUIDE_PDF = { en: 'assets/guides/triangle-home-buyer-toolkit.pdf', es: 'assets/guides/kit-del-comprador-triangulo.pdf' };
export const JOURNEY_IMAGES = ['assets/img/listing-1036-mailwood-1.jpg', 'assets/img/listing-1036-mailwood-2.jpg', 'assets/img/sold-304-spring-st-kitchen.jpg'];

export function loadIdentity(root = ROOT) {
  return JSON.parse(readFileSync(join(root, 'data', 'identity.json'), 'utf8'));
}
export function loadAreas(root = ROOT) {
  const f = join(root, 'data', 'areas.json');
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')).areas : [];
}
export function loadListings(root = ROOT) {
  return JSON.parse(readFileSync(join(root, 'data', 'listings.json'), 'utf8')).listings;
}

/** { name: [widths] } for the WebP sizes in assets/img/w (scripts/make-webp.sh). Missing folder = {}. */
export function webpIndex(root = ROOT) {
  const dir = join(root, 'assets', 'img', 'w');
  if (!existsSync(dir)) return {};
  // sources.json records which JPEG (and its sha256) each set was made from. A set whose
  // JPEG has changed or gone is skipped, so a replaced photo never shows its old WebP.
  let sources = {};
  try { sources = JSON.parse(readFileSync(join(dir, 'sources.json'), 'utf8')); } catch {}
  const fresh = (name) => {
    const src = sources[name];
    if (!src) return false;
    const jpg = join(root, 'assets', 'img', src.file);
    if (!existsSync(jpg)) return false;
    return createHash('sha256').update(readFileSync(jpg)).digest('hex') === src.sha256;
  };
  const idx = {};
  for (const f of readdirSync(dir)) {
    const m = /^(.+)-(\d+)\.webp$/.exec(f);
    if (m) (idx[m[1]] ||= []).push(Number(m[2]));
  }
  for (const k of Object.keys(idx)) {
    if (!fresh(k)) { console.warn(`WebP for ${k} is stale or untracked; serving the JPEG (run scripts/make-webp.sh).`); delete idx[k]; continue; }
    idx[k].sort((a, b) => a - b);
  }
  return idx;
}

const minCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').trim();

/**
 * build() empties its output folder first, so refuse anything that could be
 * the project itself or hold other work: the repo root or a parent of it, or
 * an existing non-empty folder that is not a previous build.
 */
export function assertSafeOutDir(outDir, root = ROOT) {
  const out = resolve(outDir);
  const rel = relative(out, resolve(root));
  if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) throw new Error(`Refusing to build into ${out}: it contains the project.`);
  if (!existsSync(out)) return;
  const entries = readdirSync(out);
  if (entries.length === 0) return;
  if (entries.includes('.git') || entries.includes('package.json') || !entries.includes('index.html'))
    throw new Error(`Refusing to empty ${out}: it does not look like a previous build.`);
}

/** Date the site content last changed (git), not the date of this build. */
export function contentDate(root = ROOT) {
  try {
    const d = execFileSync('git', ['log', '-1', '--format=%cs', '--', 'data', 'src', 'assets'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(`${d}T00:00:00Z`);
  } catch {}
  return new Date();
}

export function build({
  outDir = join(ROOT, 'dist'),
  root = ROOT,
  identity = loadIdentity(root),
  listings = loadListings(root),
  areas = loadAreas(root),
  lastmod = contentDate(root),
  now = new Date(),
  base = '',
  preview = false,
} = {}) {
  assertSafeOutDir(outDir, root);
  // The stylesheet is inlined, so its root-relative font URLs need the preview prefix too.
  const css = minCss(readFileSync(join(root, 'src', 'styles.css'), 'utf8')).replaceAll('url(/', `url(${base}/`);
  const webp = webpIndex(root);
  const site = identity.site;
  const all = LANGS.map((l) => COPY[l]);

  if (existsSync(outDir)) rmSync(outDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(join(root, 'assets'), join(outDir, 'assets'), { recursive: true });
  for (const f of ['favicon.svg', 'apple-touch-icon.png']) {
    const src = join(root, 'assets', f);
    if (existsSync(src)) cpSync(src, join(outDir, f));
  }

  const pages = {};
  for (const copy of all) {
    const rendered = renderLanguage({ identity, listings, copy, all, css, script: client.body, base, preview, now, guidePdf: GUIDE_PDF, journeyImages: JOURNEY_IMAGES, webp, areas });
    for (const [path, html] of Object.entries(rendered)) {
      const file = join(outDir, path, 'index.html');
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, html);
      pages[path] = html;
    }
  }

  const day = lastmod.toISOString().slice(0, 10);
  const pageKeys = Object.keys(all[0].paths);
  const urls = pageKeys.flatMap((k) =>
    all.map((c) => {
      const alts = all.map((x) => `    <xhtml:link rel="alternate" hreflang="${x.htmlLang}" href="${site}${x.paths[k]}"/>`).join('\n');
      return `  <url>\n    <loc>${site}${c.paths[k]}</loc>\n    <lastmod>${day}</lastmod>\n${alts}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${site}${all[0].paths[k]}"/>\n  </url>`;
    }),
  );
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
  writeFileSync(join(outDir, 'sitemap.xml'), sitemap);

  // A preview must never be indexed: it would compete with the real domain.
  writeFileSync(join(outDir, 'robots.txt'), preview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
  writeFileSync(join(outDir, 'llms.txt'), llmsTxt(identity, listings, areas));
  writeFileSync(join(outDir, '404.html'), notFound(identity, css, base));
  writeFileSync(join(outDir, '.nojekyll'), '');
  writeFileSync(
    join(outDir, '_headers'),
    // A preview also sends noindex on every file (PDFs and images included), not just the pages.
    `/*\n${preview ? '  X-Robots-Tag: noindex, nofollow\n' : ''}  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n/assets/*\n  Cache-Control: public, max-age=86400, stale-while-revalidate=604800\n`,
  );
  return { outDir, pages, sitemap };
}

export function llmsTxt(identity, listings = [], areas = []) {
  const active = activeListings(listings);
  return `# ${identity.name}

> ${identity.description.en}

- Role: ${identity.jobTitle.en}, REALTOR®
- License: ${identity.license.state} real estate broker #${identity.license.number}, held with ${identity.firm.name} (member of the ${identity.team.name})
- Languages: English and Spanish
- Areas served: ${identity.areaServed.join(', ')}
- Services: buying, selling, renting out a property (tenant placement), investing
- Phone / WhatsApp: ${identity.contact.phoneDisplay}
- Email: ${identity.contact.email}
- Office: ${officeLine(identity)}

## Pages
- [English](${identity.site}/): profile, listings, services, reviews
- [Work with me](${identity.site}/work-with-me/): intake form and scheduling
- [Trabajar conmigo](${identity.site}${COPY.es.paths.work}): formulario en español
- [Español](${identity.site}/es/): perfil, propiedades, servicios, opiniones

## About, in her words
${COPY.en.about.paras.join('\n\n')}

## Current listings
${active.length ? active.map((l) => `- ${l.address}, ${l.locality}, ${l.region} ${l.postalCode}: $${l.price.toLocaleString('en-US')}, ${l.beds} bd / ${l.baths} ba, ${l.sqft} sq ft (MLS #${l.mls})`).join('\n') : '- None right now'}

## Profiles
${identity.profiles.map((p) => `- [${p.label}](${p.url})`).join('\n')}

## Free resource
- [The Triangle Home Buyer's Toolkit](${identity.site}/${GUIDE_PDF.en}) (PDF; [en español](${identity.site}/${GUIDE_PDF.es})): ten costly mistakes, cash-to-close and monthly cost worksheets, a home-tour scorecard, offer-to-keys steps for North Carolina.
${(identity.ventures || []).length ? `\n## Also\n${identity.ventures.map((v) => `- ${identity.name} is a ${v.role.en.toLowerCase()} of [${v.name}](${v.url})${v.summary ? `, ${v.summary}` : ''}, and discloses this to every client.`).join('\n')}\n` : ''}
${areas.length ? `## Around the Triangle\n${areas.map((a) => `- ${a.name} (${a.county}): ${a.en}`).join('\n')}\n\n` : ''}## Questions buyers and sellers ask
${COPY.en.faq.items.map(([q, a]) => `### ${q}\n${a}`).join('\n\n')}

## Privacy
- [Privacy notice](${identity.site}${COPY.en.paths.privacy})
`;
}

function notFound(identity, css, base) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found | ${identity.name}</title><meta name="robots" content="noindex"><link rel="icon" href="${base}/favicon.svg" type="image/svg+xml"><style>${css}</style></head>
<body><main class="wrap" style="padding:120px 0;max-width:760px"><p class="eyebrow">404</p><h1>This page moved, or never existed.</h1><p class="lede">Esta página no existe.</p><div class="cta-row"><a class="btn btn-ink" href="${base}/">${identity.name}</a><a class="btn btn-tiff" href="${base}/es/">Español</a><a class="btn btn-ghost" href="tel:${identity.contact.phoneE164}">${identity.contact.phoneDisplay}</a></div></main></body></html>
`;
}

/** CLI: [outDir] [--preview] [--base=/name | --base /name] */
export function parseArgs(args) {
  const res = { outDir: undefined, base: '', preview: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--preview') res.preview = true;
    else if (a === '--base' || a.startsWith('--base=')) {
      const v = a === '--base' ? args[++i] : a.slice('--base='.length);
      if (!v || !/^\/[\w.-]+$/.test(v.replace(/\/$/, ''))) throw new Error(`--base needs a path like /my-repo, got ${JSON.stringify(v)}`);
      res.base = v.replace(/\/$/, '');
    } else if (a.startsWith('--')) throw new Error(`Unknown option ${a}`);
    else if (res.outDir) throw new Error(`Two output folders given: ${res.outDir} and ${a}`);
    else res.outDir = a;
  }
  return res;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { outDir: out, base, preview } = parseArgs(process.argv.slice(2));
  const { outDir, pages } = build({ ...(out ? { outDir: resolve(out) } : {}), base, preview });
  console.log(`Built ${Object.keys(pages).length} pages into ${outDir}`);
}
