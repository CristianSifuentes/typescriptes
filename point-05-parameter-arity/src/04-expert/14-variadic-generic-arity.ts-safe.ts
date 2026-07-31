/**
 * 14-variadic-generic-arity — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `partial`'s signature uses a VARIADIC TUPLE TYPE — `[...Fixed, ...Rest]`
 * — to describe "some leading arguments, then the rest," as a single typed
 * expression. Because `Fixed` and `Rest` are both generic tuples, TypeScript
 * can INFER exactly which slice of `notify`'s parameter list was already
 * supplied and which slice remains, and carries that remainder's arity AND
 * types into the RETURNED function's own signature — composition that
 * preserves the original contract instead of erasing it.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

function notify(channel: string, userId: number, message: string): string {
  return `[${channel}] notifying user ${userId}: ${message}`;
}

function partial<Fixed extends readonly unknown[], Rest extends readonly unknown[], R>(
  fn: (...args: [...Fixed, ...Rest]) => R,
  ...fixed: Fixed
): (...rest: Rest) => R {
  return (...rest: Rest) => fn(...fixed, ...rest);
}

export function runSafe(): void {
  section("What the variadic tuple type infers for the composed function");

  const notifySlack = partial(notify, "slack");
  callableTrace([
    ["notify", "(channel: string, userId: number, message: string) => string", "arity 3", "the ORIGINAL signature"],
    ["notifySlack", "(userId: number, message: string) => string", "arity 2", "[...Fixed, ...Rest] split off 'channel' (Fixed), leaving Rest = [userId, message]"],
  ]);

  blank();
  section("Calling the composed function with the wrong arity");

  ts("notifySlack(42)  — Rest = [userId: number, message: string], only 1 argument supplied");
  compileTimeOnly(() => {
    // @ts-expect-error TS2554: Expected 2 arguments, but got 1.
    notifySlack(42);
  });
  compilerSays(
    "TS2554",
    "Expected 2 arguments, but got 1.",
    "'notifySlack' is not a generic, unchecked closure the way the " +
      "JavaScript version's is — its TYPE is `(userId: number, message: " +
      "string) => string`, derived automatically from 'notify's original " +
      "signature minus the ONE argument 'partial' already consumed. Arity " +
      "checking (manifesto §3) applies to it exactly as it would to any " +
      "hand-written function with that same signature.",
  );

  blank();
  section("Calling the composed function with the wrong TYPE at a position");

  ts('notifySlack(42, 500)  — message should be a string, not a number');
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'number' is not assignable
    // to parameter of type 'string'.
    notifySlack(42, 500);
  });
  compilerSays(
    "TS2345",
    "Argument of type 'number' is not assignable to parameter of type 'string'.",
    "Position 1 of 'Rest' is 'message: string' — inferred from 'notify's " +
      "THIRD parameter, carried through composition without ever being " +
      "re-declared by hand. Per-position type checking (demo 03) survives " +
      "the composition intact.",
  );

  blank();
  section("The correct call");

  const result = notifySlack(42, "build failed");
  proveType<string>()(result, "string", "arity 2, both positions correctly typed — Rest fully satisfied");
  good(`notifySlack(42, "build failed") → ${JSON.stringify(result)}`);

  blank();
  table(
    ["expression", "type", "arity"],
    [
      ["notify", "(channel: string, userId: number, message: string) => string", "3"],
      ["partial(notify, \"slack\")", "(userId: number, message: string) => string", "2 — [...Fixed, ...Rest] minus 1 fixed argument"],
    ],
  );
  note(
    "The JavaScript '.bind'/closure equivalent achieves the SAME runtime " +
      "behavior — a function with one argument already filled in — but " +
      "loses every fact about the remaining contract in the process. " +
      "Variadic tuple types make composition a TYPE-LEVEL operation, not " +
      "just a value-level one: the resulting function's signature is " +
      "computed, not merely inherited by accident.",
  );
}
