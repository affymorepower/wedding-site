// Vercel serverless function: receives the RSVP form and writes one row to Airtable.
//
// The Airtable token MUST stay server-side. Never move this logic into the page.
// Set these in Vercel → Project → Settings → Environment Variables:
//   AIRTABLE_TOKEN    personal access token with data.records:write on the base
//   AIRTABLE_BASE_ID  e.g. appXXXXXXXXXXXXXX
//   AIRTABLE_TABLE    table name, defaults to "RSVPs"

const FIELD_MAP = {
  partyName: 'Party name',
  attending: 'Attending',
  headcount: 'Headcount',
  guestNames: 'Guest names',
  email: 'Email',
  phone: 'Phone',
  dietary: 'Dietary requirements',
  bus: 'Bus from Cape Town',
  accommodation: 'Accommodation',
  song: 'Song request',
  message: 'Message',
};

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

  // Honeypot: real people leave this hidden field empty. Bots fill it in.
  if (body.website) return res.status(200).json({ ok: true });

  if (!body.partyName?.trim()) return res.status(400).json({ error: 'Please tell us who you are.' });
  if (!body.attending) return res.status(400).json({ error: 'Please let us know if you can make it.' });

  const fields = {};
  for (const [key, column] of Object.entries(FIELD_MAP)) {
    const value = body[key];
    if (value === undefined || value === null || value === '') continue;
    fields[column] = key === 'headcount' ? Number(value) || 0 : String(value).slice(0, 2000);
  }

  try {
    const airtable = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        // typecast lets Airtable match single-select values by their option name
        body: JSON.stringify({ fields, typecast: true }),
      }
    );

    if (!airtable.ok) {
      // Log the detail for us; never return it — it can echo the request shape.
      console.error('Airtable error', airtable.status, await airtable.text());
      return res.status(502).json({ error: 'Could not save your RSVP. Please try again.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('RSVP request failed', err);
    return res.status(502).json({ error: 'Could not save your RSVP. Please try again.' });
  }
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
