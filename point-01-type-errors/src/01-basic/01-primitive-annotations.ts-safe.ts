/**
 * 01-primitives — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * The same checkout service. The type checker is ON, `strict: true`.
 *
 * Every defect from the `.js-broken` twin is still written below — deliberately.
 * Each one is preceded by `// @ts-expect-error`, which is not "ignore this".
 * It is an *inverted assertion*: it tells the compiler
 *
 *     "the next line MUST produce an error; if it ever stops producing one,
 *      fail the build."
 *
 * So this file is simultaneously a demonstration and a regression test of the
 * compiler's behaviour. If TypeScript ever started accepting `"12" as number`,
 * this file would break with TS2578 ("Unused '@ts-expect-error' directive").
 *
 * The real, unsuppressed diagnostics — message text and TSxxxx codes — are
 * produced by `npm run evidence`, which compiles
 * `_level-01.tsc-error.ts`.
 */

import {
  section,
  ts,
  good,
  note,
  compilerSays,
  table,
  blank,
  detonate,
  compileTimeOnly,
} from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

// ===========================================================================
// 1. THE DOMAIN, TYPED
//    A type annotation is a *claim about the set of values* a binding may hold
//    (see 00-foundations/manifesto.md §3). `: number` claims membership in the
//    set of IEEE-754 doubles — and the compiler will enforce that claim at
//    every assignment, for every execution.
// ===========================================================================

interface CheckoutInput {
  readonly itemsTotal: number; // cents
  readonly shippingFee: number; // cents
  readonly taxRate: number; // fraction, e.g. 0.0825
  readonly isGift: boolean;
}

/**
 * The boundary function. This is where strings become numbers — explicitly,
 * once, in one auditable place, with the failure modes handled.
 *
 * Note what the signature promises: given anything, you get back a
 * `CheckoutInput` or an exception. Downstream code never has to wonder.
 */
function parseCheckoutInput(raw: {
  itemsTotal: number;
  shippingFee: string;
  taxRate: string;
  isGift: string;
}): CheckoutInput {
  const shippingFee = Number.parseInt(raw.shippingFee, 10);
  const taxRate = Number.parseFloat(raw.taxRate.replace("%", "")) / 100;

  // `Number.parseInt` returns `number`, and `NaN` IS a `number` — the type
  // system cannot rule it out. Types constrain the *kind* of value, not its
  // *content*. Content requires a runtime check, and here it is:
  if (!Number.isFinite(shippingFee)) throw new RangeError("shippingFee is not a finite number");
  if (!Number.isFinite(taxRate)) throw new RangeError("taxRate is not a finite number");

  return {
    itemsTotal: raw.itemsTotal,
    shippingFee,
    taxRate,
    isGift: raw.isGift === "true",
  };
}

