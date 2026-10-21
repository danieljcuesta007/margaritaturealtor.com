/**
 * The free buyer toolkit, in both languages: the ten mistakes plus four
 * working tools (cash to close, monthly cost, tour scorecard, offer-to-keys). Original text (not the
 * Buffini "10 Deadly Mistakes" piece, which is licensed material).
 * scripts/make-guide.mjs renders this to PDF in assets/guides/.
 * North Carolina specifics (due diligence fee, NC Home Advantage, written
 * buyer agreements) are stated generally and carry a not-legal-advice note.
 */
export const GUIDE = {
  en: {
    title: 'Before you buy',
    subtitle: '10 costly mistakes Triangle home buyers make, and how to avoid them',
    intro:
      'Buying in Raleigh, Durham and the Triangle moves fast, and North Carolina does a few things differently from other states. These are the mistakes I see cost buyers the most money, stress and time, with what to do instead.',
    items: [
      ['Shopping before you are pre-approved', 'Sellers here expect a pre-approval letter with your offer. Without one, you can fall in love with a home and lose it to a buyer who was ready. Get pre-approved first so you also know your real budget.'],
      ['Talking to only one lender', 'Rates, fees and programs vary from lender to lender. Ask two or three for a Loan Estimate, the standard three-page form, and compare them line by line.'],
      ['Missing help for first-time buyers', 'The NC Housing Finance Agency offers the NC Home Advantage Mortgage with down payment assistance for eligible buyers, and some Triangle cities run their own programs. Ask your lender which ones you qualify for.'],
      ['Forgetting the cash you need besides the down payment', 'In North Carolina you usually pay a due diligence fee and an earnest money deposit soon after your offer is accepted, then closing costs, the inspection and the appraisal. Budget for all of it from the start.'],
      ['Not understanding the due diligence period', 'The standard North Carolina offer gives you a due diligence period to inspect, appraise and finalize your loan. You can walk away during it for any reason, but the due diligence fee is generally not refundable. Use every day of it.'],
      ['Skipping or rushing the inspection', 'A home can look perfect and still hide roof, plumbing or moisture problems. Inspect during due diligence, read the full report, and decide what to ask the seller to repair.'],
      ['Looking at the price instead of the monthly payment', 'Property taxes change by county and city, and insurance, HOA dues and mortgage insurance all add up. Compare homes by their full monthly cost, not just the list price.'],
      ['Ignoring the HOA rules', 'Many Triangle neighborhoods have an HOA. Read the rules and fees before you commit: rental limits, fences, parking, paint colors and special assessments can all affect you.'],
      ['Changing your finances before closing', 'A new car, a new credit card, a job change or large unexplained deposits can delay or even stop your loan. Keep everything steady until you have the keys.'],
      ['Going it alone, or not reading your buyer agreement', 'Since August 2024, buyers sign a written agreement with their agent before touring homes. Read it, ask how your agent is paid, and remember the terms are negotiable. A good agent explains every line.'],
    ],
    kit: {
      title: 'The Triangle Home Buyer’s Toolkit',
      subtitle: 'Ten mistakes to avoid, two worksheets, a scorecard and the road from offer to keys',
      contents: ['10 costly mistakes', 'Cash-to-close worksheet', 'True monthly cost', 'Home-tour scorecard', 'From offer to keys'],
      estimate: 'Estimate',
      actual: 'Actual',
      total: 'Total',
    },
    cash: {
      title: 'Cash-to-close worksheet',
      intro: 'The down payment is only part of the cash you need. Fill in your lender’s Loan Estimate numbers, then the real ones as they come in.',
      rows: ['Down payment', 'Due diligence fee (paid to the seller, usually credited back at closing)', 'Earnest money deposit (held in trust, usually credited back at closing)', 'Home inspection, plus any specialist inspections', 'Appraisal', 'Closing attorney', 'Lender fees and points', 'Title insurance', 'Prepaid taxes, insurance and escrow', 'HOA transfer or start-up fees', 'Moving and first repairs', 'Cushion for surprises'],
      note: 'Due diligence and earnest money are due within days of an accepted offer, long before closing. Have that cash ready when you start making offers.',
    },
    monthly: {
      title: 'True monthly cost',
      intro: 'Compare homes by what they cost every month, not by the list price.',
      rows: ['Principal and interest', 'Property tax (county + city rate × value ÷ 12)', 'Homeowners insurance', 'Mortgage insurance, if any', 'HOA dues', 'Utilities: power, water, gas, internet', 'Maintenance set-aside'],
      note: 'Measure the total against your take-home pay, not the most a lender will approve.',
    },
    score: {
      title: 'Home-tour scorecard',
      intro: 'Score each home 1 to 5 right after you see it, before the details blur together.',
      homes: ['Home A', 'Home B', 'Home C'],
      address: 'Address',
      rows: ['Commute', 'Layout and space', 'Kitchen', 'Bedrooms and storage', 'Yard and outdoor space', 'Roof, heating/AC and water heater age', 'Light and noise', 'Nearby shops, parks and services', 'HOA rules and dues', 'Monthly cost fits my plan'],
      notes: 'What I loved / what worried me',
    },
    steps: {
      title: 'From offer to keys',
      items: [
        ['Get pre-approved', 'Know your budget and have the letter ready to send with an offer.'],
        ['Sign a buyer agreement and tour', 'Read it, ask how your agent is paid, then see homes.'],
        ['Make an offer', 'Price, due diligence fee, earnest money, due diligence date and closing date are all negotiable.'],
        ['Offer accepted', 'Pay the due diligence fee to the seller and the earnest money deposit into trust.'],
        ['Due diligence period', 'Inspect, appraise, review the HOA, finish your loan and negotiate repairs. You can still walk away.'],
        ['Final loan approval', 'You receive your Closing Disclosure at least three business days before closing. Compare it with your Loan Estimate.'],
        ['Final walk-through', 'Check agreed repairs and that the home is in the condition you expect.'],
        ['Closing', 'Sign with the closing attorney. Once the deed is recorded, the keys are yours.'],
      ],
    },
    closeTitle: 'You do not have to figure this out alone.',
    closeBody: 'I walk families through every one of these steps, in English or Spanish. Tell me about your plans and I will prepare options before we even meet.',
    cta: 'Start at margaritaturealtor.com/work-with-me',
    disclaimer: 'General information only, not legal, tax or financial advice. Program rules and contract terms change; confirm details with your lender and your closing attorney.',
  },
  es: {
    title: 'Antes de comprar',
    subtitle: '10 errores costosos de los compradores en el Triángulo, y cómo evitarlos',
    intro:
      'Comprar en Raleigh, Durham y el Triángulo va rápido, y Carolina del Norte hace algunas cosas distinto a otros estados. Estos son los errores que más dinero, estrés y tiempo les cuestan a los compradores, y qué hacer en su lugar.',
    items: [
      ['Buscar casa antes de tener la preaprobación', 'Aquí los vendedores esperan una carta de preaprobación con su oferta. Sin ella, puede enamorarse de una casa y perderla ante un comprador que sí estaba listo. Obtenga la preaprobación primero para conocer también su presupuesto real.'],
      ['Hablar con un solo prestamista', 'Las tasas, los costos y los programas cambian de un prestamista a otro. Pida a dos o tres un Loan Estimate, el formulario estándar de tres páginas, y compárelos línea por línea.'],
      ['No aprovechar la ayuda para compradores de primera vivienda', 'La NC Housing Finance Agency ofrece la hipoteca NC Home Advantage con asistencia para el pago inicial a compradores que califican, y algunas ciudades del Triángulo tienen sus propios programas. Pregunte a su prestamista para cuáles califica.'],
      ['Olvidar el dinero que necesita además del pago inicial', 'En Carolina del Norte normalmente se paga un depósito de debida diligencia (due diligence fee) y un depósito de buena fe (earnest money) poco después de aceptada la oferta, y luego los costos de cierre, la inspección y el avalúo. Inclúyalo todo en su presupuesto desde el principio.'],
      ['No entender el periodo de debida diligencia', 'La oferta estándar de Carolina del Norte le da un periodo de debida diligencia para inspeccionar, hacer el avalúo y finalizar su préstamo. Durante ese tiempo puede retirarse por cualquier motivo, pero el depósito de debida diligencia por lo general no se devuelve. Aproveche cada día.'],
      ['Saltarse o apresurar la inspección', 'Una casa puede verse perfecta y esconder problemas de techo, plomería o humedad. Inspeccione durante la debida diligencia, lea el informe completo y decida qué reparaciones pedir al vendedor.'],
      ['Mirar el precio y no el pago mensual', 'Los impuestos a la propiedad cambian según el condado y la ciudad, y el seguro, las cuotas de la HOA y el seguro hipotecario suman. Compare las casas por su costo mensual total, no solo por el precio.'],
      ['Ignorar las reglas de la HOA', 'Muchos vecindarios del Triángulo tienen una asociación de propietarios (HOA). Lea sus reglas y cuotas antes de comprometerse: límites para rentar, cercas, estacionamiento, colores de pintura y cobros especiales pueden afectarle.'],
      ['Cambiar sus finanzas antes del cierre', 'Un carro nuevo, una tarjeta de crédito nueva, un cambio de trabajo o depósitos grandes sin explicación pueden retrasar o incluso detener su préstamo. Mantenga todo estable hasta tener las llaves.'],
      ['Hacerlo solo, o no leer su acuerdo de comprador', 'Desde agosto de 2024, los compradores firman un acuerdo por escrito con su agente antes de visitar casas. Léalo, pregunte cómo se le paga a su agente y recuerde que los términos son negociables. Un buen agente le explica cada línea.'],
    ],
    kit: {
      title: 'El kit del comprador en el Triángulo',
      subtitle: 'Diez errores que evitar, dos hojas de cálculo, una tarjeta de puntaje y el camino de la oferta a las llaves',
      contents: ['10 errores costosos', 'Dinero para el cierre', 'Costo mensual real', 'Tarjeta para visitas', 'De la oferta a las llaves'],
      estimate: 'Estimado',
      actual: 'Real',
      total: 'Total',
    },
    cash: {
      title: 'Hoja del dinero para el cierre',
      intro: 'El pago inicial es solo una parte del dinero que necesita. Anote los números del Loan Estimate de su prestamista y luego los reales a medida que lleguen.',
      rows: ['Pago inicial', 'Depósito de debida diligencia (se paga al vendedor; por lo general se acredita al cierre)', 'Depósito de buena fe (en fideicomiso; por lo general se acredita al cierre)', 'Inspección, y cualquier inspección especializada', 'Avalúo', 'Abogado de cierre', 'Costos del prestamista y puntos', 'Seguro de título', 'Impuestos, seguro y reserva (escrow) pagados por adelantado', 'Cuotas de traspaso o inicio de la HOA', 'Mudanza y primeras reparaciones', 'Reserva para imprevistos'],
      note: 'La debida diligencia y el depósito de buena fe se pagan a los pocos días de aceptada la oferta, mucho antes del cierre. Tenga ese dinero listo cuando empiece a ofertar.',
    },
    monthly: {
      title: 'Costo mensual real',
      intro: 'Compare las casas por lo que cuestan cada mes, no por el precio de venta.',
      rows: ['Capital e intereses', 'Impuesto a la propiedad (tasa del condado + ciudad × valor ÷ 12)', 'Seguro de la vivienda', 'Seguro hipotecario, si aplica', 'Cuotas de la HOA', 'Servicios: luz, agua, gas, internet', 'Reserva para mantenimiento'],
      note: 'Compare el total con su ingreso neto, no con lo máximo que un prestamista aprueba.',
    },
    score: {
      title: 'Tarjeta de puntaje para visitas',
      intro: 'Califique cada casa del 1 al 5 justo después de verla, antes de que los detalles se mezclen.',
      homes: ['Casa A', 'Casa B', 'Casa C'],
      address: 'Dirección',
      rows: ['Tiempo al trabajo', 'Distribución y espacio', 'Cocina', 'Habitaciones y almacenamiento', 'Patio y espacio exterior', 'Edad del techo, calefacción/aire y calentador', 'Luz y ruido', 'Tiendas, parques y servicios cerca', 'Reglas y cuotas de la HOA', 'El costo mensual cabe en mi plan'],
      notes: 'Lo que me encantó / lo que me preocupó',
    },
    steps: {
      title: 'De la oferta a las llaves',
      items: [
        ['Obtenga la preaprobación', 'Conozca su presupuesto y tenga la carta lista para enviar con una oferta.'],
        ['Firme el acuerdo de comprador y visite casas', 'Léalo, pregunte cómo se le paga a su agente y luego vea casas.'],
        ['Haga una oferta', 'El precio, el depósito de debida diligencia, el de buena fe, la fecha de debida diligencia y la de cierre se negocian.'],
        ['Oferta aceptada', 'Pague el depósito de debida diligencia al vendedor y el de buena fe en fideicomiso.'],
        ['Periodo de debida diligencia', 'Inspeccione, haga el avalúo, revise la HOA, termine su préstamo y negocie reparaciones. Todavía puede retirarse.'],
        ['Aprobación final del préstamo', 'Recibe su Closing Disclosure al menos tres días hábiles antes del cierre. Compárelo con su Loan Estimate.'],
        ['Recorrido final', 'Revise las reparaciones acordadas y que la casa esté como espera.'],
        ['Cierre', 'Firme con el abogado de cierre. Cuando se registra la escritura, las llaves son suyas.'],
      ],
    },
    closeTitle: 'No tiene que resolver esto solo.',
    closeBody: 'Acompaño a las familias en cada uno de estos pasos, en español o en inglés. Cuénteme sus planes y le preparo opciones antes de reunirnos.',
    cta: 'Empiece en margaritaturealtor.com/es/trabajar-conmigo',
    disclaimer: 'Información general, no es asesoría legal, fiscal ni financiera. Las reglas de los programas y los términos de los contratos cambian; confirme los detalles con su prestamista y su abogado de cierre.',
  },
};
