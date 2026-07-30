// @ts-nocheck
/**
 * 01-noncallable-value — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * The most direct version of Concept #4: a plain number, called as if it
 * were a function. Nothing about declaring `const x = 5` looks dangerous —
 * the danger is entirely in some LATER line treating `x` as callable,
 * possibly written by someone who never saw the declaration.
 *
 * DOMAIN: a "retry budget" that later code mistakenly invokes instead of
 * reading.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function loadRetryBudget() {
  return 3; // a plain number: how many retries remain
}

export function runBroken(): void {
  const retryBudget = loadRetryBudget();

  section("A number, called as if it were a function");

  js("retryBudget  — just reading it");
  detonate("retryBudget", () => retryBudget);
  note("3. Perfectly fine — this is a number, and nobody has tried to call it yet.");

  blank();
  js("retryBudget()  — a stray pair of parentheses, maybe a leftover refactor");
  detonate("retryBudget()", () => retryBudget());
  runtimeSays(
    "TypeError: retryBudget is not a function",
    "The engine resolved 'retryBudget' to the value 3, then checked for an " +
      "internal [[Call]] slot. Numbers don't have one. The crash happens " +
      "exactly at the '()' — but nothing before this line hinted that it " +
      "was coming.",
  );

  blank();
  section("The same mistake, one property-access away");
  const config = { retryBudget: 3, timeoutMs: 5000 };
  js("config.retryBudget()  — a property that happens to hold a number");
  detonate("config.retryBudget()", () => config.retryBudget());
  runtimeSays(
    "TypeError: config.retryBudget is not a function",
    "identical failure, just reached through a property instead of a " +
      "top-level binding — the underlying question is always 'does this " +
      "VALUE have [[Call]]?', never 'does this NAME look like a function?'",
  );

  blank();
  table(
    ["expression", "value", "callable?", "outcome of calling it"],
    [
      ["retryBudget", "3", "no", "TypeError"],
      ["config.retryBudget", "3", "no", "TypeError"],
    ],
  );
}
