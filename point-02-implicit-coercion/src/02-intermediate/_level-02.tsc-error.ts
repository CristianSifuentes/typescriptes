/**
 * EVIDENCE FIXTURE — level 02 (intermediate)
 * ---------------------------------------------------------------------------
 * Excluded from `tsconfig.json`; compiled only by `tsconfig.evidence.json`
 * (`npm run evidence`). Every error below is real and unsuppressed.
 *
 * Expected outcome: compilation FAILS. That is the deliverable.
 */

// ===========================================================================
// 04 — LOOSE VS STRICT EQUALITY
// ===========================================================================

declare const roleParam: string;
const ADMIN_LEVEL = 1;

/** TS2367: This comparison appears to be unintentional because the types
 *  'string' and 'number' have no overlap. */
const isAdmin = roleParam == ADMIN_LEVEL;

/** TS2367: disjoint number/string literal types. */
const emptyEqualsZero = "" == 0;

/** TS2367: disjoint string literal types "" and "0". */
const emptyEqualsZeroString = "" == "0";

/** No error: exempted — comparisons against null/undefined are always legal. */
const nullEqualsUndefined = null == undefined;

// ===========================================================================
// 05 — OBJECT-TO-PRIMITIVE COERCION
// ===========================================================================

/** TS2365: Operator '+' cannot be applied to types 'never[]' and 'never[]'. */
const emptyArrays = [] + [];

/** TS2365: Operator '+' cannot be applied to types 'number[]' and 'number[]'. */
const numberArrays = [1, 2] + [3, 4];

interface OrderMetadata {
  readonly orderId: string;
  readonly total: number;
}
declare const orderEvent: string;
declare const metadata: OrderMetadata;

/** No error: the string-concatenation branch of `+` fires unconditionally
 *  once one operand is already `string` — a documented gap, not a bug. */
const logLine = "[" + orderEvent + "] " + metadata;

// ===========================================================================
// 06 — NULL VS UNDEFINED IN ARITHMETIC
// ===========================================================================

declare const subtotal: number;
declare const discountNull: number | null;
declare const discountUndefined: number | undefined;

/** TS18047: 'discountNull' is possibly 'null'. */
const totalA = subtotal - discountNull;

/** TS18048: 'discountUndefined' is possibly 'undefined'. */
const totalB = subtotal - discountUndefined;

/** TS18050: The value 'null' cannot be used here. */
const bareNull = null + 1;

function computeTotal(price: number, discount: number | null): number {
  return price - (discount ?? 0);
}

/** TS2345: Argument of type 'undefined' is not assignable to parameter of
 *  type 'number | null'. */
computeTotal(100, undefined);

// Keep the bindings "used" so the only diagnostics reported are the type
// errors above rather than a wall of unused-variable noise.
export const evidence = {
  isAdmin,
  emptyEqualsZero,
  emptyEqualsZeroString,
  nullEqualsUndefined,
  emptyArrays,
  numberArrays,
  logLine,
  totalA,
  totalB,
  bareNull,
};
