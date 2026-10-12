/**
 * The JSON-LD graph. Same rule as danielcuesta007.com's identity.ts: Margarita
 * is defined ONCE, as the node at #margarita, and everything else points at it
 * by @id. Two Person objects named "Margarita Cuesta" would be two
 * half-entities to a crawler, splitting the evidence between them.
 *
 *   Person (#margarita) -- worksFor --> Organization (#team) -- parentOrganization --> The Insight Group
 *   RealEstateAgent (#agent) -- employee --> Person   (the LocalBusiness that local search reads)
 *   WebSite -- about --> Person;  each WebPage -- about/mainEntity --> Person
 *   Event (open house) -- organizer --> Person
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

export function buildGraph(identity, copy, { page = 'home', listings = [], now = new Date() } = {}) {
  const site = identity.site;
  const id = ids(site);
  const lang = copy.lang;
  const pageUrl = `${site}${copy.paths[page]}`;
  const team = identity.team;
  const address = {
    '@type': 'PostalAddress',
    streetAddress: team.address.street,
    addressLocality: team.address.locality,
    addressRegion: team.address.region,
    postalCode: team.address.postalCode,
    addressCountry: team.address.country,
  };
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
    email: identity.contact.email,
    telephone: identity.contact.phoneE164,
    knowsLanguage: languages,
    worksFor: { '@id': id.team },
    hasCredential: [
      {
        '@type': 'EducationalOccupationalCredential',
        name: `${identity.license.state} Real Estate Broker License`,
        credentialCategory: 'license',
        identifier: identity.license.number,
        recognizedBy: { '@type': 'GovernmentOrganization', name: identity.license.issuer, url: identity.license.issuerUrl },
      },
      ...identity.credentials.map((c) => ({ '@type': 'EducationalOccupationalCredential', name: c.en, credentialCategory: 'certification' })),
    ],
    alumniOf: identity.education.map((e) => ({ '@type': 'CollegeOrUniversity', name: e.name, address: e.place })),
    sameAs: identity.profiles.map((p) => p.url),
  };

  const agent = {
    '@type': 'RealEstateAgent',
    '@id': id.agent,
    name: `${identity.name}, REALTOR®`,
    url: `${site}/`,
    image: `${site}/${identity.images.portrait}`,
    telephone: identity.contact.phoneE164,
    email: identity.contact.email,
    address,
    areaServed: identity.areaServed.map((name) => ({ '@type': 'Place', name })),
    knowsLanguage: languages,
    employee: { '@id': id.person },
    parentOrganization: { '@id': id.team },
  };

  const teamNode = { '@type': 'Organization', '@id': id.team, name: team.name, telephone: team.phoneE164, address, parentOrganization: { '@id': id.firm } };
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

  const webPage = {
    '@type': page === 'work' ? ['WebPage', 'ContactPage'] : ['WebPage', 'ProfilePage'],
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: page === 'work' ? copy.work.title : copy.title,
    inLanguage: copy.htmlLang,
    isPartOf: { '@id': id.website },
    about: { '@id': id.person },
    mainEntity: { '@id': id.person },
  };

  const events =
    page !== 'home'
      ? []
      : listings
          .filter((l) => l.status === 'active')
          .flatMap((l) =>
            (l.openHouses || [])
              .filter((oh) => new Date(oh.end) > now)
              .map((oh) => ({
                '@type': 'Event',
                name: `${lang === 'es' ? 'Casa abierta' : 'Open house'}: ${l.address}, ${l.locality}`,
                startDate: oh.start,
                endDate: oh.end,
                eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
                eventStatus: 'https://schema.org/EventScheduled',
                image: `${site}/${l.photos[0]}`,
                description: l.highlights[lang],
                location: {
                  '@type': 'Place',
                  name: l.address,
                  address: { '@type': 'PostalAddress', streetAddress: l.address, addressLocality: l.locality, addressRegion: l.region, postalCode: l.postalCode, addressCountry: 'US' },
                },
                organizer: { '@id': id.person },
                isAccessibleForFree: true,
              })),
          );

  return { '@context': 'https://schema.org', '@graph': [person, agent, teamNode, firm, website, webPage, ...events] };
}
