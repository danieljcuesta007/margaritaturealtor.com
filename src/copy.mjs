/**
 * Every visible word on the site, in both languages, side by side so the two
 * versions cannot drift apart. Facts (names, numbers, awards) are NOT written
 * here: they come from data/identity.json and are dropped in by render.mjs.
 *
 * Spanish uses "usted": most of Margarita's Spanish-speaking clients are
 * meeting her for the first time about the largest purchase of their lives.
 */

export const COPY = {
  en: {
    lang: 'en',
    path: '/',
    htmlLang: 'en-US',
    locale: 'en_US',
    otherLabel: 'Español',
    title: 'Margarita Cuesta | Bilingual Real Estate Broker in Raleigh, NC',
    metaDescription:
      'Margarita Cuesta is a bilingual (English and Spanish) real estate broker with the Corrales Real Estate Team with The Insight Group, helping buyers and sellers in Raleigh, Durham, Cary, Apex and the Triangle.',
    skip: 'Skip to content',
    nav: { about: 'About', buy: 'Buying', sell: 'Selling', sold: 'Sold', contact: 'Contact' },
    themeLabel: 'Switch light or dark mode',
    callShort: 'Call',
    hero: {
      eyebrow: 'Real Estate Broker · Raleigh, NC',
      title: 'A steady hand for the biggest move of your life.',
      lede:
        'Margarita Cuesta helps families buy, sell and invest across Raleigh, Durham and the Triangle, with a clear plan, honest numbers and every conversation in English or Spanish.',
      ctaCall: 'Call or text',
      ctaWhatsapp: 'WhatsApp',
      ctaSearch: 'Search homes',
      badge: 'English · Español',
    },
    stats: { heading: 'The team behind every closing', note: 'Corrales Real Estate Team, as reported by the team.' },
    about: {
      heading: 'Meet Margarita',
      paras: [
        'Margarita is a real estate broker and REALTOR® on the Corrales Real Estate Team with The Insight Group in Raleigh. She works with first-time buyers, growing families, sellers and investors, and she makes sure nobody signs anything they do not fully understand, in whichever language they think in.',
        'Before real estate, she spent more than twenty years in pharmaceutical planning and operations at Teva Pharmaceutical and ADMA Biologics, running production schedules for hundreds of products against hard deadlines. That is the discipline she brings to a transaction: every date tracked, every document ready, and a weekly update so you always know where you stand.',
      ],
      credentialsHeading: 'Credentials',
      licenseLabel: 'North Carolina real estate broker license',
    },
    services: {
      heading: 'How Margarita can help',
      items: [
        {
          id: 'buy',
          title: 'Buying a home',
          body: 'From your first budget conversation to the day you get your keys. Margarita connects you with trusted lenders, inspectors and attorneys, explains every step, and negotiates for you.',
          cta: 'Start your home search',
        },
        {
          id: 'sell',
          title: 'Selling a home',
          body: 'Pricing from real sold data, professional photography, a listing that reaches buyers in both languages, and steady communication from first showing to closing.',
          cta: 'What is my home worth?',
        },
        {
          id: 'invest',
          title: 'Investing',
          body: 'Rental and investment properties across the Triangle, analysed with the same care she would give her own family’s money.',
          cta: 'Talk about a strategy',
        },
      ],
    },
    steps: {
      heading: 'Your path to owning a home',
      intro: 'Eight steps, and Margarita walks every one of them with you.',
      items: [
        ['Work with a buyer’s agent', 'Someone on your side from day one.'],
        ['Figure out the money', 'Income, expenses and credit, to set a budget that feels comfortable.'],
        ['Get pre-approved', 'So you know exactly what you can afford before you fall in love with a house.'],
        ['Start house hunting', 'Tour the homes that fit your budget and your life.'],
        ['Make an offer', 'Terms and contingencies written to protect you.'],
        ['Home inspection', 'A professional checks the house for issues before you commit.'],
        ['Home appraisal', 'An independent estimate of what the home is worth.'],
        ['Closing day', 'Sign, celebrate, and receive your keys.'],
      ],
    },
    sold: {
      heading: 'Recently sold',
      label: 'Sold',
      withLabel: 'with',
      alt: 'Exterior of 304 Spring Street, a light blue single-story home in Durham, North Carolina',
      altInterior: 'Kitchen at 304 Spring Street with white cabinets and stainless steel appliances',
    },
    team: {
      heading: 'Part of a team that does this every day',
      body: 'Margarita is a broker on the Corrales Real Estate Team, led by Oscar Corrales and affiliated with The Insight Group. Working with her means a whole team behind your transaction: bilingual agents, a transaction coordinator and a network of lenders, inspectors and contractors across the Triangle.',
      cta: 'Visit the Corrales team',
    },
    faq: {
      heading: 'Questions people ask',
      items: [
        ['Does Margarita speak Spanish?', 'Yes. Margarita is fully bilingual in English and Spanish, and can guide you through the whole process, documents included, in either language.'],
        ['Which areas does she serve?', 'Raleigh, Durham, Cary, Apex and the wider Research Triangle region of North Carolina, including Wake County.'],
        ['Which brokerage is she with?', 'Margarita is a licensed North Carolina real estate broker (license #{license}) on the Corrales Real Estate Team with The Insight Group, at {office}.'],
        ['Can she help first-time buyers?', 'Yes. First-time buyers are a big part of her work. She explains each step, from pre-approval to closing, and connects you with lenders who fit your situation.'],
        ['How do I contact her?', 'Call or text {phone}, message her on WhatsApp, or email {email}.'],
      ],
    },
    contact: {
      heading: 'Let’s talk about your next move',
      intro: 'Call, text or WhatsApp is fastest. Or leave a few details and Margarita will get back to you.',
      call: 'Call',
      text: 'Text',
      whatsapp: 'WhatsApp',
      email: 'Email',
      form: {
        name: 'Your name',
        phone: 'Phone',
        email: 'Email',
        goal: 'I would like to',
        goals: ['Buy a home', 'Sell a home', 'Invest', 'Something else'],
        language: 'Preferred language',
        languages: ['English', 'Español'],
        message: 'Anything she should know?',
        submitEmail: 'Send by email',
        submitWhatsapp: 'Send on WhatsApp',
        subject: 'Website inquiry',
        note: 'This opens your email or WhatsApp app with your message ready to send. Nothing is stored on this site.',
      },
      whatsappGreeting: 'Hi Margarita, I found you through your website.',
    },
    footer: {
      licensed: 'Licensed real estate broker in North Carolina',
      licenseNo: 'License #',
      office: 'Office',
      eho: 'Equal Housing Opportunity',
      disclaimer: 'Information is deemed reliable but not guaranteed. Team figures are reported by the Corrales Real Estate Team.',
      verse: 'Surely goodness and mercy shall follow me all the days of my life.',
      verseRef: 'Psalm 23:6',
    },
  },

  es: {
    lang: 'es',
    path: '/es/',
    htmlLang: 'es-US',
    locale: 'es_US',
    otherLabel: 'English',
    title: 'Margarita Cuesta | Realtor que habla español en Raleigh, NC',
    metaDescription:
      'Margarita Cuesta es corredora de bienes raíces bilingüe (español e inglés) del Corrales Real Estate Team with The Insight Group. Ayuda a comprar y vender casa en Raleigh, Durham, Cary, Apex y el Triángulo.',
    skip: 'Ir al contenido',
    nav: { about: 'Sobre mí', buy: 'Comprar', sell: 'Vender', sold: 'Vendidas', contact: 'Contacto' },
    themeLabel: 'Cambiar a modo claro u oscuro',
    callShort: 'Llamar',
    hero: {
      eyebrow: 'Corredora de bienes raíces · Raleigh, NC',
      title: 'Una mano firme para el paso más grande de su vida.',
      lede:
        'Margarita Cuesta ayuda a familias a comprar, vender e invertir en Raleigh, Durham y todo el Triángulo, con un plan claro, números honestos y cada conversación en español o en inglés.',
      ctaCall: 'Llamar o escribir',
      ctaWhatsapp: 'WhatsApp',
      ctaSearch: 'Buscar casas',
      badge: 'Español · English',
    },
    stats: { heading: 'El equipo detrás de cada cierre', note: 'Corrales Real Estate Team, según datos del equipo.' },
    about: {
      heading: 'Conozca a Margarita',
      paras: [
        'Margarita es corredora de bienes raíces y REALTOR® del Corrales Real Estate Team with The Insight Group en Raleigh. Trabaja con compradores de primera vivienda, familias que crecen, vendedores e inversionistas, y se asegura de que nadie firme nada que no entienda por completo, en el idioma en que usted piensa.',
        'Antes de los bienes raíces, dedicó más de veinte años a la planificación y las operaciones farmacéuticas en Teva Pharmaceutical y ADMA Biologics, manejando calendarios de producción para cientos de productos con fechas límite estrictas. Esa es la disciplina que trae a cada transacción: cada fecha controlada, cada documento listo y una actualización semanal para que siempre sepa en qué punto está.',
      ],
      credentialsHeading: 'Credenciales',
      licenseLabel: 'Licencia de corredora de bienes raíces de Carolina del Norte',
    },
    services: {
      heading: 'Cómo le puede ayudar Margarita',
      items: [
        {
          id: 'buy',
          title: 'Comprar casa',
          body: 'Desde la primera conversación sobre su presupuesto hasta el día en que recibe las llaves. Margarita le conecta con prestamistas, inspectores y abogados de confianza, le explica cada paso y negocia por usted.',
          cta: 'Empezar a buscar casa',
        },
        {
          id: 'sell',
          title: 'Vender su casa',
          body: 'Un precio basado en ventas reales, fotografía profesional, un anuncio que llega a compradores en ambos idiomas y comunicación constante desde la primera visita hasta el cierre.',
          cta: '¿Cuánto vale mi casa?',
        },
        {
          id: 'invest',
          title: 'Invertir',
          body: 'Propiedades de alquiler e inversión en todo el Triángulo, analizadas con el mismo cuidado que ella daría al dinero de su propia familia.',
          cta: 'Hablar de una estrategia',
        },
      ],
    },
    steps: {
      heading: 'Su camino para ser dueño de casa',
      intro: 'Ocho pasos, y Margarita los recorre todos con usted.',
      items: [
        ['Trabaje con un agente de compradores', 'Alguien de su lado desde el primer día.'],
        ['Organice sus finanzas', 'Ingresos, gastos y crédito, para fijar un presupuesto cómodo.'],
        ['Obtenga la preaprobación', 'Para saber exactamente cuánto puede pagar antes de enamorarse de una casa.'],
        ['Empiece a buscar', 'Visite las casas que se ajustan a su presupuesto y a su vida.'],
        ['Haga una oferta', 'Términos y contingencias redactados para protegerle.'],
        ['Inspección de la casa', 'Un profesional revisa la casa antes de comprometerse.'],
        ['Avalúo', 'Una estimación independiente del valor de la casa.'],
        ['Día del cierre', 'Firme, celebre y reciba sus llaves.'],
      ],
    },
    sold: {
      heading: 'Vendidas recientemente',
      label: 'Vendida',
      withLabel: 'con',
      alt: 'Fachada de 304 Spring Street, una casa azul claro de un piso en Durham, Carolina del Norte',
      altInterior: 'Cocina de 304 Spring Street con gabinetes blancos y electrodomésticos de acero inoxidable',
    },
    team: {
      heading: 'Parte de un equipo que hace esto todos los días',
      body: 'Margarita es corredora del Corrales Real Estate Team, dirigido por Oscar Corrales y afiliado a The Insight Group. Trabajar con ella significa tener un equipo completo detrás de su transacción: agentes bilingües, una coordinadora de transacciones y una red de prestamistas, inspectores y contratistas en todo el Triángulo.',
      cta: 'Conocer al equipo Corrales',
    },
    faq: {
      heading: 'Preguntas frecuentes',
      items: [
        ['¿Margarita habla español?', 'Sí. Margarita es completamente bilingüe en español e inglés y puede guiarle en todo el proceso, documentos incluidos, en cualquiera de los dos idiomas.'],
        ['¿En qué áreas trabaja?', 'Raleigh, Durham, Cary, Apex y toda la región del Research Triangle en Carolina del Norte, incluido el condado de Wake.'],
        ['¿Con qué compañía trabaja?', 'Margarita es corredora de bienes raíces con licencia en Carolina del Norte (licencia #{license}) en el Corrales Real Estate Team with The Insight Group, {office}.'],
        ['¿Ayuda a quienes compran su primera casa?', 'Sí. Los compradores de primera vivienda son una gran parte de su trabajo. Le explica cada paso, desde la preaprobación hasta el cierre, y le conecta con prestamistas adecuados para su situación.'],
        ['¿Cómo me comunico con ella?', 'Llame o envíe un mensaje al {phone}, escríbale por WhatsApp o mande un correo a {email}.'],
      ],
    },
    contact: {
      heading: 'Hablemos de su próximo paso',
      intro: 'Llamar, enviar un mensaje o WhatsApp es lo más rápido. O deje sus datos y Margarita le responderá.',
      call: 'Llamar',
      text: 'Mensaje',
      whatsapp: 'WhatsApp',
      email: 'Correo',
      form: {
        name: 'Su nombre',
        phone: 'Teléfono',
        email: 'Correo electrónico',
        goal: 'Me gustaría',
        goals: ['Comprar casa', 'Vender mi casa', 'Invertir', 'Otra cosa'],
        language: 'Idioma preferido',
        languages: ['Español', 'English'],
        message: '¿Algo que ella deba saber?',
        submitEmail: 'Enviar por correo',
        submitWhatsapp: 'Enviar por WhatsApp',
        subject: 'Consulta desde el sitio web',
        note: 'Esto abre su correo o WhatsApp con el mensaje listo para enviar. Este sitio no guarda ningún dato.',
      },
      whatsappGreeting: 'Hola Margarita, la encontré por su sitio web.',
    },
    footer: {
      licensed: 'Corredora de bienes raíces con licencia en Carolina del Norte',
      licenseNo: 'Licencia #',
      office: 'Oficina',
      eho: 'Igualdad de oportunidades en la vivienda',
      disclaimer: 'La información se considera confiable pero no está garantizada. Las cifras del equipo son reportadas por el Corrales Real Estate Team.',
      verse: 'Ciertamente el bien y la misericordia me seguirán todos los días de mi vida.',
      verseRef: 'Salmo 23:6',
    },
  },
};

export const LANGS = Object.keys(COPY);
