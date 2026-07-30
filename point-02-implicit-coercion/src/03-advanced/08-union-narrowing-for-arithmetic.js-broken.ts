// @ts-nocheck
/**
 * 08-union-narrowing-for-arithmetic — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A value that is "sometimes a string, sometimes a number" is completely
 * ordinary in JavaScript — API responses, parsed config, and legacy data
 * columns all produce it. Every arithmetic operator will happily coerce
 * whichever branch shows up, which means the SAME LINE of code can compute
 * a correct number today and a coerced string (or NaN) tomorrow, depending
 * on which branch of the "sometimes" actually arrived.
 *
 * DOMAIN: a product's `weightGrams` field, which a legacy supplier API
 * sometimes serializes as a JSON number and sometimes as a JSON string
 * (a well-documented real-world API inconsistency, not a contrived example).
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

function parseSupplierPayload(raw) {
  // Simulates two real responses from the same endpoint, on different days.
  return JSON.parse(raw);
}

export function runBroken(): void {
  section("The same field, two shapes, from the same API");

  const todaysPayload = parseSupplierPayload('{"sku": "SKU-9", "weightGrams": 450}');
  const nextWeeksPayload = parseSupplierPayload('{"sku": "SKU-9", "weightGrams": "450"}');

  function totalShippingWeight(items) {
    return items.reduce((sum, item) => sum + item.weightGrams, 0);
  }

  js("totalShippingWeight([todaysPayload])  — weightGrams is a JSON number");
  detonate("total (today)", () => totalShippingWeight([todaysPayload]));

  js("totalShippingWeight([nextWeeksPayload]) — weightGrams is a JSON STRING now");
  detonate("total (next week)", () => totalShippingWeight([nextWeeksPayload]));

  js("totalShippingWeight([todaysPayload, nextWeeksPayload]) — mixed batch");
  detonate("total (mixed)", () => totalShippingWeight([todaysPayload, nextWeeksPayload]));
  note(
    '450 + "450" = "450450" (string concatenation, once the running sum is a ' +
      "string) — and every item processed AFTER the string one inherits the " +
      "corruption, because `+` sticks to string-mode once triggered.",
  );

  blank();
  section("Why nobody notices in code review");
  table(
    ["input shape", "function signature (informally)", "looks correct?"],
    [
      ["all numbers", "reduce sums numbers", "yes — and IS correct"],
      ["all strings", "reduce concatenates strings", "the total is huge and clearly wrong — noticed fast"],
      ["mixed, number first", "starts numeric, flips to string mid-reduce", "SILENT — total looks like a plausible large number"],
    ],
  );
  note(
    "The most dangerous input shape is not 'all wrong' — it's 'one bad row in " +
      "an otherwise good batch', because the corruption hides inside a " +
      "plausible-looking result instead of an obviously broken one.",
  );
}
