// @ts-nocheck
/**
 * 13-boundary-validation-layer — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * Demo 12 established that `as`/`any` let unverified data flow through a
 * program undetected. This demo is the other half: what a codebase looks
 * like with NO validation layer at all — every caller of `fetchOrder`
 * independently decides (or forgets) whether to trust the response shape.
 *
 * DOMAIN: an order-processing pipeline receiving payloads from a payment
 * webhook, where field types drift between API versions without warning.
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

function fetchOrderPayload(version) {
  // Two real shapes the same "logical" endpoint has returned across versions.
  if (version === 1) {
    return '{"orderId": "ORD-1", "totalCents": 1999, "discountPercent": 0}';
  }
  return '{"orderId": "ORD-1", "totalCents": "1999", "discountPercent": null}';
}

function computeFinalTotal(order) {
  const discountFactor = 1 - order.discountPercent / 100;
  return order.totalCents * discountFactor;
}

export function runBroken(): void {
  section("No validation layer: every caller inherits whatever JSON.parse hands back");

  const v1 = JSON.parse(fetchOrderPayload(1));
  js("computeFinalTotal(v1)  — v1's shape: totalCents is a number, discountPercent is 0");
  detonate("final total (v1)", () => computeFinalTotal(v1));

  const v2 = JSON.parse(fetchOrderPayload(2));
  js("computeFinalTotal(v2)  — v2's shape: totalCents is a STRING, discountPercent is null");
  detonate("final total (v2)", () => computeFinalTotal(v2));
  note(
    "NaN — `null / 100` is `0` (demo 06: null coerces to 0), so `1 - 0` is " +
      '`1`, but then `"1999" * 1` coerces the STRING via ToNumber... which ' +
      'actually succeeds (1999). The REAL failure is one version further: ' +
      "if `discountPercent` is `undefined` instead of `null`, or if " +
      '`totalCents` is `"1,999"` (a formatted string with a comma), the same ' +
      "function silently returns NaN, and nothing about the code path looks " +
      "different from the version that worked.",
  );

  blank();
  section("The actual failure mode: a formatted string slips through");
  const v3 = JSON.parse('{"orderId": "ORD-1", "totalCents": "1,999", "discountPercent": 10}');
  js('computeFinalTotal(v3)  — totalCents has a thousands separator');
  detonate("final total (v3)", () => computeFinalTotal(v3));
  note(
    'NaN. `Number("1,999")` is `NaN` — the comma breaks the StringNumericLiteral ' +
      "grammar entirely. This reaches checkout, or accounting, or a refund " +
      "calculation, with no exception anywhere in the call stack.",
  );

  blank();
  section("Without a single validation point, every caller re-derives its own trust");
  table(
    ["caller", "checks totalCents?", "checks discountPercent?", "consistent with other callers?"],
    [
      ["checkout.js", "sometimes", "no", "no — ad hoc"],
      ["refunds.js", "no", "sometimes", "no — different ad hoc checks"],
      ["analytics.js", "no", "no", "no — assumes the happy path always"],
    ],
  );
}
