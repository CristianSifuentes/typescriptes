/**
 * 10-valueof-tostring-symbol-toprimitive — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * TypeScript's stance on custom coercion hooks is operator-by-operator, and
 * more nuanced than any single rule:
 *
 *   binary `+` between two objects       -> REJECTED (TS2365), even if both
 *                                            define a numeric `valueOf()`
 *   relational  `<` `>` `<=` `>=`        -> ACCEPTED if both sides have a
 *                                            `valueOf` (or are otherwise
 *                                            number-like) — these operators
 *                                            trust the coercion hook
 *   `==`/`===` against an unrelated type -> REJECTED (TS2367) — a `Money`
 *                                            and a `number` are disjoint
 *                                            TYPES regardless of `valueOf`
 *   template-literal interpolation       -> always accepted (demo 09)
 *   unary `+`/`-`                        -> accepted — always requests ToNumber
 *
 * The practical consequence: TypeScript pushes you AWAY from operator
 * overloading via `valueOf`/`Symbol.toPrimitive` for anything except
 * ordering, and TOWARD named methods for arithmetic and equality — which
 * happens to be exactly the API design that reads clearly in a diff.
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

class Money {
  readonly cents: number;

  constructor(cents: number) {
    this.cents = cents;
  }

  valueOf(): number {
    return this.cents;
  }

  toString(): string {
    return `$${(this.cents / 100).toFixed(2)}`;
  }

  /** The explicit, named alternative to relying on `+`. */
  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  /** The explicit, named alternative to relying on `==`. */
  equals(other: Money): boolean {
    return this.cents === other.cents;
  }
}

export function runSafe(): void {
  const price = new Money(1999);
  const tax = new Money(165);

  // =========================================================================
  // 1. BINARY `+`: REJECTED, EVEN THOUGH valueOf() RETURNS number
  // =========================================================================
  section("`price + tax` — rejected outright, valueOf() notwithstanding");

  ts("price + tax");
  // @ts-expect-error TS2365: Operator '+' cannot be applied to types 'Money' and 'Money'.
  const summed = price + tax;
  void summed;
  compilerSays(
    "TS2365",
    "Operator '+' cannot be applied to types 'Money' and 'Money'.",
    "Binary `+` between two object types is rejected UNCONDITIONALLY, " +
      "regardless of whether either side defines `valueOf`. TypeScript will " +
      "not guess whether you meant numeric addition (via valueOf) or an " +
      "intentional concatenation of some describable text.",
  );

  blank();
  const total = price.add(tax);
  proveType<Money>()(total, "Money", "the explicit method, not operator coercion");
  detonate("total.toString()", () => total.toString());
  good('"$21.64" — reached through a named method whose meaning is unambiguous in a diff.');

  // =========================================================================
  // 2. RELATIONAL OPERATORS: ACCEPTED — THEY TRUST valueOf()
  // =========================================================================
  blank();
  section("`<`, `>`, `<=`, `>=` — accepted, because ordering trusts valueOf()");

  ts("price < tax");
  const isPriceCheaper = price < tax;
  proveType<boolean>()(isPriceCheaper, "boolean", "no @ts-expect-error needed — this genuinely compiles");
  warn(
    "No error here. Relational operators are the ONE place TypeScript " +
      "extends real trust to `valueOf()` for object operands — the ordering " +
      "operators have no ambiguous 'concatenate or add?' question the way " +
      "binary `+` does, so there is nothing for the checker to be suspicious of.",
  );
  detonate("price < tax", () => price < tax);

  // =========================================================================
  // 3. `==` AGAINST AN UNRELATED TYPE: REJECTED, valueOf() NOTWITHSTANDING
  // =========================================================================
  blank();
  section("`price == 1999` — rejected: Money and number are disjoint TYPES");

  ts("price == 1999");
  // @ts-expect-error TS2367: This comparison appears to be unintentional because the types
  // 'Money' and 'number' have no overlap.
  const looksEqual = price == 1999;
  void looksEqual;
  compilerSays(
    "TS2367",
    "This comparison appears to be unintentional because the types 'Money' " +
      "and 'number' have no overlap.",
    "TS2367's comparability analysis (demo 04) looks at DECLARED types, not " +
      "at whether a `valueOf` hook COULD make the comparison succeed at " +
      "runtime. `Money` and `number` are unrelated types, full stop — even " +
      "though `price == 1999` would in fact evaluate to `true`.",
  );

  blank();
  detonate("price.equals(new Money(1999))", () => price.equals(new Money(1999)));
  good("An explicit `.equals()` says exactly what is being compared, and to what.");

  // =========================================================================
  // 4. THE RULE TABLE
  // =========================================================================
  blank();
  section("The operator-by-operator rule for objects with valueOf/toString");
  table(
    ["operator", "TypeScript's stance", "why"],
    [
      ["binary +", "rejected, even for matching classes", "ambiguous: numeric add or text concat?"],
      ["-, *, /, %, **", "rejected — object is never a valid arithmetic operand", "no ambiguity to resolve; simply refused"],
      ["<, >, <=, >=", "accepted if valueOf/Symbol.toPrimitive is present", "ordering has no concat-vs-add ambiguity"],
      ["==, !=, ===, !==", "rejected against structurally unrelated types", "TS2367 — declared types, not runtime hooks, decide"],
      ["`${x}` template literal", "always accepted", "ToString is total (demo 09)"],
      ["unary + / -", "accepted", "unconditionally requests ToNumber"],
    ],
  );
}
