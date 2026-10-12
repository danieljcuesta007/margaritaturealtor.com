/**
 * The free lead-magnet guide, in both languages. Original text (not the
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
    closeTitle: 'You do not have to figure this out alone.',
    closeBody: 'I walk families through every one of these steps, in English or Spanish. Tell me about your plans and I will prepare options before we even meet.',
    cta: 'Start at margaritacuesta.com/work-with-me',
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
    closeTitle: 'No tiene que resolver esto solo.',
    closeBody: 'Acompaño a las familias en cada uno de estos pasos, en español o en inglés. Cuénteme sus planes y le preparo opciones antes de reunirnos.',
    cta: 'Empiece en margaritacuesta.com/es/trabajar-conmigo',
    disclaimer: 'Información general, no es asesoría legal, fiscal ni financiera. Las reglas de los programas y los términos de los contratos cambian; confirme los detalles con su prestamista y su abogado de cierre.',
  },
};
