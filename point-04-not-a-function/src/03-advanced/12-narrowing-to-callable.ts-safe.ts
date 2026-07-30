/**
 * 12-narrowing-to-callable — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `RetryDelay = number | ((attempt: number) => number)` is a union with a
 * NON-callable member (`number`) and a callable one. Invoking it directly is
 * illegal for the same union-legality reason as every other demo in this
 * project — but the fix here is not `?.` (that solves "callable or absent");
 * it's a `typeof` GUARD that narrows the union down to its callable member
 * before invocation, the general-purpose narrowing tool for "one of several
 * unrelated types, some invocable, some not."
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

type RetryDelay = number | ((attempt: number) => number);

function resolveDelay(retryDelay: RetryDelay, attempt: number): number {
  if (typeof retryDelay === "function") {
    return retryDelay(attempt); // narrowed: (attempt: number) => number
  }
  return retryDelay; // narrowed: number
}

export function runSafe(): void {
  section("The union, and which member is callable");
  callableTrace([
    ["retryDelay", "number | ((attempt: number) => number)", "present only when typeof === \"function\"", "a union of an inert value and a callable one"],
  ]);

  blank();
  section("Invoking the union directly, without narrowing");

  ts("retryDelay(attempt)  — no typeof guard");
  compileTimeOnly(() => {
    function unsafeResolveDelay(retryDelay: RetryDelay, attempt: number): number {
      // @ts-expect-error TS2349: This expression is not callable.
      //   Not all constituents of type 'RetryDelay' are callable.
      //   Type 'number' has no call signatures.
      return retryDelay(attempt);
    }
    void unsafeResolveDelay;
  });
  compilerSays(
    "TS2349",
    "This expression is not callable. Not all constituents of type " +
      "'RetryDelay' are callable. Type 'number' has no call signatures.",
    "This is the UNION-AWARE form of the same TS2349 demo 01 introduced for " +
      "a single non-callable type: here the compiler additionally names " +
      "WHICH member of the union is the problem ('number'), because a union " +
      "type is only invocable when every one of its members is.",
  );

  blank();
  section("The disciplined fix: `typeof` narrows to the callable member");

  const fixed = resolveDelay(500, 3);
  proveType<number>()(fixed, "number", "typeof retryDelay === \"function\" was false, so the `else` branch ran");
  good(`resolveDelay(500, 3) → ${fixed}`);

  const dynamic = resolveDelay((attempt) => attempt * 100, 3);
  proveType<number>()(dynamic, "number", "typeof retryDelay === \"function\" was true, so it was CALLED, narrowed to a call signature");
  good(`resolveDelay((attempt) => attempt * 100, 3) → ${dynamic}`);

  blank();
  table(
    ["retryDelay value", "typeof retryDelay", "branch taken", "outcome"],
    [
      ["500", '"number"', "return retryDelay (no call)", "500"],
      ["(attempt) => attempt * 100", '"function"', "return retryDelay(attempt) (call)", "300"],
    ],
  );
  note(
    "`typeof x === \"function\"` is a TYPE GUARD the compiler recognises " +
      "specially: inside the `if` branch, every non-callable member of the " +
      "union is removed from `x`'s narrowed type, and outside it (or in the " +
      "`else`), the callable member is removed instead — the same " +
      "control-flow narrowing `?.` and `if (x)` rely on, applied via an " +
      "explicit runtime check instead of a truthiness/undefined test.",
  );
}
