// @ts-nocheck
/**
 * 07-noncallable-callback — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A retry utility that accepts a callback to run once the operation
 * succeeds. JavaScript places no restriction on what gets passed as that
 * argument — a function, a string, `undefined`, anything compiles and runs
 * right up until the utility actually tries to invoke it.
 *
 * DOMAIN: a retry-with-backoff utility used to call a flaky payment API.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function retryOperation(operation, onComplete) {
  const result = operation();
  onComplete(result); // assumes onComplete is callable
}

export function runBroken(): void {
  section("Calling retryOperation with a real callback");

  js("retryOperation(() => 'charged', (r) => console.log(r))");
  detonate("with a real callback", () => {
    retryOperation(
      () => "charged",
      (r) => `handled: ${r}`,
    );
    return "ran fine";
  });

  blank();
  section("Calling it with the wrong kind of second argument");

  // A common mistake: passing the SUCCESS MESSAGE instead of a callback that
  // would log it — the string was meant to be used INSIDE a callback, not
  // passed instead of one.
  js('retryOperation(() => "charged", "payment complete")');
  detonate("with a string instead of a callback", () =>
    retryOperation(() => "charged", "payment complete"),
  );
  runtimeSays(
    "TypeError: onComplete is not a function",
    "'retryOperation' has no way to know, just from receiving " +
      "'payment complete', that the caller meant to log it rather than " +
      "call it. It simply tries to call whatever it was given.",
  );

  blank();
  table(
    ["second argument", "type", "callable?", "outcome"],
    [
      ["(r) => `handled: ${r}`", "function", "yes", "works"],
      ["\"payment complete\"", "string", "no", "TypeError inside retryOperation"],
    ],
  );
}
