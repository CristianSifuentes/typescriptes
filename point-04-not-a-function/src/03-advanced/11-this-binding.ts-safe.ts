/**
 * 11-this-binding — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `this` inside a method is, ordinarily, an IMPLICIT and UNCHECKED
 * parameter — `noImplicitThis` normally only stops `this` from silently
 * becoming `any`. To catch DETACHMENT itself, `scale` declares an explicit
 * `this` PARAMETER: `scale(this: Calculator, n: number)`. A `this` parameter
 * is erased at emit time (it exists purely for the checker) but it turns
 * "what must `this` be for this call to be valid?" into an ordinary,
 * checkable part of the function's type — including at the exact moment the
 * method is torn off its object.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface Calculator {
  multiplier: number;
  scale(this: Calculator, n: number): number;
}

const calculator: Calculator = {
  multiplier: 2,
  scale(this: Calculator, n: number): number {
    return n * this.multiplier;
  },
};

export function runSafe(): void {
  section("The method's real type includes a `this` parameter");
  callableTrace([
    ["calculator.scale", "(this: Calculator, n: number) => number", "(this: Calculator, n: number): number", "`this` is part of the checked signature, not an afterthought"],
  ]);

  blank();
  section("Extracting the method and calling it detached");

  ts("const scale = calculator.scale; scale(21)");
  compileTimeOnly(() => {
    const scale = calculator.scale;
    // @ts-expect-error TS2684: The 'this' context of type 'void' is not
    // assignable to method's 'this' of type 'Calculator'.
    scale(21);
  });
  compilerSays(
    "TS2684",
    "The 'this' context of type 'void' is not assignable to method's 'this' of type 'Calculator'.",
    "Extracting 'scale' into a plain variable produces a value whose " +
      "CALL SIGNATURE still requires a 'Calculator' as 'this' — but a bare " +
      "function call supplies no 'this' at all ('void', TypeScript's way of " +
      "saying 'nothing was provided'). The mismatch is caught at the CALL, " +
      "the exact point where the detachment becomes observable, without " +
      "needing to run the code to discover it.",
  );

  blank();
  section("Calling it correctly — as a method, so `this` is supplied");

  const result = calculator.scale(21);
  proveType<number>()(result, "number", "called AS A METHOD — `this` really is `calculator`");
  good(`calculator.scale(21) → ${result}`);

  blank();
  section("The correct way to hand it around: bind, or an arrow wrapper");

  const boundScale = calculator.scale.bind(calculator);
  proveType<number>()(boundScale(21), "number", "'.bind' is itself checked by strictBindCallApply — it fixes `this` permanently");
  good(`calculator.scale.bind(calculator)(21) → ${boundScale(21)}`);

  blank();
  table(
    ["call form", "this required by scale's type", "this actually supplied", "outcome"],
    [
      ["calculator.scale(21)", "Calculator", "calculator", "compiles, returns 42"],
      ["scale(21) (detached)", "Calculator", "void (none)", "TS2684 — rejected"],
      ["calculator.scale.bind(calculator)(21)", "Calculator", "calculator (bound)", "compiles, returns 42"],
    ],
  );
  note(
    "Without an explicit `this` parameter, 'scale' would type-check fine " +
      "detached too — `this` would be treated as implicitly `any` inside the " +
      "body, and the crash would only appear at runtime, exactly as in the " +
      "JavaScript version. The `this` parameter is what turns an invisible " +
      "assumption into a checked one.",
  );
}
