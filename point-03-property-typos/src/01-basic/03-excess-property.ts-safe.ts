/**
 * 03-excess-property — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * Constructing a value has TWO checks a read or a plain write does not:
 *
 *   MISSING required member   → TS2741 ("this literal doesn't have everything")
 *   EXCESS member on a FRESH literal → TS2561 ("this literal has something extra")
 *
 * The second is EXCESS-PROPERTY CHECKING, and it exists only for object
 * literals written directly in a typed position — see the manifesto (§3) for
 * why it is a special case rather than a consequence of ordinary structural
 * subtyping.
 */

import { section, ts, good, note, compilerSays, table, blank, shapeTrace } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export function runSafe(): void {
  section("The property map a fresh literal is checked against");
  shapeTrace([["User", "id, name, email", "interface User (this file)"]]);
  note(
    "Autocomplete inside `{ }` in a `User`-typed position offers exactly these " +
      "three keys, in this order — the completion list IS this table.",
  );

  // =========================================================================
  // 1. MISSING required member
  // =========================================================================
  blank();
  section("Constructing without a required member");

  ts('const incomplete: User = { id: "u-9", name: "Grace Hopper" };');
  compilerSays(
    "TS2741",
    "Property 'email' is missing in type '{ id: string; name: string; }' but " +
      "required in type 'User'.",
    "Required means required — an object literal that omits it is rejected, " +
      "not silently completed with `undefined`.",
  );

  // =========================================================================
  // 2. EXCESS member — a typo that is simultaneously two violations
  // =========================================================================
  blank();
  section("Constructing with a typo'd member (freshness)");

  ts('const user: User = { id: "u-9", name: "Grace Hopper", emial: "grace@example.com" };');
  // @ts-expect-error TS2561: Object literal may only specify known properties,
  // but 'emial' does not exist in type 'User'. Did you mean to write 'email'?
  const user: User = { id: "u-9", name: "Grace Hopper", emial: "grace@example.com" };
  compilerSays(
    "TS2561",
    "Object literal may only specify known properties, but 'emial' does not " +
      "exist in type 'User'. Did you mean to write 'email'?",
    "This literal is technically wrong TWICE over: 'email' (required) is " +
      "MISSING, and 'emial' (unknown) is PRESENT — ordinary structural " +
      "subtyping would already reject it for the missing 'email' alone, with " +
      "TS2741. But because 'emial' is a close spelling of a real key, the " +
      "excess-property check's suggestion heuristic reports the more useful " +
      "single diagnosis: not two unrelated complaints, but 'you meant email'.",
  );
  void user;

  note(
    "Contrast with the case excess-property checking exists FOR: a literal " +
      "that has every required member correctly, PLUS one truly extra member " +
      "(not a substitute for a real one). That literal would satisfy ordinary " +
      "structural subtyping — freshness is the only thing standing in its " +
      "way. See 03-advanced/09-excess-property-subtlety for that exact case.",
  );

  note(
    "Freshness applies only to the LITERAL, written inline. Storing an object " +
      "with an extra field in a plain variable first, then assigning it, " +
      "behaves differently — that subtlety, and exactly why, is dissected in " +
      "03-advanced/09-excess-property-subtlety.",
  );

  // =========================================================================
  // 3. The correct construction
  // =========================================================================
  blank();
  section("The correct literal");
  const correct: User = { id: "u-9", name: "Grace Hopper", email: "grace@example.com" };
  good(`Stored: id=${correct.id}, name=${correct.name}, email=${correct.email}`);

  blank();
  table(
    ["situation", "JavaScript outcome", "TypeScript diagnostic"],
    [
      ["missing required member", "field silently reads as undefined", "TS2741"],
      ["typo alongside real members", "the typo'd field is orphaned, unused", "TS2561 (freshness)"],
      ["all members correct", "works, by luck", "no diagnostic — proceeds"],
    ],
  );
}
