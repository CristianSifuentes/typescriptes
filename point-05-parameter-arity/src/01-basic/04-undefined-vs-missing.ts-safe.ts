/**
 * 04-undefined-vs-missing — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * Two DIFFERENT mistakes, two DIFFERENT diagnostics — this is the whole
 * point of the demo. Arity checking (manifesto §3, step 2) counts SUPPLIED
 * argument slots, not "slots that turned out non-undefined": passing
 * `undefined` explicitly still occupies position 1, so arity is satisfied.
 * What fails is the PER-POSITION type check (step 3): the parameter is
 * declared `number`, not `number | undefined`, so a value that IS
 * `undefined` fails assignability — a TS2345, not a TS2554.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

function applyDiscount(price: number, discountPercent: number): number {
  return price * (1 - discountPercent / 100);
}

// `noUncheckedIndexedAccess` (enabled in this project) types every lookup
// as `number | undefined`, not `number` — the index signature makes no
// promise that any given key actually exists.
const coupons: Record<string, number> = { SAVE10: 10, SAVE20: 20 };

export function runSafe(): void {
  section("Two mistakes that look IDENTICAL at runtime, in JavaScript");
  callableTrace([
    ['coupons["EXPIRED99"]', "number | undefined", "n/a (not callable)", "an unknown key really can produce undefined — the TYPE says so honestly"],
    ["applyDiscount", "(price: number, discountPercent: number) => number", "position 1 requires number, not number | undefined", "the PARAMETER refuses to accept the union's undefined member"],
  ]);

  blank();
  section("Mistake (a): passing undefined EXPLICITLY — arity is satisfied, the TYPE is not");

  ts('applyDiscount(100, coupons["EXPIRED99"])  — 2 arguments supplied, position 1 is number | undefined');
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'number | undefined' is not
    // assignable to parameter of type 'number'.
    //   Type 'undefined' is not assignable to type 'number'.
    applyDiscount(100, coupons["EXPIRED99"]);
  });
  compilerSays(
    "TS2345",
    "Argument of type 'number | undefined' is not assignable to parameter " +
      "of type 'number'. Type 'undefined' is not assignable to type 'number'.",
    "NOT an arity error — the call supplies exactly 2 arguments, satisfying " +
      "the count check. The failure is entirely in step 3: 'undefined' is a " +
      "real, POSSIBLE member of the supplied type, and the declared " +
      "parameter type ('number') refuses it. This is the union-legality " +
      "rule from point-04's manifesto, applied to a PARAMETER instead of a " +
      "call target.",
  );

  blank();
  section("Mistake (b): omitting the argument ENTIRELY — arity itself fails");

  ts("applyDiscount(100)  — only 1 argument supplied");
  compileTimeOnly(() => {
    // @ts-expect-error TS2554: Expected 2 arguments, but got 1.
    applyDiscount(100);
  });
  compilerSays(
    "TS2554",
    "Expected 2 arguments, but got 1.",
    "A DIFFERENT diagnostic for a DIFFERENT mistake — this time the count " +
      "check itself fails, exactly as in demo 01. JavaScript's binding " +
      "model made mistakes (a) and (b) indistinguishable (both produce " +
      "'discountPercent === undefined' inside the function); TypeScript " +
      "reports them as two SEPARATE failures, at two separate steps of the " +
      "same algorithm.",
  );

  blank();
  section("The correct call, with a real coupon");

  const total = applyDiscount(100, coupons["SAVE10"] ?? 0);
  proveType<number>()(total, "number", "the ?? 0 fallback narrows number | undefined down to number BEFORE the call");
  good(`applyDiscount(100, coupons["SAVE10"] ?? 0) → ${total}`);

  blank();
  table(
    ["mistake", "arity satisfied?", "type check passes?", "diagnostic"],
    [
      ["explicit undefined at a required position", "yes (2 args supplied)", "no — undefined ⊄ number", "TS2345"],
      ["argument omitted entirely", "no (1 < 2 required)", "n/a — never reached", "TS2554"],
      ["a real coupon, narrowed with ??", "yes", "yes", "none"],
    ],
  );
  note(
    "JavaScript could not tell these two mistakes apart because its " +
      "binding model erases the difference the moment the function body " +
      "starts running. TypeScript catches BOTH, as two DISTINCT, correctly " +
      "labeled failures, because arity (a counting question) and type " +
      "(a per-position question) are checked as genuinely separate steps.",
  );
}
