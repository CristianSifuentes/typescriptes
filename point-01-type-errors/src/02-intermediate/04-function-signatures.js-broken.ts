// @ts-nocheck
/**
 * 04-function-signatures — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A JavaScript function signature is not a contract. It is a suggestion.
 *
 * The specification is explicit about this: parameters that receive no argument
 * are bound to `undefined`, and surplus arguments are simply collected into
 * `arguments` and ignored. Calling a 3-parameter function with 0, 2, or 9
 * arguments is *never* an error.
 *
 * DOMAIN: a shipping quote service.
 *
 * FOUR DEFECTS, NONE OF THEM REPORTED:
 *   1. Too few arguments   → `express` is `undefined`, falsy, wrong quote.
 *   2. Too many arguments  → the 4th is silently discarded; the caller believes
 *                            they enabled a feature that does not exist.
 *   3. Swapped arguments   → `weightKg` is an object, `destination` is a number;
 *                            `object * 3.5` is NaN and `(2.5).country` is
 *                            undefined. Result: NaN. No error.
 *   4. Wrong return type   → a function that promised a number returns a string;
 *                            the caller adds it and gets concatenation.
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

function shippingCost(weightKg, destination, express) {
  const base = weightKg * 3.5 + (destination.country === "US" ? 0 : 12);
  return express ? base * 2 : base;
}

/** Promises a number. Returns a string. Nothing checks. */
function totalWeight(items) {
  return items.join("+");
}

export function runBroken(): void {
  const berlin = { country: "DE", postalCode: "10115" };

  section("Arity is not enforced");

  js("shippingCost(2.5, berlin)  — the third argument was forgotten");
  detonate("quote", () => shippingCost(2.5, berlin));
  note(
    "20.75 instead of 41.50. `express` was bound to `undefined`, which is " +
      "falsy, so the express branch never ran. The customer paid for express " +
      "shipping and got standard.",
  );

  blank();
  js('shippingCost(2.5, berlin, true, "priority")  — a 4th argument that does not exist');
  detonate("quote", () => shippingCost(2.5, berlin, true, "priority"));
  note(
    '"priority" was discarded in silence. The caller is convinced they ' +
      "requested priority handling. They did not.",
  );

  blank();
  section("Argument ORDER is not enforced");

  js("shippingCost(berlin, 2.5, true)  — the first two arguments were swapped");
  detonate("quote", () => shippingCost(berlin, 2.5, true));
  note(
    "NaN. `{country:'DE'} * 3.5` is NaN; `(2.5).country` is undefined; the " +
      "ternary compares undefined to 'US' and takes the else branch; NaN + 12 " +
      "is NaN; NaN * 2 is NaN. Five operations, each individually 'successful'.",
  );

  blank();
  section("Return types are not enforced");

  js("totalWeight([1, 2, 3])  — documented as returning a number");
  detonate("total", () => totalWeight([1, 2, 3]));
  detonate("total + 10", () => totalWeight([1, 2, 3]) + 10);
  note(
    'The function returns "1+2+3". Adding 10 concatenates. The shipping label ' +
      'now says the parcel weighs "1+2+310" kilograms.',
  );

  blank();
  section("Callbacks are functions too — and equally unchecked");

  js("[1,2,3].map(w => `${w * 2}`)  — a callback that returns strings");
  detonate("doubled", () => [1, 2, 3].map((w) => `${w * 2}`));
  detonate("sum of doubled", () => [1, 2, 3].map((w) => `${w * 2}`).reduce((a, b) => a + b, 0));
  note('The reduce produces "0246": four concatenations that all "succeeded".');

  blank();
  js("[3,1,2].sort((a, b) => a < b)  — a predicate where a comparator was needed");
  detonate("sorted", () => [3, 1, 2].sort((a, b) => a < b));
  note(
    "`sort` needs negative/zero/positive, not true/false. Booleans coerce to " +
      "0 and 1, so the comparator never returns a negative number and the sort " +
      "silently does almost nothing. Correct-looking output on small arrays is " +
      "what makes this one survive review.",
  );

  blank();
  section("Summary of a language with no signatures");
  table(
    ["call", "what JavaScript does", "result", "reported?"],
    [
      ["missing argument", "binds `undefined`", "wrong branch taken", "no"],
      ["surplus argument", "discards it", "feature silently absent", "no"],
      ["swapped arguments", "runs anyway", "NaN", "no"],
      ["wrong return type", "returns it", "string concatenation downstream", "no"],
      ["wrong callback shape", "calls it", "corrupt aggregation / bad sort", "no"],
    ],
  );
}
