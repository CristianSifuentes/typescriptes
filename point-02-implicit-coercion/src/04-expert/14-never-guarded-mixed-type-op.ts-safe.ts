/**
 * 14-never-guarded-mixed-type-op — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * The simplest fix for `sum` is `function sum(values: number[]): number` —
 * that alone rejects `sum([1, "2", 3])` with an ordinary TS2322 on the array
 * literal. This demo goes one step further, as the series' capstone: a
 * GENERIC `sum` that infers its element type and uses a `never`-typed
 * witness parameter (the same technique built in demo 07) to reject any
 * array whose inferred element type is not `number`, with a message that
 * names the exact offending union.
 *
 * This is `never` doing the same job it does throughout `point-01-type-
 * errors`: `never` is the empty set (manifesto §3 of that project). A
 * function parameter typed `never` can accept no argument at all, so making
 * it MANDATORY exactly when "not all-numbers" is true converts a semantic
 * requirement ("every element must be a number") into a syntactic
 * impossibility ("this call cannot be written").
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
import { proveType } from "../99-runner/type-assert.js";

/** True iff every element of the tuple/array type `T` is exactly `number`. */
type AllNumbers<T extends readonly unknown[]> = T extends readonly (infer U)[]
  ? [U] extends [number]
    ? true
    : false
  : false;

/** The actual arithmetic, run only once every caller's guard has passed. */
function reduceNumbers(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Sums a list that the COMPILER has verified is all-`number`. A call whose
 * inferred element type includes anything else fails to compile, because
 * the trailing witness becomes a mandatory, unsatisfiable `never` parameter.
 */
function sum<T extends readonly unknown[]>(
  values: T,
  ...witness: AllNumbers<T> extends true ? [] : [proof: never]
): number {
  void witness;
  return reduceNumbers(values as readonly number[]);
}

function average<T extends readonly unknown[]>(
  values: T,
  ...witness: AllNumbers<T> extends true ? [] : [proof: never]
): number {
  void witness;
  return reduceNumbers(values as readonly number[]) / values.length;
}

export function runSafe(): void {
  // =========================================================================
  // 1. THE ALL-NUMBERS CASE: NO WITNESS NEEDED, ORDINARY ARITHMETIC
  // =========================================================================
  section("A homogeneous list: compiles, and computes exactly what it says");

  ts("sum([19.99, 1.65, 3.50])");
  const total = sum([19.99, 1.65, 3.50]);
  proveType<number>()(total, "number", "AllNumbers<[number,number,number]> is true — no witness required");
  detonate("sum (normal)", () => total);
  good("25.14 — the entire array was verified numeric BEFORE the reduce ever ran.");

  // =========================================================================
  // 2. A STRAY STRING: A COMPILE ERROR, NOT A CONCATENATED RESULT
  // =========================================================================
  blank();
  section("One stray string element: rejected before any coercion runs");

  ts('sum([19.99, 1.65, "3.50"])');
  // @ts-expect-error TS2554: Expected 2 arguments, but got 1 — the witness tuple has no
  // member a `number | string` element type can supply.
  sum([19.99, 1.65, "3.50"]);
  compilerSays(
    "TS2554",
    "Expected 2 arguments, but got 1.",
    "The array literal's inferred element type is `number | string`, so " +
      "`AllNumbers<...>` resolves to `false` and the witness tuple `[proof: " +
      "never]` becomes a mandatory SECOND argument — nothing can supply a " +
      "`never`, so the call cannot be written at all. The famous " +
      "`\"25.143.50\"` concatenation bug never gets the chance to happen.",
  );

  // =========================================================================
  // 3. undefined AND null: THE SAME GUARD, THE SAME OUTCOME
  // =========================================================================
  blank();
  section("undefined/null elements: also rejected — not just wrong strings");

  ts("sum([19.99, undefined, 3.50])");
  // @ts-expect-error TS2554: Expected 2 arguments, but got 1.
  sum([19.99, undefined, 3.50]);
  compilerSays(
    "TS2554",
    "Expected 2 arguments, but got 1.",
    "`number | undefined` is not `[U] extends [number]`, so this array is " +
      "rejected identically to the string case — demo 06's null/undefined " +
      "arithmetic bugs are closed by the SAME mechanism as demo 02's string " +
      "coercion bugs, because both reduce to 'not every element is `number`'.",
  );

  // =========================================================================
  // 4. average() INHERITS THE SAME GUARANTEE, FOR FREE
  // =========================================================================
  blank();
  section("`average` applies the identical guard — the guarantee is uniform");

  const avg = average([19.99, 1.65, 3.50]);
  proveType<number>()(avg, "number", "");
  detonate("average (normal)", () => avg);
  good("8.38 — and a mixed-type call to `average` fails to compile for the identical reason `sum` does.");

  // =========================================================================
  // 5. THE FULL TABLE, RESOLVED
  // =========================================================================
  blank();
  section("Every case from the JavaScript demo, now resolved");
  table(
    ["call", "element types", "JavaScript result", "TypeScript verdict"],
    [
      ["sum([1, 2, 3])", "all number", "6", "accepted"],
      ['sum([1, "2", 3])', "number | string", '"33"', "rejected — witness unsatisfiable"],
      ["sum([1, undefined, 3])", "number | undefined", "NaN", "rejected — witness unsatisfiable"],
      ["sum([1, null, 3])", "number | null", "4 (accidentally 'correct')", "rejected — witness unsatisfiable"],
      ["sum(['a', 'b'])", "string", '"ab"', "rejected — U is string, not number"],
    ],
  );
  note(
    "Every row that was 'silently wrong' — including the one that was " +
      "'accidentally correct' — is now a build failure. `sum(['a','b'])`, " +
      "which returned a plausible-looking string with zero exceptions in " +
      "plain JavaScript, cannot be written at all in this file.",
  );
}
