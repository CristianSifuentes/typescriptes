// @ts-nocheck
/**
 * 05-property-not-function — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * `config.retry()` — a plain configuration VALUE, invoked as if it were a
 * method. This is demo 01's defect (a non-callable value), but reached
 * through an object property instead of a top-level binding — the realistic
 * shape this bug actually takes in production code, where "config" objects
 * mix data fields and callback fields freely.
 *
 * DOMAIN: an HTTP client configuration object with both data fields
 * (retry count, timeout) and callback fields (onRetry hook).
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function loadConfig() {
  return {
    retry: 3, // how many retries — a NUMBER
    timeoutMs: 5000,
    onRetry: (attempt) => console.log(`retry #${attempt}`),
  };
}

function performRequest(config) {
  for (let attempt = 1; attempt <= config.retry(); attempt++) {
    // meant to READ config.retry as a limit, but called it instead
  }
}

export function runBroken(): void {
  const config = loadConfig();

  section("Calling a data field as if it were a method");

  js("config.retry()  — retry is a count, not a function");
  detonate("config.retry()", () => config.retry());
  runtimeSays(
    "TypeError: config.retry is not a function",
    "'retry' genuinely exists on 'config' — this isn't Concept #3's typo. " +
      "It just isn't a function. The engine resolves it fine, finds 3, and " +
      "then fails the [[Call]] check.",
  );

  blank();
  section("The same mistake, buried inside request logic");

  js("performRequest(config)");
  detonate("performRequest(config)", () => performRequest(config));
  runtimeSays(
    "TypeError: config.retry is not a function",
    "The crash is now inside a loop condition, deep in a function whose " +
      "author almost certainly meant 'attempt <= config.retry' (a " +
      "comparison), not 'config.retry()' (a call) — a single stray pair of " +
      "parentheses.",
  );

  blank();
  table(
    ["config field", "actual type", "used as", "outcome"],
    [
      ["retry", "number", "a function call", "TypeError"],
      ["onRetry", "function", "a function call", "works correctly"],
    ],
  );
}
