// Vercel serverless function: a song request won by finishing Bibi's Revenge.
//
// ONE ROW PER SONG, in its own table — deliberately not folded into the RSVPs
// table. A guest can beat the game before they RSVP, or instead of it, and
// matching a free-typed name back to a guest row is guesswork we don't need.
// The RSVP's own `Song request` field stays as it is; this is a second, separate
// list, and reconciling the two is a human job for the playlist evening.
//
// Same token and same base as /api/rsvp — no new environment variables unless
// the table is called something other than "Songs":
//   AIRTABLE_TOKEN        personal access token, data.records:write on the base
//   AIRTABLE_BASE_ID      the app… id from the base URL
//   AIRTABLE_SONGS_TABLE  table name or id, defaults to "Songs"

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    AIRTABLE_TOKEN,
    AIRTABLE_BASE_ID,
    AIRTABLE_SONGS_TABLE = 'Songs',
  } = process.env;

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    console.error('Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID');
    return res.status(500).json({ error: 'Server not configured yet.' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  if (!body) return res.status(400).json({ error: 'Bad request body.' });

  // Honeypot: people leave this empty, bots fill it. Pretend it worked.
  if (body.website) return res.status(200).json({ ok: true });

  const name = text(body.name, 80);
  const song = text(body.song, 120);
  const artist = text(body.artist, 120);

  if (!name) return res.status(400).json({ error: 'Please tell us who you are.' });
  if (!song) return res.status(400).json({ error: 'Please name a song.' });

  const fields = prune({
    Song: song,
    Artist: artist,
    'Requested by': name,
    // typecast creates this option on first write, so the base fills itself in.
    Source: text(body.source, 60) || "Bibi's Revenge",
  });

  try {
    const r = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_SONGS_TABLE)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      }
    );

    if (!r.ok) {
      // Log the detail for us; never return it — it echoes the request shape.
      console.error('Airtable error', r.status, await r.text());
      return res.status(502).json({ error: 'Could not save that song. Please try again.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Song request failed', err);
    return res.status(502).json({ error: 'Could not save that song. Please try again.' });
  }
}

const text = (v, max) => (v === undefined || v === null ? '' : String(v).trim().slice(0, max));

// Drop empty strings so Airtable doesn't overwrite selects with blanks.
const prune = (f) =>
  Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '' && v !== undefined));

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
