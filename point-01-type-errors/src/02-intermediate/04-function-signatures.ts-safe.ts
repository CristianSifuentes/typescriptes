/**
 * 04-function-signatures — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * A TypeScript signature IS a contract, enforced at every call site that exists
 * now and every call site written in the future.
 *
 * The checker verifies four independent things at each call:
 *   1. ARITY      — argument count against required/optional/rest parameters.
 *   2. POSITION   — each argument's type against the parameter at that index.
 *   3. RESULT     — the returned expression against the declared return type.
 *   4. COMPLETENESS — that every path returns (noImplicitReturns).
 *
 * This file also does something most tutorials skip: it shows the case
 * TypeScript CANNOT catch — two adjacent parameters of the same type — and then
 * shows the two standard techniques for making even that a compile error.
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
import { proveType, proofBlock } from "../99-runner/type-assert.js";

interface Address {
  readonly country: string;
  readonly postalCode: string;
}

function shippingCost(weightKg: number, destination: Address, express: boolean): number {
  const base = weightKg * 3.5 + (destination.country === "US" ? 0 : 12);
  return express ? base * 2 : base;
}

function totalWeight(items: readonly number[]): number {
  return items.reduce((sum, item) => sum + item, 0);
}

export function runSafe(): void {
  const berlin: Address = { country: "DE", postalCode: "10115" };

  // =========================================================================
  // 1. ARITY
  // =========================================================================
  section("Arity is part of the type");

  ts("shippingCost(2.5, berlin)");
  // @ts-expect-error TS2554: Expected 3 arguments, but got 2.
  const tooFew = shippingCost(2.5, berlin);
  void tooFew;
  compilerSays(
    "TS2554",
    "Expected 3 arguments, but got 2.",
    "A parameter without `?` and without a default is REQUIRED. The " +
      "`undefined` that JavaScript would have bound to `express` is not a " +
      "legal value for `boolean`, so the call itself is rejected.",
  );

  ts('shippingCost(2.5, berlin, true, "priority")');
  // @ts-expect-error TS2554: Expected 3 arguments, but got 4.
  const tooMany = shippingCost(2.5, berlin, true, "priority");
  void tooMany;
  compilerSays(
    "TS2554",
    "Expected 3 arguments, but got 4.",
    "The silently-discarded argument becomes an error. If you meant to accept " +
      "more, say so: `...rest: string[]` or an options object.",
  );

  // =========================================================================
  // 2. POSITION
  // =========================================================================
  blank();
  section("Position is part of the type");

  ts("shippingCost(berlin, 2.5, true)");
  // @ts-expect-error TS2345: Argument of type 'Address' is not assignable to parameter
  // of type 'number'.
  const swapped = shippingCost(berlin, 2.5, true);
  void swapped;
  compilerSays(
    "TS2345",
    "Argument of type 'Address' is not assignable to parameter of type 'number'.",
    "Each argument is checked against the parameter AT ITS INDEX. The NaN " +
      "cascade from the JavaScript version cannot begin.",
  );

  ts('shippingCost(2.5, berlin, "yes")');
  // @ts-expect-error TS2345: Argument of type 'string' is not assignable to parameter
  // of type 'boolean'.
  const wrongKind = shippingCost(2.5, berlin, "yes");
  void wrongKind;
  compilerSays(
    "TS2345",
    "Argument of type 'string' is not assignable to parameter of type 'boolean'.",
    'The truthy-string trap ("yes", "false", "0") closed at the call site.',
  );

  // =========================================================================
  // 3. RESULT AND COMPLETENESS
  // =========================================================================
  blank();
  section("Return type and completeness are part of the type");

  ts("function totalWeight(items: number[]): number { return items.join('+'); }");
  compilerSays(
    "TS2322",
    "Type 'string' is not assignable to type 'number'.",
    "Reported on the `return` statement itself — inside the function, at the " +
      "line that lies, not at the caller that suffers.",
  );

  ts("a function whose if/else-if chain has no final else");
  compilerSays(
    "TS2366",
    "Function lacks ending return statement and return type does not include " +
      "'undefined'.",
    "JavaScript would return `undefined` from the missing path. Under " +
      "strictNullChecks, `undefined` is not a member of `string`, so the " +
      "omission is a defect rather than a default.",
  );

  ts("const doubled: number[] = weights.map((w): string => `${w * 2}`);");
  compilerSays(
    "TS2322",
    "Type 'string[]' is not assignable to type 'number[]'.",
    "Callbacks are values with types. The callback's return type flows " +
      "through `map`'s generic parameter, so the mismatch surfaces on the " +
      "RESULT — a small lesson in how inference propagates.",
  );

  ts("[3, 1, 2].sort((a, b) => a < b)");
  compilerSays(
    "TS2345",
    "Argument of type '(a: number, b: number) => boolean' is not assignable " +
      "to parameter of type '(a: number, b: number) => number'.",
    "`sort` requires an ordering (negative/zero/positive), not a predicate. " +
      "JavaScript coerces false→0 and true→1, producing a comparator that " +
      "never returns a negative number and therefore barely sorts.",
  );

  // =========================================================================
  // 4. THE HONEST LIMIT — and how to close it
  // =========================================================================
  blank();
  section("Where a plain signature is NOT enough");

  function transferJs(fromAccountId: string, toAccountId: string, amount: number): string {
    return `${amount} from ${fromAccountId} to ${toAccountId}`;
  }

  detonate("transfer(A, B, 100)", () => transferJs("acct-A", "acct-B", 100));
  detonate("transfer(B, A, 100)  ← arguments swapped", () => transferJs("acct-B", "acct-A", 100));
  warn(
    "Both compile. Both run. One of them moved the money backwards. When two " +
      "adjacent parameters have the SAME type, position checking has nothing " +
      "to compare — the types agree, only the meaning differs.",
  );

  blank();
  note("REMEDY 1 — branded (nominal) types: make the two strings different types.");

  type Brand<T, Tag extends string> = T & { readonly __brand: Tag };
  type AccountId = Brand<string, "AccountId">;
  type CustomerId = Brand<string, "CustomerId">;

  const accountId = (raw: string): AccountId => raw as AccountId;
  const customerId = (raw: string): CustomerId => raw as CustomerId;

  function creditAccount(account: AccountId, customer: CustomerId, cents: number): string {
    return `credit ${cents} to ${account} for ${customer}`;
  }

  const acct = accountId("acct-A");
  const cust = customerId("cust-9");

  ts("creditAccount(cust, acct, 100)   // arguments swapped");
  // @ts-expect-error TS2345: Argument of type 'CustomerId' is not assignable to
  // parameter of type 'AccountId'.
  const swappedIds = creditAccount(cust, acct, 100);
  void swappedIds;
  compilerSays(
    "TS2345",
    "Argument of type 'CustomerId' is not assignable to parameter of type 'AccountId'.",
    "The `__brand` member exists only in the type world — it is erased, costs " +
      "nothing at runtime, and makes two structurally identical strings " +
      "mutually unassignable. TypeScript is structural by default; branding is " +
      "how you buy nominal typing where you need it.",
  );
  good("A swapped-argument bug that no signature could catch is now a build error.");

  blank();
  note("REMEDY 2 — a named-parameter object: order stops existing as a concept.");

  interface TransferRequest {
    readonly from: AccountId;
    readonly to: AccountId;
    readonly amountCents: number;
  }
  const transfer = (request: TransferRequest): string =>
    `${request.amountCents} from ${request.from} to ${request.to}`;

  detonate(
    "transfer({ from, to, amountCents })",
    () => transfer({ from: accountId("acct-A"), to: accountId("acct-B"), amountCents: 100 }),
  );
  good(
    "With named members there is no positional mistake to make, and a missing " +
      "member is TS2741 rather than an `undefined`.",
  );

  // =========================================================================
  // 5. THE PROGRAM THAT COMPILES
  // =========================================================================
  blank();
  section("The correct calls, with proved types");

  const quote = shippingCost(2.5, berlin, true);
  const weight = totalWeight([1, 2, 3]);

  proofBlock("results of well-typed calls");
  proveType<number>()(quote, "number", "declared return type");
  proveType<number>()(weight, "number", "reduce with a number seed");

  blank();
  table(
    ["defect", "JavaScript", "TypeScript", "code"],
    [
      ["missing argument", "undefined bound, wrong branch", "rejected", "TS2554"],
      ["surplus argument", "discarded silently", "rejected", "TS2554"],
      ["swapped (different types)", "NaN", "rejected", "TS2345"],
      ["swapped (same types)", "money moved backwards", "needs branding", "TS2345 once branded"],
      ["wrong return type", "concatenation downstream", "rejected at the return", "TS2322"],
      ["missing return path", "undefined returned", "rejected", "TS2366"],
      ["bad callback shape", "corrupt aggregation", "rejected", "TS2322 / TS2345"],
    ],
  );
}
