// @ts-nocheck
/**
 * 14-never-guarded-mixed-type-op — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * The final demo closes the loop: a generic `sum` utility, the kind every
 * codebase eventually grows, that is meant to add up a list of numbers —
 * but which JavaScript will happily "sum" a list of ANYTHING, silently
 * switching between numeric addition and string concatenation depending on
 * what the FIRST non-matching element happens to be.
 *
 * DOMAIN: a generic reporting utility (`sum`, `average`) reused across a
 * codebase for prices, quantities, and — by accident, because nothing
 * stops it — a list that also contains a label or a missing value.
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function average(values) {
  return sum(values) / values.length;
}

export function runBroken(): void {
  section("A generic `sum`, reused everywhere, guarded by nothing");

  js("sum([19.99, 1.65, 3.50])   — a normal price list");
  detonate("sum (normal)", () => sum([19.99, 1.65, 3.50]));

  js('sum([19.99, 1.65, "3.50"]) — one element came from a form field, unparsed');
  detonate("sum (one string)", () => sum([19.99, 1.65, "3.50"]));
  note('"25.143.50" — once `total` becomes a string, EVERY remaining addition concatenates.');

  js('sum([19.99, undefined, 3.50]) — one element is a missing price');
  detonate("sum (one undefined)", () => sum([19.99, undefined, 3.50]));
  note("NaN — and average() below inherits it silently.");

  blank();
  js("average([19.99, undefined, 3.50])");
  detonate("average", () => average([19.99, undefined, 3.50]));

  blank();
  section("Nothing about `sum`'s definition prevents any of this");
  table(
    ["call", "element types", "result", "exception?"],
    [
      ["sum([1, 2, 3])", "all number", "6", "no"],
      ['sum([1, "2", 3])', "mixed", '"33"', "no"],
      ["sum([1, undefined, 3])", "mixed", "NaN", "no"],
      ["sum([1, null, 3])", "mixed", "4", "no — accidentally 'correct'"],
      ["sum(['a', 'b'])", "all string", '"ab"', "no — silently NOT a sum at all"],
    ],
  );
  note(
    "The function's NAME promises arithmetic; its IMPLEMENTATION promises " +
      "nothing about the element type at all. `sum(['a', 'b'])` returning " +
      '"ab" with no error is the clearest illustration in this entire project ' +
      "of what 'no static types' actually costs: the function's contract " +
      "exists only in a comment, if it exists anywhere.",
  );
}
