/**
 * 12-brand-toolkit — A REUSABLE BRANDING TOOLKIT
 * ---------------------------------------------------------------------------
 * Demo 07 introduced brands. This one turns them into infrastructure you would
 * actually ship: one generic type, one constructor factory, and a discipline
 * that confines every `as` in the codebase to a single tested location.
 *
 * THE DISCIPLINE, in one sentence:
 *
 *     A branded type is only as trustworthy as its smart constructor, so put
 *     every `as` inside one, validate there, and never brand anywhere else.
 *
 * Why that matters: a brand has no runtime existence (`npm run erasure`), so
 * nothing at runtime can check it. `JSON.parse(body).id as AccountId` is an
 * `AccountId` to the compiler and a lie to reality. The smart constructor is
 * the single place where a raw value becomes a trusted one — which makes it the
 * single place worth unit-testing, and the single place worth reviewing.
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
  compileTimeOnly,
} from "../99-runner/trace.js";
import { proveType, proofBlock, type Equals, type Expect } from "../99-runner/type-assert.js";

// ===========================================================================
// THE TOOLKIT
// ===========================================================================

/**
 * The phantom key. `unique symbol` rather than a string, so the member cannot
 * be named — and therefore cannot be forged by an object literal — outside this
 * module.
 */
declare const brand: unique symbol;

/**
 * `Brand<number, "Cents">` is a `number` that only a smart constructor makes.
 *
 * Note the phantom member's shape: `{ kind: K; base: T }` rather than just `K`.
 * The extra `base` costs nothing (it is erased with everything else) and buys
 * `Unbrand` below. The naive definition
 *
 *     type Unbrand<B> = B extends Brand<infer T, string> ? T : B;   // does NOT work
 *
 * fails because `infer` cannot decompose an INTERSECTION: there is no way to
 * ask "what was the left-hand side of `T & {…}`?". Recording the base type as a
 * property makes it recoverable by ordinary inference. (This project's own
 * build caught that mistake — the first version of this file asserted an
 * `Unbrand` that silently returned the branded type.)
 */
export type Brand<T, K extends string> = T & {
  readonly [brand]: { readonly kind: K; readonly base: T };
};

/** Recover the underlying representation. Useful at serialisation boundaries. */
export type Unbrand<B> = B extends { readonly [brand]: { readonly base: infer T } } ? T : B;

/**
 * The constructor factory.
 *
 * Takes a validator and returns a pair: a smart constructor that throws, and a
 * total variant that returns `undefined`. The single `as` in the whole toolkit
 * lives on the marked line.
 */
function defineBrand<T, K extends string>(
  name: K,
  isValid: (value: T) => boolean,
): {
  readonly of: (value: T) => Brand<T, K>;
  readonly tryOf: (value: T) => Brand<T, K> | undefined;
  readonly is: (value: T) => value is Brand<T, K>;
} {
  const of = (value: T): Brand<T, K> => {
    if (!isValid(value)) throw new TypeError(`invalid ${name}: ${String(value)}`);
    return value as Brand<T, K>; // ← THE ONLY `as`. Validated on the line above.
  };
  const tryOf = (value: T): Brand<T, K> | undefined => (isValid(value) ? (value as Brand<T, K>) : undefined);
  const is = (value: T): value is Brand<T, K> => isValid(value);
  return { of, tryOf, is };
}

// ===========================================================================
// THE DOMAIN, BRANDED
// ===========================================================================

export type AccountId = Brand<string, "AccountId">;
export type CustomerId = Brand<string, "CustomerId">;
export type Cents = Brand<number, "Cents">;

const AccountIdBrand = defineBrand<string, "AccountId">("AccountId", (v) => /^acct-[a-z0-9]+$/.test(v));
const CustomerIdBrand = defineBrand<string, "CustomerId">("CustomerId", (v) => /^cust-[a-z0-9]+$/.test(v));
const CentsBrand = defineBrand<number, "Cents">("Cents", (v) => Number.isInteger(v) && v >= 0);

const credit = (account: AccountId, customer: CustomerId, amount: Cents): string =>
  `credit ${amount} to ${account} for ${customer}`;

/** `Unbrand` recovers the representation for a serialisation boundary. */
type _UnbrandWorks = Expect<Equals<Unbrand<AccountId>, string>>;
type _UnbrandCents = Expect<Equals<Unbrand<Cents>, number>>;

