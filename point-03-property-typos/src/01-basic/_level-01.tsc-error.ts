/**
 * EVIDENCE FIXTURE — level 01 (basic)
 * ---------------------------------------------------------------------------
 * Excluded from `tsconfig.json`; compiled only by `tsconfig.evidence.json`
 * (`npm run evidence`). Every error below is real and unsuppressed.
 *
 * Expected outcome: compilation FAILS. That is the deliverable.
 */

interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}
declare const user: User;

// ===========================================================================
// 01 — READING A MISSPELLED PROPERTY
// ===========================================================================

/** TS2551: Property 'nam' does not exist on type 'User'. Did you mean 'name'? */
const misread = user.nam;

/** TS2339: Property 'username' does not exist on type 'User'. (no suggestion) */
const nonExistent = user.username;

// ===========================================================================
// 02 — WRITING TO A MISSPELLED PROPERTY
// ===========================================================================

const draft: { id: string; totalCents: number } = { id: "o-2", totalCents: 100 };

/** TS2339: Property 'totlaCents' does not exist on type '{ id: string; totalCents: number; }'. */
draft.totlaCents = 9_900;

// ===========================================================================
// 03 — EXCESS-PROPERTY CHECKING ON OBJECT LITERALS
// ===========================================================================

/** TS2741: Property 'email' is missing in type '{ id: string; name: string; }' but required in type 'User'. */
const incomplete: User = { id: "u-9", name: "Grace Hopper" };

/** TS2561: Object literal may only specify known properties, but 'emial' does not exist in type 'User'. Did you mean to write 'email'? */
const typoLiteral: User = { id: "u-9", name: "Grace Hopper", emial: "grace@example.com" };

export const evidence = { misread, nonExistent, draft, incomplete, typoLiteral };
