/**
 * 09-excess-property-subtlety — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * THE case excess-property checking exists for: a literal that has every
 * REQUIRED member correctly, plus one truly extra member. Ordinary
 * structural subtyping would accept it outright (it is a superset of what's
 * required) — freshness is the ONLY thing standing in its way, and freshness
 * is a property of the EXPRESSION, not the type, so it disappears the
 * instant the same value is produced through an intermediate binding.
 */

import { section, ts, good, warn, note, compilerSays, table, blank, shapeTrace } from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

function loadLegacyDraft() {
  // Return type is INFERRED, not annotated `User` — deliberately, so this
  // function's result is not a fresh literal by the time it reaches its
  // caller.
  return { id: "u-42", name: "Radia Perlman", email: "radia@example.com", emial: "radia@example.com" };
}

export function runSafe(): void {
  section("The property map both attempts are checked against");
  shapeTrace([["User", "id, name, email", "interface User (this file)"]]);

  // =========================================================================
  // 1. Written inline — a FRESH literal — REJECTED
  // =========================================================================
  blank();
  section("Attempt 1: the literal, written directly in a User-typed position");

  ts('const direct: User = { id, name, email, emial };');
  const direct: User = {
    id: "u-42",
    name: "Radia Perlman",
    email: "radia@example.com",
    // @ts-expect-error TS2561: Object literal may only specify known
    // properties, but 'emial' does not exist in type 'User'. Did you mean to
    // write 'email'?
    emial: "radia@example.com",
  };
  compilerSays(
    "TS2561",
    "Object literal may only specify known properties, but 'emial' does not exist in type 'User'. Did you mean to write 'email'?",
    "This literal DOES have everything 'User' requires — 'id', 'name', AND a " +
      "correctly-spelled 'email'. Ordinary structural subtyping would accept " +
      "it outright. It is rejected ONLY because it is a FRESH literal " +
      "carrying an extra key the target never declared.",
  );
  void direct;

  // =========================================================================
  // 2. Same shape, via an intermediate binding — ACCEPTED
  // =========================================================================
  blank();
  section("Attempt 2: the identical shape, returned through a function first");

  ts("const viaVariable: User = loadLegacyDraft();");
  const viaVariable: User = loadLegacyDraft(); // ACCEPTED — no @ts-expect-error needed
  proofBlock("freshness lost — ordinary structural subtyping now applies");
  proveType<User>()(
    viaVariable,
    "User",
    "loadLegacyDraft()'s inferred return type is a superset of User — accepted",
  );
  good("No diagnostic. 'loadLegacyDraft()' is not a fresh literal at this call site — it is an ordinary expression of some inferred object type, and that type happens to be assignable to 'User'.");

  blank();
  warn(
    "The stray 'emial' key did not vanish — it is still sitting on " +
      "'viaVariable' at runtime, TypeScript-checked or not (see the manifesto: " +
      "excess-property checking is a TYPO HEURISTIC at one syntactic position, " +
      "not a runtime guarantee that extra keys never exist).",
  );

  // =========================================================================
  // 3. Why this is not a hole, but a scoped, deliberate boundary
  // =========================================================================
  blank();
  section("The boundary, stated precisely");
  table(
    ["expression", "is it a FRESH literal?", "subtyping accepts it?", "TypeScript's verdict"],
    [
      ["{ id, name, email, emial } inline", "yes", "yes (superset)", "REJECTED — TS2561 (freshness)"],
      ["loadLegacyDraft() (same shape)", "no", "yes (superset)", "ACCEPTED — freshness does not apply"],
    ],
  );
  note(
    "Both rows describe values with the IDENTICAL property map. The only " +
      "thing that differs is the SYNTACTIC FORM of the expression — literal " +
      "vs. everything else. This is why 'freshness' is the right word: it is " +
      "a transient property of how a value was just written, not a permanent " +
      "property of its type.",
  );
}
