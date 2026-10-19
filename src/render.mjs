import { buildGraph } from './schema.mjs';

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function officeLine(identity) {
  const a = identity.team.address;
  return `${a.street}, ${a.locality}, ${a.region} ${a.postalCode}`;
}

/** Fill {phone} {email} {license} {office} placeholders in copy strings. */
export function fill(text, identity) {
  return text
    .replaceAll('{phone}', identity.contact.phoneDisplay)
    .replaceAll('{email}', identity.contact.email)
    .replaceAll('{license}', identity.license.number)
    .replaceAll('{office}', officeLine(identity));
}

const TZ = 'America/New_York';
export const money = (n) => `$${Number(n).toLocaleString('en-US')}`;

/** "Sat, Oct 31 · 10:00 AM – 12:00 PM" in the page language, Eastern time. */
export function openHouseLabel(oh, htmlLang) {
  const s = new Date(oh.start);
  const e = new Date(oh.end);
  const day = new Intl.DateTimeFormat(htmlLang, { weekday: 'short', month: 'short', day: 'numeric', timeZone: TZ }).format(s);
  const t = new Intl.DateTimeFormat(htmlLang, { hour: 'numeric', minute: '2-digit', timeZone: TZ });
  return `${day} · ${t.format(s)} – ${t.format(e)}`;
}

export const activeListings = (listings) => listings.filter((l) => l.status === 'active');
export const upcomingOpenHouses = (l, now) => (l.openHouses || []).filter((oh) => new Date(oh.end) > now);

/** The next open house that has not ended yet, across all active listings. */
export function nextOpenHouse(listings, now) {
  return activeListings(listings)
    .flatMap((l) => upcomingOpenHouses(l, now).map((oh) => ({ listing: l, oh })))
    .sort((a, b) => new Date(a.oh.start) - new Date(b.oh.start))[0];
}

const ICON = {
  phone: '<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/>',
  whatsapp: '<path d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 4.8 5-1.3A9.8 9.8 0 1 0 12 2.2zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.4.4 0 0 0 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.8 2 4.6 4.6 0 0 0 1 2.5 10.6 10.6 0 0 0 4 3.6c1.5.6 2.1.7 2.8.6a2.4 2.4 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.1-.2-.2-.4-.3z"/>',
  mail: '<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4 7.4V17h16V7.4z"/>',
  instagram: '<path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM17.5 5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>',
  tiktok: '<path d="M16.6 2h-3.3v13.3a2.9 2.9 0 1 1-2-2.8V9.1a6.2 6.2 0 1 0 5.3 6.2V8.6a7.6 7.6 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.4z"/>',
  arrow: '<path d="M13 5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2l-4.6-4.6z"/>',
  close: '<path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6 10.6 12 5 6.4z"/>',
  bed: '<path d="M3 6h2v6h14a2 2 0 0 1 2 2v5h-2v-2H5v2H3zm5 1a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm4 1h5a3 3 0 0 1 3 3H12z"/>',
  bath: '<path d="M7 4a3 3 0 0 1 3 3h-2a1 1 0 0 0-2 0v5h15v2a6 6 0 0 1-3 5.2l1 1.8h-2.3l-.7-1.1a6 6 0 0 1-1 .1H9a6 6 0 0 1-1-.1L7.3 21H5l1-1.8A6 6 0 0 1 3 14v-2h1V7a3 3 0 0 1 3-3z"/>',
  area: '<path d="M3 3h7v2H6.4l4.3 4.3-1.4 1.4L5 6.4V10H3zm11 0h7v7h-2V6.4l-4.3 4.3-1.4-1.4L17.6 5H14zM3 14h2v3.6l4.3-4.3 1.4 1.4L6.4 19H10v2H3zm15.6 5-4.3-4.3 1.4-1.4 4.3 4.3V14h2v7h-7v-2z"/>',
};
const icon = (name, cls = 'i') => (!ICON[name] ? '' : `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICON[name]}</svg>`);

const EHO = `<svg class="eho" viewBox="0 0 40 40" role="img" aria-label="Equal Housing Opportunity"><path d="M20 3 2 17h4v20h28V17h4z" fill="none" stroke="currentColor" stroke-width="3"/><rect x="12" y="19" width="16" height="3.5" fill="currentColor"/><rect x="12" y="26" width="16" height="3.5" fill="currentColor"/></svg>`;

/* ---------- shared chrome ---------- */

