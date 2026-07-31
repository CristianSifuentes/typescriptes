// @ts-nocheck
/**
 * 04-undefined-vs-missing — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * Two DIFFERENT mistakes that look identical once the function body starts
 * running: (a) forgetting to pass an argument at all, and (b) passing
 * `undefined` on purpose (or by accident, e.g. from an object property that
 * doesn't exist). JavaScript's binding model makes both produce EXACTLY the
 * same value inside the function — there is no way to tell them apart.
 *
 * DOMAIN: a discount calculator reading a coupon value from a lookup table.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function applyDiscount(price, discountPercent) {
  return price * (1 - discountPercent / 100);
}

const coupons = { SAVE10: 10, SAVE20: 20 };

export function runBroken(): void {
  section("A real coupon");

  js('applyDiscount(100, coupons["SAVE10"])');
  detonate('applyDiscount(100, coupons["SAVE10"])', () =>
    applyDiscount(100, coupons["SAVE10"]),
  );

  blank();
  section("An unknown coupon code — the lookup silently returns undefined");

  // 'coupons["EXPIRED99"]' is `undefined` — there's no such key. It is
  // PASSED explicitly, but it's still `undefined`, exactly as if the
  // argument had been omitted entirely.
  js('applyDiscount(100, coupons["EXPIRED99"])');
  detonate('applyDiscount(100, coupons["EXPIRED99"])', () =>
    applyDiscount(100, coupons["EXPIRED99"]),
  );
  runtimeSays(
    "NaN",
    "'coupons[\"EXPIRED99\"]' evaluates to 'undefined' because that key " +
      "doesn't exist. 'undefined / 100' is 'NaN', and '1 - NaN' is 'NaN' — " +
      "the WHOLE PRICE becomes NaN, silently, indistinguishable from what " +
      "would have happened if 'applyDiscount' had been called with only " +
      "one argument.",
  );

  blank();
  table(
    ["call", "discountPercent value", "outcome"],
    [
      ['applyDiscount(100, coupons["SAVE10"])', "10", "90 — correct"],
      ['applyDiscount(100, coupons["EXPIRED99"])', "undefined (explicit)", "NaN"],
      ["applyDiscount(100)", "undefined (omitted)", "NaN — identical to the row above"],
    ],
  );
  note(
    "JavaScript's binding model makes 'omitted' and 'explicitly undefined' " +
      "THE SAME VALUE inside the function body — there is no way, from " +
      "within 'applyDiscount', to tell a caller who forgot an argument " +
      "apart from a caller whose lookup legitimately came up empty.",
  );
}
