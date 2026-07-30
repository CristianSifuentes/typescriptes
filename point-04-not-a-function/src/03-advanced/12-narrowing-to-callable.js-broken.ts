// @ts-nocheck
/**
 * 12-narrowing-to-callable — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A plugin's `retryDelay` option may be configured either as a fixed number
 * of milliseconds OR as a function that computes the delay dynamically
 * (e.g. exponential backoff based on attempt count). JavaScript has no way
 * to express "this is one of two kinds, and you must check which before
 * using it" — code either remembers to check `typeof`, or it doesn't.
 *
 * DOMAIN: an HTTP client's retry policy, configurable as a constant or a
 * function.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function resolveDelay(retryDelay, attempt) {
  // BUG: assumes retryDelay is always a function, never checks.
  return retryDelay(attempt);
}

export function runBroken(): void {
  section("Configured with a function — works by accident");

  js("resolveDelay((attempt) => attempt * 100, 3)");
  detonate("resolveDelay(fn, 3)", () => resolveDelay((attempt) => attempt * 100, 3));

  blank();
  section("Configured with a constant — the other equally valid shape");

  js("resolveDelay(500, 3)");
  detonate("resolveDelay(500, 3)", () => resolveDelay(500, 3));
  runtimeSays(
    "TypeError: retryDelay is not a function",
    "500 is a perfectly valid 'retryDelay' according to the plugin's own " +
      "documented configuration options — the bug is entirely inside " +
      "'resolveDelay', which forgot that a NUMBER is one of the two things " +
      "it promised to accept.",
  );

  blank();
  table(
    ["retryDelay value", "type", "resolveDelay(retryDelay, attempt)"],
    [
      ["(attempt) => attempt * 100", "function", "works"],
      ["500", "number", "TypeError"],
    ],
  );
}
