// @ts-nocheck
/**
 * 08-unions — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * In JavaScript, EVERY value is a union of every possible type. There is no
 * declaration that says "this parameter is a string or a number, and nothing
 * else", so there is also no list of cases to handle — and therefore no way to
 * know whether you have handled them all.
 *
 * The result is a codebase full of functions that work on the values the author
 * happened to think of, and produce garbage on the rest.
 *
 * DOMAIN: an HTTP client returning a response that is either a success with a
 * body, a failure with an error, or a timeout. Plus a search API whose `query`
 * parameter accepts "a string or an array of strings" — a real, extremely
 * common pattern.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

/** "query: string | string[]" — documented in a comment, enforced by nothing. */
function normaliseQuery(query) {
  return query.trim().toLowerCase();
}

/** Three possible shapes, distinguished by whichever field happens to exist. */
function fetchResource(scenario) {
  if (scenario === "ok") return { status: 200, body: '{"id":1}' };
  if (scenario === "error") return { status: 500, error: "internal error" };
  return { status: 0, timedOut: true };
}

export function runBroken(): void {
  section("An operation valid for ONE member, applied to ALL of them");

  js('normaliseQuery("  Shoes ")');
  detonate("normalised", () => normaliseQuery("  Shoes "));
  js('normaliseQuery(["shoes", "boots"])  — also documented as valid');
  detonate("normalised", () => normaliseQuery(["shoes", "boots"]));
  runtimeSays(
    "TypeError: query.trim is not a function",
    "`trim` exists on String.prototype and not on Array.prototype. The " +
      "function was correct for one of its two documented inputs.",
  );

  blank();
  js("normaliseQuery(42)  — not documented at all, and not prevented");
  detonate("normalised", () => normaliseQuery(42));

  blank();
  section("Reading a field that only SOME shapes have");

  const ok = fetchResource("ok");
  const failed = fetchResource("error");
  const timedOut = fetchResource("timeout");

  js("response.body.length for each of the three shapes");
  detonate("ok.body.length", () => ok.body.length);
  detonate("failed.body", () => failed.body);
  detonate("failed.body.length", () => failed.body.length);
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'length')",
    "There is no declaration anywhere stating which fields go together. The " +
      "developer learned the shapes by reading the function — or by reading a " +
      "stack trace.",
  );

  blank();
  js("the defensive style this forces");
  detonate("defensive read", () => {
    const r = timedOut;
    return r && r.body && typeof r.body === "string" ? r.body.length : -1;
  });
  note(
    "This is what JavaScript codebases look like: every read defended " +
      "individually, because nothing collects the possibilities in one place. " +
      "The checks are unverifiable, unmaintainable, and usually incomplete.",
  );

  blank();
  section("The case nobody handled");

  js("a fourth shape is added to fetchResource next sprint");
  detonate("handler with three branches, given a fourth shape", () => {
    const response = { status: 429, retryAfter: 30 }; // new: rate limited
    if (response.body) return "success";
    if (response.error) return "failure";
    if (response.timedOut) return "timeout";
    return undefined; // falls through — nothing warned
  });
  note(
    "The function returned `undefined` for a case it did not know about. No " +
      "error, no test failure (there is no test for a shape nobody knew " +
      "existed), and `undefined` now flows into the caller.",
  );

  blank();
  table(
    ["situation", "JavaScript behaviour", "when discovered"],
    [
      ["operation valid for one member", "TypeError", "runtime"],
      ["field present on some shapes", "undefined, then TypeError", "runtime"],
      ["undocumented input type", "coerced or crashes", "runtime"],
      ["new shape added later", "silent `undefined` return", "never"],
      ["defensive checks", "unverifiable and incomplete", "n/a"],
    ],
  );
}
