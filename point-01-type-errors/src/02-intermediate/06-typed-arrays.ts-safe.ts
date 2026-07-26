/**
 * 06-typed-arrays — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `number[]` is a *homogeneity claim*: every element of this array is a number,
 * now and after every future mutation. The compiler enforces it at three
 * separate sites — construction, mutation, and consumption.
 *
 * This demo also contains the most philosophically interesting flag in the
 * project: `noUncheckedIndexedAccess`. It makes `arr[0]` have type
 * `number | undefined` — which annoys people until they realise the alternative
 * is the compiler LYING about a fact it cannot possibly know.
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
  compileTimeOnly,
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

/** A geographic coordinate: exactly two components, in a fixed order. */
type LatLong = readonly [latitude: number, longitude: number];

export function runSafe(): void {
  // =========================================================================
  // 1. CONSTRUCTION
  // =========================================================================
  section("Homogeneity is checked when the array is built");

  ts('const lineTotals: number[] = [1200, 3400, "5600"];');
  // @ts-expect-error TS2322: Type 'string' is not assignable to type 'number'.
  const mixed: number[] = [1200, 3400, "5600"];
  void mixed;
  compilerSays(
    "TS2322",
    "Type 'string' is not assignable to type 'number'.",
    "The diagnostic points at the offending ELEMENT, not at the array. The " +
      '"46005600" fold from the JavaScript version cannot be set in motion.',
  );

  // =========================================================================
  // 2. MUTATION
  // =========================================================================
  blank();
  section("Homogeneity is checked at every mutation, forever");

  const quantities: number[] = [1, 2, 3];
  ts('quantities.push("4");');
  // @ts-expect-error TS2345: Argument of type 'string' is not assignable to parameter
  // of type 'number'.
  quantities.push("4");
  compilerSays(
    "TS2345",
    "Argument of type 'string' is not assignable to parameter of type 'number'.",
    "`push` on `number[]` has signature `(...items: number[]) => number`. The " +
      "claim made at construction is enforced for the array's whole lifetime, " +
      "including in files written years later.",
  );

  const frozen: readonly number[] = [1, 2, 3];
  ts("const frozen: readonly number[] = [...]; frozen.push(4);");
  compileTimeOnly(() => {
    // @ts-expect-error TS2339: Property 'push' does not exist on type 'readonly number[]'.
    frozen.push(4);
  });
  compilerSays(
    "TS2339",
    "Property 'push' does not exist on type 'readonly number[]'.",
    "`readonly T[]` simply does not declare the mutating members. Immutability " +
      "by absence rather than by convention — and, like everything else here, " +
      "erased at runtime: `Object.freeze` is the runtime tool, this is the " +
      "compile-time one.",
  );

  // =========================================================================
  // 3. CONSUMPTION — and the honest treatment of indices
  // =========================================================================
  blank();
  section("`noUncheckedIndexedAccess`: the compiler refuses to lie about bounds");

  const totals: number[] = [1200, 3400, 5600];

  proofBlock("what an index access actually yields");
  const first = totals[0];
  proveType<number | undefined>()(
    first,
    "number | undefined",
    "the compiler cannot know index 0 is in range",
  );

  ts("totals[0].toFixed(2)");
  // @ts-expect-error TS2532: Object is possibly 'undefined'.
  const formatted = totals[0].toFixed(2);
  void formatted;
  compilerSays(
    "TS2532",
    "Object is possibly 'undefined'.",
    "This is the flag doing exactly its job. `totals[99]` and `totals[0]` are " +
      "indistinguishable to the type system — both are `number[]` indexed by " +
      "`number`. Without this flag the compiler would type both as `number`, " +
      "which is FALSE for one of them, and the falsehood would be discovered " +
      "at runtime by `.toFixed`.",
  );
  warn(
    "Most projects turn this flag off because it is noisy. Understand what you " +
      "are buying: quieter code in exchange for the compiler asserting " +
      "something it has not proved.",
  );

  blank();
  note("The four disciplined ways to consume an element:");

  const viaGuard = totals[0];
  if (viaGuard !== undefined) {
    proveType<number>()(viaGuard, "number", "narrowed by an explicit check");
  }
  const viaDefault = totals[0] ?? 0;
  proveType<number>()(viaDefault, "number", "?? supplies the missing case");
  const viaAt = totals.at(-1);
  proveType<number | undefined>()(viaAt, "number | undefined", "`at` is honest by design");
  const viaIteration = totals.reduce((sum, value) => sum + value, 0);
  proveType<number>()(viaIteration, "number", "iteration never produces an out-of-range index");

  good(
    "The last one is the real lesson: iteration methods (`reduce`, `for..of`, " +
      "`map`) hand you elements, not indices, so they sidestep the bounds " +
      "question entirely — no index, no `undefined`, no flag needed.",
  );

  // =========================================================================
  // 4. TUPLES — arity and position as types
  // =========================================================================
  blank();
  section("Tuples: when the LENGTH and the ORDER carry meaning");

  ts("const badCoordinate: LatLong = [52.52, 13.4, 0];");
  // @ts-expect-error TS2322: Type '[number, number, number]' is not assignable to
  // type 'LatLong'. Source has 3 element(s) but target allows only 2.
  const badCoordinate: LatLong = [52.52, 13.4, 0];
  void badCoordinate;
  compilerSays(
    "TS2322",
    "Type '[number, number, number]' is not assignable to type 'LatLong'.",
    "Arity is part of a tuple's type. The silently-dropped third component " +
      "from the JavaScript version is a build error.",
  );

  const berlin: LatLong = [52.52, 13.4];
  ts("berlin[0] = 0;");
  compileTimeOnly(() => {
    // @ts-expect-error TS2540: Cannot assign to '0' because it is a read-only property.
    berlin[0] = 0;
  });
  compilerSays(
    "TS2540",
    "Cannot assign to '0' because it is a read-only property.",
    "A `readonly` tuple is checked positionally AND for mutation.",
  );

  proofBlock("tuple members are individually typed and NOT possibly-undefined");
  proveType<number>()(berlin[0], "number", "index 0 provably exists in a 2-tuple");
  proveType<number>()(berlin[1], "number", "index 1 provably exists in a 2-tuple");
  good(
    "No `| undefined` here, and no flag needed: a tuple's length is known " +
      "statically, so the bounds question is decided at compile time.",
  );

  blank();
  note(
    "Labelled tuple members (`[latitude: number, longitude: number]`) do not " +
      "prevent passing them in the wrong order — both are `number`. For that, " +
      "brand them, exactly as in demo 04.",
  );

  // =========================================================================
  // 5. THE PROGRAM THAT COMPILES
  // =========================================================================
  blank();
  section("The correct program");

  const invoiceTotal = totals.reduce((sum, value) => sum + value, 0);
  const sortedTotals = [...totals].sort((a, b) => a - b);
  const largest = totals.length > 0 ? Math.max(...totals) : 0;

  proveType<number>()(invoiceTotal, "number", "seeded reduce over number[]");
  proveType<number[]>()(sortedTotals, "number[]", "copy, then numeric comparator");
  proveType<number>()(largest, "number", "empty case handled explicitly");

  blank();
  detonate("invoice total", () => invoiceTotal);
  detonate("sorted", () => sortedTotals);
  detonate("largest", () => largest);

  blank();
  table(
    ["defect", "JavaScript", "TypeScript", "code"],
    [
      ["mixed element in literal", '"46005600"', "rejected", "TS2322"],
      ["push of wrong type", "heterogeneous array", "rejected", "TS2345"],
      ["mutating a frozen array", "silently succeeds", "rejected", "TS2339"],
      ["out-of-range index", "undefined, then TypeError", "rejected", "TS2532/TS18048"],
      ["empty-array reduce with no seed", "TypeError", "seed required by the type", "TS2554"],
      ["too many tuple components", "silently dropped", "rejected", "TS2322"],
      ["writing to a readonly tuple", "silently succeeds", "rejected", "TS2540"],
      ["default `.sort()` on numbers", "[10, 100, 9]", "*accepted* — logic bug", "none"],
    ],
  );
  note(
    "The last row again marks the boundary: `.sort()` without a comparator is " +
      "type-correct and semantically wrong. Type systems catch type errors.",
  );
}
