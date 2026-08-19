// @ts-nocheck
/**
 * 02-positional-binding — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * This demo isolates the MECHANISM rather than a bug: what exactly happens when
 * JavaScript binds arguments to parameters.
 *
 * The specification's `FunctionDeclarationInstantiation` walks the parameter
 * list in order and binds the argument at the same index. Three rules follow,
 * and every argument-order bug in this project is a consequence of one of them:
 *
 *   1. POSITION IS THE ONLY BINDING KEY. Parameter names are local variables
 *      inside the body; they have no existence at the call site.
 *   2. MISSING POSITIONS BECOME `undefined`. Not an error — a value.
 *   3. SURPLUS ARGUMENTS ARE COLLECTED AND IGNORED (available via `arguments`).
 *
 * DOMAIN: a job scheduler.
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

function scheduleJob(name, runAt, retries, ...tags) {
  return {
    name,
    runAt,
    retries,
    tags,
    argumentCount: arguments.length,
  };
}

export function runBroken(): void {
  section("1. Position is the only binding key");

  js("the intended call");
  detonate("job", () => {
    const job = scheduleJob("sync", "2026-03-01", 3, "nightly");
    return `name=${job.name} runAt=${job.runAt} retries=${job.retries} tags=${job.tags}`;
  });

  blank();
  js("the same values, two positions exchanged");
  detonate("job", () => {
    const job = scheduleJob("2026-03-01", "sync", 3, "nightly");
    return `name=${job.name} runAt=${job.runAt} retries=${job.retries} tags=${job.tags}`;
  });
  note(
    "The job is now named after a date and scheduled for a string called " +
      '"sync". Both values are strings, so nothing in the language even has ' +
      "the opportunity to object — a preview of the blind spot in demo 04.",
  );

  blank();
  section("2. Missing positions become `undefined`, not an error");

  detonate("scheduleJob('sync')", () => {
    const job = scheduleJob("sync");
    return `runAt=${job.runAt} retries=${job.retries} argumentCount=${job.argumentCount}`;
  });
  note(
    "`retries` is `undefined`. Downstream, `undefined < 3` is false and " +
      "`undefined + 1` is NaN — the retry logic is now silently disabled.",
  );

  blank();
  section("3. Surplus arguments are collected and ignored");

  detonate("an extra 5th argument, with no rest parameter to catch it", () => {
    function twoParams(a, b) {
      return { a, b, actuallyReceived: arguments.length };
    }
    const result = twoParams(1, 2, 3, 4, 5);
    return `a=${result.a} b=${result.b} received=${result.actuallyReceived}`;
  });
  note(
    "Five arguments arrived, two were bound, three vanished. The caller " +
      "believes they configured something. They did not.",
  );

  blank();
  section("4. Spreading an array: positions come from the array's ORDER");

  detonate("spread of a correctly-ordered array", () => {
    const args = ["sync", "2026-03-01", 3];
    const job = scheduleJob(...args);
    return `name=${job.name} runAt=${job.runAt}`;
  });
  detonate("spread of a wrongly-ordered array", () => {
    const args = ["2026-03-01", "sync", 3];
    const job = scheduleJob(...args);
    return `name=${job.name} runAt=${job.runAt}`;
  });
  note(
    "A spread turns an ARRAY ORDERING mistake into an ARGUMENT ORDERING " +
      "mistake. The array is built in one place and spread in another, so the " +
      "two halves of the bug can live in different files.",
  );

  blank();
  section("5. `arguments` proves there are no names at the call site");

  detonate("what the callee actually receives", () => {
    function inspect() {
      return Array.from(arguments);
    }
    return JSON.stringify(inspect("sync", "2026-03-01", 3, "nightly"));
  });
  note(
    "An indexed list. That is the whole calling convention: a list of values " +
      "and their positions. Everything else — parameter names, JSDoc, editor " +
      "hints — is commentary that the runtime never sees.",
  );

  blank();
  table(
    ["rule", "JavaScript behaviour", "consequence for argument order"],
    [
      ["binding key", "position, only", "names cannot disambiguate a swap"],
      ["missing argument", "bound to `undefined`", "a short call silently disables logic"],
      ["surplus argument", "collected, ignored", "a long call silently drops values"],
      ["spread", "array order becomes argument order", "the bug can be built elsewhere"],
      ["`arguments`", "an indexed list", "there is nothing but position at runtime"],
    ],
  );
}
