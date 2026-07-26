/**
 * 07-abstract-equality-algorithm — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * TypeScript does not (and cannot) type-check the CONTROL FLOW of
 * `IsLooselyEqual` — it is a runtime algorithm, erased before it ever
 * matters to the checker. What TypeScript gives you instead is a way to
 * build a TYPED equality helper whose signature makes miscalls a compile
 * error, so the eleven-branch algorithm from the .js-broken file is never
 * reachable with the wrong operand types in the first place.
 *
 * The generic constraint below is a hand-built, narrower cousin of the same
 * "do these types overlap?" analysis `tsc` performs internally for TS2367
 * (demo 04) — reproduced here explicitly so the mechanism is visible rather
 * than a compiler black box.
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
  coercionStep,
  coercionPipeline,
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

// =============================================================================
// 1. THE COERCION STEPS, TYPED — a transparent reimplementation of ToNumber
// =============================================================================

type Coercible = string | number | boolean | null | undefined;

/** A typed, traced ToNumber. Every branch is a real spec rule, not a guess. */
function toNumberTraced(value: Coercible): number {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") {
    const result = value ? 1 : 0;
    coercionStep(`ToNumber(${value})`, String(result), "true/false -> 1/0");
    return result;
  }
  if (value === null) {
    coercionStep("ToNumber(null)", "0", "explicit spec rule");
    return 0;
  }
  if (value === undefined) {
    coercionStep("ToNumber(undefined)", "NaN", "explicit spec rule");
    return NaN;
  }
  const result = Number(value);
  coercionStep(`ToNumber(${JSON.stringify(value)})`, String(result), "StringNumericLiteral grammar, or NaN");
  return result;
}

// =============================================================================
// 2. A TYPED LOOSE-EQUALITY HELPER: the type system decides what may be compared
// =============================================================================

/** True iff two types could conceivably share a runtime value. */
type Overlaps<A, B> = A extends B ? true : B extends A ? true : false;

/**
 * A generic loose-equality helper that is ONLY callable when the operand
 * types overlap. Unlike raw `==`, which accepts (and coerces) any pair of
 * types, this makes the "these are unrelated types" mistake a build error —
 * mirroring TS2367, but as a reusable, explicit API rather than a special
 * case wired into the `==` operator.
 */
function typedLooseEquals<A extends Coercible, B extends Coercible>(
  a: A,
  b: B,
  ...witness: Overlaps<A, B> extends true ? [] : [proof: never]
): boolean {
  void witness;
  coercionPipeline(`typedLooseEquals(${JSON.stringify(a)}, ${JSON.stringify(b)})`);
  if (typeof a === typeof b) {
    coercionStep("typeof a === typeof b", "true", "no coercion needed");
    return (a as unknown) === (b as unknown);
  }
  const numericA = toNumberTraced(a);
  const numericB = toNumberTraced(b);
  return numericA === numericB;
}

export function runSafe(): void {
  section("A typed, traced ToNumber — the same rules, made explicit");

  proofBlock("ToNumber, reimplemented with a total, typed signature");
  proveType<number>()(toNumberTraced(null), "number", "");
  proveType<number>()(toNumberTraced(undefined), "number", "");
  proveType<number>()(toNumberTraced(true), "number", "");
  proveType<number>()(toNumberTraced("42"), "number", "");

  // =========================================================================
  // 3. THE COMPILE-TIME CATCH: unrelated types can never reach `typedLooseEquals`
  // =========================================================================
  blank();
  section("Overlapping types: allowed, and traced");

  const currentUserLevel: number = 1;
  const ADMIN_LEVEL = 1; // the literal type `1`, which extends `number`

  ts("typedLooseEquals(currentUserLevel, ADMIN_LEVEL)  -- `1` extends `number`: they overlap");
  const isAdmin = typedLooseEquals(currentUserLevel, ADMIN_LEVEL);
  proveType<boolean>()(isAdmin, "boolean", "");
  good(`typedLooseEquals(1, 1) = ${isAdmin} — every step traced, same answer as real \`==\`.`);

  blank();
  section("Non-overlapping types: a compile error, before any coercion is attempted");

  const isVerified = true;
  const statusLabel = "yes";

  ts('typedLooseEquals(isVerified, statusLabel)');
  // @ts-expect-error TS2554: Expected 3 arguments, but got 2 — the witness tuple has no
  // member a boolean/string pair can supply, so it becomes a mandatory 3rd argument.
  typedLooseEquals(isVerified, statusLabel);
  compilerSays(
    "TS2554",
    "Expected 3 arguments, but got 2.",
    "`boolean` and `string` share no common member as TYPES (even though " +
      "`true == \"yes\"` would run a real ToNumber coercion at runtime), so " +
      "`Overlaps` resolves to `false` and the trailing witness parameter " +
      "becomes MANDATORY — and nothing can supply a `never`. This mirrors " +
      "real TS2367 exactly: demo 04 showed `boolean == string` rejected by " +
      "the built-in `==` operator for the identical reason.",
  );

  // =========================================================================
  // 4. `===`: ZERO steps, by construction
  // =========================================================================
  blank();
  section("`===` skips every step above — verified by absence of trace output");
  table(
    ["expression", "steps traced by typedLooseEquals's algorithm", "steps === actually takes"],
    [
      ['"1" == 1', "typeof mismatch -> ToNumber(\"1\") -> compare", "0 (=== never runs coercion)"],
      ['"" == 0', "typeof mismatch -> ToNumber(\"\") -> compare", "0"],
      ["null == undefined", "special-cased pair -> true", "0"],
    ],
  );
  ts('"1" === 1');
  // @ts-expect-error TS2367: This comparison appears to be unintentional because the types
  // 'string' and 'number' have no overlap.
  const literalMismatch = "1" === 1;
  detonate('"1" === 1', () => literalMismatch);
  compilerSays(
    "TS2367",
    "This comparison appears to be unintentional because the types 'string' " +
      "and 'number' have no overlap.",
    "TS2367 applies EQUALLY to `===`/`!==` and `==`/`!=` — the rule is about " +
      "whether the comparison can ever be anything but a constant, which has " +
      "nothing to do with which equality operator was chosen.",
  );

  blank();
  detonate("null === undefined", () => null === undefined);
  note(
    "`null === undefined` compiles (both are legal `===` operands with no " +
      "disjointness issue — TypeScript's null/undefined exemption applies " +
      "here too) and is `false` with ZERO calls into the coercion machinery " +
      "this file spent 100 lines reproducing. That absence — not a cleverer " +
      "algorithm — is the entire performance and predictability case for `===`.",
  );
}
