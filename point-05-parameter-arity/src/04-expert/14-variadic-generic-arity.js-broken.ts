// @ts-nocheck
/**
 * 14-variadic-generic-arity — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A generic `partial()` helper: fix some of a function's leading arguments,
 * get back a new function expecting the rest. `.bind()` (or a hand-rolled
 * closure) does this at runtime just fine — but JavaScript loses ALL
 * information about how many arguments the RESULTING function still needs,
 * or what types they must be. The composed function is exactly as
 * unchecked as a fresh, untyped one.
 *
 * DOMAIN: a notification helper, partially applied per channel.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function notify(channel, userId, message) {
  return `[${channel}] notifying user ${userId}: ${message}`;
}

function partial(fn, ...fixed) {
  return (...rest) => fn(...fixed, ...rest);
}

export function runBroken(): void {
  section("Partially applying 'channel', then calling the result correctly");

  const notifySlack = partial(notify, "slack");
  js('notifySlack(42, "build failed")');
  detonate('notifySlack(42, "build failed")', () => notifySlack(42, "build failed"));

  blank();
  section("Calling the PARTIALLY APPLIED function with the wrong arity");

  // notifySlack still needs (userId, message) — two arguments. The
  // composed function carries NO memory of that requirement; JavaScript
  // just forwards whatever it receives.
  js('notifySlack(42)  — forgot the message');
  detonate("notifySlack(42)", () => notifySlack(42));
  runtimeSays(
    "'[slack] notifying user 42: undefined' (silently wrong)",
    "'partial' returns a plain closure with no memory of 'notify's " +
      "original signature. Calling it with too few (or too many, or " +
      "wrongly-typed) arguments is exactly as silently tolerated as " +
      "calling any other JavaScript function incorrectly — composition " +
      "adds a layer of indirection, and loses information along with it.",
  );

  blank();
  table(
    ["call", "arguments notifySlack actually needs", "arguments supplied", "outcome"],
    [
      ['notifySlack(42, "build failed")', "2 (userId, message)", "2", "correct"],
      ["notifySlack(42)", "2", "1", "message silently undefined"],
    ],
  );
}
