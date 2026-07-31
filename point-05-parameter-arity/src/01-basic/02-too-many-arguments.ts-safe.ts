/**
 * 02-too-many-arguments — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `addSurcharge(base: number, surcharge: number)` declares a MAXIMUM arity
 * of 2 (manifesto §1 — no rest parameter, so the upper bound is fixed, not
 * infinite). Supplying a third argument violates that upper bound at the
 * same COUNTING step (manifesto §3, step 2) that catches too few — TS2554
 * reports both directions with the same mechanism, just a different
 * comparison.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

function addSurcharge(base: number, surcharge: number): number {
  return base + surcharge;
}

export function runSafe(): void {
  section("The declared parameter list, and its FIXED upper bound");
  callableTrace([
    ["addSurcharge", "(base: number, surcharge: number) => number", "exactly 2 parameters, no rest", "maximum arity 2 — not unbounded"],
  ]);

  blank();
  section("Calling with a third argument");

  ts("addSurcharge(100, 5, 10)");
  compileTimeOnly(() => {
    // @ts-expect-error TS2554: Expected 2 arguments, but got 3.
    addSurcharge(100, 5, 10);
  });
  compilerSays(
    "TS2554",
    "Expected 2 arguments, but got 3.",
    "Same mechanism as demo 01's TS2554, the OTHER direction: the supplied " +
      "count (3) falls outside the declared bounds ([2, 2], since there is " +
      "no rest parameter to make the upper bound unbounded). The extra " +
      "argument is never silently accepted and discarded — its mere " +
      "presence is the error.",
  );

  blank();
  section("The correct call");

  const total = addSurcharge(100, 5);
  proveType<number>()(total, "number", "exactly 2 arguments, both numbers — within bounds and correctly typed");
  good(`addSurcharge(100, 5) → ${total}`);

  blank();
  table(
    ["call", "arguments supplied", "declared bounds", "outcome"],
    [
      ["addSurcharge(100, 5)", "2", "[2, 2]", "compiles, returns 105"],
      ["addSurcharge(100, 5, 10)", "3", "[2, 2]", "TS2554 — rejected, the extra argument is never silently dropped"],
    ],
  );
  note(
    "If 'addSurcharge' were meant to accept a variable number of " +
      "surcharges, the FIX is not 'call it with more arguments' — it's " +
      "changing the declared signature to a rest parameter (demo 07), which " +
      "changes the upper bound from 2 to infinity ON PURPOSE, visibly, in " +
      "one place, rather than by accident at every call site.",
  );
}
