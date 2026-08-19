/**
 * EVIDENCE FIXTURE — level 04 (expert)
 * ---------------------------------------------------------------------------
 * Compiled only by `tsconfig.evidence.json` (`npm run evidence`).
 *
 * Two kinds of specimen live here, and the contrast between them is the whole
 * expert level:
 *
 *   • the SMART CONSTRUCTOR discipline, which makes branded values impossible
 *     to fabricate by accident — errors;
 *   • the ESCAPE HATCHES (`as`, `any`, untyped spreads, `apply`), which hand
 *     the argument-order bug straight back to runtime — no diagnostics.
 */

declare const brand: unique symbol;
type Brand<T, K extends string> = T & { readonly [brand]: K };

type AccountId = Brand<string, "AccountId">;
type CustomerId = Brand<string, "CustomerId">;
type Cents = Brand<number, "Cents">;

/** SMART CONSTRUCTORS: the only sanctioned way to produce a branded value.
 *  Each validates, then tags. The `as` lives here, once, under test — not at
 *  every call site. */
function accountId(raw: string): AccountId {
  if (!/^acct-[a-z0-9]+$/.test(raw)) throw new TypeError(`not an account id: ${raw}`);
  return raw as AccountId;
}
function customerId(raw: string): CustomerId {
  if (!/^cust-[a-z0-9]+$/.test(raw)) throw new TypeError(`not a customer id: ${raw}`);
  return raw as CustomerId;
}
function cents(raw: number): Cents {
  if (!Number.isInteger(raw) || raw < 0) throw new RangeError(`not cents: ${raw}`);
  return raw as Cents;
}

function credit(account: AccountId, customer: CustomerId, amount: Cents): string {
  return `credit ${amount} to ${account} for ${customer}`;
}

// ===========================================================================
// 12 — WHAT THE BRAND TOOLKIT CATCHES
// ===========================================================================

/** TS2345: the swap, now nominal. */
const swapped = credit(customerId("cust-9"), accountId("acct-a"), cents(100));

/** TS2345: a raw string cannot masquerade as an AccountId — the brand can only
 *  be produced by the smart constructor, which validated the format. */
const rawString = credit("acct-a", customerId("cust-9"), cents(100));

/** TS2345: a raw number cannot masquerade as Cents. */
const rawNumber = credit(accountId("acct-a"), customerId("cust-9"), 100);

/** TS2345: brands do not accidentally unify — two brands over the same base
 *  type are mutually unassignable in BOTH directions. */
declare function debit(account: AccountId): string;
const wrongBrand = debit(customerId("cust-9"));

// ===========================================================================
// 13 — THE ESCAPE HATCHES: every one of these reopens the door
// ===========================================================================

/** NO DIAGNOSTIC (by design). A double assertion through `unknown` launders a
 *  CustomerId into an AccountId. The money moves; nothing objects. */
const laundered = credit(
  customerId("cust-9") as unknown as AccountId,
  accountId("acct-a") as unknown as CustomerId,
  cents(100),
);

/** NO DIAGNOSTIC (by design). `any` disables the check entirely. */
declare const loose: any;
const viaAny = credit(loose, loose, loose);

/** NO DIAGNOSTIC (by design). A spread of `any[]` satisfies any parameter
 *  list — arity and order both unchecked. */
declare const looseArgs: any[];
const viaSpread = credit(...(looseArgs as [AccountId, CustomerId, Cents]));

/** NO DIAGNOSTIC (by design). `Function.prototype.apply` on a value typed
 *  `Function` bypasses signatures completely. */
const asFunction: Function = credit;
const viaApply = asFunction.apply(null, ["cust-9", "acct-a", 100]);

/** TS2322 ×2: `strictBindCallApply` DOES check `.apply` when the callee's
 *  signature is known — the hole above is the `Function` type, not `apply`.
 *
 *  Note the two differences from a normal bad call. The code is TS2322
 *  (assignability) rather than TS2345 (argument), because what is being checked
 *  is an ARRAY LITERAL against a tuple type. And there are TWO diagnostics
 *  rather than one: element-wise checking of a literal does not stop at the
 *  first failure the way argument checking does. Same defect, different
 *  machinery, different reporting. */
const viaTypedApply = credit.apply(null, [customerId("cust-9"), accountId("acct-a"), cents(100)]);

// ===========================================================================
// 14 — A `never`-BASED GUARD AGAINST AMBIGUOUS SIGNATURES
// ===========================================================================

type Equals<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

/**
 * A guard that makes a call whose two parameters have IDENTICAL types fail to
 * compile, pushing the author towards brands or an options object.
 */
type RejectAmbiguousPair<A, B> = Equals<A, B> extends true
  ? [ambiguous: "these two parameters share a type — brand them or use an options object"]
  : [];

declare function pair<A, B>(a: A, b: B, ...guard: RejectAmbiguousPair<A, B>): readonly [A, B];

/** NO DIAGNOSTIC (by design): differently-typed pair, nothing ambiguous. */
const fine = pair("Ada", 25);

/** TS2554: Expected 3 arguments, but got 2.
 *
 *  The guard fires — but be honest about the ergonomics: the MESSAGE is the
 *  generic arity error. The explanatory text lives in the required parameter's
 *  NAME (`ambiguous: "these two parameters share a type — ..."`), which the
 *  editor shows in its signature hint and hover, not in the terminal output.
 *
 *  That is a real limitation of encoding advice in types: TypeScript has no
 *  custom-diagnostic mechanism, so the best available channels are the
 *  parameter name and the type name. Weigh that before deploying a guard like
 *  this on an API other people have to use. */
const ambiguous = pair(3, 10);

/** NO DIAGNOSTIC (by design): branded, therefore unambiguous again. */
declare const w: Brand<number, "Width">;
declare const h: Brand<number, "Height">;
const branded = pair(w, h);

export const evidence = {
  swapped,
  rawString,
  rawNumber,
  wrongBrand,
  laundered,
  viaAny,
  viaSpread,
  viaApply,
  viaTypedApply,
  fine,
  ambiguous,
  branded,
};
