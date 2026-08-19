// @ts-nocheck
/**
 * 14-design-tradeoffs — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * The final demo is about JUDGEMENT rather than mechanism: given a function
 * with a swap risk, which remedy is worth its cost?
 *
 * The JavaScript half exists to establish the one thing every remedy is
 * competing against: the STATUS QUO, in which the only defence is human
 * attention at the call site. This file measures how well that works by
 * showing the same call written five ways and asking, each time, whether a
 * reader could tell it was wrong.
 *
 * DOMAIN: a payment API.
 */

import { section, js, note, detonate, table, blank, warn } from "../99-runner/trace.js";

function refund(orderId, customerId, amountCents, isPartial, notifyCustomer) {
  return {
    orderId,
    customerId,
    amount: amountCents,
    kind: isPartial ? "partial" : "full",
    notified: notifyCustomer ? "yes" : "no",
  };
}

export function runBroken(): void {
  section("The status quo: five ways to write the same call");

  js("1. the correct call");
  detonate("refund", () => JSON.stringify(refund("ord-1", "cust-9", 2500, true, false)));

  blank();
  js("2. the two ids exchanged");
  detonate("refund", () => JSON.stringify(refund("cust-9", "ord-1", 2500, true, false)));
  note("Refunding order 'cust-9' for customer 'ord-1'. Both are strings.");

  blank();
  js("3. the two booleans exchanged");
  detonate("refund", () => JSON.stringify(refund("ord-1", "cust-9", 2500, false, true)));
  note("A FULL refund with a notification, instead of a partial silent one.");

  blank();
  js("4. an argument dropped");
  detonate("refund", () => JSON.stringify(refund("ord-1", "cust-9", 2500, true)));
  note("`notified: 'no'` — because `undefined` is falsy. Indistinguishable from a deliberate `false`.");

  blank();
  js("5. all five, from a config object mapped by hand");
  detonate("refund", () => {
    const cfg = { order: "ord-1", customer: "cust-9", cents: 2500, partial: true, notify: false };
    return JSON.stringify(refund(cfg.customer, cfg.order, cfg.cents, cfg.notify, cfg.partial));
  });
  warn(
    "Two independent transpositions in one line — the ids AND the booleans. " +
      "The mapping was written by hand in a file that does not contain " +
      "`refund`, and every name in it is correct.",
  );

  blank();
  section("Could a reader have caught any of these?");
  table(
    ["call", "what is wrong", "visible without opening `refund`?"],
    [
      ["refund('ord-1','cust-9',2500,true,false)", "nothing", "—"],
      ["refund('cust-9','ord-1',2500,true,false)", "ids exchanged", "**no** — unless you know the id prefixes"],
      ["refund('ord-1','cust-9',2500,false,true)", "booleans exchanged", "**no**"],
      ["refund('ord-1','cust-9',2500,true)", "an argument missing", "**no** — 4 vs 5 is not visible"],
      ["refund(cfg.customer, cfg.order, …)", "two transpositions", "**no**"],
    ],
  );
  note(
    "Four of five defects are invisible at the call site. This is what every " +
      "remedy in the TypeScript twin is competing against — and it is why " +
      "'just be careful' has never been a strategy.",
  );

  blank();
  section("The one thing JavaScript CAN do here");
  detonate("a runtime assertion at the top of the function", () => {
    function refundChecked(orderId, customerId, amountCents) {
      if (!orderId.startsWith("ord-")) throw new TypeError(`not an order id: ${orderId}`);
      if (!customerId.startsWith("cust-")) throw new TypeError(`not a customer id: ${customerId}`);
      return `refunded ${amountCents} on ${orderId}`;
    }
    try {
      return refundChecked("cust-9", "ord-1", 2500);
    } catch (error) {
      return `THROWS: ${error.message}`;
    }
  });
  note(
    "This works, and it is worth doing — but note the three costs: it runs in " +
      "production rather than in your editor, it only works when the two kinds " +
      "have distinguishable FORMATS, and it must be repeated in every function " +
      "that takes the pair. A brand is the same check, hoisted to the type " +
      "system and written once.",
  );
}
