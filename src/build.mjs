#!/usr/bin/env node
/**
 * Builds the static site into dist/. Node standard library only, so it runs on
 * any machine with Node 18+ and nothing to install.
 *
 *   node src/build.mjs            -> ./dist
 *   node src/build.mjs some/dir   -> some/dir
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COPY, LANGS } from './copy.mjs';
import { renderPage, fill } from './render.mjs';
import * as client from './client.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function loadIdentity(root = ROOT) {
  return JSON.parse(readFileSync(join(root, 'data', 'identity.json'), 'utf8'));
}

/** Minify CSS just enough: comments and runs of whitespace. */
const minCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').trim();

/**
 * build() empties its output folder first, so refuse anything that could be
 * the project itself or hold other work: the repo root or any parent of it, or
 * an existing non-empty folder that is not a previous build (has no index.html,
 * or has a .git / package.json).
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
  return new Date(); // no git (e.g. a tarball): fall back to today rather than fail
}

export function build({ outDir = join(ROOT, 'dist'), root = ROOT, identity = loadIdentity(root), today = contentDate(root) } = {}) {
  assertSafeOutDir(outDir, root);
  const css = minCss(readFileSync(join(root, 'src', 'styles.css'), 'utf8'));
  const script = { head: client.head, body: client.body };
  const site = identity.site;

  if (existsSync(outDir)) rmSync(outDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(join(root, 'assets'), join(outDir, 'assets'), { recursive: true });
  for (const f of ['favicon.svg', 'apple-touch-icon.png']) {
    const src = join(root, 'assets', f);
    if (existsSync(src)) cpSync(src, join(outDir, f));
  }

  const pages = {};
  for (const lang of LANGS) {
    const copy = COPY[lang];
    const other = COPY[LANGS.find((l) => l !== lang)];
    const html = renderPage({ identity, copy, other, css, script, alternates: LANGS.map((l) => COPY[l]) });
    const file = join(outDir, copy.path, 'index.html');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
    pages[lang] = html;
  }

  const lastmod = today.toISOString().slice(0, 10);
  const alt = LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${COPY[l].htmlLang}" href="${site}${COPY[l].path}"/>`).join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${LANGS.map((l) => `  <url>\n    <loc>${site}${COPY[l].path}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alt}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${site}/"/>\n  </url>`).join('\n')}
</urlset>
`;
  writeFileSync(join(outDir, 'sitemap.xml'), sitemap);

  // Every crawler welcome, AI ones included: being quoted by an assistant is
  // exactly how a buyer who asks "Spanish-speaking realtor in Raleigh" finds her.
  writeFileSync(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);

  writeFileSync(join(outDir, 'llms.txt'), llmsTxt(identity));
  writeFileSync(join(outDir, '404.html'), notFound(identity, css));
  writeFileSync(
    join(outDir, '_headers'),
    `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n/assets/*\n  Cache-Control: public, max-age=86400, stale-while-revalidate=604800\n`,
  );
  return { outDir, pages, sitemap };
}

export function llmsTxt(identity) {
  const en = COPY.en;
  const faq = en.faq.items.map(([q, a]) => `- ${q} ${fill(a, identity)}`).join('\n');
  return `# ${identity.name}

> ${identity.description.en}

- Role: ${identity.jobTitle.en}, REALTOR®
- Team: ${identity.firm.displayWithTeam} (${identity.team.url})
- License: ${identity.license.state} real estate broker #${identity.license.number}
- Languages: English and Spanish
- Areas served: ${identity.areaServed.join(', ')}
- Phone / WhatsApp: ${identity.contact.phoneDisplay}
- Email: ${identity.contact.email}
- Office: ${identity.team.address.street}, ${identity.team.address.locality}, ${identity.team.address.region} ${identity.team.address.postalCode}

## Pages
- [English](${identity.site}/): profile, services, recent sales, contact
- [Español](${identity.site}/es/): perfil, servicios, ventas recientes, contacto

## Profiles
${identity.profiles.map((p) => `- [${p.label}](${p.url})`).join('\n')}

## Background
${COPY.en.about.paras[1]}
${identity.awards.map((a) => `- ${a.en}, ${a.year}`).join('\n')}

## FAQ
${faq}
`;
}

function notFound(identity, css) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found | ${identity.name}</title><meta name="robots" content="noindex"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><style>${css}</style></head>
<body><main class="wrap narrow" style="padding:96px 0"><p class="eyebrow">404</p><h1>This page moved, or never existed.</h1><p class="lede">Esta página no existe.</p><div class="cta-row"><a class="btn btn-solid" href="/">${identity.name}</a><a class="btn btn-line" href="/es/">Español</a><a class="btn btn-ghost" href="tel:${identity.contact.phoneE164}">${identity.contact.phoneDisplay}</a></div></main></body></html>
`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] ? resolve(process.argv[2]) : undefined;
  const { outDir } = build(out ? { outDir: out } : {});
  console.log(`Built ${LANGS.length} pages into ${outDir}`);
}
