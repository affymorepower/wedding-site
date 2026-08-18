/* ==========================================================================
   THE GATE — three guest groups, one shared password each.

   READ THIS BEFORE TRUSTING IT WITH ANYTHING.

   This is a POLITE GATE, not security, and that was a deliberate call
   (website-plan.md, "Access & groups", 2026-08-09). The check runs entirely in
   the browser, which means two things are true no matter how it is written:

     1. Every group's content ships inside the page. A visitor in the "town"
        group can read the on-reserve section by opening dev tools. There is no
        client-side arrangement that prevents this.
     2. The passwords are recoverable. Storing SHA-256 hashes below rather than
        the plain strings raises the bar from "read it in view-source" to "run
        a wordlist against three hashes" — worth doing, but it is a speed bump,
        not a lock. These are short English compounds; a determined guest with
        a wordlist gets them in seconds.

   What this DOES buy: nobody stumbles into the wrong version, and the fact
   that a free-accommodation tier exists is not advertised on screen. That was
   the actual goal. If it ever needs to be real, the shape is: passwords in
   Vercel env vars, a login function that sets a signed HttpOnly cookie, and
   each variant served per-request rather than hidden with CSS.

   Do not put anything here that would genuinely harm someone if it leaked.
   ========================================================================== */

(() => {
  'use strict';

  // sha256(password) -> group key. Plain passwords are deliberately absent.
  const GROUPS = {
    '053098243213651f6249ccc753abec371a41b0c5a9cd71867b129efe47127983': 'family',
    '2690521135fc31616e8dd9c0fa7f7fb37a67060ea42dc1edcf2c6c817e5de3ff': 'friends',
    cb8d6299e41b87f4ba06047268fb41c0347fa4d6534c3fedc0ee20815cca4692: 'town',
  };

  const KEY = 'ag.group';
  const VALID = new Set(['family', 'friends', 'town']);

  // Where each group sleeps. Two accommodation variants, three RSVP variants —
  // family and friends share a section but not a form.
  const STAY = { family: 'reserve', friends: 'reserve', town: 'town' };

  // Each group's own accommodation page.
  //
  // All three paths ARE their group's password (Affy, 2026-08-18; group 1 moved
  // off /stay/group-1 the same day). One link both signs the guest in and lands
  // them on their own page, so it can be pasted into a WhatsApp thread and
  // /login never has to come up. See enterFromPath below for what that costs.
  // Changing any path changes that group's password with it, so keep each equal
  // to the plain string behind its hash above. The old /stay/group-1..3 URLs
  // redirect here and can be deleted once no thread still carries one.
  const PAGE = { family: '/zebracrossing', friends: '/hippoproblems', town: '/marriedtothestars' };

  async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function current() {
    try {
      const g = localStorage.getItem(KEY);
      return VALID.has(g) ? g : null;
    } catch {
      // Safari in private mode throws on localStorage. Treat as logged out
      // rather than breaking the page.
      return null;
    }
  }

  const AG = {
    /* Resolve a password to a group, remembering it on success.
       Returns the group key, or null if nothing matched. */
    async login(password) {
      // crypto.subtle only exists in a secure context: https, or localhost.
      // On plain http over a LAN it is undefined and every login would fail
      // silently, so say so rather than telling the guest their password is wrong.
      if (!window.crypto?.subtle) throw new Error('insecure-context');

      const group = GROUPS[await sha256(String(password).trim().toLowerCase())];
      if (!group) return null;
      try {
        localStorage.setItem(KEY, group);
      } catch {
        /* private mode: they stay logged in for this page only */
      }
      return group;
    },

    /* Sign in from a page's own URL, for a page whose last path segment IS the
       group's password (/zebracrossing, /hippoproblems, /marriedtothestars). The
       point is that
       the link can be
       pasted straight into a WhatsApp thread: the guest never sees /login, and
       there is one link to send rather than a link plus a password.

       The slug is hashed and checked against GROUPS exactly as a typed password
       is, so two useful things hold: the plain password is never written into
       the page, and a guessed URL still fails. It also means renaming such a
       file changes its password — update PAGE above if you do.

       This is WEAKER than typing the password, because a URL leaks in ways a
       typed string does not: browser history, link previews, a Referer header, a
       forwarded screenshot of the address bar. That was an accepted trade, not an
       oversight. It changes nothing about the standing rule in the header — this
       is a polite gate either way, and nothing behind it should be able to harm
       someone if it leaked.

       Returns the group on success, or null. Callers should follow it with the
       ordinary guardPage(), so a slug that resolves to nothing still sends the
       visitor to /login rather than leaving them on a blank page. */
    async enterFromPath(path = location.pathname) {
      const slug = path.replace(/\.html?$/i, '').split('/').filter(Boolean).pop() || '';
      try {
        return await AG.login(slug);
      } catch {
        // insecure-context: crypto.subtle is missing, so no hash can be made.
        // Fall through to the caller's guard, which will offer /login.
        return null;
      }
    },

    group: current,

    /* 'reserve' for family and friends, 'town' for everyone else, null if out. */
    stay() {
      const g = current();
      return g ? STAY[g] : null;
    },

    /* The signed-in guest's own accommodation page, or null if signed out. */
    stayPath() {
      const g = current();
      return g ? PAGE[g] : null;
    },

    /* Guard for one of the per-group pages. Pass the group (or groups, space
       separated) the page belongs to:

         if (!AG.guardPage('family')) return;

       Signed out, they go to /login and come back here afterwards. Signed in
       but on someone else's page, they are moved to their own rather than shown
       an error — a guest who lands on the wrong URL is a mis-sent link, not a
       trespasser, and there is nothing here to protect (see the header). */
    guardPage(groups) {
      const g = AG.requireGroup();
      if (!g) return false;
      if (!String(groups).split(/\s+/).includes(g)) {
        location.replace(PAGE[g]);
        return false;
      }
      return true;
    },

    forget() {
      try {
        localStorage.removeItem(KEY);
      } catch {
        /* nothing to do */
      }
    },

    /* Send a logged-out visitor to the login page, remembering where they were
       headed. Returns the group if they are already in, so callers can do:
         const group = AG.requireGroup(); if (!group) return; */
    requireGroup() {
      const g = current();
      if (g) return g;
      const next = location.pathname + location.search + location.hash;
      location.replace('/login?next=' + encodeURIComponent(next));
      return null;
    },

    /* Reveal the elements belonging to the current group and remove the rest,
       so a stray CSS override can't expose another group's block. Elements opt
       in with data-group="family friends" or data-stay="reserve". */
    applyTo(root = document) {
      const group = current();
      const stay = group ? STAY[group] : null;

      root.querySelectorAll('[data-group]').forEach((el) => {
        const wanted = el.dataset.group.split(/\s+/);
        if (!group || !wanted.includes(group)) el.remove();
      });
      root.querySelectorAll('[data-stay]').forEach((el) => {
        const wanted = el.dataset.stay.split(/\s+/);
        if (!stay || !wanted.includes(stay)) el.remove();
      });

      /* The soft variant. data-stay-narrow trims to the visitor's group once we
         know it, but leaves everything in place for anyone signed out.

         data-stay would be wrong here: it deletes on signed-out too, and this is
         used in the FAQ, which is open to everyone. Someone without a password
         should still get an answer about the safari — just the general one
         covering both cases, rather than a blank where the answer was. */
      root.querySelectorAll('[data-stay-narrow]').forEach((el) => {
        if (!stay) return;
        const wanted = el.dataset.stayNarrow.split(/\s+/);
        if (!wanted.includes(stay)) el.remove();
      });
      root.querySelectorAll('[data-locked]').forEach((el) => {
        if (group) el.remove();
      });

      /* Anchors that should point at the visitor's own accommodation page. The
         href can't be written into the HTML because it differs by group, and
         hard-coding all three would put the other two in view-source for no
         reason. Signed out, the anchor goes with the rest of the locked bits. */
      root.querySelectorAll('[data-stay-link]').forEach((el) => {
        if (group) el.href = PAGE[group];
        else el.remove();
      });

      document.documentElement.dataset.group = group || 'none';
    },
  };

  window.AG = AG;
})();
