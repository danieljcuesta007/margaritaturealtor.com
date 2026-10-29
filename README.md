# margaritaturealtor.com

The domain is **margaritaturealtor.com**, matching her @margaritaturealtor handles (not bought yet). Repo: `danieljcuesta007/margaritaturealtor.com` (renamed from `margaritacuesta.com` on 19 Oct 2026; GitHub redirects the old URL).

The website of **Margarita Cuesta**, bilingual (English/Spanish) real estate broker and
REALTOR® with the Corrales Real Estate Team with The Insight Group in Raleigh, NC.

Its job is to make her findable by name and turn visits into **her own** clients: every
call, WhatsApp, email, intake and booking goes to her, with the Corrales team and The Insight
Group credited as where her license is held.

Pages: `/` and `/es/` (home), `/work-with-me/` and `/es/trabajar-conmigo/` (four-step intake
that hands off to her calendar), `/privacy/` and `/es/privacidad/`. Also: current listings as
flip cards, the next open house in a bar across the top, a welcome window offering the free
bilingual **Home Buyer's Toolkit** (7-page PDF: the 10 costly mistakes, cash-to-close and
monthly cost worksheets, a home-tour scorecard, offer-to-keys steps), and the
"where are you headed" homes animation.

The welcome window is modelled on the W.O.W signup prompt: once per visit on the home page,
after 20 seconds of attention, 55% down the page or on exit intent; never while someone is
typing; quiet for 7, 30, then 90 days after "Not now"; never again once they have the toolkit.

**Preview:** https://margaritaturealtor-preview.pages.dev/ (not indexed; published from this repo).

## Requirements

- Node 18 or newer (22+ for the browser tests, which also need Google Chrome and skip without it). No packages to install.
- Python 3 (preinstalled on macOS) only for the local preview server.
- Only to publish the preview: `npx` (comes with Node) and a Cloudflare login (`npx wrangler login`).
- Optional, only to regenerate photo sizes (`scripts/make-webp.sh`): `cwebp` (libwebp) and macOS `sips`. Without them the committed WebP files keep working, and a missing one falls back to the JPEG.
- Only to regenerate the share image (`scripts/make-images.sh`): Google Chrome and macOS's
  built-in `sips`. On Linux, screenshot `scripts/og.html` (1200x630) and `assets/mark.svg` on white
  (180x180) by hand instead.

## Use

```sh
node src/build.mjs                    # build into dist/
node --test                           # run the tests
python3 -m http.server 8765 -d dist   # preview at http://localhost:8765
./scripts/make-images.sh              # regenerate the share card and touch icon
./scripts/make-webp.sh                # right-sized WebP copies of the photos (after adding a photo)
node scripts/make-guide.mjs           # regenerate the toolkit PDFs (needs Chrome)
./scripts/publish-preview.sh          # publish a noindex preview to Cloudflare Pages (needs a wrangler login)
```

`npm run build`, `npm test` and `npm run serve` are shortcuts for the same commands.

## Where things live

| Path | What |
|---|---|
| `data/identity.json` | Every fact about her: name, phone, license, team, profiles, awards, sales. Change facts here only. |
| `data/listings.json` | Her current listings and open houses. **The file she edits most.** |
| `src/copy.mjs` | Every visible sentence, English and Spanish side by side. |
| `src/guide.mjs` | The free toolkit's text, both languages. |
| `src/schema.mjs` | The JSON-LD graph: one Person node, referenced by `@id` everywhere. |
| `src/render.mjs`, `src/styles.css`, `src/client.mjs` | Markup, styles (light only, by request), and the little JavaScript there is. |
| `src/build.mjs` | Writes `dist/`: every page, sitemap with hreflang, robots.txt, llms.txt, 404, Cloudflare `_headers`. |
| `test/` | `node:test` suite: compliance lines, NAP consistency, one entity, hreflang, asset links, EN/ES parity. |
| `worker/` | The lead backend (Cloudflare Worker + D1): saves toolkit sign-ups and intakes, emails Margarita. Built and tested, **not deployed**. |
| `docs/LEAD-SYSTEM.md` | Backend design for capturing leads and the 24-48h follow-up email, with the open decisions. |
| `docs/ENTITY.md` | The off-site plan: what Instagram, LinkedIn, TikTok, Google Business Profile and the team site should say. |

## Common changes

- **New listing or open house:** add it to `data/listings.json` (photos in `assets/img/`), then run `./scripts/make-webp.sh`. Past open houses hide themselves.
- **Booking links:** `links.booking` in `data/identity.json` maps each goal (discovery, buy, sell, lease, invest, showing) to a Calendly event; a single URL string also works and is used as the discovery call.
- **New profile (Zillow, Google Business Profile...):** add it to `profiles`. It reaches `sameAs` and the footer.
- **Wording:** edit `src/copy.mjs`, both languages. The parity test fails if one side gains or loses a field.

## Measured (19 Oct 2026, mobile Lighthouse 12, median of 4, local gzip server)

| Page | Perf | A11y | BP | SEO | LCP | First paint | Weight |
|---|---|---|---|---|---|---|---|
| `/` before | 87 | 96 | 100 | 100 | 3.96s | 2.73s | 824KB |
| `/` after | 99 | 100 | 100 | 100 | 2.02s | 0.85s | 239KB |
| `/es/` after | 100 | 100 | 100 | 100 | 0.87s | 0.87s | 239KB |

axe-core (WCAG 2.2 AA + best practice): 0 violations on 13 page states at 390px and 1440px.
No third-party requests: fonts (`assets/fonts/`, OFL) and GSAP (`assets/vendor/`) are self-hosted.

## Deploy

Cloudflare Pages, connected to this repo: build command `node src/build.mjs`, output
directory `dist`, production branch `main`. Nothing secret is needed.

## Turning on lead capture

Until `api.leads` / `api.subscribe` in `data/identity.json` are set, nothing is stored: the
intake hands its answers to email/WhatsApp and the toolkit window offers a one-tap note to
Margarita, and the fine print says so. To switch it on, in **her** Cloudflare account:

```sh
cp worker/wrangler.example.toml worker/wrangler.toml      # fill in the D1 id; gitignored
npx wrangler d1 create margarita-leads
npx wrangler d1 execute margarita-leads --remote --file=worker/schema.sql
npx wrangler secret put RESEND_API_KEY --config worker/wrangler.toml   # optional: email alerts
npx wrangler deploy --config worker/wrangler.toml
```

Then set `api.subscribe` to `https://api.margaritaturealtor.com/api/subscribe` and
`api.leads` to `.../api/lead`, rebuild, and send one real test of each form. Without a Resend
key leads are still saved; read them with `npx wrangler d1 execute margarita-leads --remote
--command "SELECT * FROM leads ORDER BY created_at DESC"`.

## Compliance

North Carolina Real Estate Commission rules require the firm name on advertising. Every
page shows "Corrales Real Estate Team with The Insight Group", her license number and the
Equal Housing Opportunity mark, and a test enforces it.

## License

Code: MIT (see `LICENSE`). Photographs, likeness and written content: © Margarita Cuesta,
all rights reserved.
