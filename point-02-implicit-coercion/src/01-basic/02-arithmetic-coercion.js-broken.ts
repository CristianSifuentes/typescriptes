// @ts-nocheck
/**
 * 02-arithmetic-coercion — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * Unlike `+`, every other arithmetic operator (`-`, `*`, `/`, `%`, `**`) has
 * exactly ONE meaning: coerce both operands with `ToNumber`, then compute.
 * There is no "is either side a string?" branch — the coercion is
 * unconditional, and when it fails it does not throw, it produces `NaN`.
 *
 *   "5" - 3     → 2         ToNumber("5") = 5, then 5 - 3
 *   "abc" * 2   → NaN       ToNumber("abc") = NaN, then NaN * 2 = NaN
 *
 * DOMAIN: a discount engine. `basePrice` comes from the internal price list
 * (number). `discountPercent` and `couponValue` come from a marketing CSV
 * import, where every column is text.
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

function readMarketingRow() {
  return { sku: "SKU-42", discountPercent: "15", couponValue: "3.50", tag: "SUMMER" };
}

export function runBroken(): void {
  section("The operators that coerce unconditionally");

  const basePrice = 80;
  const row = readMarketingRow();

  js("basePrice * (1 - discountPercent / 100)");
  const discounted = basePrice * (1 - row.discountPercent / 100);
  detonate("discounted price", () => discounted);
  note(
    "This one WORKS — 68 — because ToNumber(\"15\") succeeds cleanly. The " +
      "developer now believes every field in this CSV is 'basically a number'.",
  );

  blank();
  section("...until a column holds text that is not numeric");

  js("basePrice - couponValue  (looks fine: '3.50' parses)");
  const afterCoupon = basePrice - row.couponValue;
  detonate("price after coupon", () => afterCoupon);

  js("basePrice * tag  (tag is a marketing label, not a number)");
  const corrupted = basePrice * row.tag;
  detonate("corrupted total", () => corrupted);
  note(
    "`NaN`. No exception was thrown. If this value is later stored, summed, or " +
      "displayed, EVERY downstream computation that touches it becomes NaN too " +
      "— NaN is absorbing: `NaN + x`, `NaN - x`, `NaN * x` are all NaN.",
  );

  blank();
  section("NaN is a number, and it is contagious");
  const runningTotal = [discounted, afterCoupon, corrupted, 42].reduce((a, b) => a + b, 0);
  detonate("running total across four SKUs", () => runningTotal);
  note("One bad row poisons the sum of the entire batch, silently, at any position.");

  blank();
  section("The full coercion table for non-`+` arithmetic");
  table(
    ["expression", "ToNumber step", "result", "exception?"],
    [
      ['"5" - 3', 'ToNumber("5") = 5', "2", "no"],
      ['"abc" * 2', 'ToNumber("abc") = NaN', "NaN", "no"],
      ['"" - 1', 'ToNumber("") = 0', "-1", "no"],
      ["null * 2", "ToNumber(null) = 0", "0", "no"],
      ["undefined - 1", "ToNumber(undefined) = NaN", "NaN", "no"],
      ["[] - 1", "ToNumber(ToPrimitive([])) = ToNumber(\"\") = 0", "-1", "no"],
      ["[5] * 2", "ToNumber(ToPrimitive([5])) = ToNumber(\"5\") = 5", "10", "no"],
      ["[5, 6] * 2", 'ToNumber("5,6") = NaN', "NaN", "no"],
      ["{} - 1", 'ToNumber("[object Object]") = NaN', "NaN", "no"],
    ],
  );
  note(
    "Not one of these nine operations throws. `ToNumber` NEVER raises an " +
      "exception for arithmetic operators — it always returns SOME number, " +
      "including NaN. This is why arithmetic coercion is more insidious than a " +
      "crash: a crash gets noticed.",
  );
}
