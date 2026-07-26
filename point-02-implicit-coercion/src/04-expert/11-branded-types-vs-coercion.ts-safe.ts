/**
 * 11-branded-types-vs-coercion — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * TypeScript's type system is STRUCTURAL: two types with the same shape are
 * the same type, no matter what they are named. `UserId` and `OrderId`, if
 * both declared as plain `string`, are 100% interchangeable — structural
 * typing offers no protection here, unlike the nominal type systems of Java
 * or C#.
 *
 * A BRANDED (nominal-by-convention) type closes this gap by intersecting
 * the primitive with a property that can never legitimately exist on a
 * plain string: `string & { readonly __brand: "UserId" }`. No object
 * literal can accidentally have that property, so the ONLY way to produce a
 * value of the branded type is through a function that says so explicitly —
 * turning "which string is this?" from a runtime mystery into a compile-time
 * fact.
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

declare const userIdBrand: unique symbol;
declare const orderIdBrand: unique symbol;

type UserId = string & { readonly [userIdBrand]: "UserId" };
type OrderId = string & { readonly [orderIdBrand]: "OrderId" };

/** The ONLY way to obtain a `UserId`. No `as` needed at call sites. */
function asUserId(raw: string): UserId {
  if (!raw.startsWith("USR-")) throw new TypeError(`not a user id: ${raw}`);
  return raw as UserId;
}

/** The ONLY way to obtain an `OrderId`. */
function asOrderId(raw: string): OrderId {
  if (!raw.startsWith("ORD-")) throw new TypeError(`not an order id: ${raw}`);
  return raw as OrderId;
}

interface Order {
  readonly userId: UserId;
  readonly amountCents: number;
}

const orders: Record<string, Order> = {
  "ORD-1001": { userId: asUserId("USR-42"), amountCents: 1999 },
  "ORD-1002": { userId: asUserId("USR-77"), amountCents: 500 },
};

function issueRefund(orderId: OrderId, userId: UserId): { ok: boolean; reason?: string; refunded?: number } {
  const order = orders[orderId];
  if (!order) return { ok: false, reason: "order not found" };
  if (order.userId !== userId) return { ok: false, reason: "user does not own this order" };
  return { ok: true, refunded: order.amountCents };
}

export function runSafe(): void {
  // =========================================================================
  // 1. THE CORRECT CALL — BUILT FROM VALIDATED, BRANDED VALUES
  // =========================================================================
  section("Branded values, constructed at the boundary");

  const orderId = asOrderId("ORD-1001");
  const userId = asUserId("USR-42");
  proveType<OrderId>()(orderId, "OrderId", "branded via asOrderId — never via a bare cast at the call site");
  proveType<UserId>()(userId, "UserId", "branded via asUserId");

  detonate("issueRefund(orderId, userId)", () => issueRefund(orderId, userId));
  good('{ ok: true, refunded: 1999 } — the correct order, the correct owner.');

  // =========================================================================
  // 2. THE SWAP, NOW A COMPILE ERROR — NOT A LUCKY RUNTIME MISS
  // =========================================================================
  blank();
  section("Swapping the arguments: caught before the program runs");

  ts("issueRefund(userId, orderId)");
  // @ts-expect-error TS2345: Argument of type 'UserId' is not assignable to parameter of
  // type 'OrderId'.
  issueRefund(userId, orderId);
  compilerSays(
    "TS2345",
    "Argument of type 'UserId' is not assignable to parameter of type " +
      "'OrderId'.",
    "Both are `string` at runtime — a structural type system would normally " +
      "call them identical. The brand property (`[userIdBrand]` vs " +
      "`[orderIdBrand]`) exists ONLY at the type level, but it is enough to " +
      "make the two types' structures genuinely different, so assignability " +
      "fails exactly where the JavaScript version silently 'worked'.",
  );

  // =========================================================================
  // 3. A BARE STRING CANNOT SNEAK IN EITHER
  // =========================================================================
  blank();
  section("A raw string literal is not a UserId or an OrderId — by design");

  ts('issueRefund("ORD-1001", "USR-42")');
  // @ts-expect-error TS2345: Argument of type 'string' is not assignable to parameter of
  // type 'OrderId'.
  issueRefund("ORD-1001", "USR-42");
  compilerSays(
    "TS2345",
    "Argument of type 'string' is not assignable to parameter of type " +
      "'OrderId'.",
    "This is intentional, not friction: it forces every ID to pass through " +
      "`asOrderId`/`asUserId` at least once, which is exactly the validating " +
      "boundary (demo 13 builds this pattern out fully) that also rejects a " +
      "malformed ID before it ever reaches business logic.",
  );

  // =========================================================================
  // 4. THE MECHANISM, PRECISELY
  // =========================================================================
  blank();
  section("Why the intersection trick works");
  table(
    ["type", "runtime representation", "compile-time shape"],
    [
      ["string", "a JS string", "{ }  (no extra properties)"],
      ["UserId", "the SAME JS string, unchanged", "{ [userIdBrand]: \"UserId\" }  (phantom — never exists at runtime)"],
      ["OrderId", "the SAME JS string, unchanged", "{ [orderIdBrand]: \"OrderId\" }  (phantom, different symbol)"],
    ],
  );
  note(
    "Zero runtime cost: `[userIdBrand]` never actually exists on the string " +
      "object — `as UserId` only persuades the CHECKER. This is `point-01`'s " +
      "type erasure (Concept #1) put to deliberate use: the brand only needs " +
      "to be real at compile time, because that is the only time it is checked.",
  );
}
