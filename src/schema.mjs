/**
 * The JSON-LD graph. Same rule as danielcuesta007.com's identity.ts: Margarita
 * is defined ONCE, as the node at PERSON_ID, and everything else points at it
 * by @id. Two Person objects named "Margarita Cuesta" would be two half-entities
 * to a crawler, splitting the evidence between them.
 *
 * Shape of the graph:
 *   Person (#margarita) ── worksFor ──▶ Organization (#team) ── parentOrganization ──▶ The Insight Group
 *        ▲
 *        └── employee ── RealEstateAgent (#agent)   (the LocalBusiness Google reads for local results)
 *   WebSite (#website) ── about ──▶ Person
 *   WebPage (per language) ── about ──▶ Person, mainEntity ──▶ FAQPage
 */

export function ids(site) {
  return {
    person: `${site}/#margarita`,
    agent: `${site}/#agent`,
    team: `${site}/#team`,
    firm: `${site}/#insight-group`,
    website: `${site}/#website`,
  };
}

export function buildGraph(identity, copy, { faq }) {
  const site = identity.site;
  const id = ids(site);
  const lang = copy.lang;
  const pageUrl = `${site}${copy.path}`;
  const team = identity.team;
  const address = {
    '@type': 'PostalAddress',
    streetAddress: team.address.street,
    addressLocality: team.address.locality,
    addressRegion: team.address.region,
    postalCode: team.address.postalCode,
    addressCountry: team.address.country,
  };
  const areaServed = identity.areaServed.map((name) => ({ '@type': 'Place', name }));
  const languages = [
    { '@type': 'Language', name: 'English', alternateName: 'en' },
    { '@type': 'Language', name: 'Spanish', alternateName: 'es' },
  ];

  const person = {
    '@type': 'Person',
    '@id': id.person,
    name: identity.name,
    alternateName: identity.alternateNames,
    jobTitle: identity.jobTitle[lang],
    description: identity.description[lang],
    url: `${site}/`,
    image: `${site}/${identity.images.portrait}`,
    email: `mailto:${identity.contact.email}`,
    telephone: identity.contact.phoneE164,
    knowsLanguage: languages,
    worksFor: { '@id': id.team },
    workLocation: { '@type': 'Place', name: 'Raleigh, North Carolina', address },
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      name: `${identity.license.state} Real Estate Broker License`,
      credentialCategory: 'license',
      identifier: identity.license.number,
      recognizedBy: { '@type': 'GovernmentOrganization', name: identity.license.issuer, url: identity.license.issuerUrl },
    },
    alumniOf: identity.education.map((e) => ({ '@type': 'CollegeOrUniversity', name: e.name, address: e.place })),
    award: identity.awards.map((a) => `${a.en} (${a.year})`),
    sameAs: identity.profiles.map((p) => p.url),
  };

  const agent = {
    '@type': 'RealEstateAgent',
    '@id': id.agent,
    name: `${identity.name}, ${identity.firm.displayWithTeam}`,
    url: `${site}/`,
    image: `${site}/${identity.images.portrait}`,
    telephone: identity.contact.phoneE164,
    email: identity.contact.email,
    address,
    areaServed,
    knowsLanguage: languages,
    employee: { '@id': id.person },
    parentOrganization: { '@id': id.team },
  };

  const teamNode = {
    '@type': 'Organization',
    '@id': id.team,
    name: team.name,
    url: team.url,
    telephone: team.phoneE164,
    address,
    parentOrganization: { '@id': id.firm },
  };

  const firm = { '@type': 'Organization', '@id': id.firm, name: identity.firm.name, brand: identity.firm.brand };

  const website = {
    '@type': 'WebSite',
    '@id': id.website,
    url: `${site}/`,
    name: identity.name,
    inLanguage: ['en-US', 'es-US'],
    about: { '@id': id.person },
    publisher: { '@id': id.person },
  };

  const faqPage = {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: faq.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const page = {
    '@type': ['WebPage', 'ProfilePage'],
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: copy.title,
    description: copy.metaDescription,
    inLanguage: copy.htmlLang,
    isPartOf: { '@id': id.website },
    about: { '@id': id.person },
    mainEntity: { '@id': id.person },
    primaryImageOfPage: `${site}/${identity.images.portrait}`,
    hasPart: { '@id': `${pageUrl}#faq` },
  };

  return { '@context': 'https://schema.org', '@graph': [person, agent, teamNode, firm, website, page, faqPage] };
}
