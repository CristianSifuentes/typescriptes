// @ts-nocheck
/**
 * 10-overloads — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A query helper that is meant to be called in exactly two shapes: by a
 * numeric id, or by a filter object. JavaScript doesn't have "two valid call
 * shapes and nothing else" as a concept — a single function body just reads
 * whatever arguments it received and guesses.
 *
 * DOMAIN: a tiny in-memory "database" query function, callable by id or by
 * filter — a simplified stand-in for an ORM's `find()`.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

const ORDERS = [
  { id: 1, status: "shipped" },
  { id: 2, status: "pending" },
];

function findOrder(criteria) {
  if (typeof criteria === "number") {
    return ORDERS.find((o) => o.id === criteria);
  }
  if (typeof criteria === "object" && criteria !== null) {
    return ORDERS.find((o) => o.status === criteria.status);
  }
  // Anything else falls through silently — including a case nobody designed
  // for.
}

export function runBroken(): void {
  section("Calling in each of the two INTENDED shapes");

  js("findOrder(1)");
  detonate("findOrder(1)", () => findOrder(1));

  js('findOrder({ status: "pending" })');
  detonate('findOrder({ status: "pending" })', () => findOrder({ status: "pending" }));

  blank();
  section("Calling with a THIRD shape nobody designed for");

  // A caller assumes findOrder also accepts a comparator callback (like
  // Array.prototype.find does) — a reasonable guess, and nothing in
  // JavaScript stops them from trying it.
  js("findOrder((o) => o.status === 'pending')");
  detonate("findOrder((o) => o.status === 'pending')", () =>
    findOrder((o) => o.status === "pending"),
  );
  runtimeSays(
    "undefined (not a TypeError — arguably worse)",
    "'criteria' is a function here, so BOTH `typeof criteria === 'number'` " +
      "and `typeof criteria === 'object'` are false — the function falls " +
      "through every branch and returns 'undefined'. Whatever code called " +
      "'findOrder' expecting an order object now has 'undefined' instead, " +
      "and WILL eventually try to call a method on it — reaching the exact " +
      "'is not a function' crash this project is about, just one hop later.",
  );

  blank();
  table(
    ["argument shape", "handled by findOrder?", "outcome"],
    [
      ["number (id)", "yes", "returns the order"],
      ["object (filter)", "yes", "returns the order"],
      ["function (comparator)", "no — silently ignored", "returns undefined"],
    ],
  );
}
