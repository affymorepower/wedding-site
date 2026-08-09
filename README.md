# Affy &amp; Gabby: Wedding Site

**14–20 March 2027.** Cape Town and the Little Karoo.

Three events, spread over a week and split across two cities:

| Date | Event | Where |
|---|---|---|
| Sun 14 Mar | Welcome picnic | Kirstenbosch Botanical Gardens, Cape Town |
| Tue 16 Mar | Holud | Norval Foundation gardens, Cape Town |
| Sat 20 Mar | Wedding | Buffelsdrift Game Lodge, Oudtshoorn |

The plan, the reasoning and the open questions live in `website-plan.md`, which is kept
out of this repo because it holds budget figures. Affy and Gabby have it locally; ask if you
need it.

## What's here

```
index.html          single-scroll site: timeline, story, three events, travel, dress, FAQ
login.html          the password page, served at /login
rsvp.html           the RSVP form, served at /rsvp
js/gate.js          the three-group gate — READ ITS HEADER before trusting it
api/rsvp.js         serverless function: form → Airtable, one row per guest
api/access-request.js  "I don't have a password" → Airtable row, and email if configured
vercel.json         cleanUrls, so /rsvp and /login work without the .html
game/index.html     the save-the-date platformer, unchanged
prototypes/         early explorations, reference only
# website-plan.md is deliberately not in this repo (budget figures)
```

## The three guest groups

Two parts of the site differ by group: **where to stay** on the front page, and the
**RSVP form**. Everything else is open to anyone with the link.

| Password | Group | Sleeps | Pays |
|---|---|---|---|
| `weddinggame` | Family | On the reserve | We do |
| `hippoproblems` | Friends | On the reserve | They do |
| `marriedtothestars` | Other | Oudtshoorn | They do |

Guests type one password at `/login`; which group they land in is derived from which
password matched, so the three tiers are never named on screen. The choice is remembered
in `localStorage` under `ag.group`.

**This is a polite gate, not security.** The check runs in the browser, so every group's
content is present in the page and readable in dev tools, and the passwords are recoverable
from the hashes in `js/gate.js` by anyone with a wordlist. That was a deliberate call — the
long version, and what a real gate would look like instead, is in the header of
`js/gate.js`. Don't put anything behind it that would genuinely harm someone if it leaked.

**Changing a password** means replacing a hash in `js/gate.js`:

```bash
printf '%s' 'yournewpassword' | shasum -a 256
```

Passwords are lowercased and trimmed before hashing, so guests can be sloppy about it.

**Styling is a skeleton.** Every colour, font and spacing value is a token in the `:root`
block at the top of each page. Theming should mean editing that block. If you find
yourself hunting for hard-coded colours further down, something has gone wrong.

Search the pages for `[TBC]` and `todo` to find everything still needing real content.

## Making changes

No build step. No `npm install`. Open `index.html` in a browser and edit it.

Three ways to work, pick whichever suits you:

- **Claude Code**: clone the repo, describe what you want
- **Browser**: press `.` on any GitHub page for a full VS Code in the browser
- **Small edits**: the pencil icon on any file on GitHub

Push to `main` and it goes live in about a minute. Push to a branch and open a pull request instead if you'd like the other person to see it first. You will get a preview link on the PR.

**Pull before you start.** Two people editing the same file on the same afternoon is the one way this gets annoying:

```bash
git pull
```

## First time setup (Claude Code)

