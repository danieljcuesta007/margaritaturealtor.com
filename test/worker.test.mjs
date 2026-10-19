/**
 * The lead backend (worker/src/index.mjs) against a real SQLite database:
 * node:sqlite behind a thin D1-shaped adapter, so the SQL in d1Store is
 * exercised, not mocked. Only Resend (the network) is faked.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHandler, d1Store, resendNotifier } from '../worker/src/index.mjs';

let sqlite;
try { sqlite = await import('node:sqlite'); } catch {}
const skip = sqlite ? false : 'node:sqlite not available';

function fakeD1() {
  const db = new sqlite.DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../worker/schema.sql', import.meta.url), 'utf8'));
  const prep = (sql) => {
    const st = db.prepare(sql);
    return {
      bind: (...a) => ({
        run: async () => ({ meta: { changes: Number(st.run(...a).changes) } }),
        first: async () => st.get(...a) ?? null,
      }),
    };
  };
  return { prepare: prep, raw: db };
}

const SITE = 'https://www.margaritaturealtor.com';
function setup({ notify, limiter } = {}) {
  const db = fakeD1();
  const sent = [];
  let n = 0;
  const handle = createHandler({
    store: d1Store(db),
    notify: notify ?? (async (m) => sent.push(m)),
    origins: [SITE],
    limiter,
    now: () => new Date('2026-10-19T12:00:00Z'),
    id: () => `id-${++n}`,
  });
  const post = (path, body, origin = SITE) =>
    handle(new Request(`https://api.example${path}`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) }));
  return { db: db.raw, sent, handle, post };
}

test('a guide signup is saved, Margarita is told, and the reply goes to the visitor', { skip }, async () => {
  const { db, sent, post } = setup();
  const r = await post('/api/subscribe', { name: 'Ana', email: ' Ana@Example.com ', lang: 'es', source: 'welcome', page: '/es/' });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('access-control-allow-origin'), SITE);
  const row = db.prepare('SELECT * FROM subscribers').get();
  assert.equal(row.email, 'ana@example.com');
  assert.equal(row.lang, 'es');
  await new Promise((r) => setTimeout(r));
  assert.equal(sent.length, 1);
  assert.equal(sent[0].replyTo, 'ana@example.com');
});

test('signing up twice keeps one row, and re-subscribing undoes an unsubscribe', { skip }, async () => {
  const { db, post, handle } = setup();
  await post('/api/subscribe', { email: 'a@b.co' });
  const { token } = db.prepare('SELECT token FROM subscribers').get();
  const look = await handle(new Request(`https://api.example/api/unsubscribe?t=${token}`));
  assert.equal(look.status, 200);
  assert.equal(db.prepare('SELECT unsubscribed_at FROM subscribers').get().unsubscribed_at, null, 'a GET (mail scanner) changes nothing');
  const u = await handle(new Request(`https://api.example/api/unsubscribe?t=${token}`, { method: 'POST' }));
  assert.equal(u.status, 200);
  assert.ok(db.prepare('SELECT unsubscribed_at FROM subscribers').get().unsubscribed_at);
  const bogus = await handle(new Request('https://api.example/api/unsubscribe?t=not-a-token', { method: 'POST' }));
  assert.equal(bogus.status, 404, 'a made-up token is not reported as success');
  await post('/api/subscribe', { email: 'A@b.co' });
  const rows = db.prepare('SELECT * FROM subscribers').all();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].unsubscribed_at, null);
});

test('bad input is refused and nothing is stored', { skip }, async () => {
  const { db, post } = setup();
  assert.equal((await post('/api/subscribe', { email: 'not-an-email' })).status, 422);
  assert.equal((await post('/api/subscribe', '{oops')).status, 400);
  assert.equal((await post('/api/subscribe', { email: 'x'.repeat(30000) + '@a.co' })).status, 400);
  assert.equal((await post('/api/subscribe', { email: 'a@b.co' }, 'https://evil.example')).status, 403);
  assert.equal((await post('/api/lead', { brief: '', fields: { email: 'a@b.co' } })).status, 422);
  assert.equal((await post('/api/lead', { brief: 'hi', fields: {} })).status, 422);
  assert.equal(db.prepare('SELECT count(*) n FROM subscribers').get().n, 0);
  assert.equal(db.prepare('SELECT count(*) n FROM leads').get().n, 0);
});

test('the honeypot answers 200 and stores nothing', { skip }, async () => {
  const { db, sent, post } = setup();
  const r = await post('/api/subscribe', { email: 'bot@spam.co', mc_trap: 'http://spam' });
  assert.equal(r.status, 200);
  assert.equal(db.prepare('SELECT count(*) n FROM subscribers').get().n, 0);
  assert.equal(sent.length, 0);
});

test('an intake is saved with its brief even when the notification fails', { skip }, async () => {
  const { db, post } = setup({ notify: async () => { throw new Error('mail down'); } });
  const r = await post('/api/lead', { brief: '== You ==\nFirst name: Ana', fields: { firstName: 'Ana', lastName: 'R', phone: '(919) 555-0100', goal: 'buy', lang: 'en', page: '/work-with-me/' } });
  assert.equal(r.status, 200);
  const row = db.prepare('SELECT * FROM leads').get();
  assert.equal(row.name, 'Ana R');
  assert.equal(row.goal, 'buy');
  assert.match(row.brief, /First name: Ana/);
  assert.equal(JSON.parse(row.fields).phone, '(919) 555-0100');
});

test('CORS preflight only answers the site itself', { skip }, async () => {
  const { handle } = setup();
  const ok = await handle(new Request('https://api.example/api/lead', { method: 'OPTIONS', headers: { origin: SITE } }));
  assert.equal(ok.status, 204);
  const no = await handle(new Request('https://api.example/api/lead', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } }));
  assert.equal(no.status, 403);
  assert.equal(no.headers.get('access-control-allow-origin'), null);
});

test('no Resend key means no notifier; with one, it posts to Resend', async () => {
  assert.equal(resendNotifier({}), null);
  const calls = [];
  const n = resendNotifier({ RESEND_API_KEY: 'k', NOTIFY_TO: 'm@x.co', NOTIFY_FROM: 'w@x.co' }, async (url, init) => (calls.push([url, JSON.parse(init.body)]), { ok: true }));
  await n({ subject: 's', text: 't', replyTo: 'v@x.co' });
  assert.equal(calls[0][0], 'https://api.resend.com/emails');
  assert.deepEqual(calls[0][1].to, ['m@x.co']);
  assert.equal(calls[0][1].reply_to, 'v@x.co');
});

test('Margarita is emailed once per new address, not on every repeat sign-up', { skip }, async () => {
  const { sent, post } = setup();
  for (let i = 0; i < 3; i++) await post('/api/subscribe', { email: 'same@x.co' });
  await new Promise((r) => setTimeout(r));
  assert.equal(sent.length, 1);
});

test('the rate limiter turns a flood away before anything is stored', { skip }, async () => {
  let n = 0;
  const { db, post } = setup({ limiter: { limit: async () => ({ success: ++n <= 2 }) } });
  const codes = [];
  for (let i = 0; i < 4; i++) codes.push((await post('/api/lead', { brief: 'x', fields: { email: `a${i}@b.co` } })).status);
  assert.deepEqual(codes, [200, 200, 429, 429]);
  assert.equal(db.prepare('SELECT count(*) n FROM leads').get().n, 2);
});

test('a body declared larger than the limit is refused unread', { skip }, async () => {
  const { handle } = setup();
  const r = await handle(new Request('https://api.example/api/subscribe', { method: 'POST', headers: { origin: SITE, 'content-length': '999999' }, body: '{}' }));
  assert.equal(r.status, 400);
});
