/**
 * 07-noncallable-callback — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `retryOperation`'s second PARAMETER is typed as a call signature —
 * `onComplete: (result: string) => void`. Passing a `string` where that
 * parameter is expected is an ordinary argument-assignability failure
 * (TS2345), reported at the CALL SITE, exactly like passing a `number`
 * where a `string` parameter is expected — function types are just another
 * kind of parameter type to check arguments against.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

function retryOperation(
  operation: () => string,
  onComplete: (result: string) => void,
): void {
  const result = operation();
  onComplete(result);
}

export function runSafe(): void {
  section("The parameter's declared call signature");
  callableTrace([
    ["onComplete", "(result: string) => void", "(result: string) => void", "a real callback parameter"],
  ]);

  blank();
  section("Passing a non-callable value where a callback is expected");

  ts('retryOperation(() => "charged", "payment complete")');
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'string' is not assignable
    // to parameter of type '(result: string) => void'.
    retryOperation(() => "charged", "payment complete");
  });
  compilerSays(
    "TS2345",
    "Argument of type 'string' is not assignable to parameter of type '(result: string) => void'.",
    "Read exactly like 'Argument of type string is not assignable to " +
      "parameter of type number' — a function type is a type, and argument " +
      "checking treats it identically to any other parameter type. The " +
      "diagnostic is reported at the CALL, not inside 'retryOperation''s " +
      "body, which is never at fault here.",
  );

  blank();
  section("The correct call");

  const log: string[] = [];
  retryOperation(
    () => "charged",
    (r) => log.push(`handled: ${r}`),
  );
  proveType<string[]>()(log, "string[]", "onComplete really is a function, so calling it really works");
  good(`retryOperation ran the real callback: [${log.join(", ")}]`);

  blank();
  table(
    ["second argument", "assignable to (result: string) => void?", "TypeScript diagnostic"],
    [
      ["\"payment complete\" (string)", "no", "TS2345"],
      ["(r) => log.push(...) (function)", "yes", "no diagnostic"],
    ],
  );
  note(
    "The fix for the JavaScript bug (a message string passed instead of a " +
      "callback that would use it) is visible AT THE CALL SITE — the exact " +
      "place a human reviewing the code would also look first.",
  );
}
