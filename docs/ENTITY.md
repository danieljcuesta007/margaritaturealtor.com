# Making Margarita findable

The website is half the job. Search engines and AI assistants decide who a person
is by **corroboration**: the same name, phone, title and team stated the same way
on many independent pages, all pointing at each other. The site states it once,
in `data/identity.json`, and links outward with `sameAs`. This file is the other
half: what every outside profile should say so they all point back.

## Baseline, 12 Oct 2026

- Google/Bing for "Margarita Cuesta realtor Raleigh": **nothing about her**. Every
  result was another agent.
- corralesre.com/agent lists her as **Broker**, (919) 432-2204,
  margarita@corralesre.com, with no photo or bio.
- `margaritaturealtor.corralesre.com` (her IDX page) has a title and nothing else.
- Instagram `@margaritaturealtor`: display name "Margarita C" plus a house emoji,
  116 followers, bio "Trusted Realtor, Latina | Raleigh, NC", no link.
- Two Linktrees (`MargaritaCuesta`, `MargaritaTuRealtor`), both mostly affiliate links
  (Headspace, Fabletics, Talkspace...), which dilutes the realtor signal.
- LinkedIn `margarita-cuesta-baa6245` still reads as a pharmaceutical planner.

So she starts from zero, which also means nothing is competing with her name.

## The canonical facts (copy these exactly, everywhere)

| Field | Exactly this |
|---|---|
| Name | **Margarita Cuesta** (not "Margarita C", not "MargaritaTuRealtor") |
| Title | Real Estate Broker, REALTOR® (Spanish: Corredora de bienes raíces) |
| Team | Corrales Real Estate Team with The Insight Group |
| Phone | (919) 432-2204 (also WhatsApp) |
| Email | margarita@corralesre.com |
| Office | 1715 Pacific Dr., Raleigh, NC 27609 |
| License | NC #358832 |
| Website | https://www.margaritaturealtor.com |
| One line | Bilingual (English/Spanish) real estate broker in Raleigh, Durham and the Triangle. |

Handles stay as they are. Changing a handle breaks every link that already exists.
Change **display names and bios**, which is what search actually reads.

## Checklist, in order of payoff

1. **Google Business Profile** (biggest local lever). Create one for "Margarita Cuesta,
   REALTOR®" as an individual practitioner, category *Real estate agent*, the office
   address, the exact phone, website, "Identifies as Latino-owned"/Spanish spoken.
   Verification is hers to do (video or postcard). This is what puts her in the map pack
   for "realtor que habla español Raleigh".
2. **Team page on corralesre.com.** Ask Oscar to add her photo, the one-line bio and a
   link to margaritaturealtor.com on `/agents/Margarita-Cuesta/8898384` and her IDX subdomain.
   A link from the team's own site is the strongest corroboration she can get.
3. **Instagram.** Name field: `Margarita Cuesta | Realtor Raleigh` (the name field is
   searchable on Instagram). Bio: `Bilingual realtor · English & Español · Corrales Real
   Estate Team with The Insight Group · NC #358832`. Link: margaritaturealtor.com (or a single
   cleaned Linktree with the site first).
4. **LinkedIn** (kept off the website by Daniel's call, 12 Oct 2026, but the profile itself should still match). Headline: `Real Estate Broker & REALTOR® | Corrales Real Estate Team with
   The Insight Group | Bilingual English/Spanish | Raleigh-Durham`. Add the Corrales team as
   current experience and the site under Contact info.
5. **TikTok.** Name `Margarita Cuesta | Realtor`, same bio line. A website link on TikTok
   needs a Business account or 1,000 followers; until then put the site in the bio text.
6. **Linktree.** Merge to one tree, put the website first, and move the affiliate links to
   a separate tree (or drop them). Same name and photo as Instagram.
7. **Zillow, Realtor.com, Homes.com.** Claim her agent profiles through her MLS membership (Doorify MLS),
   use the same photo and bio, and attach the 304 Spring Street sale.
8. **Reviews.** Ask the 304 Spring Street clients, and every client after, for a Google
   review first and a Zillow review second. Reviews are what turn a profile into calls.
9. **Team Instagram (@corrales.re.team).** A "Meet Margarita" post and highlight that tags her.

When a profile is updated, add its URL to `profiles` in `data/identity.json` (Google
Business Profile, Zillow and Realtor.com especially) so it joins `sameAs`.

## After the domain is live

- Google Search Console: add the property, submit `/sitemap.xml`, request indexing for `/`
  and `/es/`.
- Bing Webmaster Tools: import from Search Console. Bing feeds ChatGPT and Copilot search.
- Re-run the baseline search above a month later and record it here.

## Not recommended (yet)

**Wikidata.** Her son's item works because of independent press (Sun Sentinel, Miami
Herald). Margarita has no third-party coverage, so a self-created item would be deleted.
Revisit if she is ever written up, for example by a local paper or the HBA.

## Search baseline, 19 Oct 2026

Web search for "Margarita Cuesta realtor Raleigh NC" and "realtor que habla español Knightdale Raleigh Margarita": **she does not appear** (unchanged from 12 Oct; the site is not live). The Spanish query surfaces other bilingual Triangle agents (Luis Carrillo, eXp; Rocio Rojas, Choice Residential; Roxana Garcia-Rodriguez, Coldwell Banker). Re-run both after launch and monthly.

Entity links in place: one Person `@id` (`/#margarita`) on every page; Sequoia Builders' site names her by that same `@id` (sequoiabuilders PR #2) and her Person lists Sequoia under `affiliation`; FAQPage on both home pages; llms.txt carries the FAQ, the toolkit and the privacy notice.
