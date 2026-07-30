// @ts-nocheck
/**
 * 02-too-many-arguments — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A two-argument adder. JavaScript never rejects a call for supplying MORE
 * arguments than a function declares — every extra argument is simply
 * unreachable through the named parameters, silently discarded.
 *
 * DOMAIN: a small pricing utility that adds a base price and a surcharge.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function addSurcharge(base, surcharge) {
  return base + surcharge;
}

export function runBroken(): void {
  section("Calling with exactly two arguments");

  js("addSurcharge(100, 5)");
  detonate("addSurcharge(100, 5)", () => addSurcharge(100, 5));

  blank();
  section("Calling with a THIRD argument — a second surcharge, forgotten about the signature");

  // A caller assumed 'addSurcharge' could take multiple surcharges, the way
  // some math-like utilities do. JavaScript never complains.
  js("addSurcharge(100, 5, 10)");
  detonate("addSurcharge(100, 5, 10)", () => addSurcharge(100, 5, 10));
  runtimeSays(
    "(no crash — the third argument is silently discarded)",
    "'addSurcharge' has exactly two named parameters. The '10' is still " +
      "technically reachable via 'arguments[2]', but the function never " +
      "looks there — it is computed, then thrown away, and the caller's " +
      "second surcharge is never applied. No error, no warning, just a " +
      "silently wrong total.",
  );

  blank();
  table(
    ["call", "arguments supplied", "arguments USED", "result"],
    [
      ["addSurcharge(100, 5)", "2", "2", "105 — correct"],
      ["addSurcharge(100, 5, 10)", "3", "2", "105 — the '10' vanished, no error"],
    ],
  );
  note(
    "This is arguably worse than a crash: the caller has every reason to " +
      "believe the second surcharge was applied. Nothing observable " +
      "distinguishes 'correct call' from 'call with a silently ignored " +
      "argument'.",
  );
}
