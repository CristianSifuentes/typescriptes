/**
 * 09-template-literal-coercion — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * An uncomfortable fact, stated up front: TypeScript places NO restriction
 * on what type may appear inside `${...}`. `ToString` accepts every value,
 * so the checker has no type it needs to reject — `${anything}` type-checks,
 * always, including `undefined`, `null`, and whole objects. This is a real
 * gap, not a demo simplification.
 *
 * What DOES work is routing every interpolated value through an explicit,
 * narrowly-typed formatting function FIRST. The interpolation itself stays
 * permissive; the ARGUMENT to your formatter is where `strictNullChecks`
 * and ordinary parameter typing re-enter the picture — because a function
 * parameter, unlike a template hole, is a real type-checked position.
 */

import {
  section,
  ts,
  good,
  warn,
  note,
  compilerSays,
  table,
  blank,
  detonate,
} from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface Order {
  readonly item: string;
  readonly price?: number; // optional: "no price yet" is a real, honest state
  readonly quantity: number;
}

export function runSafe(): void {
  // =========================================================================
  // 1. THE GAP, DEMONSTRATED HONESTLY
  // =========================================================================
  section("Template interpolation accepts anything — even `possibly undefined`");

  function renderReceiptLineUnchecked(order: Order): string {
    ts("`${order.item} — $${order.price} (qty ${order.quantity})`");
    // No @ts-expect-error here — there is genuinely no error to suppress.
    return `${order.item} — $${order.price} (qty ${order.quantity})`;
  }
  warn(
    "`order.price` has type `number | undefined`. Interpolating it compiles " +
      "with ZERO diagnostics, exactly like the JavaScript version. Template " +
      "literals are one of the few positions in this project where " +
      "`strictNullChecks` has nothing to say.",
  );
  detonate(
    "receipt line (missing price)",
    () => renderReceiptLineUnchecked({ item: "Widget", quantity: 3 }),
  );
  note('"Widget — $undefined (qty 3)" — identical to the uncaught JavaScript bug.');

  // =========================================================================
  // 2. THE FIX: FORCE THE VALUE THROUGH A TYPED PARAMETER FIRST
  // =========================================================================
  blank();
  section("The fix: a formatter with a REQUIRED parameter, called explicitly");

  /** `price` here is a real, type-checked parameter position — unlike a
   *  template hole, passing `number | undefined` to it IS an error. */
  function formatCurrency(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  function renderReceiptLineSafe(order: Order): string {
    ts("formatCurrency(order.price)");
    // @ts-expect-error TS2345: Argument of type 'number | undefined' is not assignable to
    // parameter of type 'number'.
    formatCurrency(order.price);
    compilerSays(
      "TS2345",
      "Argument of type 'number | undefined' is not assignable to parameter " +
        "of type 'number'.",
      "The SAME optional field that slipped silently through `${order.price}` " +
        "is rejected here, because a function parameter is a type-checked " +
        "position and a template hole is not. Routing values through named " +
        "functions converts an invisible gap into a visible one.",
    );
    if (order.price === undefined) {
      throw new RangeError(`order for "${order.item}" has no price`);
    }
    return `${order.item} — ${formatCurrency(order.price)} (qty ${order.quantity})`;
  }

  detonate(
    "receipt line (safe)",
    () => renderReceiptLineSafe({ item: "Widget", price: 19.99, quantity: 3 }),
  );
  good('"Widget — $19.99 (qty 3)" — and a missing price now THROWS with a clear message instead of rendering "$undefined".');

  // =========================================================================
  // 3. OBJECTS INSIDE TEMPLATE LITERALS: THE SAME GAP, A DIFFERENT SHAPE
  // =========================================================================
  blank();
  section("Interpolating a whole object: also not flagged");

  interface Discount {
    readonly percent: number;
  }
  const discount: Discount = { percent: 10 };

  ts("`Discount: ${discount}%`   -- meant discount.percent");
  const discountLine = `Discount: ${discount}%`;
  detonate("discount line (unchecked)", () => discountLine);
  warn(
    "No error. `${discount}` type-checks for the same reason `${order.price}` " +
      "did: every type has a `ToString` path, so every type is a legal " +
      "template-literal operand. Only a NAME (`discount.percent`, or a " +
      "`.describe()` method) makes the intended field visible in the source.",
  );

  blank();
  const correctedLine = `Discount: ${discount.percent}%`;
  proveType<string>()(correctedLine, "string", "");
  good('"Discount: 10%" — reached by naming the field, not by any type check preventing the typo.');

  // =========================================================================
  // 4. THE HONEST SUMMARY TABLE
  // =========================================================================
  blank();
  section("Where the boundary actually is");
  table(
    ["position", "does TypeScript restrict the type?"],
    [
      ["template literal hole `${x}`", "no — every type is accepted"],
      ["function parameter", "yes — ordinary assignability rules, including strictNullChecks"],
      ["arithmetic operand (+, -, *, /)", "yes — demos 01-02, 08"],
      ["== / === operand", "yes, when types provably never overlap (TS2367, demo 04)"],
    ],
  );
}
