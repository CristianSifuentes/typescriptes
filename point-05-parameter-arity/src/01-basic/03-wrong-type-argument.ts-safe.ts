/**
 * 03-wrong-type-argument — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `lineItemTotal(unitPrice: number, quantity: number)` — TWO required
 * numbers. A call with the right COUNT of arguments still has each argument
 * checked independently against ITS OWN position's declared type (manifesto
 * §3, step 3). Arity and type checking are separate steps for a reason: a
 * call can pass one and fail the other, exactly as this demo shows.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

function lineItemTotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}

export function runSafe(): void {
  section("Per-position types, independent of the count check");
  callableTrace([
    ["lineItemTotal", "(unitPrice: number, quantity: number) => number", "position 0: number, position 1: number", "arity is right at 2 arguments; TYPE is checked separately, per position"],
  ]);

  blank();
  section("The right count, the wrong type at position 1");

  ts('lineItemTotal(19.99, "3")');
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'string' is not assignable
    // to parameter of type 'number'.
    lineItemTotal(19.99, "3");
  });
  compilerSays(
    "TS2345",
    "Argument of type 'string' is not assignable to parameter of type 'number'.",
    "The call supplies exactly 2 arguments — arity is satisfied. This is a " +
      "PURE type failure at position 1, independent of the count check " +
      "demos 01/02 dissect. Crucially, it is rejected REGARDLESS of whether " +
      "the string happens to look numeric (\"3\") or not (\"3 units\") — the " +
      "compiler checks the STATIC TYPE 'string', not the runtime content, " +
      "so it can't be fooled by a coincidentally-numeric-looking value the " +
      "way JavaScript's '*' coercion was.",
  );

  blank();
  section("The correct call");

  const total = lineItemTotal(19.99, 3);
  proveType<number>()(total, "number", "both arguments really are numbers — no coercion involved, none needed");
  good(`lineItemTotal(19.99, 3) → ${total}`);

  blank();
  table(
    ["quantity argument", "assignable to number?", "TypeScript diagnostic"],
    [
      ["3 (number)", "yes", "none"],
      ['"3" (string, numeric-looking)', "no", "TS2345 — rejected regardless of content"],
      ['"3 units" (string, non-numeric)', "no", "TS2345 — the SAME diagnostic, not a different one"],
    ],
  );
  note(
    "In JavaScript, whether this bug produced a coincidentally-correct " +
      "number or an outright 'NaN' depended on the EXACT STRING CONTENT at " +
      "runtime — an accident of formatting. TypeScript's rejection depends " +
      "only on the STATIC TYPE, so it is identical and immediate for every " +
      "string, numeric-looking or not.",
  );
}
