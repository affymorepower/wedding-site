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
    fdf75bab50a0c4837ee60723b01beb179ee535dcbf4b4444b8fae4ae21bcb51a: 'family',
    '2690521135fc31616e8dd9c0fa7f7fb37a67060ea42dc1edcf2c6c817e5de3ff': 'friends',
    cb8d6299e41b87f4ba06047268fb41c0347fa4d6534c3fedc0ee20815cca4692: 'town',
  };

  const KEY = 'ag.group';
  const VALID = new Set(['family', 'friends', 'town']);

  // Where each group sleeps. Two accommodation variants, three RSVP variants —
  // family and friends share a section but not a form.
  const STAY = { family: 'reserve', friends: 'reserve', town: 'town' };

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

    group: current,

    /* 'reserve' for family and friends, 'town' for everyone else, null if out. */
    stay() {
      const g = current();
      return g ? STAY[g] : null;
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

      document.documentElement.dataset.group = group || 'none';
    },
  };

  window.AG = AG;
})();
