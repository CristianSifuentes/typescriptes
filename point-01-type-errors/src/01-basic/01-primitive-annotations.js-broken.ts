// @ts-nocheck
/**
 * 01-primitives — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * `// @ts-nocheck` on line 1 switches the type checker off for this file. What
 * remains is, semantically, plain JavaScript: the compiler will happily emit it
 * without inspecting a single expression. This is the baseline we are measuring
 * against — the language as it behaves when nobody is checking.
 *
 * DOMAIN: a checkout service computing what to charge a customer.
 * The values arrive where values always arrive from: the environment, a JSON
 * payload, a form field. Every one of them is a STRING at runtime, and nothing
 * in JavaScript objects to that.
 *
 * WHAT GOES WRONG, AND WHEN:
 *   line ~48  `itemsTotal + shippingFee`  → string concatenation, not addition.
 *                                           No error. Result: "10012".
 *   line ~57  `subtotal * taxRate`        → NaN, because "8.25%" is not numeric.
 *                                           No error. NaN then infects every
 *                                           downstream computation forever.
 *   line ~66  `if (isGift)`               → the STRING "false" is truthy.
 *                                           No error. The branch runs backwards.
 *   line ~78  `.toFixed(2)` on a string   → TypeError, thrown at last, in the
 *                                           final line of the pipeline, far
 *                                           away from the line that was wrong.
 *
 * Note the pattern: the crash, when it finally comes, happens nowhere near the
 * defect. Three of the four bugs never crash at all.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

/**
 * Simulates `process.env` / `JSON.parse(body)` / `formData.get(...)`.
 * Every boundary in a real system hands you strings.
 */
function readCheckoutInput() {
  return {
    itemsTotal: 100, // cents, computed internally — genuinely a number
    shippingFee: "12", // from process.env.SHIPPING_FEE — a string
    taxRate: "8.25%", // from a config file — a string with a suffix
    isGift: "false", // from a query parameter — the string "false"
  };
}

export function runBroken(): void {
  section("JavaScript: nobody is checking");

  const input = readCheckoutInput();

  // -------------------------------------------------------------------------
  // BUG 1 — `+` is overloaded in JavaScript: numeric addition OR string
  // concatenation, decided at runtime by the operand types. One string operand
  // is enough to switch the whole operation.
  // -------------------------------------------------------------------------
  const subtotal = input.itemsTotal + input.shippingFee;
  js(`itemsTotal (${input.itemsTotal}) + shippingFee ("${input.shippingFee}")`);
  detonate("subtotal", () => subtotal);
  note('Expected 112. Got the string "10012" — a 100x overcharge that did not throw.');

  // -------------------------------------------------------------------------
  // BUG 2 — `*` coerces its operands to numbers. "8.25%" is not a numeric
  // string, so coercion yields NaN. NaN is contagious: every arithmetic
  // operation involving it produces NaN, silently, forever.
  // -------------------------------------------------------------------------
  blank();
  const tax = subtotal * input.taxRate;
  js(`subtotal * taxRate ("${input.taxRate}")`);
  detonate("tax", () => tax);
  detonate("tax + 500", () => tax + 500);
  detonate("Math.max(tax, 0)", () => Math.max(tax, 0));
  note("NaN is a black hole: once it enters the pipeline nothing removes it.");

  // -------------------------------------------------------------------------
  // BUG 3 — every non-empty string is truthy, including "false".
  // -------------------------------------------------------------------------
  blank();
  js(`isGift is the string "${input.isGift}"`);
  const giftWrapFee = input.isGift ? 350 : 0;
  detonate("giftWrapFee", () => giftWrapFee);
  note('The customer said "false" and was charged for gift wrap anyway.');

  // -------------------------------------------------------------------------
  // BUG 4 — the crash. It arrives at the END of the pipeline, on a line that
  // is completely innocent, minutes or months after the defect was introduced.
  // -------------------------------------------------------------------------
  blank();
  js("formatting the invoice line: subtotal.toFixed(2)");
  detonate("invoice", () => subtotal.toFixed(2));
  runtimeSays(
    "TypeError: subtotal.toFixed is not a function",
    "Reported at the formatting step. The actual defect is 30 lines earlier, " +
      "in a `+` that looked perfectly ordinary.",
  );

  blank();
  section("What actually got charged");
  table(
    ["quantity", "intended", "produced by JavaScript", "detected?"],
    [
      ["subtotal", "112", '"10012" (string)', "no"],
      ["tax", "9.24", "NaN", "no"],
      ["giftWrapFee", "0", "350", "no"],
      ["invoice", '"112.00"', "TypeError thrown", "yes — in production"],
    ],
  );
  note(
    "Three silent corruptions and one late crash, from four assignments that " +
      "JavaScript considered entirely legal.",
  );
}
