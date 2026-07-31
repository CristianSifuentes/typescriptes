// @ts-nocheck
/**
 * 07-rest-parameters — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A summing utility meant to accept any number of numeric arguments.
 * JavaScript's `...nums` collects everything into an array with no per-
 * element type checking at all — a single wrong-typed argument anywhere in
 * the list corrupts the whole computation.
 *
 * DOMAIN: a small analytics helper summing a variable-length list of metric
 * values.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function sum(...nums) {
  return nums.reduce((total, n) => total + n, 0);
}

export function runBroken(): void {
  section("Summing a real variable-length list of numbers");

  js("sum(1, 2, 3, 4)");
  detonate("sum(1, 2, 3, 4)", () => sum(1, 2, 3, 4));

  blank();
  section("One argument in the list is a string, not a number");

  // A metric value arrived from a form field or a mis-mapped array and was
  // never converted to a number before being spread into the call.
  js('sum(1, 2, "3", 4)');
  detonate('sum(1, 2, "3", 4)', () => sum(1, 2, "3", 4));
  runtimeSays(
    "'334' (string concatenation, not a sum — silently wrong)",
    "'+' concatenates once it hits the string '\"3\"' instead of adding: " +
      "0 + 1 = 1, 1 + 2 = 3, 3 + \"3\" = \"33\" (string!), \"33\" + 4 = " +
      "\"334\". The exact garbage value depends on WHERE in the list the " +
      "string sits — nothing about the call itself looked wrong.",
  );

  blank();
  table(
    ["call", "every element a number?", "sum(...) result"],
    [
      ["sum(1, 2, 3, 4)", "yes", "10 — correct"],
      ['sum(1, 2, "3", 4)', "no — one string", "a garbage concatenated string"],
    ],
  );
}
