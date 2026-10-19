/**
 * Lead backend for margaritaturealtor.com: a Cloudflare Worker with a D1
 * database. Standard Web APIs only, no npm packages.
 *
 *   POST /api/subscribe    guide / welcome popup: {name, email, lang, source, page}
 *   POST /api/lead         "Work with me" intake: {brief, fields}
 *   GET  /api/unsubscribe  ?t=<token> from the link in any email
 *
 * Every lead is saved first; telling Margarita is best effort after the save,
 * so a mail outage never loses a lead. A filled-in `website` field is the
 * honeypot: bots get a 200 and nothing is stored.
 *
 * The site switches to this API by setting api.leads / api.subscribe in
 * data/identity.json. Until then the forms fall back to email/WhatsApp.
 */

const MAX_BODY = 20_000;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const clip = (v, n = 200) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

export function d1Store(db) {
  return {
    async saveSubscriber(s) {
      // Re-subscribing an address that unsubscribed turns it back on.
      await db
        .prepare(
          `INSERT INTO subscribers (id, email, name, lang, source, page, token, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
           ON CONFLICT(email) DO UPDATE SET name = excluded.name, lang = excluded.lang, unsubscribed_at = NULL`,
        )
        .bind(s.id, s.email, s.name, s.lang, s.source, s.page, s.token, s.createdAt)
        .run();
      return db.prepare('SELECT token FROM subscribers WHERE email = ?1').bind(s.email).first();
    },
    async saveLead(l) {
      await db
        .prepare('INSERT INTO leads (id, created_at, name, email, phone, goal, lang, page, brief, fields) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)')
        .bind(l.id, l.createdAt, l.name, l.email, l.phone, l.goal, l.lang, l.page, l.brief, l.fields)
        .run();
    },
    async unsubscribe(token, at) {
      const r = await db.prepare('UPDATE subscribers SET unsubscribed_at = ?2 WHERE token = ?1 AND unsubscribed_at IS NULL').bind(token, at).run();
      return (r.meta?.changes ?? r.changes ?? 0) > 0;
    },
  };
}

/** Sends Margarita a plain-text note through Resend. No key = no email (the lead is still saved). */
export function resendNotifier(env, fetchImpl = fetch) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_TO || !env.NOTIFY_FROM) return null;
  return async ({ subject, text, replyTo }) => {
    const r = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.NOTIFY_FROM, to: [env.NOTIFY_TO], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!r.ok) throw new Error(`resend ${r.status}`);
  };
}

export function createHandler({ store, notify = null, origins = [], now = () => new Date(), id = () => crypto.randomUUID(), waitUntil = (p) => p }) {
  const cors = (origin) =>
    origin && origins.includes(origin)
      ? { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', vary: 'origin' }
      : {};
  const json = (status, body, origin) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...cors(origin) } });
  const tell = (msg) => {
    if (!notify) return;
    waitUntil(Promise.resolve().then(() => notify(msg)).catch(() => {}));
  };

  async function readBody(req) {
    const text = await req.text();
    if (text.length > MAX_BODY) return null;
    try {
      const v = JSON.parse(text);
      return v && typeof v === 'object' ? v : null;
    } catch {
      return null;
    }
  }

  return async function handle(req) {
    const url = new URL(req.url);
    const origin = req.headers.get('origin');

    if (req.method === 'OPTIONS') return new Response(null, { status: origins.includes(origin) ? 204 : 403, headers: cors(origin) });

    if (req.method === 'GET' && url.pathname === '/api/unsubscribe') {
      const t = clip(url.searchParams.get('t'), 80);
      const done = t ? await store.unsubscribe(t, now().toISOString()) : false;
      const msg = done || t ? 'You are unsubscribed. / Se ha dado de baja.' : 'This link is not valid. / Este enlace no es válido.';
      return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Margarita Cuesta</title><p style="font:18px/1.5 system-ui;max-width:32em;margin:15vh auto;padding:0 16px">${msg}</p>`, {
        status: t ? 200 : 400,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }

    if (req.method !== 'POST') return json(405, { ok: false, error: 'method' }, origin);
    // Browsers always send Origin on a cross-site POST; anything else is not our form.
    if (!origins.includes(origin)) return json(403, { ok: false, error: 'origin' }, origin);
    const body = await readBody(req);
    if (!body) return json(400, { ok: false, error: 'body' }, origin);
    if (clip(body.website)) return json(200, { ok: true }, origin);

    const createdAt = now().toISOString();

    if (url.pathname === '/api/subscribe') {
      const email = clip(body.email, 254).toLowerCase();
      if (!EMAIL.test(email)) return json(422, { ok: false, error: 'email' }, origin);
      const s = { id: id(), email, name: clip(body.name, 80), lang: body.lang === 'es' ? 'es' : 'en', source: clip(body.source, 40) || 'guide', page: clip(body.page, 200), token: id(), createdAt };
      await store.saveSubscriber(s);
      tell({ subject: `New guide download: ${s.name || s.email}`, text: `${s.name || '(no name)'} <${s.email}>\nLanguage: ${s.lang}\nFrom: ${s.source} on ${s.page || '/'}\n\nThey downloaded the buyer toolkit. Reply to this email to reach them.`, replyTo: s.email });
      return json(200, { ok: true }, origin);
    }

    if (url.pathname === '/api/lead') {
      const f = body.fields && typeof body.fields === 'object' ? body.fields : {};
      const brief = clip(body.brief, 8000);
      const email = clip(f.email, 254).toLowerCase();
      const phone = clip(f.phone, 40);
      if (!brief || (!EMAIL.test(email) && phone.replace(/\D/g, '').length < 7)) return json(422, { ok: false, error: 'contact' }, origin);
      const name = `${clip(f.firstName, 80)} ${clip(f.lastName, 80)}`.trim();
      const fields = JSON.stringify(Object.fromEntries(Object.entries(f).slice(0, 60).map(([k, v]) => [clip(k, 40), clip(String(v), 2000)])));
      await store.saveLead({ id: id(), createdAt, name, email, phone, goal: clip(f.goal, 20), lang: f.lang === 'es' ? 'es' : 'en', page: clip(f.page, 200), brief, fields });
      tell({ subject: `New client intake: ${name || email || phone} (${clip(f.goal, 20) || 'goal not given'})`, text: brief, replyTo: EMAIL.test(email) ? email : undefined });
      return json(200, { ok: true }, origin);
    }

    return json(404, { ok: false, error: 'route' }, origin);
  };
}

export default {
  fetch(req, env, ctx) {
    const origins = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    return createHandler({ store: d1Store(env.DB), notify: resendNotifier(env), origins, waitUntil: (p) => ctx.waitUntil(p) })(req);
  },
};