export function runSafe(): void {
  // =========================================================================
  // 1. THE TOOLKIT IN USE
  // =========================================================================
  section("One generic type, one factory, three brands");

  const account = AccountIdBrand.of("acct-a1");
  const customer = CustomerIdBrand.of("cust-9");
  const amount = CentsBrand.of(12_950);

  proofBlock("what the constructors produced");
  proveType<AccountId>()(account, "AccountId", "validated by the regex, then tagged");
  proveType<CustomerId>()(customer, "CustomerId", "");
  proveType<Cents>()(amount, "Cents", "integer, non-negative");

  blank();
  detonate("credit(account, customer, amount)", () => credit(account, customer, amount));

  // =========================================================================
  // 2. WHAT IT REJECTS
  // =========================================================================
  blank();
  section("Every way of getting it wrong");

  ts("credit(customer, account, amount)   // the two ids swapped");
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'CustomerId' is not assignable to
    // parameter of type 'AccountId'.
    void credit(customer, account, amount);
  });
  compilerSays(
    "TS2345",
    "Argument of type 'CustomerId' is not assignable to parameter of type 'AccountId'.",
    "The swap, caught — two strings that are the same type at runtime.",
  );

  ts('credit("acct-a1", customer, amount)   // a raw string');
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'string' is not assignable to parameter
    // of type 'AccountId'.
    void credit("acct-a1", customer, amount);
  });
  compilerSays(
    "TS2345",
    "Argument of type 'string' is not assignable to parameter of type 'AccountId'.",
    "A raw string cannot masquerade as an AccountId. To get one you must go " +
      "through the constructor — which VALIDATED THE FORMAT. The brand is " +
      "therefore not just a label: it is a claim that the check ran.",
  );

  ts("credit(account, customer, 12950)   // a raw number");
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'number' is not assignable to parameter
    // of type 'Cents'.
    void credit(account, customer, 12_950);
  });

  blank();
  detonate("AccountIdBrand.of('not-an-account')", () => AccountIdBrand.of("not-an-account"));
  detonate("CentsBrand.of(-5)", () => CentsBrand.of(-5));
  detonate("CentsBrand.of(1.5)", () => CentsBrand.of(1.5));
  good(
    "The runtime half of the guarantee. Values from outside the program hit " +
      "the validator before they hit the type system.",
  );

  // =========================================================================
  // 3. THE TOTAL VARIANT, FOR BOUNDARIES
  // =========================================================================
  blank();
  section("`tryOf` and `is`: the same brand without exceptions");

  const maybe = AccountIdBrand.tryOf("acct-b2");
  const nope = AccountIdBrand.tryOf("nonsense");
  proveType<AccountId | undefined>()(maybe, "AccountId | undefined", "tryOf never throws");
  proveType<AccountId | undefined>()(nope, "AccountId | undefined", "");

  if (maybe !== undefined) {
    proveType<AccountId>()(maybe, "AccountId", "narrowed by the check");
    detonate("narrowed and usable", () => credit(maybe, customer, amount));
  }

  const raw: string = "acct-c3";
  if (AccountIdBrand.is(raw)) {
    proveType<AccountId>()(raw, "AccountId", "narrowed by the `value is Brand<…>` predicate");
    detonate("narrowed by the guard", () => credit(raw, customer, amount));
  }
  note(
    "    `is` is a type predicate, so it bridges a runtime check into a " +
      "compile-time fact — the same mechanism used everywhere for parsing " +
      "untrusted input. Note that the compiler verifies the SIGNATURE of a " +
      "predicate, never its body: `is` is trustworthy because `isValid` is " +
      "tested, not because the compiler checked it.",
  );

  // =========================================================================
  // 4. THE BOUNDARY IN BOTH DIRECTIONS
  // =========================================================================
  blank();
  section("Crossing the boundary: parsing in, serialising out");

  const parseAccountId = (value: unknown): AccountId => {
    if (typeof value !== "string") throw new TypeError("expected a string");
    return AccountIdBrand.of(value);
  };

  detonate('parse from JSON: {"id":"acct-d4"}', () => {
    const payload: unknown = JSON.parse('{"id":"acct-d4"}');
    const id = (payload as { id: unknown }).id;
    return credit(parseAccountId(id), customer, amount);
  });
  detonate("parse a hostile payload", () => {
    const payload: unknown = JSON.parse('{"id":"../../etc/passwd"}');
    return parseAccountId((payload as { id: unknown }).id);
  });

  blank();
  const serialised = JSON.stringify({ account, customer, amount });
  detonate("serialising branded values", () => serialised);
  good(
    "The brand is erased, so serialisation is unchanged — no `.value`, no " +
      "custom replacer, no shape change. Compare the JavaScript twin, where " +
      "every wrapper altered the payload and the class-based version did not " +
      "even survive a round trip.",
  );

  // =========================================================================
  // 5. THE RULES
  // =========================================================================
  blank();
  section("The discipline, in five rules");

  note("    1. ONE `as` PER BRAND, inside the smart constructor. Never elsewhere.");
  note("    2. VALIDATE in the constructor. A brand claims the check ran.");
  note("    3. `unique symbol` keys, so brands cannot be forged by a literal.");
  note("    4. BRAND AT THE BOUNDARY — parse once, pass branded values inward.");
  note("    5. UNIT-TEST THE CONSTRUCTORS. They are the only unchecked step.");

  blank();
  warn(
    "And the standing caveat: `x as AccountId` written anywhere else " +
      "reintroduces the bug with none of the validation. That is not " +
      "hypothetical — it is demo 13, and it is the reason rule 1 is rule 1.",
  );

  blank();
  table(
    ["approach", "catches swaps", "when", "allocation", "survives JSON", "API compatibility"],
    [
      ["JS tag property", "yes", "runtime", "1 object/value", "yes", "needs .value everywhere"],
      ["JS class", "yes", "runtime", "1 object/value", "**no**", "needs .value everywhere"],
      ["JS Symbol tag", "yes", "runtime", "1 object/value", "partly", "needs .value everywhere"],
      ["**TS brand**", "**yes**", "**compile time**", "**none**", "**yes**", "**unchanged**"],
    ],
  );
}
