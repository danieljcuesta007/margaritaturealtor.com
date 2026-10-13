# Lead system: from "Work with me" to a pre-market email

Status 12 Oct 2026: **front end built, backend designed, not built.** Today both forms
work without a server: the intake opens the visitor's email (or WhatsApp) with the brief
ready to send to Margarita, and the guide downloads directly. The pieces below turn that
into a system that captures every lead, tells her at once, and follows up for her.

## What Daniel asked for (12 Oct 2026)

> "be able to fill out a form listing common things a realtor would need to know and then
> be able to book it on her schedule ... so she can sit down and review the info before
> taking the client meeting ... use [it] to have an automated search system that looks for
> homes and alternatives in that client's space and send them a directly targeted email with
> those recommendations ... a touchpoint a day or two after the first email submission."

> "We don't want her to send people to Corrales ... the funnel ... going to her calendar or
> her email or her number."

## Flow

```
visitor ── intake (4 steps) ──▶ POST /api/lead ──▶ D1: leads
                                     │
                                     ├─▶ email to Margarita: the brief + "prepare touchpoint" link   (minutes)
                                     ├─▶ visitor: confirmation + her booking link
                                     │
cron (hourly) ── lead is 24h old, no touchpoint yet ──▶ reminder to Margarita if she hasn't prepared one
                                     │
Margarita ── pastes her Flexmls saved-search link + a note ──▶ approves
                                     │
                                     └─▶ touchpoint email to the client, from her, at +24-48h
                                         "Here is what I found for you before we meet" + her search link
                                         Flexmls then emails the client new matches automatically.
```

Margarita stays in the loop on purpose. She asked to review each lead before meeting them,
and listing data has MLS display rules, so a person picks the homes.

## Why the "automatic search" runs through her Flexmls

- Her MLS (Doorify) runs on Flexmls. A **saved search with a subscription** emails the
  client new matching listings on its own, already compliant with MLS rules, branded to her.
  That is the automated search; we just get every client into one within a day.
- Fully automatic matching (our code querying listings) needs **Spark API** access, which FBS
  grants per MLS with a data licence, and display has to follow Doorify's IDX rules. Phase 2,
  only if Phase 1 shows it's worth it.
- Not the team's Lofty CRM. Her IDX subdomain feeds the Corrales team system, which is the
  funnel Daniel wants to avoid.

## Pieces (all on Cloudflare's free tier)

| Piece | What | Notes |
|---|---|---|
| Worker `api/` | `POST /api/lead`, `POST /api/subscribe`, `GET /prepare/:token` | Validates input, honeypot field + Cloudflare Turnstile against spam |
| D1 | `leads`, `subscribers`, `touchpoints` | Personal data: no logging of bodies, delete after 24 months unless she is working with them |
| Notify Margarita | Cloudflare Email Routing `send_email` | Can only send to verified addresses, which is exactly her inbox |
| Email to clients | Resend (free: 3,000/month) from `margaritaturealtor.com` | Needs the domain + SPF/DKIM; Reply-To `margarita@corralesre.com` so replies reach her |
| Cron trigger | hourly | Reminders and scheduled touchpoints |
| Booking | Calendly events per goal in `data/identity.json` → `links.booking` (set 12 Oct 2026) | The intake hands off to the matching event, prefilled |
| Newsletter | `subscribers` table, sent monthly | Or Kit/Flodesk if she wants a visual editor |

Front-end switch: set `api.leads` and `api.subscribe` in `data/identity.json` to the Worker
URLs. Nothing else in the site changes, and if the API is ever down the forms fall back to
email/WhatsApp on their own.

## Decisions needed (Daniel / Margarita)

1. **Buy `margaritaturealtor.com`.** Needed to send email as her and for the real site. Unregistered on 12 Oct 2026 (Daniel will buy it).
2. **Calendar:** Google Calendar appointment schedule (free with a Google account) or Cal.com. Which calendar does she actually live in?
3. **Email sender:** Resend on her domain (recommended), or keep everything as notifications to her and let her send the touchpoint from her own inbox.
4. **Cloudflare account:** Daniel's now, moved to hers later, or hers from the start.
5. **Newsletter tool:** our own (free, simplest) or Kit/Flodesk (visual editor for her).

## Ownership

The goal is for Margarita to run this herself. When she is ready: a GitHub account added as
a collaborator on the repo, and her own Cloudflare account that owns the domain, Pages project,
Worker and D1. Everyday edits she will make (`data/listings.json` for listings and open houses,
`links.booking`) are plain JSON on purpose, so they can be edited on github.com without tools.
