/**
 * Drives the built site in headless Chrome through the DevTools protocol, to
 * test what static-HTML tests cannot: the intake steps, validation, the brief
 * Margarita receives, query-string prefill, and the guide popup.
 *
 * Stdlib only (Node 22+ global WebSocket). Skips if Chrome is not installed;
 * set CHROME=/path/to/chrome to point at one. GitHub's ubuntu runners have it.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../src/build.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME =
  process.env.CHROME ||
  ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
const skip = !CHROME || typeof WebSocket === 'undefined' ? 'Chrome or global WebSocket not available' : false;

let server, chrome, ws, origin, profile;
let seq = 0;
const pending = new Map();

function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => pending.set(id, { res, rej }));
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
async function open(path) {
  await send('Page.navigate', { url: origin + path });
  for (let i = 0; i < 100; i++) {
    if ((await evaluate('document.readyState')) === 'complete') return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`timeout loading ${path}`);
}

before(async () => {
  if (skip) return;
  const out = mkdtempSync(join(tmpdir(), 'mc-browser-'));
  build({ outDir: out, root: ROOT, now: new Date('2026-10-12T12:00:00-04:00') });
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };
  server = createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = join(out, p);
    if (!f.startsWith(out) || !existsSync(f)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' }).end(readFileSync(f));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  origin = `http://127.0.0.1:${server.address().port}`;

  profile = mkdtempSync(join(tmpdir(), 'mc-chrome-'));
  chrome = spawn(CHROME, [...(process.env.CI ? ['--no-sandbox'] : []), '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--remote-debugging-port=0', '--window-size=1280,900', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((res, rej) => {
    let buf = '';
    chrome.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) res(m[1]);
    });
    setTimeout(() => rej(new Error('Chrome did not start')), 15000);
  });
  const port = new URL(wsUrl).port;
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result);
  };
  await send('Page.enable');
  await send('Runtime.enable');
  // Never let a test open the mail app or a window: record instead.
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.__opened=[]; window.open=function(u){window.__opened.push(u)};
             window.__posts=[]; window.fetch=function(u,o){window.__posts.push({u:u,body:JSON.parse(o.body)}); return Promise.resolve({ok:true})};`,
  });
});

after(async () => {
  ws?.close();
  if (chrome && chrome.exitCode === null) {
    const exited = new Promise((r) => chrome.once('exit', r));
    chrome.kill();
    await exited; // Chrome keeps writing its profile until it exits
  }
  server?.close();
  // Best effort: on Linux, Chrome's helper processes can outlive the parent for a moment.
  try { if (profile) rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
});

const FILL_STEP1 = `(() => { const f=document.querySelector('.intake');
  f.firstName.value='Ana'; f.lastName.value='Prueba'; f.phone.value='9195550100'; f.email.value='ana@example.com';
  f.querySelector('input[name=contactPref]').checked=true; f.querySelector('input[name=language]').checked=true; })()`;
const STEP = `document.querySelector('.intake .step.is-on').dataset.step`;

test('Enter in a step-1 field moves to step 2 instead of submitting the whole form', { skip }, async () => {
  await open('/work-with-me/');
  await evaluate(FILL_STEP1);
  await evaluate(`document.querySelector('.intake').requestSubmit()`); // what Enter does
  assert.equal(await evaluate(STEP), '2');
  assert.equal(await evaluate(`document.querySelector('.intake .done').hidden`), true);
});

test('Continue is blocked and the missing radio group is highlighted', { skip }, async () => {
  await open('/work-with-me/');
  await evaluate(`(() => { const f=document.querySelector('.intake'); f.firstName.value='A'; f.lastName.value='B'; f.phone.value='1'; f.email.value='a@b.co'; f.querySelector('[data-next]').click(); })()`);
  assert.equal(await evaluate(STEP), '1');
  assert.equal(await evaluate(`document.querySelectorAll('.intake .q.is-bad').length`), 2, 'contact + language groups marked');
});

test('a hostile ?goal= value does not break the form', { skip }, async () => {
  await open('/work-with-me/?goal=buy%22%5D');
  await evaluate(FILL_STEP1);
  await evaluate(`document.querySelector('.intake [data-next]').click()`);
  assert.equal(await evaluate(STEP), '2');
});

test('a full intake sends Margarita a readable brief with the listing, and only answered fields', { skip }, async () => {
  await open('/es/trabajar-conmigo/?goal=buy&listing=1036-mailwood');
  await evaluate(`(() => { const f=document.querySelector('.intake'); f.dataset.api='/api/lead'; })()`);
  await evaluate(FILL_STEP1);
  await evaluate(`document.querySelector('.intake [data-next]').click()`);
  assert.equal(await evaluate(`document.querySelector('.intake input[name=goal]:checked').value`), 'buy', 'goal prefilled');
  await evaluate(`document.querySelector('.intake [data-next]').click()`);
  await evaluate(`(() => { const f=document.querySelector('.intake'); f.areas.value='Knightdale'; f.querySelector('[data-next]').click(); })()`);
  await evaluate(`(() => { const f=document.querySelector('.intake'); f.consent.checked=true; f.requestSubmit(); })()`);
  await new Promise((r) => setTimeout(r, 200));
  const posts = await evaluate('window.__posts');
  assert.equal(posts.length, 1);
  const brief = posts[0].body.brief;
  assert.match(brief, /^Listing: 1036 Mailwood Drive, Knightdale/);
  assert.match(brief, /Nombre: Ana/);
  assert.match(brief, /Áreas o vecindarios que le gustan: Knightdale/);
  // With Calendly configured, preferred-time questions are replaced by real booking.
  assert.doesNotMatch(brief, /Día 1|Hora 1/, 'time questions hidden when booking is set');
  assert.doesNotMatch(brief, /Rango de precio/, 'unanswered selects left out');
  assert.doesNotMatch(brief, /Dirección de la casa que vende/, 'sell questions not asked of a buyer');
  assert.equal(posts[0].body.fields.lang, 'es');
  assert.equal(await evaluate(`document.querySelector('.intake .done').hidden`), false);
  // Came from a listing card, so the handoff is her Calendly "showing" event, pre-filled.
  const href = await evaluate(`document.querySelector('[data-booking-link]').href`);
  assert.match(href, /^https:\/\/calendly\.com\/margarita-corralesre\/showing\?name=Ana\+Prueba&email=ana%40example\.com$/);
});

test('a seller with no listing is handed to the listing-consultation event', { skip }, async () => {
  await open('/work-with-me/?goal=sell');
  await evaluate(FILL_STEP1);
  for (let i = 0; i < 2; i++) await evaluate(`document.querySelector('.intake [data-next]').click()`);
  await evaluate(`(() => { const f=document.querySelector('.intake'); f.sellAddress.value='1 Main St'; f.querySelector('[data-next]').click(); f.consent.checked=true; f.dataset.api='/api/lead'; f.requestSubmit(); })()`);
  await new Promise((r) => setTimeout(r, 200));
  assert.match(await evaluate(`document.querySelector('[data-booking-link]').href`), /\/listing-consultation\?/);
});

test('the guide popup opens from ?guide=1 and hands over the PDF in the same click', { skip }, async () => {
  await open('/?guide=1');
  assert.equal(await evaluate(`document.getElementById('guide').open`), true);
  await evaluate(`(() => { const f=document.querySelector('.pop-form'); f.name.value='Ana'; f.email.value='ana@example.com'; f.requestSubmit(); })()`);
  const opened = await evaluate('window.__opened');
  assert.equal(opened.length, 1);
  assert.match(opened[0], /triangle-home-buyer-toolkit\.pdf$/);
  assert.equal(await evaluate(`document.querySelector('.pop-done').hidden`), false);
});

test('a visitor from a listing who switches to selling gets the listing consultation, not a showing', { skip }, async () => {
  await open('/work-with-me/?goal=buy&listing=1036-mailwood');
  await evaluate(FILL_STEP1);
  await evaluate(`document.querySelector('.intake [data-next]').click()`);
  await evaluate(`(() => { const f=document.querySelector('.intake'); f.querySelector('input[name=goal][value=sell]').checked=true; f.querySelector('[data-next]').click(); f.sellAddress.value='1 Main St'; f.querySelector('[data-next]').click(); f.consent.checked=true; f.dataset.api='/api/lead'; f.requestSubmit(); })()`);
  await new Promise((r) => setTimeout(r, 200));
  assert.match(await evaluate(`document.querySelector('[data-booking-link]').href`), /\/listing-consultation\?name=/);
});

const POPUP_SUBMIT = `(() => { const f=document.querySelector('.pop-form'); f.name.value='Ana'; f.email.value='ana@example.com'; f.requestSubmit(); })()`;

test('with a backend, the toolkit signup is posted and confirmed; without one, the one-tap note is offered', { skip }, async () => {
  await open('/?guide=1');
  await evaluate(`document.getElementById('guide').dataset.api='/api/subscribe'`);
  await evaluate(POPUP_SUBMIT);
  await new Promise((r) => setTimeout(r, 200));
  const posts = await evaluate('window.__posts');
  assert.equal(posts.length, 1);
  assert.deepEqual([posts[0].body.email, posts[0].body.source], ['ana@example.com', 'welcome']);
  assert.equal(await evaluate(`document.querySelector('[data-saved]').hidden`), false);
  assert.equal(await evaluate(`document.querySelector('[data-note]').hidden`), true);

  await open('/es/?guide=1');
  await evaluate(`document.getElementById('guide').dataset.api=''`);
  await evaluate(POPUP_SUBMIT);
  assert.equal((await evaluate('window.__posts')).length, 0);
  assert.equal(await evaluate(`document.querySelector('[data-note]').hidden`), false);
  assert.match(await evaluate(`document.querySelector('[data-note-mail]').href`), /Ana%20%3Cana%40example\.com%3E/);
});

test('a failed signup says so and offers the note, instead of claiming success', { skip }, async () => {
  await open('/?guide=1');
  await evaluate(`window.fetch=function(){return Promise.resolve({ok:false})}; document.getElementById('guide').dataset.api='/api/subscribe'`);
  await evaluate(POPUP_SUBMIT);
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(await evaluate(`document.querySelector('[data-saved]').hidden`), true);
  assert.equal(await evaluate(`document.querySelector('[data-failed]').hidden`), false);
});

test('"Not now" closes the window and keeps it quiet for a week; having the toolkit keeps it quiet for good', { skip }, async () => {
  await open('/?guide=1');
  await evaluate(`localStorage.clear(); document.querySelector('.pop-actions [data-close]').click()`);
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(await evaluate(`document.getElementById('guide').open`), false);
  const days = await evaluate(`(+localStorage.getItem('mc-guide-quiet') - Date.now()) / 864e5`);
  assert.ok(days > 6.9 && days <= 7, String(days));
  await evaluate(`document.querySelector('[data-open-guide]').click(); document.querySelector('[data-already]').click()`);
  assert.ok(await evaluate(`!!localStorage.getItem('mc-guide-done')`));
  await evaluate(`localStorage.clear()`);
});

test('the welcome window opens by itself after 20 seconds of attention on the home page only', { skip }, async () => {
  await open('/');
  await evaluate(`localStorage.clear(); sessionStorage.clear(); sessionStorage.setItem('mc-attention','19')`);
  await open('/');
  await new Promise((r) => setTimeout(r, 1600));
  assert.equal(await evaluate(`document.getElementById('guide').open`), true);
  await evaluate(`sessionStorage.clear()`);
  await open('/work-with-me/');
  await evaluate(`sessionStorage.setItem('mc-attention','19')`);
  await open('/work-with-me/');
  await new Promise((r) => setTimeout(r, 1600));
  assert.equal(await evaluate(`document.getElementById('guide').open`), false);
  await evaluate(`sessionStorage.clear(); localStorage.clear()`);
});

test('an intake that could not be sent says "almost done", never "I have your plans"', { skip }, async () => {
  await open('/work-with-me/?goal=sell');
  await evaluate(`window.fetch=function(){return Promise.resolve({ok:false})}; location.assign=function(){}`);
  await evaluate(FILL_STEP1);
  for (let i = 0; i < 2; i++) await evaluate(`document.querySelector('.intake [data-next]').click()`);
  await evaluate(`(() => { const f=document.querySelector('.intake'); f.sellAddress.value='1 Main St'; f.querySelector('[data-next]').click(); f.consent.checked=true; f.dataset.api='/api/lead'; f.requestSubmit(); f.requestSubmit(); })()`);
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(await evaluate(`document.querySelector('[data-done-title]').textContent`), 'Almost done: send me your answers.');
  assert.equal(await evaluate(`document.querySelector('[data-fallback]').hidden`), false);
});
