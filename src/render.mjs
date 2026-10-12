import { buildGraph } from './schema.mjs';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Fill {phone} {email} {license} placeholders in copy strings. */
export function fill(text, identity) {
  return text
    .replaceAll('{phone}', identity.contact.phoneDisplay)
    .replaceAll('{email}', identity.contact.email)
    .replaceAll('{license}', identity.license.number);
}

const ICON = {
  phone: '<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/>',
  chat: '<path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-4 4V5a1 1 0 0 1 1-1z"/>',
  whatsapp: '<path d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 4.8 5-1.3A9.8 9.8 0 1 0 12 2.2zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.4.4 0 0 0 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.8 2 4.6 4.6 0 0 0 1 2.5 10.6 10.6 0 0 0 4 3.6c1.5.6 2.1.7 2.8.6a2.4 2.4 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.1-.2-.2-.4-.3z"/>',
  mail: '<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4 7.4V17h16V7.4z"/>',
  search: '<path d="M10 3a7 7 0 0 1 5.6 11.2l5 5-1.4 1.4-5-5A7 7 0 1 1 10 3zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>',
  instagram: '<path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM17.5 5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>',
  tiktok: '<path d="M16.6 2h-3.3v13.3a2.9 2.9 0 1 1-2-2.8V9.1a6.2 6.2 0 1 0 5.3 6.2V8.6a7.6 7.6 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.4z"/>',
  linkedin: '<path d="M4.5 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM3 8.5h3V21H3zm6 0h2.9v1.7h.1a3.2 3.2 0 0 1 2.9-1.6c3 0 3.6 2 3.6 4.6V21h-3v-6.8c0-1.6 0-3.7-2.3-3.7S11.9 12.3 11.9 14V21H9z"/>',
  sun: '<path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0-5 1 3h-2zm0 20-1-3h2zM2 12l3-1v2zm20 0-3 1v-2zM4.9 4.9l2.8 1.4-1.4 1.4zm14.2 14.2-2.8-1.4 1.4-1.4zM4.9 19.1l1.4-2.8 1.4 1.4zM19.1 4.9l-1.4 2.8-1.4-1.4z"/>',
  moon: '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/>',
  arrow: '<path d="M13 5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2l-4.6-4.6z"/>',
};
const icon = (name, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICON[name]}</svg>`;

/** Equal Housing Opportunity mark, drawn rather than downloaded. */
const EHO = `<svg class="eho" viewBox="0 0 40 40" role="img" aria-label="Equal Housing Opportunity"><path d="M20 3 2 17h4v20h28V17h4z" fill="none" stroke="currentColor" stroke-width="3"/><rect x="12" y="19" width="16" height="3.5" fill="currentColor"/><rect x="12" y="26" width="16" height="3.5" fill="currentColor"/></svg>`;

export function renderPage({ identity, copy, other, css, script }) {
  const c = copy;
  const site = identity.site;
  const url = `${site}${c.path}`;
  const tel = `tel:${identity.contact.phoneE164}`;
  const sms = `sms:${identity.contact.phoneE164}`;
  const wa = `${identity.contact.whatsapp}?text=${encodeURIComponent(c.contact.whatsappGreeting)}`;
  const mail = `mailto:${identity.contact.email}`;
  const faq = c.faq.items.map(([q, a]) => [q, fill(a, identity)]);
  const graph = buildGraph(identity, c, { faq });
  const img = (p) => (c.lang === 'en' ? '' : '../') + p;
  const lang = c.lang;

  const serviceLinks = {
    buy: identity.links.searchHomes,
    sell: identity.links.homeValue,
    invest: '#contact',
  };

  const footerProfiles = identity.profiles.filter((p) => p.footer !== false);
  const sale = identity.sales[0];

  return `<!doctype html>
