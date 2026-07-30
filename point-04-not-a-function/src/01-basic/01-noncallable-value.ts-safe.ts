/**
 * 01-noncallable-value — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `retryBudget()` is checked against the STATIC TYPE of `retryBudget` —
 * `number` — before any code runs. `number` has no call signature (the
 * manifesto's formal definition of "callable"), so the expression is
 * rejected outright: **TS2349**. No value ever needs to exist; the whole
 * question is answered by the type alone.
 */

import { section, ts, good, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

function loadRetryBudget(): number {
  return 3;
}

export function runSafe(): void {
  const retryBudget = loadRetryBudget();

  section("What the compiler believes is callable here");
  callableTrace([
    ["retryBudget", "number", "none — number has no call signatures", "a plain value, never a function"],
  ]);

  blank();
  section("Calling a non-function value");

  ts("retryBudget()");
  compileTimeOnly(() => {
    // @ts-expect-error TS2349: This expression is not callable.
    //   Type 'Number' has no call signatures.
    const result = retryBudget();
    void result;
  });
  compilerSays(
    "TS2349",
    "This expression is not callable.\n  Type 'Number' has no call signatures.",
    "The message names the exact fact the manifesto formalised: a call " +
      "signature is a member of a type's property map, and 'number' " +
      "declares none. This is decided from the DECLARED type of " +
      "'retryBudget' — no runtime value was ever consulted.",
  );

  blank();
  section("The same check, reached through a property");

  const config = { retryBudget: 3, timeoutMs: 5000 };
  ts("config.retryBudget()");
  compileTimeOnly(() => {
    // @ts-expect-error TS2349: This expression is not callable.
    //   Type 'Number' has no call signatures.
    const result = config.retryBudget();
    void result;
  });
  compilerSays(
    "TS2349",
    "This expression is not callable.\n  Type 'Number' has no call signatures.",
    "Identical diagnostic, reached through a member access instead of a " +
      "top-level binding — the check is the same because the underlying " +
      "question ('does this TYPE have a call signature?') is the same.",
  );

  blank();
  section("The correct usage");
  const retriesLeft: number = retryBudget;
  proveType<number>()(retriesLeft, "number", "read as a value, never invoked");
  good(`retryBudget = ${retriesLeft} — used the way its type actually permits.`);

  blank();
  table(
    ["expression", "JavaScript outcome", "TypeScript diagnostic"],
    [
      ["retryBudget()", "TypeError: retryBudget is not a function", "TS2349"],
      ["config.retryBudget()", "TypeError: config.retryBudget is not a function", "TS2349"],
      ["retryBudget (read, not called)", "3", "no diagnostic"],
    ],
  );
}
