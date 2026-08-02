# Wedding Website — Plan

*Last updated: 2026-08-02. Affy & Gabby, 18–20 March 2027, Oudtshoorn, Little Karoo.*

## The shape of it

Two surfaces, different jobs:

| Surface | Job | Update frequency |
|---|---|---|
| **Website** | RSVP + logistics. Source of truth. | Rarely, after launch |
| **Instagram** | Ongoing engagement — countdown, venue teasers, story-so-far | Weekly-ish |

Keep logistics off Instagram. Stories vanish, captions get buried, and someone will
screenshot the wrong date. Instagram links to the site; the site never depends on Instagram.

## The weekend

| Day | Event | Notes |
|---|---|---|
| Thu 18 Mar | Welcome picnic | [TBC] who it's for — everyone, or early arrivals |
| Fri 19 Mar | Holud | Outfits provided by us → RSVP collects sizes per person |
| Sat 20 Mar | Wedding | The main event |
| — | Safari | Optional, guests pay their own way, **spots limited** → needs capacity tracking and coordination with the operator |

## Live

- **Site:** https://affyandgabby.vercel.app
- **Repo:** https://github.com/affymorepower/wedding-site (private)
- **Airtable base:** `appCPqCVlHqL1sr2T`

## Stack

- **Host:** Vercel, free tier, git-connected, auto-deploy on push
- **Backend:** Airtable, written via a Vercel Serverless Function (`/api/rsvp`)
- **Frontend:** plain HTML/CSS/JS, no build step
- **Repo:** private GitHub, Affy + Gabby as collaborators

The load-bearing reason for Vercel isn't Vercel — it's that an Airtable token in
client-side JavaScript is public, so the host must be able to run a function. That rules
out GitHub Pages. Netlify and Cloudflare Pages are equivalent; Vercel wins on per-branch
preview URLs, which matter when two people are building.

**Airtable must be a personal account, not the Okra one.** Gabby has no access to Okra's
workspace and shouldn't, guest phone numbers don't belong in a company account, and if
that account rotates the guest list goes with it.

## Structure

Single scroll, plus a separate RSVP page:

```
/            hero → timeline → our story → picnic → holud → wedding
             → getting there → what to wear → FAQ → RSVP call-to-action
/rsvp        the form
/game/       the save-the-date platformer
```

RSVP is a separate page on purpose — the link gets pasted into WhatsApp dozens of times,
and an anchor to the bottom of a scroll is not a link.

**Dress code is one section covering all three events**, not three scattered ones. A guest
engages with dress code exactly once, while packing, and at that moment needs to see all
three at the same time.

**Travel and accommodation are top-level**, not sub-items of the wedding day. People are
flying into Cape Town, driving four to five hours, and staying several nights. It's the
largest source of guest anxiety and the most re-read part of the site.

## Data model — one row per guest

Not per party. Holud outfit sizes and safari spots are per-person, and the safari operator
needs names rather than a count. Party-level answers repeat on each guest's row —
denormalized on purpose, so a grid view can filter to Holud attendees and read off sizes
without touching linked records.

| Field | Type | Level |
|---|---|---|
| Guest name | Single line text (primary) | guest |
| Party | Single line text | party |
| Attending | Single select — `Yes` / `No` | party |
| Welcome picnic | Checkbox | guest |
| Holud | Checkbox | guest |
| Wedding | Checkbox | guest |
| Holud outfit size | Single select | guest |
| Dietary requirements | Long text | guest |
| Coach seat | Checkbox | guest |
| Safari | Single select — **options TBC** | guest |
| Accommodation | Single select — **options TBC** | party |
| Email / Phone / Song request / Message | — | party |

Exact field names and setup steps are in [README.md](README.md). Airtable's API is
case-sensitive and `typecast: true` means a mismatched name is dropped **silently** —
you'd get a row with blanks and no error.

## Travel

**Route 62**, the inland Little Karoo route — not the Garden Route.

- **Coach from Cape Town, paid by us.** The RSVP asks per person, so the answer doubles as
  the charter headcount. Earlier research put a return charter for ~120 at roughly
  R90k–150k.
- **Self-drive Route 62** as the scenic alternative for anyone with time.

Coach numbers should firm up over time rather than resting on one answer given a year out.
Worth a "confirm your seat" nudge closer to the date.

## Status

| Phase | | |
|---|---|---|
| 0 | Repo + Vercel + skeleton deploying | **Done** |
| 1 | RSVP → Airtable end to end | **Untested** — see below |
| 2 | Theme it | Waiting on inspiration |
| 3 | Real content — every `[TBC]` on the site | Waiting on Affy & Gabby |
| 4 | Instagram set up, cross-linked | Handle undecided |

**Phase 1 is not actually proven.** The env vars reach the function and validation works,
but nothing has ever been written to Airtable. The token could be wrong, the base id could
be wrong, and the field names have never been checked against the real table. A single
test submission settles all three.

## Open questions

1. **Venue** — Oudtshoorn is confirmed, the venue itself isn't named on the site yet.
2. **Safari options and prices** — needed before the RSVP field means anything. Placeholder
   values live in `SAFARI_OPTIONS` at the top of the script block in `rsvp.html`.
3. **Accommodation options and prices** — two or three named choices with per-night rates.
4. **RSVP deadline** — currently `[TBC]` in two places.
5. **Kids** — people book flights around this answer.
6. **Gifts / registry** — silence reads as awkward rather than as "no gifts".
7. **Gated vs open RSVP** — still undecided. With a fixed-cost buffet and a paid-for coach,
   plus-one drift costs real money. Gating means pre-loading the guest list and having
   people find their invite. Currently the form is open to anyone with the link.
8. **Custom domain** — `affyandgabby.vercel.app` is fine for testing; a printed invite
   wants `affyandgabby.com` (~R200/year).
9. **Names** — the two prototypes are titled "Affy & Sam". Placeholder, or to fix?

## Instagram

- Grid: venue, Karoo scenery, the two of you, vendor tags
- Stories: countdown, behind-the-scenes, "who's coming" polls
- Bio links to the website
- Set the day-of hashtag early so guests learn it before the day
- Decide now whether it stays up afterwards as a photo archive
