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
// 01 — THE `+` OPERATOR: TWO ALGORITHMS BEHIND ONE SYMBOL
// ===========================================================================

const unitPrice = 19.99;
const quantityText = "3";

/** `"5" + 3` style: ACCEPTED, typed `string`. No error on this line. */
const concatenated = unitPrice + quantityText;

/** TS2322: Type 'string' is not assignable to type 'number'.
 *  The `+` above was legal; its result had nowhere to go. */
const total: number = unitPrice + quantityText;

/** TS2365: Operator '+' cannot be applied to types 'number' and 'boolean'. */
const withBoolean = unitPrice + true;

/** TS18050: The value 'null' cannot be used here. (strictNullChecks) */
const withNull = unitPrice + null;

// ===========================================================================
// 02 — EVERY OTHER ARITHMETIC OPERATOR: NO STRING BRANCH EXISTS
// ===========================================================================

const discountPercentText = "15";
const tagText = "SUMMER";

/** TS2362: The left-hand side of an arithmetic operation must be of type
 *  'any', 'number', 'bigint' or an enum type. */
const weirdMinus = discountPercentText - 3;

/** TS2363: The right-hand side of an arithmetic operation must be of type
 *  'any', 'number', 'bigint' or an enum type. */
const scaled = unitPrice * discountPercentText;

/** TS2362: same rule — rejected uniformly, even though "SUMMER" would have
 *  produced NaN at runtime rather than a plausible number. */
const corrupted = tagText * unitPrice;

/** TS2365: Operator '<' cannot be applied to types 'number' and 'string'. */
const badCompare = unitPrice < discountPercentText;

// ===========================================================================
// 03 — TRUTHINESS: WHAT TYPESCRIPT CAN AND CANNOT CATCH
// ===========================================================================

declare const orderNote: string;

/** TS2367: This comparison appears to be unintentional because the types
 *  'string' and 'boolean' have no overlap. */
const impossible = orderNote === false;

declare const itemsInStock: number | undefined;

/** No error: `||` between `number | undefined` and `string` is completely
 *  legal TypeScript. The bug (0 treated as "unset") is a LOGIC error, not a
 *  type error — see 03-truthy-falsy-coercion.explanation.md for why this
 *  line, despite being buggy, correctly produces ZERO diagnostics here. */
const stockMessage = itemsInStock || "quantity not yet counted";

// Keep the bindings "used" so the only diagnostics reported are the type
// errors above rather than a wall of unused-variable noise.
export const evidence = {
  concatenated,
  total,
  withBoolean,
  withNull,
  weirdMinus,
  scaled,
  corrupted,
  badCompare,
  impossible,
  stockMessage,
};
