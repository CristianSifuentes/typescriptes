/**
 * EVIDENCE FIXTURE — level 02 (intermediate)
 * Compiled only by `tsconfig.evidence.json`. Every error below is real.
 * Run: `npm run evidence`
 */

// ===========================================================================
// 04 — FUNCTION SIGNATURES: arity, order, return type
// ===========================================================================

interface Address {
  readonly country: string;
  readonly postalCode: string;
}

function shippingCost(weightKg: number, destination: Address, express: boolean): number {
  const base = weightKg * 3.5 + (destination.country === "US" ? 0 : 12);
  return express ? base * 2 : base;
}

declare const berlin: Address;

/** TS2554: Expected 3 arguments, but got 2. */
const tooFew = shippingCost(2.5, berlin);

/** TS2554: Expected 3 arguments, but got 4. */
const tooMany = shippingCost(2.5, berlin, true, "priority");

/** TS2345: Argument of type 'Address' is not assignable to parameter of type 'number'.
 *  (the classic swapped-arguments defect) */
const swapped = shippingCost(berlin, 2.5, true);

/** TS2345: Argument of type 'string' is not assignable to parameter of type 'boolean'. */
const wrongKind = shippingCost(2.5, berlin, "yes");

/** TS2322: Type 'string' is not assignable to type 'number'.
 *  (declared return type violated) */
function totalWeight(items: readonly number[]): number {
  return items.join("+");
}

/** TS2366: Function lacks ending return statement and return type does not
 *  include 'undefined'. (noImplicitReturns / strictNullChecks) */
function bandFor(weightKg: number): string {
  if (weightKg < 1) return "light";
  else if (weightKg < 10) return "medium";
}

/** TS2322: Type 'string[]' is not assignable to type 'number[]'.
 *  The callback's return type flows through `map`'s generic parameter, so the
 *  mismatch is reported on the RESULT, not on the callback. */
const weights = [1, 2, 3];
const doubled: number[] = weights.map((w): string => `${w * 2}`);

/** TS7006: Parameter 'item' implicitly has an 'any' type. (noImplicitAny) */
function describe(item) {
  return String(item);
}

// ===========================================================================
// 05 — OBJECT SHAPES: typos, missing members, excess members, optionality
// ===========================================================================

interface Order {
  readonly id: string;
  readonly customerEmail: string;
  readonly totalCents: number;
  readonly note?: string;
}

declare const order: Order;

/** TS2339: Property 'total' does not exist on type 'Order'. */
const misread = order.total;

/** TS2551: Property 'totalCent' does not exist on type 'Order'.
 *  Did you mean 'totalCents'? */
const nearMiss = order.totalCent;

/** TS2741: Property 'totalCents' is missing in type '{ id: string;
 *  customerEmail: string; }' but required in type 'Order'. */
const incomplete: Order = { id: "o-1", customerEmail: "a@b.c" };

/** TS2561: Object literal may only specify known properties, but 'totlaCents'
 *  does not exist in type 'Order'. Did you mean to write 'totalCents'?
 *  (the excess-property check, which fires only on FRESH object literals) */
const extra: Order = {
  id: "o-2",
  customerEmail: "a@b.c",
  totalCents: 999,
  totlaCents: 999,
};

/** TS18048: 'order.note' is possibly 'undefined'. — optional member used
 *  without a check. */
const noteLength = order.note.length;

/** TS2375: Type '{ ...; note: undefined; }' is not assignable to type 'Order'
 *  with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the
 *  types of the target's properties.
 *  ("absent" and "present but undefined" are different states.) */
const explicitUndefined: Order = {
  id: "o-3",
  customerEmail: "a@b.c",
  totalCents: 100,
  note: undefined,
};

// ===========================================================================
// 06 — ARRAYS AND TUPLES
// ===========================================================================

/** TS2322: Type 'string' is not assignable to type 'number'. — a mixed
 *  element inside an array literal annotated `number[]` */
const lineTotals: number[] = [1200, 3400, "5600"];

/** TS2345: Argument of type 'string' is not assignable to parameter of
 *  type 'number'. — mixing element types after the fact */
const quantities: number[] = [1, 2, 3];
quantities.push("4");

/** TS2532: Object is possibly 'undefined'. — the honest consequence of
 *  noUncheckedIndexedAccess: `arr[0]` has type `number | undefined`, because
 *  the compiler cannot know that index 0 is in range. */
const firstTotal = lineTotals[0].toFixed(2);

/** TS2322: Type '[number, number, number]' is not assignable to type
 *  'LatLong'. — tuple arity is part of the type. */
type LatLong = readonly [latitude: number, longitude: number];
const badCoordinate: LatLong = [52.52, 13.4, 0];

/** TS2540: Cannot assign to '0' because it is a read-only property. */
const coordinate: LatLong = [52.52, 13.4];
coordinate[0] = 0;

/** TS2345: Argument of type '(a: number, b: number) => boolean' is not
 *  assignable to parameter of type '(a: number, b: number) => number'.
 *  `sort` needs an ordering (negative/zero/positive), not a predicate. This is
 *  a real, common bug: `(a, b) => a < b` "works" in JavaScript by coercing
 *  false→0 and true→1, which is not a valid comparator. */
const sorted = [3, 1, 2].sort((a, b) => a < b);

export const evidence = {
  tooFew,
  tooMany,
  swapped,
  wrongKind,
  totalWeight,
  bandFor,
  doubled,
  describe,
  misread,
  nearMiss,
  incomplete,
  extra,
  noteLength,
  explicitUndefined,
  lineTotals,
  quantities,
  firstTotal,
  badCoordinate,
  coordinate,
  sorted,
};
