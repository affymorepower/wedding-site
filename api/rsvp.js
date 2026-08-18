// Vercel serverless function: receives the RSVP form and writes to Airtable.
//
// ONE ROW PER PERSON. The form is sent to each guest individually — partners get
// one each — so a submission is one adult plus any children with them. That's one
// row for the adult and one per child, sharing a Party value so a household reads
// as a block. Contact details and the coach answer repeat onto the children's
// rows: deliberate, and it keeps the base to a single flat table you can filter
// in a grid view without touching linked records.
//
// A decline writes one row with Attending = No and nothing else.
//
// FIELDS THIS EXPECTS ON THE BASE (see README): Safari must be a MULTIPLE select,
// and Guest type / Age / Child bed must exist. A single-select Safari rejects the
// array this sends.
//
// The Airtable token MUST stay server-side. Never move this into the page.
// Set in Vercel → Project → Settings → Environment Variables:
//   AIRTABLE_TOKEN    personal access token, data.records:write on the base
//   AIRTABLE_BASE_ID  the app… id from the base URL
//   AIRTABLE_TABLE    table name or id, defaults to "RSVPs"

const MAX_CHILDREN = 8;   // nobody is bringing nine children; a cap stops a scripted flood
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

  // One form per person now: the guest answers for themselves, plus any children
  // with them. There is no party headcount and no repeating guest block.
  const guest = body.guest || {};
  const name = String(guest.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Please tell us who you are.' });
  if (guest.attending !== 'Yes' && guest.attending !== 'No') {
    return res.status(400).json({ error: 'Please let us know if you can make it.' });
  }

  const attending = guest.attending === 'Yes';

  // What a child inherits from the adult who listed them: the group they were
  // invited in, how to reach the family, and the coach. Everything else — events,
  // diet, activities, bed — is answered per child.
  const shared = {
    Attending: guest.attending,
    // Which of the three guest groups they signed in as: Family (room covered),
    // Friends (room on the reserve, paying) or In Town (own place in Oudtshoorn).
    // Comes from the browser, so it is a convenience for reconciling the base —
    // never treat it as proof of entitlement. Anyone can post whatever they like.
    Group: text(guest.group),
    Email: text(guest.email),
    Phone: text(guest.phone),
    // Party groups a household: an adult's own name on their row, and the same
    // name on their children's rows, so a family reads as one block in the base.
    Party: name,
    'Coach seat': !!guest.coach,
  };

  const records = [{
    fields: prune({
      ...shared,
      'Guest name': name,
      'Guest type': 'Invitee',
      Age: 'Adult',
      'Welcome picnic': !!guest.picnic,
      Holud: !!guest.holud,
      Wedding: !!guest.wedding,
      'Holud outfit': text(guest.outfit),
      'Holud outfit size': text(guest.size),
      'Dietary requirements': text(guest.dietary),
      // MULTIPLE select — an array, not a string. The Safari field must be a
      // multipleSelects on the base or Airtable rejects this.
      Safari: list(guest.activities),
      Accommodation: text(guest.accommodation),
      // Reserve guests (family + friends) answer these; town guests answer
      // Accommodation instead. Nights uses the same strings as the Nights column
      // in the Buffelsdrift Rates sheet, so it pastes into the room allocation.
      Nights: text(guest.nights),
      'Third night': text(guest.thirdNight),
      'Share family tent': !!guest.shareFamily,
      'Song request': text(guest.song),
      Message: text(guest.message),
    }),
  }];

  // A row per child, so the rooming list and the caterers can count heads without
  // anyone parsing prose. Age is the venue's billing band, not a birthday.
  if (attending) {
    const kids = Array.isArray(body.children) ? body.children.slice(0, MAX_CHILDREN) : [];
    for (const [i, kid] of kids.entries()) {
      records.push({
        fields: prune({
          ...shared,
          'Guest name': text(kid.name) || `${name} — child ${i + 1}`,
          'Guest type': 'Child',
          Age: text(kid.age),
          'Welcome picnic': !!kid.picnic,
          Holud: !!kid.holud,
          Wedding: !!kid.wedding,
          'Dietary requirements': text(kid.dietary),
          Safari: list(kid.activities),
          'Child bed': text(kid.sleeping),
          Nights: text(guest.nights),
        }),
      });
    }
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

// Multiple-select fields take an array of choice names. Anything not an array,
// or an empty one, becomes undefined so prune() drops the field entirely rather
// than clearing it.
const list = (v) => (Array.isArray(v) && v.length ? v.map(text).slice(0, 20) : undefined);

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
