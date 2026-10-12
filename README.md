# margaritacuesta.com

The website of **Margarita Cuesta**, bilingual (English/Spanish) real estate broker and
REALTOR® with the Corrales Real Estate Team with The Insight Group in Raleigh, NC.

Its job is to make her findable by name and turn visits into **her own** clients: every
call, WhatsApp, email, intake and booking goes to her, with the Corrales team and The Insight
Group credited as where her license is held.

Pages: `/` and `/es/` (home), `/work-with-me/` and `/es/trabajar-conmigo/` (four-step intake
that hands off to her calendar). Also: current listings as flip cards, the next open house in
a bar across the top, a free bilingual buyer's guide behind a pop-up, and the
"where are you headed" homes animation.

**Preview:** https://danieljcuesta007.github.io/margaritacuesta-preview/ (not indexed).

## Requirements

- Node 18 or newer (22+ for the browser tests, which also need Google Chrome and skip without it). No packages to install.
- Python 3 (preinstalled on macOS) only for the local preview server.
- Only to regenerate the share image (`scripts/make-images.sh`): Google Chrome and macOS's
  built-in `sips`. On Linux, screenshot `scripts/og.html` (1200x630) and `scripts/icon.html`
  (180x180) by hand instead.

## Use

```sh
node src/build.mjs                    # build into dist/
node --test                           # run the tests
python3 -m http.server 8765 -d dist   # preview at http://localhost:8765
./scripts/make-images.sh              # regenerate the share card and touch icon
node scripts/make-guide.mjs           # regenerate the free guide PDFs (needs Chrome)
./scripts/publish-preview.sh          # push a noindex preview to GitHub Pages
```

`npm run build`, `npm test` and `npm run serve` are shortcuts for the same commands.

## Where things live

| Path | What |
|---|---|
| `data/identity.json` | Every fact about her: name, phone, license, team, profiles, awards, sales. Change facts here only. |
| `data/listings.json` | Her current listings and open houses. **The file she edits most.** |
| `src/copy.mjs` | Every visible sentence, English and Spanish side by side. |
| `src/guide.mjs` | The free guide's text, both languages. |
| `src/schema.mjs` | The JSON-LD graph: one Person node, referenced by `@id` everywhere. |
| `src/render.mjs`, `src/styles.css`, `src/client.mjs` | Markup, styles (light and dark), and the little JavaScript there is. |
| `src/build.mjs` | Writes `dist/`: both pages, sitemap with hreflang, robots.txt, llms.txt, 404, Cloudflare `_headers`. |
| `test/` | `node:test` suite: compliance lines, NAP consistency, one entity, hreflang, asset links, EN/ES parity. |
| `docs/LEAD-SYSTEM.md` | Backend design for capturing leads and the 24-48h follow-up email, with the open decisions. |
| `docs/ENTITY.md` | The off-site plan: what Instagram, LinkedIn, TikTok, Google Business Profile and the team site should say. |

## Common changes

- **New listing or open house:** add it to `data/listings.json` (photos in `assets/img/`). Past open houses hide themselves.
- **Booking links:** `links.booking` in `data/identity.json` maps each goal (discovery, buy, sell, lease, invest, showing) to a Calendly event; a single URL string also works and is used as the discovery call.
- **New profile (Zillow, Google Business Profile...):** add it to `profiles`. It reaches `sameAs` and the footer.
- **Wording:** edit `src/copy.mjs`, both languages. The parity test fails if one side gains or loses a field.

## Deploy

Cloudflare Pages, connected to this repo: build command `node src/build.mjs`, output
directory `dist`, production branch `main`. Nothing secret is needed.

## Compliance

North Carolina Real Estate Commission rules require the firm name on advertising. Every
page shows "Corrales Real Estate Team with The Insight Group", her license number and the
Equal Housing Opportunity mark, and a test enforces it.

## License

Code: MIT (see `LICENSE`). Photographs, likeness and written content: © Margarita Cuesta,
all rights reserved.
