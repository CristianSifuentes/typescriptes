// @ts-nocheck
/**
 * 12-resolution-model — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * At RUNTIME, `invoice.id` is resolved by walking the PROTOTYPE CHAIN: check
 * `invoice`'s own properties, then `Object.getPrototypeOf(invoice)` (the
 * `Invoice.prototype`), then ITS prototype (`Entity.prototype`), and so on,
 * until a matching key is found or the chain ends at `null` — at which point
 * the result is `undefined`. This is a real, dynamic, per-access walk.
 *
 * DOMAIN: an invoice, inheriting shared fields from a base entity.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

class Entity {
  constructor(id) {
    this.id = id;
  }
}

class Invoice extends Entity {
  constructor(id, totalCents) {
    super(id);
    this.totalCents = totalCents;
  }
}

export function runBroken(): void {
  const invoice = new Invoice("inv-501", 9900);

  section("Resolving 'id' — an OWN property of the instance, not the class");

  js("invoice.id  — set directly on the instance by Entity's constructor");
  detonate("invoice.id", () => invoice.id);
  note("Found on the instance itself — step 1 of the prototype walk, no further steps needed.");

  blank();
  section("Resolving a misspelled property");

  js("invoice.totlaCents  — 'totalCents', transposed");
  detonate("invoice.totlaCents", () => invoice.totlaCents);
  runtimeSays(
    "undefined — no error",
    "The runtime walked: instance own properties (no 'totlaCents'), then " +
      "Invoice.prototype (no 'totlaCents'; methods would live here), then " +
      "Entity.prototype (no 'totlaCents'), then Object.prototype (no " +
      "'totlaCents'), then the chain ends at null. Every step failed, so the " +
      "expression is `undefined` — and NONE of that walking happened at any " +
      "point before this exact line ran.",
  );

  blank();
  section("The walk, made explicit");
  table(
    ["step", "checked", "found 'totlaCents'?"],
    [
      ["1", "invoice (own properties)", "no"],
      ["2", "Invoice.prototype", "no"],
      ["3", "Entity.prototype", "no"],
      ["4", "Object.prototype", "no"],
      ["5", "null — chain ends", "undefined, silently"],
    ],
  );
  note("This entire walk re-runs on EVERY access, at runtime, for every instance, forever.");
}