1. **Accept the repo invite.** It arrives by email, and it will not do anything until you click accept.
2. **Install Claude Code.** The desktop app is easier than the CLI. Needs a paid Claude plan; the free tier won't run it.
3. **Get the repo onto your machine.** Easiest way, no terminal needed: install
   [GitHub Desktop](https://desktop.github.com), sign in with your GitHub account,
   then File → Clone Repository → `wedding-site`. It handles the sign-in invisibly
   and puts the folder somewhere you can find it.

   *If you'd rather use a terminal:* install the [GitHub CLI](https://cli.github.com)
   first (`brew install gh` on a Mac, after installing [Homebrew](https://brew.sh)),
   then `gh auth login` followed by `gh repo clone affymorepower/wedding-site`.

4. **Open that folder in Claude Code** and describe what you want changed. It'll handle
   the commit and push.

You don't need a Vercel account, an Airtable account, or any of the tokens to work on the site.

## Deployment

Hosted on Vercel, connected to this repo. Whoever pushes, it deploys. You do not need a Vercel account to work on the site.

## Connecting Airtable

The RSVP form won't save anything until this is done. **Use a personal Airtable account, not a work one.**

**One row per guest, not per party.** Holud outfit sizes and safari spots are per-person,
so a party-shaped row can't hold them. Party-level answers (email, accommodation, message)
repeat on each guest's row, denormalized on purpose, so you can open a grid view, filter
to Holud attendees, and read off sizes without touching linked records.

1. Create a base with a table called `RSVPs`
2. Add these fields, exactly as named. **Airtable's API is case-sensitive.** `Party Name`
   is a different field from `Party name`. A mismatch returns `422 UNKNOWN_FIELD_NAME` and
   the whole write is rejected, so a wrong name fails loudly and atomically rather than
   half-saving. (Select *values* behave differently: `typecast: true` creates a missing
   option instead of erroring, so a typo there shows up as a duplicate choice in the base.)

   | Field | Type | Level |
   |---|---|---|
   | Guest name | Single line text | per guest, make this the primary field |
   | Party | Single line text | party |
   | Attending | Single select: `Yes` / `No` | party |
   | Welcome picnic | Checkbox | per guest |
   | Holud | Checkbox | per guest |
   | Wedding | Checkbox | per guest |
   | Holud outfit | Single select: `Sari, shades of pink (girls)` / `Kurta, shades of green (boys)` / `Either, surprise me` | per guest |
   | Holud outfit size | Single select: `XS` `S` `M` `L` `XL` `XXL` `Not sure, measure me` | per guest |
   | Dietary requirements | Long text | per guest |
   | Coach seat | Checkbox | per guest |
   | Safari | Single select: options TBC | per guest |
   | Accommodation | Single select: options TBC | party |
   | Email | Email | party |
   | Phone | Phone | party |
   | Song request | Single line text | party |
   | Message | Long text | party |
   | Group | Single select: `Family` / `Friends` / `Other` | party |

   **`Group` records which password the guest signed in with.** It is what lets you tell
   who is being billed for a room and who isn't. It comes from the browser, so treat it as
   a convenience for reconciling the base rather than proof of anything — the gate is not
   security and anyone can post whatever they like to the endpoint.

   **The single-select fields were created with no options on purpose.** `typecast: true`
   makes Airtable add a missing option on first write, so the choice lists fill themselves
   in as RSVPs arrive. You never hand-type them twice and they can't drift out of sync.
   The trade-off is that a typo in the code becomes a new option rather than an error, so
   the source of truth is the form: `SAFARI_OPTIONS`, `SIZES` and `OUTFITS` at the top of
   the `<script>` block in `rsvp.html`, plus the accommodation `<select>`.

   The safari and accommodation options are still `[TBC]` placeholders and need real
   values before launch.

3. **Add a second table called `Access requests`** with three fields: `Name` (single line
   text, primary), `Email` (email) and `Requested` (date, include time). This is where
   "I don't have a password" lands. Without it that form returns an error rather than
   silently losing the request.
4. Create a personal access token at [airtable.com/create/tokens](https://airtable.com/create/tokens) with the `data.records:write` scope on that base
5. In Vercel → Project → Settings → Environment Variables, add:
   - `AIRTABLE_TOKEN`: the token
   - `AIRTABLE_BASE_ID`: the `app…` id from the base URL
   - `AIRTABLE_TABLE`: `RSVPs` (optional, this is the default)
   - `AIRTABLE_ACCESS_TABLE`: `Access requests` (optional, this is the default)
6. Redeploy

### Getting emailed about password requests

Requests always land in the `Access requests` table. Getting a notification on top of that
is optional, and there are two ways:

- **An Airtable automation**, no code and no keys: in the base, Automations → When record
  created in `Access requests` → Send email, to `gabriella.brigando@gmail.com` and
  `affyhannan@gmail.com`. Easiest.
- **Resend**, if you'd rather the site sent it: add `RESEND_API_KEY` in Vercel and
  `api/access-request.js` starts emailing both of you, with reply-to set to the guest.
  Optionally set `RESEND_FROM` once you have a verified domain.

The two inboxes live in `api/access-request.js`, not in any page, so they don't get
scraped off public HTML. There is no automated password reset — the passwords are shared
per group, so a human decides which group someone belongs to and sends it on.

**The token never goes in this repo.** It lives only in Vercel. Anything in the repo is readable by anyone with access to it, and a leaked token lets someone read or delete the whole guest list.

## The game

`game/index.html`: a retro platformer where Sultan Affy rescues Queen Gabby from Bibi the Ostrich. Arrow keys to fly, X to drop bombs, three arenas. Entirely self-contained: canvas engine, Web Audio chiptune, no dependencies. Linked from the site footer.
