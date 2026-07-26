/**
 * EVIDENCE FIXTURE — level 01 (basic)
 * ---------------------------------------------------------------------------
 * This file is EXCLUDED from `tsconfig.json` and compiled only by
 * `tsconfig.evidence.json` (`npm run evidence`).
 *
 * Every error below is real and unsuppressed. Nothing here is `@ts-ignore`d or
 * `@ts-expect-error`ed, because the entire purpose of the file is to make the
 * compiler speak in its own words — message text, source position, TSxxxx code.
 *
 * Expected outcome: compilation FAILS. That is the deliverable.
 */

// ===========================================================================
// 01 — PRIMITIVE ANNOTATIONS
// ===========================================================================

/** TS2322: Type 'string' is not assignable to type 'number'. */
const shippingFee: number = "12";

/** TS2322: Type 'string' is not assignable to type 'boolean'. */
const isGift: boolean = "false";

/** TS2322: Type 'number' is not assignable to type 'string'. */
const currencyCode: string = 840;

/** TS2322: Type 'null' is not assignable to type 'number'. (strictNullChecks) */
const discount: number = null;

/** TS2322: Type 'undefined' is not assignable to type 'string'. */
const promoCode: string = undefined;

// ===========================================================================
// 02 — ARITHMETIC AND THE `+` OPERATOR
// ===========================================================================

const taxRateText = "8.25%";
const subtotalCents = 11_200;

/** TS2363: The right-hand side of an arithmetic operation must be of type
 *  'any', 'number', 'bigint' or an enum type. */
const tax = subtotalCents * taxRateText;

/** TS2362: The left-hand side of an arithmetic operation must be of type
 *  'any', 'number', 'bigint' or an enum type. */
const weird = taxRateText - 3;

/** TS2365: Operator '+' cannot be applied to types 'number' and 'boolean'. */
const nonsense = subtotalCents + true;

/** TS2365: Operator '<' cannot be applied to types 'number' and 'string'. */
const badCompare = subtotalCents < taxRateText;

/** The classic pair, side by side. `"5" - 3` is rejected... */
const classicMinus = "5" - 3;

/** ...and `"5" + 3` is ACCEPTED, typed `string`. The error therefore appears
 *  one step downstream, where the string meets a `number` binding:
 *  TS2322: Type 'string' is not assignable to type 'number'. */
const classicPlus: number = "5" + 3;

/** TS2365: Operator '+' cannot be applied to types 'never[]' and '{}'. */
const objectSalad = [] + {};

/** TS18050: The value 'null' cannot be used here. (strictNullChecks) */
const nullMath = 1 + null;

// ===========================================================================
// 03 — METHODS THAT DO NOT EXIST ON THE RECEIVER
// ===========================================================================

/** TS2339: Property 'toUpperCase' does not exist on type 'number'. */
const shouted = (5).toUpperCase();

/** TS2339: Property 'toFixed' does not exist on type 'string'. */
const formatted = "10012".toFixed(2);

/** TS2551: Property 'lenght' does not exist on type 'string'.
 *  Did you mean 'length'? — the compiler even suggests the fix. */
const size = "gold".lenght;

/** TS2339: Property 'map' does not exist on type 'string'. */
const mapped = "abc".map((c) => c);

/** TS2551 / TS2339: Property 'push' does not exist on type 'ReadonlyArray'. */
const lines: readonly number[] = [1, 2, 3];
lines.push(4);

interface UserRecord {
  readonly id: number;
  readonly email: string;
  readonly displayName: string;
  readonly loyaltyPoints: number;
}
declare const user: UserRecord;

/** TS2339: Property 'toUpperCase' does not exist on type 'number'. */
const loudId = user.id.toUpperCase();

/** TS2339: Property 'emailAdress' does not exist on type 'UserRecord'.
 *
 *  Two things worth noticing:
 *  (1) The typo is caught at the READ. In JavaScript the read is legal and
 *      yields `undefined`; the crash arrives later, at `.trim()`, on an
 *      innocent line.
 *  (2) No "Did you mean 'email'?" suggestion here, while the next case DOES
 *      get one. The suggestion engine only fires when the edit distance is
 *      below a threshold relative to the identifier's length —
 *      'emailAdress' → 'email' is too far, 'trimm' → 'trim' is not. Hence
 *      TS2339 here and TS2551 below. Same defect class, two codes. */
const typo = user.emailAdress;

/** TS2551: Property 'trimm' does not exist on type 'string'. Did you mean 'trim'? */
const misspelledMethod = user.displayName.trimm();

// Keep the bindings "used" so the only diagnostics reported are the type
// errors above rather than a wall of unused-variable noise.
export const evidence = {
  shippingFee,
  isGift,
  currencyCode,
  discount,
  promoCode,
  tax,
  weird,
  nonsense,
  badCompare,
  classicMinus,
  classicPlus,
  objectSalad,
  nullMath,
  shouted,
  formatted,
  size,
  mapped,
  lines,
  loudId,
  typo,
  misspelledMethod,
};
