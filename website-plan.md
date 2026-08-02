# Wedding Website — Plan

*Last updated: 2026-08-02. Affy & Gabby, 20 March 2027.*

## The shape of it

Two surfaces, different jobs:

| Surface | Job | Update frequency |
|---|---|---|
| **Website** | RSVP + logistics. The thing guests are *sent to* once and return to for details. Source of truth. | Rarely, after launch |
| **Instagram** | Ongoing engagement — countdown, venue teasers, story-so-far, day-of hashtag | Weekly-ish |

Keep logistics off Instagram. Stories vanish, captions get buried, and Aunty will screenshot the wrong date. Instagram links to the site; the site never depends on Instagram.

## Stack

- **Host:** Vercel — free tier, git-connected, auto-deploy on push
- **Backend:** Airtable, written via a Vercel Serverless Function (`/api/rsvp`)
- **Frontend:** plain HTML/CSS/JS to start — no build step, same as the existing game. Add a framework only if the theme demands it.
- **Repo:** private GitHub, Affy + Gabby as collaborators

### Why Vercel (you asked for a better idea — there isn't a materially better one)

The load-bearing reason isn't Vercel specifically, it's that **you need a server-side hop.** An Airtable API key in client-side JavaScript is public — anyone can view-source it and read or wipe your guest list. So the host must be able to run a small function. That rules out GitHub Pages.

Vercel, Netlify, and Cloudflare Pages are all equivalent for this. Vercel edges ahead on one thing that actually matters for two people building together: **every branch gets its own preview URL**, so Gabby can look at your change on her phone before it goes live. Pick Vercel, stop deliberating.

**The one alternative worth a thought:** skip the custom form and embed an Airtable form directly. Faster, zero backend, zero API key. You lose styling control and get Airtable branding on the free tier. Since you're about to send me theme inspiration, you clearly care about the look — so custom form it is.

### ⚠️ Which Airtable account

The Airtable connected to this workspace is the **Okra work account**. Do not put the wedding base there:

- Gabby has no access to Okra's workspace, and shouldn't
- Guest phone numbers, dietary and medical-adjacent info in a company account is the wrong side of the personal/work line
- If you ever leave or rotate that account, the guest list goes with it

Create a **free personal Airtable account** (or use Gabby's) and build the base there. One free base handles 1,000 records — far more than a wedding needs.

## Data model — first draft

Single `RSVPs` table is enough. One row per invited party, not per person.

| Field | Type | Notes |
|---|---|---|
| Party name | Text | "Hannan Family", "Jess & Tom" |
| Attending | Single select | Yes / No / Maybe |
| Headcount | Number | Confirmed attendees in the party |
| Guest names | Long text | Everyone attending, for place cards |
| Email | Email | Primary contact |
| Phone | Phone | For day-of WhatsApp group |
| Dietary requirements | Long text | Feeds into the braai buffet menu |
| Bus from Cape Town | Single select | Yes / No / Not sure — **capacity planning, see below** |
| Accommodation | Single select | Booking own / Need help / Not staying over |
| Song request | Text | |
| Message | Long text | |
| Submitted at | Created time | Auto |

**The bus field earns its place.** Prior research in this folder puts a Cape Town → Buffelsdrift coach charter at roughly R90k–150k return for 120 pax. Coach count is a step function — you need the yes/no split early, and you need it to firm up over time, not on one final deadline. Consider a "confirm your seat" nudge closer to the date rather than trusting a March 2026 answer.

### Guest-list-gated vs open form

Two options, real trade-off:

- **Open form** — anyone with the link can RSVP. Simple to build. Vulnerable to bots and to your cousin adding four people you didn't invite.
- **Gated** — pre-load the guest list in Airtable; guest enters their name or a code, sees their invite, confirms. Controls plus-ones properly and blocks spam by construction. Maybe an extra half-day of work.

For a wedding with a coach charter and a fixed-cost buffet, **gated is worth it** — plus-one drift costs real money. If you go open, at minimum add a honeypot field and a rate limit.

## Repo & how you two work together

```
wedding-site/
  index.html          # landing + RSVP
  api/rsvp.js         # serverless function → Airtable
  game/index.html     # the save-the-date game, kept as-is
  assets/
  README.md           # setup for Gabby
```

- `main` auto-deploys to production. Branches get preview URLs.
- The Airtable API key lives **only** in Vercel's env vars. Never in the repo. `.env` is already gitignored.
- For a two-person wedding site, committing straight to `main` is fine. Use branches when you want the other person to look before it's live.

### Access — who needs an account where

**Gabby needs a GitHub account. She does not need a Vercel account.**

GitHub's free tier allows unlimited collaborators on private repos, so adding her costs nothing. Vercel's free Hobby plan is *single-user* — a genuinely shared Vercel project needs Pro at $20/user/month. Skip it: the Vercel project is connected to the **repo**, not to a person, so it deploys whatever lands on `main` no matter who pushed. Gabby's commits deploy exactly like Affy's, and preview URLs come back as status checks on her PRs inside GitHub.

The only asymmetry: env vars (i.e. the Airtable key) are editable by the Vercel account owner only. Fine for this — arguably good.

| Decision | Options | Call |
|---|---|---|
| Her repo permission | Write / Admin | **Write** is enough. Admin also allows settings changes and deleting the repo. |
| Ownership model | Personal repo + collaborator, or a free **GitHub Organization** both own | Org if you want it to feel jointly owned rather than "Affy's repo Gabby can edit". Free, slightly more setup. |
| How she edits | Claude Code / github.dev (press `.` on any repo page for browser VS Code) / pencil icon for small edits | Depends on her comfort — all three push to the same repo. |

**Existing files to sort out before the repo goes up:** `index.html` (the game) is modified but uncommitted, and `prototype-1-timeline.html` / `prototype-2-chat.html` are untracked. The budget spreadsheet and menu docs should stay out of the repo entirely — they're planning docs, not site content, and one of them is a live-editing lock file.

## Build order

| Phase | What | Blocked on |
|---|---|---|
| 0 | GitHub repo + Vercel connected + skeleton deploying | Nothing — can start now |
| 1 | RSVP form → Airtable, end to end, ugly but working | Personal Airtable account |
| 2 | Theme it | Your inspiration |
| 3 | Content: story, venue, travel, accommodation, dress code, registry, FAQ | Copy from you two |
| 4 | Instagram set up, cross-linked | Handle decision |

Doing phase 1 before phase 2 is deliberate — prove the data path works while it's still cheap to change, then make it beautiful.

## Instagram

- Grid: venue, Karoo/Oudtshoorn scenery, the two of you, vendor tags
- Stories: countdown, behind-the-scenes, "who's coming" polls
- Bio links to the website
- Set the day-of hashtag early so guests learn it before the day
- Decide now: does it stay up after the wedding as a photo archive, or get archived?

## Open questions

1. **Which Airtable account** — new personal one, or Gabby's existing?
2. **Venue** — README says Cape Town; the transport research points at Buffelsdrift (Oudtshoorn). Which is the ceremony venue, and is Cape Town just where guests depart from?
3. **Domain** — custom (`affyandgabby.com`) or `something.vercel.app`? Custom is ~R200/year and worth it on a printed invite.
4. **Names** — the two prototypes are titled "Affy & Sam". Placeholder, or something to fix?
5. **Gabby's git comfort** — determines whether she works in Claude Code, the GitHub web editor, or you drive and she reviews preview links.
6. **Gated or open RSVP** — see above. My vote: gated.
