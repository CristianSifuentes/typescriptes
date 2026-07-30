/**
 * EVIDENCE FIXTURE — level 04 (expert)
 * ---------------------------------------------------------------------------
 * Excluded from `tsconfig.json`; compiled only by `tsconfig.evidence.json`
 * (`npm run evidence`). Every error below is real and unsuppressed.
 *
 * Note: demos 12 and 13 are deliberately absent from this fixture — their
 * entire point is that `as`/`any` (demo 12) and a validated boundary
 * (demo 13's happy path) produce NO diagnostics. There is nothing to
 * reproduce here for either; see their `.explanation.md` files.
 *
 * Expected outcome: compilation FAILS. That is the deliverable.
 */

// ===========================================================================
// 11 — BRANDED TYPES
// ===========================================================================

declare const userIdBrand: unique symbol;
declare const orderIdBrand: unique symbol;
type UserId = string & { readonly [userIdBrand]: "UserId" };
type OrderId = string & { readonly [orderIdBrand]: "OrderId" };

declare function issueRefund(orderId: OrderId, userId: UserId): void;
declare const someUserId: UserId;
declare const someOrderId: OrderId;

/** TS2345: Argument of type 'UserId' is not assignable to parameter of type
 *  'OrderId' — the arguments are swapped. */
issueRefund(someUserId, someOrderId);

/** TS2345: Argument of type 'string' is not assignable to parameter of type
 *  'OrderId' — a raw string bypasses the branding constructor. */
issueRefund("ORD-1001", someUserId);

// ===========================================================================
// 14 — never-GUARDED GENERIC ARITHMETIC
// ===========================================================================

type AllNumbers<T extends readonly unknown[]> = T extends readonly (infer U)[]
  ? [U] extends [number]
    ? true
    : false
  : false;

function sum<T extends readonly unknown[]>(
  values: T,
  ...witness: AllNumbers<T> extends true ? [] : [proof: never]
): number {
  void witness;
  return (values as readonly number[]).reduce((total, value) => total + value, 0);
}

/** TS2554: Expected 2 arguments, but got 1 — the array's element type is
 *  `number | string`, so the witness tuple `[proof: never]` is mandatory. */
sum([19.99, 1.65, "3.50"]);

/** TS2554: Expected 2 arguments, but got 1 — `number | undefined` fails the
 *  same guard, identically to the string case. */
sum([19.99, undefined, 3.50]);

/** TS2554: Expected 2 arguments, but got 1 — rejected even though this call
 *  would have produced the numerically "correct" answer at runtime. */
sum([19.99, null, 3.50]);

// Keep the export so this file has a module-level side effect to check.
export const evidence = true;