function head({ ctx, page, title, description, graph }) {
  const { identity, c, all, u, site, preview } = ctx;
  const url = `${site}${c.paths[page]}`;
  return `<!doctype html>
<html lang="${c.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${preview ? '<meta name="robots" content="noindex, nofollow">\n' : ''}<link rel="canonical" href="${url}">
${all.map((x) => `<link rel="alternate" hreflang="${x.htmlLang}" href="${site}${x.paths[page]}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${site}${all[0].paths[page]}">
<meta name="theme-color" content="#FFFFFF">
<meta property="og:type" content="profile">
<meta property="og:site_name" content="${esc(identity.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site}/${identity.images.og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${c.locale}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${u('/favicon.svg')}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${u('/apple-touch-icon.png')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700&display=swap">
<style>${ctx.css}</style>
<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>
</head>`;
}

function announce(ctx) {
  const { c, listings, now, u } = ctx;
  const next = nextOpenHouse(listings, now);
  if (!next) return '';
  const { listing: l, oh } = next;
  return `<div class="announce" data-ends="${oh.end}">
  <div class="wrap announce-inner">
    <span class="announce-tag">${esc(c.announce.label)}</span>
    <span class="announce-text"><strong>${esc(openHouseLabel(oh, c.htmlLang))}</strong> <span class="announce-addr">· ${esc(l.address)}, ${esc(l.locality)}</span></span>
    <a class="announce-cta" href="${u(c.paths.work)}?goal=buy&amp;listing=${encodeURIComponent(l.id)}">${esc(c.announce.cta)} ${icon('arrow')}</a>
  </div>
</div>`;
}

function header(ctx, page) {
  const { identity, c, other, u } = ctx;
  const home = u(c.paths.home);
  const tel = `tel:${identity.contact.phoneE164}`;
  const a = (hash) => (page === 'home' ? hash : `${home}${hash}`);
  return `<a class="skip" href="#main">${esc(c.skip)}</a>
${announce(ctx)}
<header class="top">
  <div class="wrap top-inner">
    <a class="brand" href="${home}">
      <span class="brand-name">${esc(identity.name)}</span>
      <span class="brand-sub">REALTOR® · English &amp; Español</span>
    </a>
    <nav class="nav" aria-label="Primary">
      <a href="${a('#listings')}">${esc(c.nav.listings)}</a>
      <a href="${a('#services')}">${esc(c.nav.services)}</a>
      <a href="${a('#about')}">${esc(c.nav.about)}</a>
      <a href="${a('#reviews')}">${esc(c.nav.reviews)}</a>
    </nav>
    <div class="top-actions">
      <a class="lang" href="${u(other.paths[page])}" hreflang="${other.htmlLang}" lang="${other.htmlLang}">${esc(c.otherLabel)}</a>
      <a class="btn btn-ghost btn-sm hide-sm" href="${tel}">${icon('phone')}<span>${esc(identity.contact.phoneDisplay)}</span></a>
      <a class="btn btn-ink btn-sm" href="${u(c.paths.work)}">${esc(c.nav.work)}</a>
    </div>
  </div>
</header>`;
}

function footer(ctx) {
  const { identity, c, other, u, page } = ctx;
  const tel = `tel:${identity.contact.phoneE164}`;
  const mail = `mailto:${identity.contact.email}`;
  return `<footer class="foot">
  <div class="wrap foot-grid">
    <div class="foot-id">
      <p class="foot-name">${esc(identity.name)}</p>
      <p>${esc(identity.jobTitle[c.lang])}, REALTOR®<br>${esc(identity.firm.displayWithTeam)}</p>
      <p>${esc(c.footer.licensed)} · ${esc(c.footer.licenseNo)}${esc(identity.license.number)}</p>
      <ul class="social">
        ${identity.profiles.filter((p) => p.footer !== false).map((p) => `<li><a href="${p.url}" rel="me noopener" aria-label="${esc(p.label)}">${ICON[p.id] ? icon(p.id) : `<span class="social-txt">${esc(p.label)}</span>`}</a></li>`).join('\n        ')}
      </ul>
    </div>
    <div>
      <p class="foot-h">${esc(c.footer.office)}</p>
      <p><a href="${tel}">${esc(identity.contact.phoneDisplay)}</a><br><a href="${mail}">${esc(identity.contact.email)}</a></p>
      <p>${esc(officeLine(identity))}</p>
    </div>
    <div class="foot-legal">
      <p class="foot-h">${esc(c.footer.licenseWith)}</p>
      <div class="logos">
        <img src="${u('/' + identity.firm.logo)}" alt="${esc(identity.firm.brand)}" width="380" height="180" loading="lazy">
        <span class="logo-tile"><img src="${u('/' + identity.team.logo)}" alt="${esc(identity.team.name)}" width="162" height="186" loading="lazy"></span>
      </div>
      <p class="eho-row">${EHO}<span>${esc(c.footer.eho)}</span></p>
      <p class="fine">${esc(c.footer.disclaimer)}</p>
    </div>
  </div>
  <div class="wrap verse">
    <p>“${esc(c.footer.verse)}” <span>${esc(c.footer.verseRef)}</span></p>
    <p class="fine">© <span data-year>2026</span> ${esc(identity.name)} · <a href="${u(c.paths.privacy)}">${esc(c.footer.privacy)}</a> · <a href="${u(other.paths[page])}" hreflang="${other.htmlLang}">${esc(c.otherLabel)}</a></p>
  </div>
</footer>`;
}

/** The toolkit cover, drawn in markup: used in the popup and the giveaway band. */
function toolkitCover(c, cls) {
  return `<div class="${cls}" aria-hidden="true"><span class="tk-kick">Raleigh · Durham</span><span class="tk-title">${esc(c.popup.cover)}</span><span class="tk-rule"></span><span class="tk-lines"><i></i><i></i><i></i><i></i><i></i></span><span class="tk-by">Margarita Cuesta</span></div>`;
}

/**
 * The welcome window: a native <dialog> modelled on the W.O.W signup prompt
 * (danielcuesta007.com SignupPrompt.astro). It asks once, at a good moment,
 * and steps back for a while after a "not now". Timing lives in client.mjs.
 * With api.subscribe set the email is saved by the Worker; without it the
 * toolkit still opens and the visitor can send Margarita a one-tap note, and
 * the fine print says exactly that.
 */
function popup(ctx) {
  const { c, other, u, identity } = ctx;
  const p = c.popup;
  const pdf = u('/' + ctx.guidePdf[c.lang]);
  const api = identity.api.subscribe;
  const note = `mailto:${identity.contact.email}?subject=${encodeURIComponent(p.noteSubject)}&body=${encodeURIComponent(p.noteBody)}`;
  const wa = `${identity.contact.whatsapp}?text=${encodeURIComponent(p.noteBody)}`;
  return `<dialog class="pop" id="guide" aria-labelledby="guide-title" data-api="${esc(api)}" data-lang="${c.lang}" data-pdf="${pdf}">
  <div class="pop-card">
    <button class="pop-x" type="button" data-close aria-label="${esc(p.close)}">${icon('close')}</button>
    ${toolkitCover(c, 'tk tk-pop')}
    <p class="pop-kick">${esc(p.eyebrow)}</p>
    <h2 class="pop-title" id="guide-title" tabindex="-1">${esc(p.title)}</h2>
    <p class="pop-blurb">${esc(p.body)}</p>
    <form class="pop-form">
      <label class="sr" for="g-name">${esc(p.name)}</label><input id="g-name" name="name" placeholder="${esc(p.name)}" autocomplete="given-name" required>
      <label class="sr" for="g-email">${esc(p.email)}</label><input id="g-email" name="email" type="email" placeholder="${esc(p.email)}" autocomplete="email" required>
      <input class="hp" name="mc_trap" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn btn-ink" type="submit" data-label="${esc(p.submit)}" data-sending="${esc(p.sending)}">${esc(p.submit)}</button>
    </form>
    <div class="pop-done" hidden>
      <p class="pop-thanks">${esc(p.thanks)}</p>
      <a class="btn btn-ink" href="${pdf}" download>${esc(p.download)}</a>
      <p class="pop-status" data-saved hidden role="status">${esc(p.saved)}</p>
      <div class="pop-note" data-note hidden>
        <p><span data-failed hidden>${esc(p.failed)} </span>${esc(p.note)}</p>
        <div class="pop-note-row"><a class="btn btn-ghost btn-sm" data-note-mail href="${esc(note)}">${icon('mail')}<span>${esc(p.noteEmail)}</span></a><a class="btn btn-ghost btn-sm" href="${esc(wa)}" rel="noopener">${icon('whatsapp')}<span>${esc(p.noteWa)}</span></a></div>
      </div>
    </div>
    <p class="pop-fine">${esc(api ? p.privacy : p.privacyLocal)} <a href="${u(c.paths.privacy)}">${esc(p.privacyLink)}</a></p>
    <div class="pop-actions">
      <button type="button" class="pop-link" data-already>${esc(p.already)}</button><span aria-hidden="true">·</span>
      <button type="button" class="pop-link" data-close>${esc(p.notNow)}</button><span aria-hidden="true">·</span>
      <a class="pop-link" href="${u(other.paths.home)}?guide=1" hreflang="${other.htmlLang}" lang="${other.htmlLang}">${esc(p.switchLang)}</a>
    </div>
  </div>
</dialog>`;
}

function page(ctx, pageName, body, { title, description, graph }) {
  ctx.page = pageName;
  return `${head({ ctx, page: pageName, title, description, graph })}
<body class="page-${pageName}">
${header(ctx, pageName)}
<main id="main">
${body}
</main>
${footer(ctx)}
${popup(ctx)}
<a class="float-call" href="tel:${ctx.identity.contact.phoneE164}">${icon('phone')}<span>${esc(ctx.c.callShort)}</span></a>
${pageName === 'home' ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>' : ''}
<script>${ctx.script}</script>
</body>
</html>
`;
}

/* ---------- home ---------- */

// Clip shapes for the "where are you headed" stage, on a 500x500 board:
// a house assembled from slices, a floor plan, and a block of lots.
const CLIPS = [
  `<path class="path" d="M120 70h50v60h-50z"/>
   <path class="path" d="M250 40 470 210H30z"/>
   <path class="path" d="M70 222h360v108H70z"/>
   <path class="path" d="M70 342h360v96H70z"/>
   <path class="path" d="M20 450h460v30H20z"/>`,
  `<rect class="path" x="20" y="20" width="200" height="280" rx="14"/>
   <rect class="path" x="20" y="320" width="200" height="160" rx="14"/>
   <rect class="path" x="240" y="20" width="240" height="140" rx="14"/>
   <rect class="path" x="240" y="180" width="110" height="160" rx="14"/>
   <rect class="path" x="370" y="180" width="110" height="160" rx="14"/>
   <rect class="path" x="240" y="360" width="240" height="120" rx="14"/>`,
  Array.from({ length: 9 })
    .map((_, i) => `<rect class="path" x="${(i % 3) * 160 + 20}" y="${Math.floor(i / 3) * 160 + 20}" width="140" height="140" rx="10"/>`)
    .join('\n   '),
];

function journeys(ctx) {
  const { c, u, journeyImages } = ctx;
  const j = c.journeys;
  return `<section class="journeys" aria-labelledby="j-h">
  <div class="wrap j-grid">
    <div class="j-menu">
      <p class="eyebrow" id="j-h">${esc(j.eyebrow)}</p>
      <ol class="j-list">
        ${j.items
          .map(
            (it, i) => `<li><button type="button" class="j-item${i === 0 ? ' is-on' : ''}" data-j="${i}" data-target="#svc-${it.id}" aria-pressed="${i === 0}">
          <span class="j-num">0${i + 1}</span><span class="j-name">${esc(it.lines[0])}<br>${esc(it.lines[1])}</span>
        </button></li>`,
          )
          .join('\n        ')}
      </ol>
      <p class="j-hint">${esc(j.hint)}</p>
    </div>
    <div class="j-stage">
      <div class="j-glow" aria-hidden="true"></div>
      <svg viewBox="0 0 500 500" role="img" aria-label="${esc(j.items.map((x) => x.lines.join(' ')).join(', '))}">
        <defs>
          ${CLIPS.map((p, i) => `<clipPath id="j-clip-${i}">${p}</clipPath>`).join('\n          ')}
        </defs>
        ${journeyImages
          .map(
            (src, i) => `<g class="j-layer${i === 0 ? ' is-on' : ''}" data-layer="${i}" clip-path="url(#j-clip-${i})"><image href="${u('/' + src)}" width="500" height="500" preserveAspectRatio="xMidYMid slice"/></g>`,
          )
          .join('\n        ')}
      </svg>
    </div>
  </div>
</section>`;
}

function listingCard(ctx, l) {
  const { c, u, now } = ctx;
  const L = c.listings;
  const oh = upcomingOpenHouses(l, now)[0];
  const sold = l.status === 'sold';
  const book = `${u(c.paths.work)}?goal=buy&amp;listing=${encodeURIComponent(l.id)}`;
  return `<article class="flip${sold ? ' is-sold' : ''}" data-flip>
  <div class="flip-inner">
    <div class="face front">
      <div class="photo">
        <img src="${u('/' + l.photos[0])}" alt="${esc(l.address)}, ${esc(l.locality)}" width="1280" height="720" loading="lazy">
        ${oh ? `<span class="chip" data-ends="${oh.end}"><b>${esc(L.openHouse)}</b> ${esc(openHouseLabel(oh, c.htmlLang))}</span>` : ''}
      </div>
      <div class="front-body">
        <p class="kick">${esc(sold ? L.sold : L.active)}${l.mls ? ` · MLS #${esc(l.mls)}` : ''}</p>
        <h3>${esc(l.address)}</h3>
        <p class="loc">${esc(l.locality)}, ${esc(l.region)} ${esc(l.postalCode)}</p>
        <p class="facts">${l.beds} ${esc(L.beds.toLowerCase())} · ${l.baths} ${esc(L.baths.toLowerCase())} · ${Number(l.sqft).toLocaleString('en-US')} ${esc(L.sqft.toLowerCase())}</p>
        ${sold ? '' : `<a class="link front-book" href="${book}">${esc(L.bookShort)} ${icon('arrow')}</a>`}
        <div class="front-foot">
          ${l.price && !sold ? `<p class="price">${money(l.price)}</p>` : ''}
          <span class="hover-hint">${esc(L.flip)} ${icon('arrow')}</span>
          <button class="flip-btn" type="button" aria-expanded="false">${esc(L.flip)} ${icon('arrow')}</button>
        </div>
      </div>
    </div>
    <div class="face back">
      <div class="specs">
        <div class="spec">${icon('bed')}<strong>${l.beds}</strong><span>${esc(L.beds)}</span></div>
        <div class="spec">${icon('bath')}<strong>${l.baths}</strong><span>${esc(L.baths)}</span></div>
        <div class="spec">${icon('area')}<strong>${Number(l.sqft).toLocaleString('en-US')}</strong><span>${esc(L.sqft)}</span></div>
      </div>
      <h3>${esc(l.address)}</h3>
      <p class="back-text">${esc(l.highlights[c.lang])}</p>
      ${sold ? '' : `<a class="btn btn-ink btn-block" href="${book}">${esc(L.book)}</a>`}
      ${l.url ? `<a class="link" href="${l.url}" rel="noopener">${esc(L.photos)} ${icon('arrow')}</a>` : ''}
      <button class="flip-btn flip-back" type="button">${esc(L.flipBack)}</button>
    </div>
  </div>
</article>`;
}

function sequoiaBand(ctx) {
  const { identity, c } = ctx;
  const v = (identity.ventures || []).find((x) => x.id === 'sequoia');
  if (!v) return '';
  const S = c.sequoia;
  return `<section class="sequoia" aria-labelledby="sequoia-h">
  <div class="wrap sequoia-inner">
    <div class="sequoia-mark" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M32 4 14 30h8L10 46h16v14h12V46h16L42 30h8z" fill="currentColor"/></svg></div>
    <div>
      <p class="eyebrow">${esc(S.eyebrow)}</p>
      <h2 id="sequoia-h">${esc(S.heading)}</h2>
      <p>${esc(S.body)}</p>
      <a class="btn btn-ink" href="${esc(v.url)}" rel="noopener">${esc(S.cta)} ${icon('arrow')}</a>
      <p class="fine">${esc(S.disclosure)}</p>
    </div>
  </div>
</section>
`;
}

/** Booking links as {goal: url}, minus $-prefixed notes. A single string is treated as the discovery link. */
export function bookingMap(identity) {
  const b = identity.links?.booking;
  if (!b) return {};
  if (typeof b === 'string') return { discovery: b };
  return Object.fromEntries(Object.entries(b).filter(([k, v]) => !k.startsWith('$') && typeof v === 'string' && v));
}

function homeBody(ctx) {
  const { identity, c, u, listings } = ctx;
  const tel = `tel:${identity.contact.phoneE164}`;
  const h = c.hero;
  const work = u(c.paths.work);
  const cards = [...activeListings(listings), ...listings.filter((l) => l.status === 'sold')];

  return `<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">${esc(h.eyebrow)}</p>
      <h1><span>${esc(h.titleA)}</span> <span>${esc(h.titleB)}</span> <em>${esc(h.titleC)}</em></h1>
      <p class="lede">${esc(h.lede)}</p>
      <div class="cta-row">
        <a class="btn btn-ink" href="${work}">${esc(h.ctaWork)} ${icon('arrow')}</a>
      </div>
      <p class="hero-call"><a href="${tel}">${icon('phone')} ${esc(identity.contact.phoneDisplay)}</a></p>
    </div>
    <figure class="hero-photo">
      <div class="hero-arch" aria-hidden="true"></div>
      <img src="${u('/' + identity.images.portrait)}" srcset="${u('/' + identity.images.portraitSmall)} 640w, ${u('/' + identity.images.portrait)} 1200w" sizes="(min-width: 900px) 440px, 82vw" width="1200" height="1800" alt="${esc(identity.name)}, REALTOR®" fetchpriority="high">
      <figcaption class="badge">${esc(h.badge)}</figcaption>
    </figure>
  </div>
</section>

${journeys(ctx)}

<section id="listings" class="listings" aria-labelledby="listings-h">
  <div class="wrap listings-grid">
    <div class="listings-intro">
      <p class="eyebrow">${esc(c.listings.eyebrow)}</p>
      <h2 id="listings-h">${esc(c.listings.heading)}</h2>
      <p class="lede">${esc(c.listings.intro)}</p>
      <div class="cta-row">
        <a class="btn btn-ink" href="${work}?goal=buy">${esc(c.listings.alerts)} ${icon('arrow')}</a>
        <a class="btn btn-ghost" href="${identity.links.searchHomes}" rel="noopener">${esc(c.listings.search)}</a>
      </div>
    </div>
    ${cards.length ? `<div class="cards-row">\n      ${cards.map((l) => listingCard(ctx, l)).join('\n      ')}\n    </div>` : `<p class="lede">${esc(c.listings.empty)}</p>`}
  </div>
</section>

${sequoiaBand(ctx)}
<section id="services" class="services" aria-labelledby="services-h">
  <div class="wrap">
    <p class="eyebrow">${esc(c.services.eyebrow)}</p>
    <h2 id="services-h">${esc(c.services.heading)}</h2>
    <div class="svc-grid">
      ${c.services.items
        .map(
          (s, i) => `<article class="svc" id="svc-${s.id}">
        <span class="svc-n">0${i + 1}</span>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.body)}</p>
        <a class="link" href="${work}?goal=${s.id}">${esc(s.cta)} ${icon('arrow')}</a>
      </article>`,
        )
        .join('\n      ')}
    </div>
  </div>
</section>

<section id="about" class="about" aria-labelledby="about-h">
  <div class="wrap about-grid">
    <figure class="about-photo">
      <img src="${u('/' + identity.images.seated)}" srcset="${u('/' + identity.images.seatedSmall)} 640w, ${u('/' + identity.images.seated)} 1200w" sizes="(min-width: 900px) 420px, 90vw" width="1200" height="1800" alt="${esc(identity.name)}" loading="lazy">
    </figure>
    <div class="about-copy">
      <p class="eyebrow">${esc(c.about.eyebrow)}</p>
      <h2 id="about-h">${esc(c.about.heading)}</h2>
      ${c.about.paras.map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
      <p class="signature">${esc(c.about.signature)}</p>
      <ul class="creds">
        <li>${esc(c.about.licenseLabel)} #${esc(identity.license.number)}</li>
        ${identity.credentials.map((x) => `<li>${esc(x[c.lang])}</li>`).join('\n        ')}
        ${identity.education.map((e) => `<li>${esc(e[c.lang])}, ${esc(e.name)}, ${esc(e.place)}</li>`).join('\n        ')}
      </ul>
    </div>
  </div>
</section>

<section class="promises" aria-labelledby="promises-h">
  <div class="wrap">
    <p class="eyebrow" id="promises-h">${esc(c.promises.eyebrow)}</p>
    <ol class="promise-grid">
      ${c.promises.items.map(([t, b]) => `<li><h3>${esc(t)}</h3><p>${esc(b)}</p></li>`).join('\n      ')}
    </ol>
  </div>
</section>

<section id="reviews" class="reviews" aria-labelledby="reviews-h">
  <div class="wrap">
    <p class="eyebrow">${esc(c.reviews.eyebrow)}</p>
    <h2 id="reviews-h">${esc(c.reviews.heading)}</h2>
    <div class="quote-grid">
      ${identity.testimonials.map((t) => `<figure class="quote"><blockquote lang="${t.lang}"><p>${esc(t.text)}</p></blockquote><figcaption>${esc(t.name)}</figcaption></figure>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="giveaway" aria-labelledby="give-h">
  <div class="wrap give-inner">
    ${toolkitCover(c, 'tk tk-give')}
    <div>
      <p class="eyebrow">${esc(c.giveaway.eyebrow)}</p>
      <h2 id="give-h">${esc(c.giveaway.heading)}</h2>
      <p>${esc(c.giveaway.body)}</p>
      <ol class="give-list">${c.giveaway.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      <button class="btn btn-ink" type="button" data-open-guide>${esc(c.giveaway.cta)} ${icon('arrow')}</button>
    </div>
  </div>
</section>

<section class="closer" aria-labelledby="closer-h">
  <div class="wrap closer-inner">
    <h2 id="closer-h">${esc(c.cta.heading)}</h2>
    <p>${esc(c.cta.body)}</p>
    <div class="cta-row">
      <a class="btn btn-tiff" href="${work}">${esc(c.cta.work)} ${icon('arrow')}</a>
      ${bookingMap(identity).discovery ? `<a class="btn btn-line-light" href="${esc(bookingMap(identity).discovery)}" rel="noopener" data-book-call>${esc(c.cta.book)}</a>` : ''}
      <a class="btn btn-line-light" href="${tel}">${icon('phone')}<span>${esc(c.cta.call)} ${esc(identity.contact.phoneDisplay)}</span></a>
    </div>
  </div>
</section>`;
}

/* ---------- work with me ---------- */

const opt = (arr, blank = false) => (blank ? '<option value="">—</option>' : '') + arr.map((o) => `<option>${esc(o)}</option>`).join('');
const radios = (name, arr, req = false) =>
  `<div class="pills">${arr.map((o, i) => `<label class="pill"><input type="radio" name="${name}" value="${esc(o)}"${req && i === 0 ? ' required' : ''}><span>${esc(o)}</span></label>`).join('')}</div>`;

function workBody(ctx) {
  const { identity, c, listings } = ctx;
  const W = c.work;
  const F = W.fields;
  const timeRow = (n) => `<div class="time-row">
            <label>${esc(F.day)} ${n}<input type="date" name="day${n}"${n === 1 ? ' data-req-nobooking' : ''}></label>
            <label>${esc(F.slot)} ${n}<select name="slot${n}">${opt(F.slots)}</select></label>
          </div>`;
  return `<section class="work">
  <div class="wrap work-grid">
    <aside class="work-side">
      <p class="eyebrow">${esc(W.eyebrow)}</p>
      <h1>${esc(W.heading)}</h1>
      <p class="lede">${esc(W.lede)}</p>
      <figure class="work-portrait"><img src="${ctx.u('/' + identity.images.portraitSmall)}" width="640" height="960" alt="${esc(identity.name)}"></figure>
      <p class="fine">${esc(W.privacy)}</p>
    </aside>
    <form class="intake" novalidate data-api="${esc(identity.api.leads)}" data-booking="${esc(JSON.stringify(bookingMap(identity)))}" data-email="${identity.contact.email}" data-wa="${identity.contact.whatsapp}" data-subject="${esc(W.subject)}" data-lang="${c.lang}">
      <ol class="stepper">${W.steps.map((s, i) => `<li${i === 0 ? ' class="is-on" aria-current="step"' : ''}><span>${i + 1}</span><em>${esc(s)}</em></li>`).join('')}</ol>
      <p class="listing-chip" hidden><span>${esc(F.listing)}:</span> <strong data-listing-name></strong><input type="hidden" name="listing"></p>
      <script type="application/json" data-listings>${JSON.stringify(listings.map((l) => ({ id: l.id, name: `${l.address}, ${l.locality}` }))).replace(/</g, '\\u003c')}</script>

      <fieldset class="step is-on" data-step="1">
        <legend>${esc(W.steps[0])}</legend>
        <div class="row-2">
          <label>${esc(F.firstName)}<input name="firstName" autocomplete="given-name" required></label>
          <label>${esc(F.lastName)}<input name="lastName" autocomplete="family-name" required></label>
        </div>
        <div class="row-2">
          <label>${esc(F.phone)}<input name="phone" type="tel" autocomplete="tel" required></label>
          <label>${esc(F.email)}<input name="email" type="email" autocomplete="email" required></label>
        </div>
        <div class="q"><span class="q-l">${esc(F.contactPref)}</span>${radios('contactPref', F.contactPrefs, true)}</div>
        <div class="q"><span class="q-l">${esc(F.language)}</span>${radios('language', F.languages, true)}</div>
      </fieldset>

      <fieldset class="step" data-step="2" hidden>
        <legend>${esc(W.steps[1])}</legend>
        <div class="q"><span class="q-l">${esc(F.goal)}</span>
          <div class="pills pills-lg">${Object.entries(F.goals).map(([k, v], i) => `<label class="pill"><input type="radio" name="goal" value="${k}"${i === 0 ? ' required' : ''}><span>${esc(v)}</span></label>`).join('')}</div>
        </div>
        <label>${esc(F.timeline)}<select name="timeline">${opt(F.timelines, true)}</select></label>
        <div class="q"><span class="q-l">${esc(F.agent)}</span>${radios('agent', F.yesNo)}</div>
      </fieldset>

      <fieldset class="step" data-step="3" hidden>
        <legend>${esc(W.steps[2])}</legend>
        <div class="when" data-when="buy both invest">
          <label>${esc(F.areas)}<input name="areas" placeholder="${esc(F.areasHint)}"></label>
          <div class="row-3">
            <label>${esc(F.budget)}<select name="budget">${opt(F.budgets, true)}</select></label>
            <label>${esc(F.beds)}<select name="beds">${opt(['1+', '2+', '3+', '4+', '5+'], true)}</select></label>
            <label>${esc(F.baths)}<select name="baths">${opt(['1+', '1.5+', '2+', '3+'], true)}</select></label>
          </div>
          <label>${esc(F.homeType)}<select name="homeType">${opt(F.homeTypes, true)}</select></label>
          <div class="q"><span class="q-l">${esc(F.preapproved)}</span>${radios('preapproved', F.preapprovals)}</div>
          <div class="row-2">
            <div class="q"><span class="q-l">${esc(F.firstTime)}</span>${radios('firstTime', F.yesNo)}</div>
            <label>${esc(F.currentLease)}<input name="leaseEnds" type="month"></label>
          </div>
          <label>${esc(F.mustHaves)}<textarea name="mustHaves" rows="2" placeholder="${esc(F.mustHavesHint)}"></textarea></label>
        </div>
        <div class="when" data-when="sell both">
          <label>${esc(F.sellAddress)}<input name="sellAddress" autocomplete="street-address"></label>
          <div class="row-2">
            <label>${esc(F.sellReason)}<input name="sellReason"></label>
            <label>${esc(F.sellOwed)}<input name="sellOwed" inputmode="numeric"></label>
          </div>
        </div>
        <div class="when" data-when="lease">
          <label>${esc(F.leaseAddress)}<input name="leaseAddress"></label>
          <label>${esc(F.leaseAvailable)}<input name="leaseAvailable" type="date"></label>
        </div>
        <label>${esc(F.notes)}<textarea name="notes" rows="3"></textarea></label>
      </fieldset>

      <fieldset class="step" data-step="4" hidden>
        <legend>${esc(W.steps[3])}</legend>
        <div class="q" data-no-booking><span class="q-l">${esc(F.meeting)}</span>${radios('meeting', F.meetings, true)}</div>
        <div class="times" data-no-booking>
          <p class="q-l">${esc(F.times)}</p>
          ${[1, 2, 3].map(timeRow).join('\n          ')}
          <p class="fine">${esc(F.timesHint)}</p>
        </div>
        <p class="booking-intro" data-booking-only hidden>${esc(W.bookingIntro)}</p>
        <label class="consent"><input type="checkbox" name="consent" required> <span>${esc(F.consent)}</span></label>
      </fieldset>

      <input class="hp" name="mc_trap" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="form-nav">
        <button class="btn btn-ghost" type="button" data-back hidden>${esc(W.back)}</button>
        <button class="btn btn-ink" type="button" data-next>${esc(W.next)} ${icon('arrow')}</button>
        <button class="btn btn-ink" type="submit" data-submit hidden data-sending="${esc(W.sending)}">${esc(W.submit)} ${icon('arrow')}</button>
      </div>

      <div class="done" hidden tabindex="-1">
        <h2 data-done-title data-unsent="${esc(W.doneTitleUnsent)}">${esc(W.doneTitle)}</h2>
        <p data-done-body data-unsent="${esc(W.doneBodyUnsent)}">${esc(W.doneBody)}</p>
        <a class="btn btn-tiff" data-booking-link hidden href="#" rel="noopener">${esc(W.bookingCta)} ${icon('arrow')}</a>
        <div data-fallback hidden>
          <p class="fine">${esc(W.doneEmail)}</p>
          <div class="cta-row">
            <a class="btn btn-ink" data-send-email href="#">${icon('mail')}<span>${esc(W.sendEmail)}</span></a>
            <a class="btn btn-tiff" data-send-wa href="#" rel="noopener">${icon('whatsapp')}<span>${esc(W.sendWhatsapp)}</span></a>
          </div>
        </div>
      </div>
    </form>
  </div>
</section>`;
}

/* ---------- privacy ---------- */

function privacyBody(ctx) {
  const { identity, c } = ctx;
  const P = c.privacy;
  return `<section class="legal">
  <div class="wrap legal-inner">
    <p class="eyebrow">${esc(P.eyebrow)}</p>
    <h1>${esc(P.heading)}</h1>
    <p class="fine">${esc(P.updated)}</p>
    ${P.sections.map(([h, b]) => `<h2>${esc(h)}</h2>\n    <p>${esc(fill(b, identity))}</p>`).join('\n    ')}
  </div>
</section>`;
}

/* ---------- entry ---------- */

/**
 * Renders every page for one language and returns { [path]: html }.
 * base: prefix for internal links ('' on the real domain, '/repo-name' on GitHub Pages).
 */
export function renderLanguage({ identity, listings, copy, all, css, script, base = '', preview = false, now = new Date(), guidePdf, journeyImages }) {
  const other = all.find((x) => x !== copy);
  const ctx = { identity, listings, c: copy, all, other, css, script, preview, now, guidePdf, journeyImages, site: identity.site, u: (p) => `${base}${p}` };
  const home = page(ctx, 'home', homeBody(ctx), {
    title: copy.title,
    description: copy.metaDescription,
    graph: buildGraph(identity, copy, { page: 'home' }),
  });
  const work = page(ctx, 'work', workBody(ctx), {
    title: copy.work.title,
    description: copy.work.metaDescription,
    graph: buildGraph(identity, copy, { page: 'work' }),
  });
  const privacy = page(ctx, 'privacy', privacyBody(ctx), {
    title: copy.privacy.title,
    description: copy.privacy.metaDescription,
    graph: buildGraph(identity, copy, { page: 'privacy' }),
  });
  return { [copy.paths.home]: home, [copy.paths.work]: work, [copy.paths.privacy]: privacy };
}
