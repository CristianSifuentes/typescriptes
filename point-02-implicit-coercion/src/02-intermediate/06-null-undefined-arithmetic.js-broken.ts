// @ts-nocheck
/**
 * 06-null-undefined-arithmetic — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * `ToNumber` defines `null` and `undefined` DIFFERENTLY, and the difference
 * is not intuitive:
 *
 *   ToNumber(null)      = 0     — an explicit, deliberate spec rule
 *   ToNumber(undefined) = NaN   — a different, also deliberate spec rule
 *
 * So `null` behaves like a real zero in arithmetic, and `undefined` poisons
 * the computation with NaN. Two values that both mean "nothing is here" in
 * everyday usage take OPPOSITE paths through the exact same operator.
 *
 * DOMAIN: a shopping-cart total where a discount field may be `null`
 * (explicitly "no discount applies", set by business logic) or `undefined`
 * (the field was never populated — usually a bug upstream).
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

export function runBroken(): void {
  section("Same intent, opposite ToNumber rule");
  table(
    ["value", "typeof", "ToNumber", "spec reason"],
    [
      ["null", "object", "0", "explicit: null converts to positive zero"],
      ["undefined", "undefined", "NaN", "explicit: undefined has no numeric representation"],
    ],
  );

  blank();
  section("The shopping cart, two ways to mean 'no discount'");

  function computeTotal(subtotal, discount) {
    return subtotal - discount;
  }

  const subtotal = 100;

  js("computeTotal(100, null)   — discount explicitly set to 'none' by the pricing engine");
  detonate("total (discount: null)", () => computeTotal(subtotal, null));
  note("100 — correct! null behaves like zero here, by luck of the spec rule.");

  js("computeTotal(100, undefined) — discount field was never populated (a real bug upstream)");
  detonate("total (discount: undefined)", () => computeTotal(subtotal, undefined));
  note(
    "NaN — and it PROPAGATES. Any tax, shipping, or rounding computed from " +
      "this total is now also NaN, and none of those downstream computations " +
      "throws either.",
  );

  blank();
  section("The trap: code that 'handles null' looks safe but leaves undefined uncovered");

  function computeTotalGuarded(subtotal, discount) {
    // A common, INCOMPLETE guard: checks for null, misses undefined.
    const safeDiscount = discount === null ? 0 : discount;
    return subtotal - safeDiscount;
  }

  js("computeTotalGuarded(100, undefined) — the === null check does not match undefined");
  detonate("guarded total (discount: undefined)", () => computeTotalGuarded(subtotal, undefined));
  note(
    "Still NaN. `discount === null` is `false` when discount is `undefined` " +
      "(=== never coerces), so the guard silently does nothing for exactly the " +
      "case that needed it.",
  );

  blank();
  section("More null/undefined arithmetic, for the full picture");
  detonate("null + 1", () => null + 1);
  detonate("undefined + 1", () => undefined + 1);
  detonate("null * 5", () => null * 5);
  detonate("undefined * 5", () => undefined * 5);
  detonate("null - null", () => null - null);
  detonate("[null, undefined, 1, 2].reduce((a, b) => a + b)", () =>
    [null, undefined, 1, 2].reduce((a, b) => a + b),
  );
  note(
    "A single `undefined` anywhere in a reduce chain poisons the entire " +
      "accumulation, from that point forward, regardless of how many valid " +
      "numbers follow it.",
  );
}
