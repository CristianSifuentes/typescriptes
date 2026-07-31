/**
 * 07-rest-parameters — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `...nums: number[]` sets `sum`'s maximum arity to infinity (manifesto §1)
 * — any count of arguments, zero or more, is allowed — WITHOUT giving up
 * per-position typing: EVERY argument that lands in the rest group is
 * checked against the rest parameter's element type, `number`, exactly as
 * fixed positions are checked in demo 03. Variable arity and strict typing
 * are not in tension; they are two independent axes of the same signature.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

function sum(...nums: number[]): number {
  return nums.reduce((total, n) => total + n, 0);
}

export function runSafe(): void {
  section("A rest parameter's arity bounds and element type");
  callableTrace([
    ["sum", "(...nums: number[]) => number", "minimum arity 0, maximum arity ∞", "every element of nums, at every position, must be number"],
  ]);

  blank();
  section("A non-number anywhere in the argument list");

  ts('sum(1, 2, "3", 4)');
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'string' is not assignable
    // to parameter of type 'number'.
    sum(1, 2, "3", 4);
  });
  compilerSays(
    "TS2345",
    "Argument of type 'string' is not assignable to parameter of type 'number'.",
    "Every argument collected into 'nums' is checked against the REST " +
      "ELEMENT TYPE independently — position 2 in this call is exactly as " +
      "checked as a fixed, named parameter would be (demo 03). Variable " +
      "arity relaxes the COUNT constraint only; it does not relax typing " +
      "at any position, first or last.",
  );

  blank();
  section("Valid calls at different arities — all of them checked identically");

  const empty = sum();
  proveType<number>()(empty, "number", "zero arguments — a valid arity for a rest parameter, unlike a fixed one");
  good(`sum() → ${empty}`);

  const four = sum(1, 2, 3, 4);
  proveType<number>()(four, "number", "every one of the 4 arguments is a number");
  good(`sum(1, 2, 3, 4) → ${four}`);

  blank();
  table(
    ["call", "argument count", "every element assignable to number?", "outcome"],
    [
      ["sum()", "0", "vacuously yes", "compiles, returns 0"],
      ["sum(1, 2, 3, 4)", "4", "yes", "compiles, returns 10"],
      ['sum(1, 2, "3", 4)', "4", "no — position 2 is a string", "TS2345"],
    ],
  );
  note(
    "The JavaScript version's garbage result depended on WHICH position " +
      "held the bad value and what '+' happens to do with the accumulator " +
      "at that point — an accident of iteration order. TypeScript's check " +
      "is uniform across every position, so the exact index of the mistake " +
      "never changes whether or how loudly it is caught.",
  );
}
