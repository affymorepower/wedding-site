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
stay/group-1.html   accommodation, family — served at /stay/group-1
hippoproblems.html      accommodation, friends — served at /hippoproblems
marriedtothestars.html  accommodation, Oudtshoorn — served at /marriedtothestars
stay/group-2.html   redirect to /hippoproblems (old link, still in threads)
stay/group-3.html   redirect to /marriedtothestars (same)
js/gate.js          the three-group gate — READ ITS HEADER before trusting it
api/rsvp.js         serverless function: form → Airtable, one row per guest
api/access-request.js  "I don't have a password" → Airtable row, and email if configured
vercel.json         cleanUrls, so /rsvp and /login work without the .html
game/index.html     the save-the-date platformer, unchanged
bibi/index.html     Bibi's Revenge — the 20-second runner, served at /bibi
video/              the reward clip the game unlocks
prototypes/         early explorations, reference only
# website-plan.md is deliberately not in this repo (budget figures)
```

## The three guest groups

Two parts of the site differ by group: **where to stay** on the front page, and the
**RSVP form**. Everything else is open to anyone with the link.

| Password | Group | Page | Sleeps | Pays |
|---|---|---|---|---|
| `zebracrossing` | Family | `/stay/group-1` | On the reserve | We do |
| `hippoproblems` | Friends | `/hippoproblems` | On the reserve | They do |
| `marriedtothestars` | Other | `/marriedtothestars` | Oudtshoorn | They do |

**Groups 2 and 3 have the password *as* the path**, so one link both signs the guest in
and lands them on their own page — nothing to type, nothing to remember, and it can be
pasted straight into a WhatsApp thread. The page hashes the last segment of its own URL
and checks it against the same table gate.js checks a typed password against
(`AG.enterFromPath`), so the plain password still isn't written into any file and a
guessed URL still fails. **Renaming either file changes that group's password**, so
`PAGE` in `js/gate.js` must move with it. The old `/stay/group-2` and `/stay/group-3`
URLs redirect to the new ones. Group 1 hasn't been moved.

It is weaker than typing a password, because a URL leaks in ways a typed string doesn't —
browser history, link previews, a forwarded screenshot of the address bar. That was an
accepted trade. It changes nothing about the standing rule below: this is a polite gate
either way.

Guests type one password at `/login`; which group they land in is derived from which
password matched, so the three tiers are never named on screen. The choice is remembered
in `localStorage` under `ag.group`.

**Signing in takes them to their own accommodation page**, unless the link they arrived on
said otherwise: `/login` on its own goes to whichever page `PAGE` in `js/gate.js` names for
that group, `/login?next=/rsvp` goes to the RSVP. Group 1 still uses the guest-sheet
shorthand — 1 family, 2 friends, 3 everyone else — so `/stay/group-1` names a tier only by
number; groups 2 and 3 are named for their password instead.

**Arriving on a password-path only signs in a visitor who is signed OUT.** Someone already
signed in as another group is moved to their own page rather than quietly reclassified. That
is deliberate: a forwarded link is a mis-sent link, and switching a family guest into group 2
would change what their RSVP records them as owing. The Sign out button in each page's footer
is the way through for anyone who really has changed group.

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

## The three accommodation pages

One page per group, one file each, so either of us can rewrite one without touching the
others and each group has a URL that can be pasted into a WhatsApp thread.

```
stay/group-1.html       family  — on the reserve, we're covering it
hippoproblems.html      friends — on the reserve, they settle their own room
marriedtothestars.html  other   — guesthouses in and around Oudtshoorn
```

**They deliberately don't look alike.** Groups 1 and 2 are sleeping at Buffelsdrift, so
their pages carry the lodge's own stamp rail — it's a picture of where they'll wake up.
Group 3 is booking their own room in town, so its page carries the three Booking.com
options instead, and no rail: photographs of a lodge they aren't staying at would be
decoration. Don't "fix" that by making the three pages match.

**Editing one:** everything between the `CONTENT STARTS` and `CONTENT ENDS` markers is
content. The `:root` block above it holds the same colour and font tokens as `index.html`,
so a page can be restyled without hunting for hard-coded values. Paths must be absolute
(`/fonts/…`, `/images/…`) because these files sit a folder down.

**What guards them:** `AG.guardPage('family')` at the foot of each page, preceded on the
two password-path pages by `AG.enterFromPath()`, which signs a signed-out visitor in from
the URL they arrived on. Signed out, the
visitor goes to `/login` and comes back afterwards. Signed in on the wrong page, they are
moved to their own — a wrong URL is a mis-sent link, not a trespasser. The page body stays
hidden until that check passes, so another group's page never flashes up first (the browser
tab title can still flicker; it's in `<head>`, which paints before any script runs). Same
caveat as everything else here: this is a polite gate, and the file is readable by anyone
who knows the URL. **Don't write on one group's page what another group is paying.**

**Each page has a form slot** at the foot, marked `Form to come`. Until those are written,
the staying-over questions on `/rsvp` still cover it, so no guest is blocked.

**The front page still carries the old inline version** of the reserve and town
accommodation blocks, marked with a `KEEP UNTIL` comment in `index.html`. They're the detail
these three pages are replacing; once the pages are written, delete both blocks and leave
the "your own accommodation page" link that sits above them.

## The RSVP form

**One row per person, one form per person.** Each guest gets their own link — partners
included — so a submission is one adult plus any children with them. That writes one
Airtable row for the adult and one per child, sharing a `Party` value so a household reads
as a block.

Three variants, chosen by the signed-in group: family and friends answer the same four
staying-over questions (nights, sharing a four-sleeper, third night) with different copy
above them; town guests answer where they're staying instead. `js/gate.js` deletes the two
blocks that don't apply.

**Game activities are a tick list with no prices.** Deliberate: the 2027 rates aren't
citable. Only the bush safari (R870) appears in Beadri's quote, and buffelsdrift.com
publishes 2026 prices about 8% lower. Guests tick what appeals and get quoted individually.
The age limits shown instead are the venue's own, checked 18 Aug 2026 — they matter more
than prices now that children are on the form.

**Fields this expects on the base.** The form will fail without them:

| Field | Type | Note |
|---|---|---|
| `Safari` | **multiple** select | was a single select; multiple values post as an array |
| `Guest type` | single select | `Invitee` / `Child` |
| `Age` | single select | `Adult` / `Under 3` / `4 to 12` / `13 or older` |
| `Child bed` | single select | `In our tent` / `Needs their own bed` |

The old `Children` free-text column is no longer written to. Leave it in place rather than
deleting it, so anything already submitted survives.

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
   | Group | Single select: `Family` / `Game Reserve Friends` / `In Town` | party |

   **`Group` records which password the guest signed in with.** It is what lets you tell
   who is being billed for a room and who isn't. It comes from the browser, so treat it as
   a convenience for reconciling the base rather than proof of anything — the gate is not
   security and anyone can post whatever they like to the endpoint.

   Those three strings are duplicated in `GROUP_LABEL` at the top of the script block in
   `rsvp.html` and **must match the base exactly**. `typecast: true` creates a missing
   option rather than erroring, so a mismatch quietly grows a duplicate choice instead of
   failing where you'd notice.

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

## The games

**`game/index.html`** — the save-the-date platformer. Sultan Affy rescues Queen Gabby
from Bibi the Ostrich. Arrow keys to fly, X to drop bombs, three arenas. Self-contained:
canvas engine, Web Audio chiptune, no dependencies.

**`bibi/index.html`** — *Bibi's Revenge*, the sequel, at `/bibi`. About twenty seconds:
hop seven charging ostriches, then jump into Bibi three times to shove him into a
crocodile pit. Affy then leaps the pit to Queen Gabby waiting on the far side, and
finishing unlocks the footage of the real Bibi, which is the actual point of it.

Space or a tap jumps; the arrows move him within a band roughly a third of the screen
wide. Jump is the whole game and you can win without ever touching left or right —
movement buys reaction time on an ostrich and closes on Bibi faster, worth about a second
and a half over a run. Timed end to end: **19s** using the arrows, **20.6s** without.

Four things worth knowing before editing it:

- **The backdrop is the site's own hero photograph**, `images/hero-swartberg.webp`,
  drawn into a 240×150 offscreen canvas and blown back up with smoothing off. That
  downsample is what stops the photo and the sprites looking like two different media,
  so don't "fix" it by drawing the image straight to the canvas. Alternate tiles are
  mirrored so the ridge meets itself at every seam.
- **Nothing can hurt you after the stampede.** Bibi lays eggs during the chase and they
  are scenery. An earlier version made them lethal and it cost three hearts in testing,
  one jump away from the reward — a guest who gets that far should always see the
  crocodiles.
- **He cannot walk into the pit.** `clampPlayerX()` swaps his right-hand bound for the
  pit's lip once it is on screen, and it runs *twice* per frame — once after he moves and
  again after `updatePit()` shifts the pit, or he stands a few pixels out over the edge
  while it is still scrolling in.
- **It is embedded on the front page**, in a section just above the RSVP, as a plain
  lazy-loaded iframe sitting inline at 8:5. It shows its own title screen, so the section
  previews itself, and it plays in place. The page hands the frame focus on pointerdown,
  because otherwise Space and the arrows scroll the page instead of reaching the game.
  It stays a standalone page because that is the link people paste into WhatsApp.

### The prize

`video/bibi-reward.mp4` — 17.9s, 576×1024, H.264/AAC, 3.7 MB. The real encounter the
whole thing is based on. The win card plays it beside the words rather than under them,
because it is portrait footage in an 8:5 frame and stacking would shrink it to a strip.

Two things that follow from it being a video rather than a form:

- **The clip is only as private as its URL.** The repo is private but the deployed site
  is not, so anyone who guesses `/video/bibi-reward.mp4` can watch it without playing.
  The game gates the route to it, not the file. If that ever matters, serve it through a
  function that checks something instead of as a static path.
- **`preload="metadata"`**, so the 3.7 MB only downloads when somebody wins — the game is
  embedded on the front page and would otherwise cost every visitor the whole file.

It replaced an earlier song-request prize that wrote to an Airtable `Songs` table via
`api/song.js`. Both are deleted; `git log` has them if the song is ever wanted back. The
RSVP's own `Song request` field is untouched and still collects songs from everyone.
