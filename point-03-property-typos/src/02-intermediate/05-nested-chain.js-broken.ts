// @ts-nocheck
/**
 * 05-nested-chain — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * `order.customer.adress.city` — a typo one level into a three-level chain.
 * Whether this SILENTLY returns undefined or CRASHES depends entirely on how
 * deep the typo sits, which has nothing to do with how serious the mistake
 * is. That inconsistency is itself a symptom of the underlying problem: none
 * of the three levels declares what it's supposed to contain.
 *
 * DOMAIN: an order, its customer, the customer's shipping address.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function loadOrder() {
  return {
    id: "o-77",
    customer: {
      id: "c-1",
      fullName: "Katherine Johnson",
      address: { street: "1 Langley Blvd", city: "Hampton", postalCode: "23666" },
    },
    totalCents: 8800,
  };
}

export function runBroken(): void {
  const order = loadOrder();

  section("A typo ONE level in: 'adress' instead of 'address'");

  js("order.customer.adress.city");
  detonate("order.customer.adress.city", () => order.customer.adress.city);
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'city')",
    "order.customer.adress is undefined (no such key), so reading '.city' off " +
      "it throws immediately. The typo is ONE hop away from the crash.",
  );

  blank();
  section("A typo TWO levels in: 'ciyt' instead of 'city'");

  js("order.customer.address.ciyt");
  detonate("order.customer.address.ciyt", () => order.customer.address.ciyt);
  note(
    "undefined — NO crash at all, because there is nothing further to " +
      "dereference. The 'city' typo just silently vanishes into a value " +
      "nobody checks.",
  );

  blank();
  section("A typo at the TOP: 'custmer' instead of 'customer'");

  js("order.custmer.address.city");
  detonate("order.custmer.address.city", () => order.custmer.address.city);
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'address')",
    "order.custmer is undefined, so '.address' throws immediately — TWO hops " +
      "away from the crash this time.",
  );

  blank();
  section("Same class of mistake, three different runtime behaviours");
  table(
    ["typo location", "outcome", "hops from typo to crash"],
    [
      ["order.customer.adress.city", "TypeError", "1"],
      ["order.customer.address.ciyt", "silent undefined", "0 (nothing left to crash)"],
      ["order.custmer.address.city", "TypeError", "2"],
    ],
  );
  note(
    "The DEPTH of the typo, not its severity, decides whether you get a crash " +
      "or a silent undefined — and only one of those three outcomes gives you " +
      "any signal at all.",
  );
}
