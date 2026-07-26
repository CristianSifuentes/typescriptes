// @ts-nocheck
/**
 * 10-valueof-tostring-symbol-toprimitive — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * `ToPrimitive` checks for THREE hooks, in this priority order:
 *
 *   1. Symbol.toPrimitive(hint)   -- if present, TOTAL override, hint-aware
 *   2. valueOf()                  -- tried first for hint "number"/"default"
 *   3. toString()                 -- tried first for hint "string"
 *
 * A class that defines `valueOf`/`toString` (or `Symbol.toPrimitive`) is
 * OPTING IN to coercion — every `+`, `-`, template literal, and `==` against
 * an instance will silently call into that method. This is a legitimate,
 * powerful feature (it's how `Date` and money-like value objects integrate
 * with operators) — and a common source of "why did adding two Money
 * objects give me a weird number" bugs when the hook's contract is unclear.
 *
 * DOMAIN: a `Money` value object representing cents, hooking into coercion
 * so `money1 + money2` "just works" — and the surprises that come with it.
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

class Money {
  constructor(cents) {
    this.cents = cents;
  }
  valueOf() {
    return this.cents;
  }
  toString() {
    return `$${(this.cents / 100).toFixed(2)}`;
  }
}

class MoneyWithHint {
  constructor(cents) {
    this.cents = cents;
  }
  [Symbol.toPrimitive](hint) {
    if (hint === "string") return `$${(this.cents / 100).toFixed(2)}`;
    if (hint === "number") return this.cents;
    return `$${(this.cents / 100).toFixed(2)}`; // hint "default"
  }
}

export function runBroken(): void {
  section("Money with valueOf/toString — coercion 'just works', until it doesn't");

  const price = new Money(1999); // $19.99
  const tax = new Money(165); // $1.65

  js("price + tax   -- valueOf() is tried first for hint 'default': ADDS CENTS");
  detonate("price + tax", () => price + tax);
  note("2164 — a raw number of CENTS, not a Money instance and not a dollar amount. Whoever wrote `+` here probably wanted a NEW Money.");

  js('`Total: ${price}`   -- hint "string": toString() is tried FIRST for template literals');
  detonate("`Total: ${price}`", () => `Total: ${price}`);

  js("price == 1999   -- valueOf() participates in == too");
  detonate("price == 1999", () => price == 1999);
  note("true — the Money object compares equal to its raw cent count, which may or may not be intended.");

  blank();
  section("The hint changes EVERYTHING, and hint selection is invisible in source");
  table(
    ["context", "hint passed to ToPrimitive", "method tried FIRST"],
    [
      ["price + tax", '"default"', "valueOf()"],
      ["`${price}`", '"string"', "toString()"],
      ["+price (unary)", '"number"', "valueOf()"],
      ["price < tax", '"number"', "valueOf()"],
      ["String(price)", '"string"', "toString()"],
    ],
  );
  note(
    "Nothing in `price + tax` visually distinguishes it from `someNumber + " +
      "someOtherNumber`. The hint, and therefore which method runs, is decided " +
      "entirely by which OPERATOR surrounds the expression — invisible at the " +
      "call site itself.",
  );

  blank();
  section("Symbol.toPrimitive: full control, same invisibility problem");
  const priceH = new MoneyWithHint(1999);
  detonate("priceH + 0", () => priceH + 0);
  detonate("`${priceH}`", () => `${priceH}`);
  detonate("+priceH", () => +priceH);
  note(
    "Symbol.toPrimitive lets a class answer DIFFERENTLY per hint (here, " +
      "'default' and 'string' both format as currency, but 'number' returns " +
      "raw cents) — more correct, but the invisibility of WHICH hint fires is " +
      "unchanged.",
  );
}
