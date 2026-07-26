// @ts-nocheck
/**
 * 07-narrowing — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * JavaScript HAS the runtime operators — `typeof`, `in`, `instanceof`,
 * `Array.isArray`, truthiness — but it has no notion of what they PROVE. A
 * check is just a branch; the language draws no conclusion from it, and the
 * code after the check is unconstrained by it.
 *
 * That gap produces a distinctive family of bugs: the developer performs the
 * right check and then, three lines later, uses the value as if a DIFFERENT
 * check had succeeded.
 *
 * DOMAIN: a cache/config reader whose values may be strings, numbers, arrays,
 * objects, or null.
 *
 * FIVE FAILURES:
 *   1. `typeof null === "object"`      — the 25-year-old wart.
 *   2. else-branch assumption           — "not a string" ≠ "a number".
 *   3. truthiness ≠ presence            — 0 and "" are falsy but valid.
 *   4. narrowing does not survive       — reassignment invalidates the check.
 *   5. `in` proves nothing              — the key may hold undefined.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

export function runBroken(): void {
  section('1. typeof null === "object"');

  detonate('typeof null', () => typeof null);
  detonate("the classic object check on null", () => {
    const setting = null;
    if (typeof setting === "object") {
      return Object.keys(setting).length; // throws
    }
    return 0;
  });
  runtimeSays(
    "TypeError: Cannot convert undefined or null to object",
    "The check passed and was still wrong. `typeof null` has returned " +
      '"object" since 1995 and cannot be fixed without breaking the web.',
  );

  blank();
  section("2. The else branch assumption");

  detonate("value is a string | number | null; else-branch assumes number", () => {
    const value = null;
    if (typeof value === "string") return value.toUpperCase();
    return value.toFixed(2); // "not a string" was assumed to mean "a number"
  });
  runtimeSays(
    "TypeError: Cannot read properties of null (reading 'toFixed')",
    "Complementation only works if you know the full set of possibilities. " +
      "JavaScript never told the developer that `null` was in it.",
  );

  blank();
  section("3. Truthiness is not presence");

  detonate("retries = 0, guarded by `if (retries)`", () => {
    const config = { retries: 0, prefix: "" };
    const retries = config.retries ? config.retries : 3;
    const prefix = config.prefix ? config.prefix : "app";
    return { retries, prefix };
  });
  note(
    "Both explicit settings were discarded: 0 and \"\" are falsy. The user " +
      'asked for "no retries" and got three. No error, no warning — this is ' +
      "the single most common configuration bug in the ecosystem.",
  );

  blank();
  section("4. A check does not survive reassignment");

  detonate("check, then reassign, then use", () => {
    let payload = "hello";
    if (typeof payload === "string") {
      payload = JSON.parse("42"); // now a number
      return payload.toUpperCase(); // the check is stale
    }
    return "";
  });
  runtimeSays(
    "TypeError: payload.toUpperCase is not a function",
    "The check was true WHEN IT RAN. Nothing re-validates it afterwards, " +
      "because JavaScript never connected the check to the use in the first " +
      "place.",
  );

  blank();
  section("5. `in` proves the key exists, not that it is usable");

  detonate('"body" in response, where body is undefined', () => {
    const response = { status: 200, body: undefined };
    if ("body" in response) {
      return response.body.length;
    }
    return 0;
  });
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'length')",
    "`in` answers a question about KEYS. The developer needed an answer about " +
      "VALUES.",
  );

  blank();
  section("What JavaScript knows after each check");
  table(
    ["check", "what the developer concluded", "what JavaScript guarantees"],
    [
      ['typeof x === "string"', "x is a string, from here on", "nothing after the branch ends"],
      ['typeof x === "object"', "x is an object", 'nothing — null passes too'],
      ["else branch", "x is the other type", "nothing — there may be more types"],
      ["if (x)", "x is present", "nothing — 0, \"\", NaN, false are falsy"],
      ['"k" in obj', "obj.k is usable", "only that the key exists"],
      ["after reassignment", "the check still holds", "nothing at all"],
    ],
  );
  note(
    "The right-hand column is empty in every row. That is the point: in " +
      "JavaScript a check is an if-statement, not a proof.",
  );
}
