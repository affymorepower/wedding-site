# Affy &amp; Gabby — Wedding Site

**20 March 2027.** Venue TBC.

The plan, the reasoning and the open questions live in [website-plan.md](website-plan.md). Read that first.

## What's here

```
index.html          landing page + RSVP form   ← placeholder styling, replace when the theme lands
api/rsvp.js         serverless function: form → Airtable
game/index.html     the save-the-date platformer, unchanged
prototypes/         early explorations (timeline, chat) — reference only, not deployed
website-plan.md     the plan
```

## Making changes

No build step. No `npm install`. Open `index.html` in a browser and edit it.

Three ways to work, pick whichever suits you:

- **Claude Code** — clone the repo, describe what you want
- **Browser** — press `.` on any GitHub page for a full VS Code in the browser
- **Small edits** — the pencil icon on any file on GitHub

Push to `main` and it goes live in about a minute. Push to a branch and open a pull request instead if you'd like the other person to see it first — you'll get a preview link on the PR.

**Pull before you start.** Two people editing the same file on the same afternoon is the one way this gets annoying:

```bash
git pull
```

## First time setup (Claude Code)

1. **Accept the repo invite.** It arrives by email — it won't do anything until you click accept.
2. **Install Claude Code.** The desktop app is easier than the CLI. Needs a paid Claude plan; the free tier won't run it.
3. **Get the repo onto your machine.** Easiest way, no terminal needed — install
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

Hosted on Vercel, connected to this repo. Whoever pushes, it deploys — you don't need a Vercel account to work on the site.

## Connecting Airtable

The RSVP form won't save anything until this is done. **Use a personal Airtable account, not a work one.**

1. Create a base with a table called `RSVPs`
2. Add these fields, exactly as named:

   | Field | Type |
   |---|---|
   | Party name | Single line text |
   | Attending | Single select — `Yes` / `No` / `Maybe` |
   | Headcount | Number |
   | Guest names | Long text |
   | Email | Email |
   | Phone | Phone |
   | Dietary requirements | Long text |
   | Bus from Cape Town | Single select — `Yes` / `No` / `Not sure yet` |
   | Accommodation | Single select — `Booking our own` / `Need help` / `Not staying over` |
   | Song request | Single line text |
   | Message | Long text |

3. Create a personal access token at [airtable.com/create/tokens](https://airtable.com/create/tokens) with the `data.records:write` scope on that base
4. In Vercel → Project → Settings → Environment Variables, add:
   - `AIRTABLE_TOKEN` — the token
   - `AIRTABLE_BASE_ID` — the `app…` id from the base URL
   - `AIRTABLE_TABLE` — `RSVPs` (optional, this is the default)
5. Redeploy

**The token never goes in this repo.** It lives only in Vercel. Anything in the repo is readable by anyone with access to it, and a leaked token lets someone read or delete the whole guest list.

## The game

`game/index.html` — a retro platformer where Sultan Affy rescues Queen Gabby from Bibi the Ostrich. Arrow keys to fly, X to drop bombs, three arenas. Entirely self-contained: canvas engine, Web Audio chiptune, no dependencies. Linked from the site footer.
