/**
 * 03-truthy-falsy-coercion — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * An uncomfortable truth up front: TypeScript does NOT reject `itemsInStock
 * || "unset"` when `itemsInStock: number | undefined`. Both operands are
 * legally-typed for `||`, so there is no TYPE error — the bug ("0 is treated
 * as unset") is a LOGIC error, and a type checker checks types, not intent.
 * This is the same boundary drawn in point-01 (`sort()` vs `sort((a,b)=>a-b)`).
 *
 * What TypeScript DOES give you here:
 *   1. `strictNullChecks` makes the "possibly absent" case a real, visible
 *      type (`number | undefined`) instead of a silent runtime surprise.
 *   2. `??` (nullish coalescing) is a SEPARATE operator with a narrower,
 *      correct meaning ("only if null/undefined"), and the type system
 *      proves its result type precisely enough to show the difference.
 *   3. Comparisons that can never be true (`note === false` when `note` is
 *      `string`) ARE type errors (TS2367) — because that IS a type fact.
 */

import {
  section,
  ts,
  good,
  warn,
  note as printNote,
  compilerSays,
  table,
  blank,
  detonate,
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

export function runSafe(): void {
  // =========================================================================
  // 1. `||` vs `??` — same falsy list, different operator, provably different types
  // =========================================================================
  section("`||` compiles on a real bug — `??` is the operator that fixes it");

  function describeStockLoose(itemsInStock: number | undefined): number | string {
    return itemsInStock || "quantity not yet counted"; // no type error — and still a bug
  }
  function describeStockCorrect(itemsInStock: number | undefined): number | string {
    return itemsInStock ?? "quantity not yet counted"; // only null/undefined fall through
  }

  ts("itemsInStock || fallback   -- compiles, but 0 is treated as absent");
  detonate("describeStockLoose(0)", () => describeStockLoose(0));
  warn(
    "TypeScript raised NO error here. `number | undefined` is a perfectly " +
      "legal left operand for `||`. This is the honest limit: a type checker " +
      "proves things about TYPES, and '0 means empty shelf, not unset' is " +
      "business logic, not a type fact.",
  );

  blank();
  ts("itemsInStock ?? fallback  -- only null/undefined trigger the fallback");
  detonate("describeStockCorrect(0)", () => describeStockCorrect(0));
  good("0 — the real stock count survives, because `??` checks for null/undefined ONLY.");

  proofBlock("what each operator's result type reveals");
  proveType<number | string>()(describeStockLoose(0), "number | string", "|| can still return the fallback for 0");
  proveType<number | string>()(describeStockCorrect(0), "number | string", "?? returns the fallback only for null/undefined");
  printNote(
    "Both have the SAME static type. The type system cannot tell you which " +
      "operator expresses your intent — only you can. What it gives you is " +
      "`??` existing as a distinct, correctly-scoped tool, and `strictNullChecks` " +
      "making 'this value might be absent' something you must confront at all.",
  );

  // =========================================================================
  // 2. Comparisons TypeScript CAN reject: no possible overlap
  // =========================================================================
  blank();
  section("A truthiness check that IS a type error");

  function describeOrderNote(orderNote: string): string {
    ts('if (orderNote === false)');
    // @ts-expect-error TS2367: This comparison appears to be unintentional because the
    // types 'string' and 'boolean' have no overlap.
    if (orderNote === false) {
      return "unreachable";
    }
    return orderNote ? `Note: ${orderNote}` : "No note attached";
  }
  compilerSays(
    "TS2367",
    "This comparison appears to be unintentional because the types 'string' " +
      "and 'boolean' have no overlap.",
    "`orderNote` can never literally equal `false` — a `string` and a " +
      "`boolean` inhabit disjoint sets. This IS a type fact, so it IS caught.",
  );

  blank();
  detonate('describeOrderNote("")', () => describeOrderNote(""));
  warn(
    '"No note attached" for an explicit empty string — still the SAME logic ' +
      "bug as `describeStockLoose`, and still not a type error, for the same " +
      "reason. The fix is the same: prefer an explicit check " +
      "(`orderNote.length === 0` with a clear name) over relying on truthiness " +
      "when 'empty' and 'absent' must be told apart.",
  );

  // =========================================================================
  // 3. NaN: strictNullChecks doesn't apply, but explicit guards do
  // =========================================================================
  blank();
  section("Guarding against NaN explicitly, instead of relying on falsiness");

  function applyDiscountIfValid(price: number, discountPercent: number): number {
    ts("if (discountPercent > 0)  -- an explicit, NaN-proof condition");
    // `NaN > 0` is `false` (NaN compares false to everything), so this reads
    // as correct — but it is correct by ACCIDENT of comparison semantics, not
    // because the type system verified `discountPercent` is not NaN.
    if (discountPercent > 0 && Number.isFinite(discountPercent)) {
      return price - price * (discountPercent / 100);
    }
    return price;
  }

  proofBlock("the type `number` includes NaN — TypeScript cannot exclude it");
  proveType<number>()(NaN, "number", "NaN's typeof is 'number'; there is no separate NaN type");

  detonate("applyDiscountIfValid(100, NaN)", () => applyDiscountIfValid(100, NaN));
  good("100 — unchanged, because the guard checks `Number.isFinite` explicitly.");
  printNote(
    "`Number.isFinite` is a RUNTIME check with no corresponding type-level " +
      "narrowing (there is no `number & NotNaN` type). Keeping NaN out of a " +
      "computation is validated, not typed — the same distinction as the " +
      "boundary-parsing pattern in demo 02.",
  );

  // =========================================================================
  // 4. The eight falsy values, and which of them strictNullChecks actually touches
  // =========================================================================
  blank();
  section("What `strictNullChecks` changes about this list, precisely");
  table(
    ["falsy value", "made visible in the TYPE by strictNullChecks?", "why"],
    [
      ["null, undefined", "yes", "removed from every other type; must appear explicitly in a union"],
      ["0, -0, 0n, NaN", "no", "still just `number`/`bigint` — no literal-zero exclusion exists"],
      ['""', "no", "still just `string` — no literal-empty exclusion exists"],
      ["false", "no", "still just `boolean` — both members are equally valid"],
    ],
  );
  printNote(
    "This is the precise, honest boundary: TypeScript's truthiness-adjacent " +
      "guarantee is entirely about null/undefined. The other six falsy values " +
      "remain a JavaScript runtime concept the type system does not model.",
  );
}
