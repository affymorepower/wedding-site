// Vercel serverless function: "I don't have a password" on the login page.
//
// A guest leaves a name and an email; Affy and Gabby need to know so they can
// send the right group's password back by hand. There is no automated reset —
// the three passwords are shared per group, so there is nothing per-person to
// reset, only a human deciding which group someone belongs to.
//
// TWO CHANNELS, EITHER WILL DO:
//   1. A row in Airtable, so nothing is ever lost and there is a list to work
//      through. Uses the same base and token the RSVP already writes to.
//   2. An email to both of them, if RESEND_API_KEY is set. Without the key the
//      function still works — it just records the request without pinging.
//
// It only returns success if at least one channel actually accepted the
// request. Reporting "we got it" when nothing was recorded is the one failure
// mode that matters here: the guest stops chasing and no one ever finds out.
//
// Env (Vercel → Project → Settings → Environment Variables):
//   AIRTABLE_TOKEN         already set, needs data.records:write on the base
//   AIRTABLE_BASE_ID       already set
//   AIRTABLE_ACCESS_TABLE  optional, defaults to "Access requests"
//   RESEND_API_KEY         optional; without it, no email is sent
//   RESEND_FROM            optional, defaults to Resend's shared sandbox sender
//
// The two inboxes live here and NOT in the page, so they don't get scraped off
// public HTML.
const NOTIFY = ['gabriella.brigando@gmail.com', 'affyhannan@gmail.com'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  if (!body) return res.status(400).json({ error: 'Bad request body.' });

  // Honeypot: people leave this empty, bots fill it. Pretend it worked so the
  // bot doesn't retry, but record nothing.
  if (body.website) return res.status(200).json({ ok: true });

  const name = text(body.name, 200);
  const email = text(body.email, 200);
  if (!name) return res.status(400).json({ error: 'Please tell us your name.' });
  if (!looksLikeEmail(email)) return res.status(400).json({ error: 'That email does not look right.' });

  const results = await Promise.allSettled([saveToAirtable(name, email), sendEmail(name, email)]);
  const [saved, mailed] = results.map((r) => r.status === 'fulfilled' && r.value === true);

  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error(i === 0 ? 'Airtable' : 'Email', 'failed:', r.reason?.message || r.reason);
  });

  if (!saved && !mailed) {
    return res.status(502).json({ error: 'Could not record your request. Please try again.' });
  }
  return res.status(200).json({ ok: true });
}

async function saveToAirtable(name, email) {
  const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_ACCESS_TABLE = 'Access requests' } = process.env;
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) return false;

  const r = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_ACCESS_TABLE)}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: [{ fields: { Name: name, Email: email, Requested: new Date().toISOString() } }],
        typecast: true,
      }),
    }
  );
  if (!r.ok) throw new Error(`Airtable ${r.status}: ${await r.text()}`);
  return true;
}

async function sendEmail(name, email) {
  const { RESEND_API_KEY, RESEND_FROM = 'Wedding site <onboarding@resend.dev>' } = process.env;
  if (!RESEND_API_KEY) return false; // not configured, and that is fine

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: NOTIFY,
      reply_to: email,
      subject: `Password request — ${name}`,
      text:
        `${name} <${email}> asked for a password on the wedding site.\n\n` +
        `Decide which group they belong to and send them the matching password:\n` +
        `  family  — staying on the reserve, we're covering it\n` +
        `  friends — staying on the reserve, paying their own way\n` +
        `  town    — staying in Oudtshoorn\n\n` +
        `Replying to this email goes straight back to them.\n`,
    }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  return true;
}

const text = (v, max) => (v === undefined || v === null ? '' : String(v).trim().slice(0, max));

// Deliberately loose. The only job is catching a typo before it becomes a row
// nobody can reply to; anything stricter starts rejecting real addresses.
const looksLikeEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
