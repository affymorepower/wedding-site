# Affy & Gabby — Wedding Save the Date

A retro 2D platformer wedding invitation. Sultan Affy must rescue Queen Gabby from Bibi the Ostrich across three arenas of Cape Town, ending in a save-the-date reveal.

**Wedding date:** 20 March 2027
**Location:** Cape Town, South Africa

## How to play

Open `index.html` in any modern browser, or visit the deployed link.

- Arrow keys (or on-screen arrows on mobile) — fly the magic carpet
- X (or on-screen BOMB button) — drop bombs
- Hit Bibi 3 times across 3 arenas, then fly to Gabby to win

## Deploy

This is a single static HTML file with no build step.

### Vercel

1. Sign in to [vercel.com](https://vercel.com) with your GitHub account
2. Click "Add New… → Project"
3. Import this repository
4. Vercel auto-detects it as a static site — click Deploy
5. You get a public URL like `your-project.vercel.app`

### Netlify Drop

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag `index.html` onto the page
3. Get a public URL instantly — no signup needed

## Customize the registration link

Find this line near the bottom of `index.html` inside the `<script>` block:

```js
const REGISTRATION_URL = 'https://airtable.com/...';
```

Change to your form's URL and redeploy.

## Tech

- Pure HTML / CSS / JavaScript — no frameworks, no build step
- Canvas-based pixel art game engine
- Web Audio API for chiptune music + sound effects
- Responsive layout using `dvh` for accurate mobile viewport sizing
- Fullscreen + landscape lock where supported (Android Chrome; iOS Safari restricts both)

## Files

- `index.html` — the entire game in one file
- `README.md` — this file
- `.gitignore` — git exclusions
