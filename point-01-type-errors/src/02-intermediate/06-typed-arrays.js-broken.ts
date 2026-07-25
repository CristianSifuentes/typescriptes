// @ts-nocheck
/**
 * 06-typed-arrays — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A JavaScript array is a heterogeneous, sparse, growable map from stringified
 * integer keys to arbitrary values. It has no element type, no fixed length,
 * and no bounds.
 *
 * Every one of those four properties is a bug source:
 *
 *   heterogeneous → one stray string turns `reduce(+)` into concatenation
 *   growable      → nothing prevents `push`ing the wrong kind of thing
 *   unbounded     → `arr[99]` is `undefined`, not an error
 *   sparse        → `[ , , ]` has holes that `map` skips and `length` counts
 *
 * DOMAIN: an invoice with line items, imported partly from a CSV.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

export function runBroken(): void {
  section("One stray element changes the meaning of the whole computation");

  // The third value came from a CSV import and stayed a string.
  const lineTotals = [1200, 3400, "5600"];

  js("[1200, 3400, \"5600\"].reduce((a, b) => a + b, 0)");
  detonate("invoice total", () => lineTotals.reduce((a, b) => a + b, 0));
  note(
    'Expected 10200. Got "46005600": 0+1200 = 1200 (number), +3400 = 4600 ' +
      '(number), +"5600" = "46005600" (string). The type of the accumulator ' +
      "CHANGED mid-fold, and nothing objected.",
  );

  blank();
  js("the same array, summed with a for-loop");
  detonate("total via loop", () => {
    let total = 0;
    for (const value of lineTotals) total += value;
    return total;
  });
  note("Same corruption, different syntax. The defect is in the data, not the loop.");

  blank();
  section("Growing an array with the wrong element type");

  const quantities = [1, 2, 3];
  js('quantities.push("4")  — a string into a numeric array');
  detonate("after push", () => {
    quantities.push("4");
    return quantities;
  });
  detonate("Math.max(...quantities)", () => Math.max(...quantities));
  note("Math.max coerced it back, so this one 'works' — until it does not.");

  blank();
  section("Indices are unbounded");

  js("lineTotals[99]");
  detonate("lineTotals[99]", () => lineTotals[99]);
  js("lineTotals[99].toFixed(2)");
  detonate("lineTotals[99].toFixed(2)", () => lineTotals[99].toFixed(2));
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'toFixed')",
    "Out-of-range access is not an error in JavaScript; it is `undefined`. " +
      "The failure is deferred to whatever you do with the `undefined` next.",
  );

  blank();
  js("the empty-array case, which every codebase eventually hits");
  detonate("[].reduce((a, b) => a + b)", () => [].reduce((a, b) => a + b));
  runtimeSays(
    "TypeError: Reduce of empty array with no initial value",
    "A real crash for a real edge case, discovered by whichever customer " +
      "first submits an empty basket.",
  );

  blank();
  section("Tuples do not exist, so neither does arity");

  js("const coordinate = [52.52, 13.4, 0]  — one component too many");
  detonate("coordinate", () => [52.52, 13.4, 0]);
  js("destructuring it as [lat, lon]");
  detonate("[lat, lon]", () => {
    const [lat, lon] = [52.52, 13.4, 0];
    return { lat, lon };
  });
  note(
    "The extra component is silently dropped. If the array had been " +
      "[lon, lat] instead, the coordinate would be in the wrong hemisphere and " +
      "nothing would say so.",
  );

  blank();
  section("Sorting, one more time");
  detonate("[10, 9, 100].sort()", () => [10, 9, 100].sort());
  note(
    "[10, 100, 9]. The default comparator stringifies. In an invoice this " +
      "silently reorders line items by lexicographic accident.",
  );

  blank();
  table(
    ["operation", "JavaScript result", "detected?"],
    [
      ['[1200,3400,"5600"].reduce(+)', '"46005600"', "no"],
      ['quantities.push("4")', "array becomes heterogeneous", "no"],
      ["lineTotals[99]", "undefined", "no"],
      ["lineTotals[99].toFixed(2)", "TypeError", "yes, at runtime"],
      ["[].reduce(+) with no seed", "TypeError", "yes, at runtime"],
      ["[52.52, 13.4, 0] as a pair", "third component dropped", "no"],
      ["[10, 9, 100].sort()", "[10, 100, 9]", "no"],
    ],
  );
}
