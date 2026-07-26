// @ts-nocheck
/**
 * 01-plus-operator-overload — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * `+` is the ONLY arithmetic operator ECMAScript overloads. Every other one
 * (`-`, `*`, `/`, `%`, `**`) always means "coerce both sides to numbers, then
 * compute". `+` instead runs `ApplyStringOrNumericBinaryOperator`, which asks
 * "is either operand a string (after ToPrimitive)?" and, if so, abandons
 * arithmetic for concatenation.
 *
 *   5 + 3     → 8        both numeric  → numeric addition
 *   "5" + 3   → "53"     one is a string → concatenation
 *
 * DOMAIN: a checkout total built from a unit price (a number, from the price
 * list) and a quantity typed into an HTML <input> (a string, always — every
 * DOM form field value is a string, with no exception).
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

/** Every value read from an <input> element is a string. This is not
 *  contrived: `event.target.value` has type `string` in every browser. */
function readQuantityInput() {
  return "3"; // the customer typed "3" into a quantity box
}

export function runBroken(): void {
  section("The one operator with two algorithms");

  const unitPrice = 19.99; // from the price list — a real number
  const quantity = readQuantityInput(); // from the DOM — a string, always

  js(`unitPrice (${unitPrice}, number) + quantity ("${quantity}", string)`);
  const total = unitPrice + quantity;
  detonate("total", () => total);
  note(
    'Expected 59.97 (three units at $19.99). Got "19.993" — the price and the ' +
      "quantity were concatenated as text. No exception. No warning.",
  );

  blank();
  section("Why review misses it");
  table(
    ["expression", "operands", "result", "looks like a bug?"],
    [
      ["unitPrice + quantity", "number + string", '"19.993"', "not obviously — reads like a sum"],
      ["unitPrice * Number(quantity)", "number * number", "59.97", "correct, but nobody wrote this"],
    ],
  );

  blank();
  section("The trap generalizes to every text input on the page");
  const discountPercentInput = "10"; // another form field
  const shippingFeeInput = "5.50"; // another form field

  detonate("unitPrice + discountPercentInput", () => unitPrice + discountPercentInput);
  detonate("quantity + shippingFeeInput", () => quantity + shippingFeeInput);
  detonate('quantity + quantity + quantity', () => quantity + quantity + quantity);
  note(
    '`quantity + quantity + quantity` → "333", not 9. `+` is left-associative ' +
      "and string-once-a-string-always for the rest of the chain.",
  );

  blank();
  section("The asymmetry that makes `+` uniquely dangerous");
  table(
    ["operator", "coerces unconditionally?", "silent failure mode"],
    [
      ["-, *, /, %, **", "yes — always ToNumber", "NaN (loud in a sense: NaN propagates and often surfaces)"],
      ["+", "no — checks operand types first", '"19.993" (a PLAUSIBLE number, as text — the worst kind of wrong)'],
    ],
  );
  note(
    "NaN at least announces itself in a debugger (`Number.isNaN` becomes true " +
      'somewhere). `"19.993"` looks correct in a receipt PDF. This is the ' +
      "single most expensive property of `+`.",
  );
}
