/**
 * EVIDENCE FIXTURE — level 03 (advanced)
 * ---------------------------------------------------------------------------
 * Excluded from `tsconfig.json`; compiled only by `tsconfig.evidence.json`
 * (`npm run evidence`). Every error below is real and unsuppressed.
 *
 * Expected outcome: compilation FAILS. That is the deliverable.
 */

// ===========================================================================
// 08 — STRUCTURAL TYPING: a typo on a fresh literal, no suggestion available
// ===========================================================================

interface MapPin {
  readonly lat: number;
  readonly lng: number;
}

/** TS2353: Object literal may only specify known properties, and 'lgn' does not exist in type 'MapPin'. */
const mistypedPin: MapPin = { lat: 40.73, lgn: -73.99 };

// ===========================================================================
// 09 — EXCESS-PROPERTY CHECKING'S SUBTLETY
// ===========================================================================

interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

/** TS2561: Object literal may only specify known properties, but 'emial' does not exist in type 'User'. Did you mean to write 'email'? */
const direct: User = { id: "u-42", name: "Radia Perlman", email: "radia@example.com", emial: "radia@example.com" };

// ===========================================================================
// 10 — keyof: A TYPO PASSED AS A VALUE
// ===========================================================================

interface Order {
  readonly id: string;
  readonly totalCents: number;
  readonly customerEmail: string;
}
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
declare const order: Order;

/** TS2345: Argument of type '"totalCent"' is not assignable to parameter of type 'keyof Order'. */
const badColumn = getProperty(order, "totalCent");

// ===========================================================================
// 11 — MAPPED + TEMPLATE-LITERAL KEYS: a typo in a GENERATED key
// ===========================================================================

type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
declare const order2: Order;

/** TS2561: Object literal may only specify known properties, but 'getTotalCent' does not exist in type 'Getters<Order>'. Did you mean to write 'getTotalCents'? */
const getters: Getters<Order> = {
  getId: () => order2.id,
  getTotalCent: () => order2.totalCents,
  getCustomerEmail: () => order2.customerEmail,
};

export const evidence = { mistypedPin, direct, badColumn, getters };