<html lang="${c.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.title)}</title>
<meta name="description" content="${esc(c.metaDescription)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en-US" href="${site}/">
<link rel="alternate" hreflang="es-US" href="${site}/es/">
<link rel="alternate" hreflang="x-default" href="${site}/">
<meta name="theme-color" content="#FBF8F3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#11141C" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="profile">
<meta property="og:site_name" content="${esc(identity.name)}">
<meta property="og:title" content="${esc(c.title)}">
<meta property="og:description" content="${esc(c.metaDescription)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site}/${identity.images.og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${c.locale}">
<meta property="og:locale:alternate" content="${other.locale}">
<meta property="profile:first_name" content="Margarita">
<meta property="profile:last_name" content="Cuesta">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${img('favicon.svg')}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${img('apple-touch-icon.png')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Figtree:wght@400;500;600&display=swap">
<script>${script.head}</script>
<style>${css}</style>
<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>
</head>
<body>
<a class="skip" href="#main">${esc(c.skip)}</a>

<header class="top">
  <div class="wrap top-inner">
    <a class="brand" href="${c.path}" aria-label="${esc(identity.name)}">
      <span class="mono" aria-hidden="true">MC</span>
      <span class="brand-text"><span class="brand-name">${esc(identity.name)}</span><span class="brand-sub">${esc(identity.team.name)}</span></span>
    </a>
    <nav class="nav" aria-label="Primary">
      <a href="#about">${esc(c.nav.about)}</a>
      <a href="#buy">${esc(c.nav.buy)}</a>
      <a href="#sell">${esc(c.nav.sell)}</a>
      <a href="#sold">${esc(c.nav.sold)}</a>
      <a href="#contact">${esc(c.nav.contact)}</a>
    </nav>
    <div class="top-actions">
      <a class="lang" href="${other.path}" hreflang="${other.htmlLang}" lang="${other.htmlLang}">${esc(c.otherLabel)}</a>
      <button class="theme" type="button" aria-label="${esc(c.themeLabel)}" title="${esc(c.themeLabel)}">${icon('moon', 'i i-moon')}${icon('sun', 'i i-sun')}</button>
      <a class="btn btn-solid btn-sm" href="${tel}">${icon('phone')}<span>${esc(c.callShort)}</span></a>
    </div>
  </div>
</header>

<main id="main">
  <section class="hero">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">${esc(c.hero.eyebrow)}</p>
        <h1>${esc(c.hero.title)}</h1>
        <p class="lede">${esc(c.hero.lede)}</p>
        <div class="cta-row">
          <a class="btn btn-solid" href="${tel}">${icon('phone')}<span>${esc(c.hero.ctaCall)} <span class="nowrap">${esc(identity.contact.phoneDisplay)}</span></span></a>
          <a class="btn btn-line" href="${wa}" rel="noopener">${icon('whatsapp')}<span>${esc(c.hero.ctaWhatsapp)}</span></a>
          <a class="btn btn-ghost" href="${identity.links.searchHomes}" rel="noopener">${icon('search')}<span>${esc(c.hero.ctaSearch)}</span></a>
        </div>
        <p class="hero-firm">${esc(identity.firm.displayWithTeam)}</p>
      </div>
      <figure class="hero-photo">
        <img src="${img(identity.images.portrait)}" srcset="${img(identity.images.portraitSmall)} 640w, ${img(identity.images.portrait)} 1200w" sizes="(min-width: 900px) 420px, 80vw" width="1200" height="1800" alt="${esc(identity.name)}, ${esc(identity.jobTitle[lang])}" fetchpriority="high">
        <figcaption class="badge">${esc(c.hero.badge)}</figcaption>
      </figure>
    </div>
  </section>

  <section class="stats" aria-labelledby="stats-h">
    <div class="wrap">
      <h2 id="stats-h" class="kicker">${esc(c.stats.heading)}</h2>
      <ul class="stat-row">
        ${identity.team.stats.map((s) => `<li><span class="stat-v">${esc(s.value)}</span><span class="stat-l">${esc(s[lang])}</span></li>`).join('\n        ')}
      </ul>
      <p class="fine">${esc(c.stats.note)}</p>
    </div>
  </section>

  <section id="about" class="about">
    <div class="wrap about-grid">
      <figure class="about-photo">
        <img src="${img(identity.images.seated)}" srcset="${img(identity.images.seatedSmall)} 640w, ${img(identity.images.seated)} 1200w" sizes="(min-width: 900px) 380px, 90vw" width="1200" height="1800" alt="${esc(identity.name)}" loading="lazy">
      </figure>
      <div>
        <h2>${esc(c.about.heading)}</h2>
        ${c.about.paras.map((p) => `<p>${esc(p)}</p>`).join('\n        ')}
        <h3>${esc(c.about.credentialsHeading)}</h3>
        <ul class="creds">
          <li><strong>${esc(c.about.licenseLabel)}</strong> #${esc(identity.license.number)}</li>
          ${identity.education.map((e) => `<li>${esc(e[lang])}, ${esc(e.name)}, ${esc(e.place)}</li>`).join('\n          ')}
          ${identity.awards.map((a) => `<li>${esc(a[lang])}, ${a.year}</li>`).join('\n          ')}
          ${identity.credentials.map((x) => `<li>${esc(x[lang])}</li>`).join('\n          ')}
        </ul>
      </div>
    </div>
  </section>

  <section class="services" aria-labelledby="services-h">
    <div class="wrap">
      <h2 id="services-h">${esc(c.services.heading)}</h2>
      <div class="cards">
        ${c.services.items
          .map(
            (s, i) => `<article class="card" id="${s.id}">
          <span class="card-n">0${i + 1}</span>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.body)}</p>
          <a class="link" href="${serviceLinks[s.id]}"${serviceLinks[s.id].startsWith('http') ? ' rel="noopener"' : ''}>${esc(s.cta)} ${icon('arrow')}</a>
        </article>`,
          )
          .join('\n        ')}
      </div>
    </div>
  </section>

  <section class="steps" aria-labelledby="steps-h">
    <div class="wrap">
      <h2 id="steps-h">${esc(c.steps.heading)}</h2>
      <p class="section-intro">${esc(c.steps.intro)}</p>
      <ol class="step-list">
        ${c.steps.items.map(([t, d]) => `<li><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('\n        ')}
      </ol>
    </div>
  </section>

  <section id="sold" class="sold" aria-labelledby="sold-h">
    <div class="wrap">
      <h2 id="sold-h">${esc(c.sold.heading)}</h2>
      <article class="sale">
        <div class="sale-media">
          <img src="${img(sale.image)}" width="1600" height="431" alt="${esc(c.sold.alt)}" loading="lazy">
          <img src="${img(sale.imageInterior)}" width="680" height="460" alt="${esc(c.sold.altInterior)}" loading="lazy">
        </div>
        <div class="sale-text">
          <span class="tag">${esc(c.sold.label)}</span>
          <h3>${esc(sale.address)}<br><span>${esc(sale.locality)}, ${esc(sale.region)} ${esc(sale.postalCode)}</span></h3>
          <p>${esc(sale[lang])}</p>
          <p class="fine">${esc(identity.name)} ${esc(c.sold.withLabel)} ${esc(sale.with)}</p>
        </div>
      </article>
    </div>
  </section>

  <section class="team" aria-labelledby="team-h">
    <div class="wrap team-inner">
      <h2 id="team-h">${esc(c.team.heading)}</h2>
      <p>${esc(c.team.body)}</p>
      <a class="link" href="${identity.team.url}" rel="noopener">${esc(c.team.cta)} ${icon('arrow')}</a>
    </div>
  </section>

  <section class="faq" aria-labelledby="faq-h">
    <div class="wrap narrow">
      <h2 id="faq-h">${esc(c.faq.heading)}</h2>
      ${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n      ')}
    </div>
  </section>

  <section id="contact" class="contact" aria-labelledby="contact-h">
    <div class="wrap contact-grid">
      <div>
        <h2 id="contact-h">${esc(c.contact.heading)}</h2>
        <p>${esc(c.contact.intro)}</p>
        <ul class="contact-list">
          <li><a href="${tel}">${icon('phone')}<span><small>${esc(c.contact.call)}</small>${esc(identity.contact.phoneDisplay)}</span></a></li>
          <li><a href="${sms}">${icon('chat')}<span><small>${esc(c.contact.text)}</small>${esc(identity.contact.phoneDisplay)}</span></a></li>
          <li><a href="${wa}" rel="noopener">${icon('whatsapp')}<span><small>${esc(c.contact.whatsapp)}</small>${esc(identity.contact.phoneDisplay)}</span></a></li>
          <li><a href="${mail}">${icon('mail')}<span><small>${esc(c.contact.email)}</small>${esc(identity.contact.email)}</span></a></li>
        </ul>
      </div>
      <form class="form" action="${mail}" method="post" enctype="text/plain" data-email="${identity.contact.email}" data-wa="${identity.contact.whatsapp}" data-subject="${esc(c.contact.form.subject)}">
        <label>${esc(c.contact.form.name)}<input name="name" autocomplete="name" required></label>
        <div class="form-2">
          <label>${esc(c.contact.form.phone)}<input name="phone" type="tel" autocomplete="tel"></label>
          <label>${esc(c.contact.form.email)}<input name="email" type="email" autocomplete="email"></label>
        </div>
        <div class="form-2">
          <label>${esc(c.contact.form.goal)}<select name="goal">${c.contact.form.goals.map((g) => `<option>${esc(g)}</option>`).join('')}</select></label>
          <label>${esc(c.contact.form.language)}<select name="language">${c.contact.form.languages.map((g) => `<option>${esc(g)}</option>`).join('')}</select></label>
        </div>
        <label>${esc(c.contact.form.message)}<textarea name="message" rows="4"></textarea></label>
        <div class="cta-row">
          <button class="btn btn-solid" type="submit" value="email">${icon('mail')}<span>${esc(c.contact.form.submitEmail)}</span></button>
          <button class="btn btn-line" type="submit" value="whatsapp" data-channel="whatsapp">${icon('whatsapp')}<span>${esc(c.contact.form.submitWhatsapp)}</span></button>
        </div>
        <p class="fine">${esc(c.contact.form.note)}</p>
      </form>
    </div>
  </section>
</main>

<footer class="foot">
  <div class="wrap foot-grid">
    <div>
      <p class="foot-name">${esc(identity.name)}</p>
      <p>${esc(identity.jobTitle[lang])}, REALTOR®<br>${esc(identity.firm.displayWithTeam)}</p>
      <p>${esc(c.footer.licensed)} · ${esc(c.footer.licenseNo)}${esc(identity.license.number)}</p>
    </div>
    <div>
      <p><a href="${tel}">${esc(identity.contact.phoneDisplay)}</a><br><a href="${mail}">${esc(identity.contact.email)}</a></p>
      <p>${esc(c.footer.office)}: ${esc(identity.team.address.street)}, ${esc(identity.team.address.locality)}, ${esc(identity.team.address.region)} ${esc(identity.team.address.postalCode)} · <a href="tel:${identity.team.phoneE164}">${esc(identity.team.phoneDisplay)}</a></p>
      <ul class="social">
        ${footerProfiles.map((p) => `<li><a href="${p.url}" rel="me noopener" aria-label="${esc(p.label)}">${icon(p.id)}</a></li>`).join('\n        ')}
      </ul>
    </div>
    <div class="foot-legal">
      <p class="eho-row">${EHO}<span>${esc(c.footer.eho)}</span></p>
      <p class="fine">${esc(c.footer.disclaimer)}</p>
    </div>
  </div>
  <div class="wrap verse">
    <p>“${esc(c.footer.verse)}” <span>${esc(c.footer.verseRef)}</span></p>
    <p class="fine">© <span data-year>2026</span> ${esc(identity.name)} · <a href="${other.path}" hreflang="${other.htmlLang}">${esc(c.otherLabel)}</a></p>
  </div>
</footer>

<a class="float-call" href="${tel}" aria-label="${esc(c.contact.call)} ${esc(identity.contact.phoneDisplay)}">${icon('phone')}<span>${esc(c.callShort)}</span></a>
<script>${script.body}</script>
</body>
</html>
`;
}
