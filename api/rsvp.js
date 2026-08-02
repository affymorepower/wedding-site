// Vercel serverless function: receives the RSVP form and writes to Airtable.
//
// ONE ROW PER GUEST, not per party. Holud outfit sizes and safari spots are
// per-person, so a party-shaped row can't hold them. Party-level answers
// (email, accommodation, message) are repeated onto each guest's row — that's
// deliberate: it keeps the base to a single flat table you can filter in a grid
// view without touching linked records.
//
// A decline writes one row with Attending = No and nothing else.
//
// The Airtable token MUST stay server-side. Never move this into the page.
// Set in Vercel → Project → Settings → Environment Variables:
//   AIRTABLE_TOKEN    personal access token, data.records:write on the base
//   AIRTABLE_BASE_ID  the app… id from the base URL
//   AIRTABLE_TABLE    table name or id, defaults to "RSVPs"

const MAX_GUESTS = 10;
const AIRTABLE_BATCH = 10; // Airtable's per-request record cap

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE = 'RSVPs' } = process.env;
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    console.error('Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID');
    return res.status(500).json({ error: 'Server not configured yet.' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  if (!body) return res.status(400).json({ error: 'Bad request body.' });

  // Honeypot: people leave this empty, bots fill it. Pretend it worked.
  if (body.website) return res.status(200).json({ ok: true });

  const party = body.party || {};
  const partyName = String(party.partyName || '').trim();
  if (!partyName) return res.status(400).json({ error: 'Please tell us who you are.' });
  if (party.attending !== 'Yes' && party.attending !== 'No') {
    return res.status(400).json({ error: 'Please let us know if you can make it.' });
  }

  const shared = {
    Party: partyName,
    Attending: party.attending,
    Email: text(party.email),
    Phone: text(party.phone),
    Accommodation: text(party.accommodation),
    'Song request': text(party.song),
    Message: text(party.message),
  };

  let records;
  if (party.attending === 'No') {
    records = [{ fields: prune({ 'Guest name': partyName, ...shared }) }];
  } else {
    const guests = Array.isArray(body.guests) ? body.guests.slice(0, MAX_GUESTS) : [];
    if (!guests.length) return res.status(400).json({ error: 'Please add at least one guest.' });

    records = guests.map((g, i) => ({
      fields: prune({
        'Guest name': text(g.name) || `${partyName} — guest ${i + 1}`,
        ...shared,
        'Welcome picnic': !!g.picnic,
        Holud: !!g.holud,
        Wedding: !!g.wedding,
        'Holud outfit size': text(g.size),
        'Dietary requirements': text(g.dietary),
        'Coach seat': !!g.coach,
        Safari: text(g.safari),
      }),
    }));
  }

  try {
    for (const batch of chunk(records, AIRTABLE_BATCH)) {
      const r = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${AIRTABLE_TOKEN}`,
            'Content-Type': 'application/json',
          },
          // typecast lets Airtable match single-select values by option name.
          // Careful: it CREATES a missing option rather than erroring, so a typo
          // shows up as a duplicate choice in the base instead of a failure.
          body: JSON.stringify({ records: batch, typecast: true }),
        }
      );

      if (!r.ok) {
        // Log the detail for us; never return it — it echoes the request shape.
        console.error('Airtable error', r.status, await r.text());
        return res.status(502).json({ error: 'Could not save your RSVP. Please try again.' });
      }
    }
    return res.status(200).json({ ok: true, saved: records.length });
  } catch (err) {
    console.error('RSVP request failed', err);
    return res.status(502).json({ error: 'Could not save your RSVP. Please try again.' });
  }
}

const text = (v) => (v === undefined || v === null ? '' : String(v).slice(0, 2000));

// Drop empty strings so Airtable doesn't overwrite selects with blanks.
const prune = (fields) =>
  Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== '' && v !== undefined));

const chunk = (arr, n) =>
  Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