export function runSafe(): void {
  section("TypeScript: the same four bugs, all rejected before execution");

  // =========================================================================
  // BUG 1 REJECTED — assigning a string to a `number` binding.
  // =========================================================================
  ts("const shippingFee: number = \"12\";");
  // @ts-expect-error TS2322: Type 'string' is not assignable to type 'number'.
  const shippingFeeWrong: number = "12";
  void shippingFeeWrong;
  compilerSays(
    "TS2322",
    "Type 'string' is not assignable to type 'number'.",
    "Assignability is subset inclusion: the set of strings is not a subset of " +
      "the set of numbers, so no string may inhabit a `number` binding.",
  );
  good("The 100x overcharge is now impossible to write.");

  // =========================================================================
  // BUG 2 REJECTED — arithmetic on a string operand.
  // =========================================================================
  blank();
  const subtotal = 112;
  const taxRateText = "8.25%";
  ts("subtotal * taxRateText");
  // @ts-expect-error TS2363: The right-hand side of an arithmetic operation must be of
  // type 'any', 'number', 'bigint' or an enum type.
  const taxWrong = subtotal * taxRateText;
  void taxWrong;
  compilerSays(
    "TS2363",
    "The right-hand side of an arithmetic operation must be of type 'any', " +
      "'number', 'bigint' or an enum type.",
    "`*` is defined only on numeric types. TypeScript refuses to perform the " +
      "implicit coercion that would have produced NaN.",
  );
  good("NaN cannot be born here, so it cannot propagate.");

  // =========================================================================
  // BUG 3 REJECTED — a string where a boolean was meant.
  // =========================================================================
  blank();
  ts('const isGift: boolean = "false";');
  // @ts-expect-error TS2322: Type 'string' is not assignable to type 'boolean'.
  const isGiftWrong: boolean = "false";
  void isGiftWrong;
  compilerSays(
    "TS2322",
    "Type 'string' is not assignable to type 'boolean'.",
    "`boolean` is the two-element set { true, false }. The string \"false\" is " +
      "not a member of it, however much it looks like one.",
  );
  good('The truthiness trap ("false" is truthy) is closed at the type level.');

  // =========================================================================
  // BUG 4 REJECTED — calling a number method on a string.
  // =========================================================================
  blank();
  ts('"10012".toFixed(2)');
  compileTimeOnly(() => {
    // @ts-expect-error TS2551: Property 'toFixed' does not exist on type '"10012"'.
    // Did you mean 'fixed'?
    const invoiceWrong = "10012".toFixed(2);
    void invoiceWrong;
  });
  compilerSays(
    "TS2551",
    "Property 'toFixed' does not exist on type '\"10012\"'. Did you mean 'fixed'?",
    "Three things to notice. (1) Method resolution is static: the compiler " +
      "looks `toFixed` up in the declared members of `String` and does not " +
      "find it — in JavaScript that same lookup happens at runtime and throws. " +
      "(2) The receiver is reported as the LITERAL type '\"10012\"', not " +
      "'string': the compiler tracks the exact value. (3) TS2551 rather than " +
      "TS2339 because a near-miss member exists — `String.prototype.fixed`, a " +
      "legacy HTML method — so the checker offers a spelling suggestion.",
  );
  good("The TypeError that ended the JavaScript run is now a red squiggle.");

  // =========================================================================
  // 2. THE CORRECT PROGRAM — and what the compiler knows about it.
  // =========================================================================
  blank();
  section("The version that compiles, and the types the compiler proved");

  const input = parseCheckoutInput({
    itemsTotal: 100,
    shippingFee: "12",
    taxRate: "8.25%",
    isGift: "false",
  });

  // `proveType<T>()` does not merely print a label: if the static type of the
  // expression is not EXACTLY T, this line fails to compile with TS2554.
  // Every type printed below is therefore machine-verified, not asserted.
  proveType<number>()(input.itemsTotal, "number", "declared in CheckoutInput");
  proveType<number>()(input.shippingFee, "number", "parsed at the boundary");
  proveType<number>()(input.taxRate, "number", "parsed at the boundary");
  proveType<boolean>()(input.isGift, "boolean", 'raw === "true"');

  const trueSubtotal: number = input.itemsTotal + input.shippingFee;
  const tax: number = Math.round(trueSubtotal * input.taxRate);
  const giftWrapFee: number = input.isGift ? 350 : 0;
  const invoice: string = ((trueSubtotal + tax + giftWrapFee) / 100).toFixed(2);

  proveType<number>()(trueSubtotal, "number", "`+` on two numbers is addition");
  proveType<string>()(invoice, "string", "`toFixed` returns string");

  blank();
  detonate("invoice", () => `$${invoice}`);

  blank();
  table(
    ["quantity", "JavaScript produced", "TypeScript produces", "caught when"],
    [
      ["subtotal", '"10012" (string)', "112 (number)", "compile time"],
      ["tax", "NaN", "9 (number)", "compile time"],
      ["giftWrapFee", "350 (wrong branch)", "0", "compile time"],
      ["invoice", "TypeError", '"1.21"', "compile time"],
    ],
  );
  note(
    "Not one of these errors required running the program, writing a test, or " +
      "reproducing a customer report.",
  );
}
