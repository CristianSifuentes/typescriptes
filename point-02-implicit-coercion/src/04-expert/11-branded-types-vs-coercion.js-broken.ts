// @ts-nocheck
/**
 * 11-branded-types-vs-coercion — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * This demo is about a coercion-ADJACENT bug: two values that are BOTH
 * `string` at runtime, structurally identical, and freely interchangeable —
 * even though swapping them is always a mistake. This is not `ToNumber` or
 * `ToPrimitive` misfiring; it is the flip side of the same coin: JavaScript
 * has exactly ONE string type, so it cannot distinguish "a string that means
 * a user ID" from "a string that means an order ID", any more than it can
 * distinguish "a string that means a number" from an actual number.
 *
 * DOMAIN: a refund service where swapping a `userId` and an `orderId` — both
 * plain strings — silently issues a refund against the wrong record.
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

const orders = {
  "ORD-1001": { userId: "USR-42", amountCents: 1999 },
  "ORD-1002": { userId: "USR-77", amountCents: 500 },
};

function issueRefund(orderId, userId) {
  const order = orders[orderId];
  if (!order) return { ok: false, reason: "order not found" };
  if (order.userId !== userId) return { ok: false, reason: "user does not own this order" };
  return { ok: true, refunded: order.amountCents };
}

export function runBroken(): void {
  section("Two strings, one obvious bug — that the type system cannot see");

  js('issueRefund("ORD-1001", "USR-42")   — correct argument order');
  detonate("correct call", () => issueRefund("ORD-1001", "USR-42"));

  js('issueRefund("USR-42", "ORD-1001")   — ARGUMENTS SWAPPED');
  detonate("swapped call", () => issueRefund("USR-42", "ORD-1001"));
  note(
    '{ ok: false, reason: "order not found" } — this one FAILS LOUDLY, which ' +
      "is the lucky case. Nothing in the language stopped the swap; only the " +
      "lookup happening to miss saved us this time.",
  );

  blank();
  section("The unlucky case: a swap that does NOT fail loudly");

  // A second, structurally identical function elsewhere in the codebase,
  // written by someone who copied the pattern with the parameters reversed.
  function issueRefundReversed(userId, orderId) {
    const order = orders[orderId];
    if (!order) return { ok: false, reason: "order not found" };
    if (order.userId !== userId) return { ok: false, reason: "user does not own this order" };
    return { ok: true, refunded: order.amountCents };
  }

  js('issueRefund("ORD-1001", "USR-42")           via the (orderId, userId) function');
  detonate("original signature", () => issueRefund("ORD-1001", "USR-42"));

  js('issueRefundReversed("ORD-1001", "USR-42")   via the (userId, orderId) function — SAME CALL SITE TEXT');
  detonate("reversed signature, same call", () => issueRefundReversed("ORD-1001", "USR-42"));
  note(
    'Identical call-site text, identical argument VALUES, two DIFFERENT ' +
      "signatures elsewhere in the codebase — and both \"work\" often enough " +
      "that a reviewer skimming the diff has no textual signal anything is wrong.",
  );

  blank();
  section("Why `string` alone can never catch this");
  table(
    ["value", "typeof", "what it 'means'", "distinguishable from another string?"],
    [
      ['"ORD-1001"', "string", "an order ID", "no — same primitive as every other string"],
      ['"USR-42"', "string", "a user ID", "no — same primitive as every other string"],
    ],
  );
  note(
    "This is coercion's structural sibling: `ToNumber`/`ToPrimitive` erase " +
      "the DISTINCTION between types that happen to convert into each other; " +
      "a single `string` type erases the distinction between MEANINGS that " +
      "happen to share a representation. Different mechanism, same root " +
      "cause — the runtime type is too coarse for the invariant you need.",
  );
}
