/**
 * 06-null-undefined-arithmetic — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `strictNullChecks` removes `null` and `undefined` from every other type by
 * default, so a `number` binding can never silently BE `null` — any function
 * whose parameter is genuinely nullable must say so with a union
 * (`number | null`). The moment such a value reaches an arithmetic operator,
 * TypeScript stops you BEFORE asking what `ToNumber(null)` or
 * `ToNumber(undefined)` would even produce:
 *
 *   number | null       in arithmetic  -> TS18047 ('possibly null')
 *   number | undefined  in arithmetic  -> TS18048 ('possibly undefined')
 *
 * Crucially, this is not the SAME rule as demo 02's TS2362/TS2363 — those
 * fire because the type is categorically wrong (`string` is never numeric).
 * These fire because the type is CONDITIONALLY wrong: `number | null` is
 * "usually fine, sometimes not", and the checker forces you to eliminate the
 * "sometimes not" case by name before proceeding.
 */

import {
  section,
  ts,
  good,
  warn,
  note,
  compilerSays,
  table,
  blank,
  detonate,
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

export function runSafe(): void {
  // =========================================================================
  // 1. THE CART TOTAL, WITH AN HONEST TYPE
  // =========================================================================
  section("A discount that can be absent, typed as such");

  /** `null` = "no discount, by business decision".
   *  `undefined` = "field not yet populated" (should not reach this function). */
  function computeTotal(subtotal: number, discount: number | null): number {
    ts("subtotal - discount");
    // @ts-expect-error TS18047: 'discount' is possibly 'null'.
    const naive = subtotal - discount;
    void naive;
    compilerSays(
      "TS18047",
      "'discount' is possibly 'null'.",
      "Caught BEFORE the operator runs, which means ToNumber(null) never gets " +
        "the chance to be 'accidentally correct' — the ambiguity is resolved " +
        "in the source text, not left to the spec's arithmetic rule.",
    );
    return subtotal - (discount ?? 0);
  }

  proofBlock('the type of `discount ?? 0`');
  const total = computeTotal(100, null);
  proveType<number>()(total, "number", "?? eliminates null explicitly, in one auditable place");
  good("100 — same runtime answer as the JavaScript version, now for a stated reason.");

  // =========================================================================
  // 2. THE BUG THAT `=== null` MISSES — CAUGHT AT THE PARAMETER, NOT THE GUARD
  // =========================================================================
  blank();
  section("Why `=== null` is not enough — and how TypeScript forces the real fix");

  ts("computeTotal(100, undefined)");
  // @ts-expect-error TS2345: Argument of type 'undefined' is not assignable to parameter
  // of type 'number | null'.
  computeTotal(100, undefined);
  compilerSays(
    "TS2345",
    "Argument of type 'undefined' is not assignable to parameter of type " +
      "'number | null'.",
    "This is the real fix, and it happens at the CALL SITE, not inside " +
      "`computeTotal`. The function's signature declares which absence value " +
      "is acceptable (`null`); passing the other one is now a build error " +
      "instead of a guard silently failing to match.",
  );

  blank();
  function computeTotalPermissive(subtotal: number, discount: number | null | undefined): number {
    // Now BOTH absence values are declared, so `??` (which treats null and
    // undefined identically) is the exactly-correct tool.
    return subtotal - (discount ?? 0);
  }
  detonate("computeTotalPermissive(100, undefined)", () => computeTotalPermissive(100, undefined));
  good("100 — because the signature now tells the truth about which values can arrive.");

  // =========================================================================
  // 3. THE FULL PICTURE, TYPE BY TYPE
  // =========================================================================
  blank();
  section("null vs undefined in arithmetic: the rule, precisely");
  table(
    ["expression type", "TypeScript diagnostic", "why"],
    [
      ["number | null in +/-/*", "TS18047", "'possibly null'"],
      ["number | undefined in +/-/*", "TS18048", "'possibly undefined'"],
      ["null (bare literal) in +/-/*", "TS18050", "'the value null cannot be used here'"],
      ["undefined (bare literal) in +/-/*", "TS18050", "same code — the message names the literal"],
    ],
  );
  note(
    "All four are `strictNullChecks` diagnostics, distinct from TS2362/TS2363 " +
      "(demo 02): those reject a type that is NEVER numeric; these reject a " +
      "type that is SOMETIMES numeric, forcing the 'sometimes' to be resolved " +
      "explicitly — with `??`, a guard, or a thrown error — before arithmetic runs.",
  );

  blank();
  ts("null + 1  -- rejected as SOURCE TEXT, even as a standalone expression");
  // @ts-expect-error TS18050: The value 'null' cannot be used here.
  const bareNullPlusOne = null + 1;
  detonate("null + 1  (the runtime rule itself is untouched)", () => bareNullPlusOne);
  note(
    "TypeScript never changes what `null + 1` evaluates to. It changes " +
      "whether your SOURCE TEXT is allowed to write `null + 1` on a value " +
      "whose type says it might be null — the runtime rule is untouched; the " +
      "opportunity to invoke it by accident is what's removed.",
  );
}
