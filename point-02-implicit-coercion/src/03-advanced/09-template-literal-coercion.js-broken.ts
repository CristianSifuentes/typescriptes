// @ts-nocheck
/**
 * 09-template-literal-coercion — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * Every `${...}` interpolation in a template literal calls `ToString` on its
 * value — unconditionally, regardless of type. This is a GENTLER coercion
 * than `+` (it never has an "arithmetic" branch to accidentally trigger),
 * but it hides its own class of bug: it makes ANY value, including
 * `undefined`, `null`, `NaN`, and objects, silently renderable as text, so a
 * missing or malformed value produces a plausible-looking string instead of
 * an error.
 *
 * DOMAIN: rendering a customer-facing receipt line from an order object
 * where a field may legitimately be missing (no discount) or, due to an
 * upstream bug, unexpectedly absent (no price at all).
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

export function runBroken(): void {
  section("ToString runs on EVERYTHING that lands inside ${...}");
  table(
    ["value", "typeof", "`${value}` result"],
    [
      ["42", "number", '"42"'],
      ["undefined", "undefined", '"undefined"'],
      ["null", "object", '"null"'],
      ["NaN", "number", '"NaN"'],
      ["[1,2,3]", "object", '"1,2,3"'],
      ["{}", "object", '"[object Object]"'],
      ["true", "boolean", '"true"'],
    ],
  );

  blank();
  section("A receipt line, built with a template literal");

  function renderReceiptLine(order) {
    return `${order.item} — $${order.price} (qty ${order.quantity})`;
  }

  js('renderReceiptLine({ item: "Widget", price: 19.99, quantity: 3 })');
  detonate("receipt line", () => renderReceiptLine({ item: "Widget", price: 19.99, quantity: 3 }));

  js('renderReceiptLine({ item: "Widget", quantity: 3 })  — price field missing (upstream bug)');
  detonate("receipt line (missing price)", () =>
    renderReceiptLine({ item: "Widget", quantity: 3 }),
  );
  note(
    'The customer sees "Widget — $undefined (qty 3)" on a real receipt. No ' +
      "exception anywhere: ToString(undefined) is the STRING \"undefined\", a " +
      "perfectly valid value for the template literal to embed.",
  );

  blank();
  js('renderReceiptLine({ item: "Widget", price: NaN, quantity: 3 })  — a failed price calculation upstream');
  detonate("receipt line (NaN price)", () =>
    renderReceiptLine({ item: "Widget", price: NaN, quantity: 3 }),
  );
  note('"$NaN" — equally plausible-looking, equally wrong, equally silent.');

  blank();
  section("Objects interpolate too, with no warning that you forgot a field access");
  const discount = { percent: 10 };
  js("`Discount: ${discount}%`  — meant discount.percent, typed discount by mistake");
  detonate("discount line", () => `Discount: ${discount}%`);
  note('"Discount: [object Object]%" — a typo-class bug template literals cannot flag.');
}
