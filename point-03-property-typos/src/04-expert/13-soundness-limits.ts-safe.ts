/**
 * 13-soundness-limits — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * Every mechanism in this project protects the DECLARED shape of a value —
 * never the actual data the world sends you. Four constructs reopen the
 * typo door this project has spent twelve demos closing, each for a
 * different, precise reason:
 *
 *   `any`             — has no property map to check a name against
 *   `as T`             — the ASSERTION itself is unchecked (you can lie)
 *   `as unknown as T`  — defeats even the 'sufficient overlap' guard
 *   dynamic string key — IS caught (TS7053)... until cast away
 */

import { section, ts, good, warn, note, compilerSays, table, blank } from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

function fakeApiResponse(): any {
  // `JSON.parse` returns `any` — there is NO type here to check a name
  // against, by construction. This is the I/O boundary (manifesto §2).
  return JSON.parse('{"id":"u-1","name":"Ada Lovelace","usre":"legacy-field"}');
}

export function runSafe(): void {
  // =========================================================================
  // 1. `any` — no property map at all
  // =========================================================================
  section("(a) any — JSON.parse's return type has no property map");

  const response = fakeApiResponse();
  ts("response.email  — response: any");
  const email = response.email; // compiles: `any` has no members to check against
  proveType<any>()(email, "any", "no @ts-expect-error needed — `any` accepts every access, right or wrong");
  warn("Compiles. Also `undefined` at runtime, for exactly the reason the JS version showed.");
  note("Fix: never let `JSON.parse`'s `any` escape uninspected — validate at the edge (demo 09, point-13's own advice).");

  // =========================================================================
  // 2. `as T` — the assertion itself is unchecked
  // =========================================================================
  blank();
  section("(b) as T — a value the checker trusts you about, not one it verified");

  const raw = { id: "u-2", name: "Katherine Johnson" }; // no 'email' at all
  ts("raw as User  — 'raw' structurally lacks 'email' entirely");
  const asserted = raw as User; // compiles: `User` is assignable to `typeof raw`,
  // so the assertion's "sufficient overlap" check passes in the OTHER
  // direction — this is not a bug, it is exactly how `as` is specified.
  proveType<User>()(asserted, "User", "the compiler now BELIEVES this is a User — nothing it verified says so");
  warn("`asserted.email` compiles and returns `undefined` at runtime: the type says `string`, the data disagrees.");

  // =========================================================================
  // 3. `as unknown as T` — defeats the overlap guard entirely
  // =========================================================================
  blank();
  section("(c) as unknown as T — even the loosest guard, bypassed");

  const notEvenAnObject: string = "not a user at all";
  ts("notEvenAnObject as User  — a bare string, no overlap with User whatsoever");
  compilerSays(
    "TS2352",
    "Conversion of type 'string' to type 'User' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.",
    "This is the ONE guard `as` has: if the two types share nothing, the " +
      "assertion is rejected outright — UNLESS you follow the compiler's own " +
      "suggestion.",
  );
  const doublyAsserted = notEvenAnObject as unknown as User; // compiles — the guard is gone
  proofBlock("the overlap guard, defeated");
  proveType<User>()(
    doublyAsserted,
    "User",
    "compiles cleanly; 'doublyAsserted' is, at runtime, a STRING",
  );
  warn("doublyAsserted.email.length would throw: 'Cannot read properties of undefined'. The type system said string; the runtime disagreed on all counts.");

  // =========================================================================
  // 4. Dynamic string keys — CAUGHT, unless deliberately widened
  // =========================================================================
  blank();
  section("(d) a genuinely dynamic key — caught by default, reopened only on request");

  const user: User = { id: "u-3", name: "Grace Hopper", email: "grace@example.com" };
  const fieldName: string = "email"; // decided at runtime — could be anything

  ts("user[fieldName]  — fieldName is `string`, not a keyof User literal");
  // @ts-expect-error TS7053: Element implicitly has an 'any' type because
  // expression of type 'string' can't be used to index type 'User'. No index
  // signature with a parameter of type 'string' was found on type 'User'.
  const dynamicRead = user[fieldName];
  void dynamicRead;
  compilerSays(
    "TS7053",
    "Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'User'.",
    "By DEFAULT this is rejected — 'User' has no index signature, so a " +
      "non-literal string key has no property map entry to resolve against. " +
      "This is the checker refusing to silently grant `any`.",
  );
  const safeDynamicRead = (user as unknown as Record<string, unknown>)[fieldName];
  warn("Only an explicit, visible cast like this reopens it — the danger is opt-in, not a default hole.");
  void safeDynamicRead;

  // =========================================================================
  // Summary
  // =========================================================================
  blank();
  section("Where TypeScript protects you, and where it stops");
  table(
    ["construct", "does it check the DECLARED shape?", "does it check the ACTUAL data?"],
    [
      ["'.' access on a declared type (demos 01-12)", "yes, always", "never — that is what 'declared' means"],
      ["any (JSON.parse, etc.)", "no property map exists", "no"],
      ["as T (single overlap)", "the ASSERTION is unchecked", "no"],
      ["as unknown as T (double)", "the overlap guard is bypassed too", "no"],
      ["obj[dynamicKey], no index sig.", "yes — TS7053 by default", "n/a — rejected before runtime"],
    ],
  );
  good(
    "The common thread: TypeScript verifies that YOUR CODE is internally " +
      "consistent with the types YOU declared. It cannot verify that a " +
      "declared type matches reality at the edge of the program — that is " +
      "always a promise made by a human, at an `any`, an `as`, or a schema " +
      "validator that was (or wasn't) actually wired up.",
  );
}
