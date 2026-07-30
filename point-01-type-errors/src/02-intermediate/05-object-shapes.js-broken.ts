// @ts-nocheck
/**
 * 05-object-shapes — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * JavaScript objects are OPEN and UNTYPED. Three consequences follow, and each
 * one is a bug factory:
 *
 *   1. Reading an absent property is legal and yields `undefined`. There is no
 *      way, at the language level, to distinguish "this key is missing" from
 *      "this key holds undefined".
 *   2. Writing an absent property is legal and creates it. A typo on the left
 *      of `=` silently forks your data model in two.
 *   3. Nothing anywhere declares what an object is supposed to contain, so a
 *      "shape" exists only in the developer's memory and in the tests.
 *
 * DOMAIN: order fulfilment — reading an order, computing a total, notifying the
 * customer.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function loadOrder() {
  return {
    id: "o-1024",
    customerEmail: "ada@example.com",
    totalCents: 12_950,
    // `note` is OPTIONAL — sometimes present, sometimes not. Today: absent.
    shipping: { country: "DE", postalCode: "10115" },
  };
}

export function runBroken(): void {
  const order = loadOrder();

  section("Reading a property that does not exist");

  js("order.total  — the field is called totalCents");
  detonate("order.total", () => order.total);
  note("undefined. Legal. Silent. The typo is now a value.");

  blank();
  js("order.total / 100  — using the undefined");
  detonate("order.total / 100", () => order.total / 100);
  note("NaN. Still legal, still silent. Two operations, zero complaints.");

  blank();
  js("`Total: $${order.total / 100}`  — rendering it");
  detonate("receipt line", () => `Total: $${order.total / 100}`);
  runtimeSays(
    "no error at all",
    'The customer receives "Total: $NaN". This is the failure mode that never ' +
      "pages anyone: it is not an exception, it is a bad string.",
  );

  blank();
  section("Writing a property that does not exist");

  js('order.totlaCents = 9_900  — a transposition on the LEFT of `=`');
  detonate("assignment", () => {
    order.totlaCents = 9_900;
    return `totalCents=${order.totalCents}, totlaCents=${order.totlaCents}`;
  });
  note(
    "The object now has BOTH fields. The intended write went to a new, " +
      "parallel property that nothing reads. The discount was never applied " +
      "and no code path can tell.",
  );

  blank();
  section("Optional properties: absent versus undefined");

  js("order.note  — optional, absent today");
  detonate("order.note", () => order.note);
  js("order.note.length  — the code assumed it was there");
  detonate("order.note.length", () => order.note.length);
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'length')",
    "The single most common crash in JavaScript applications. It happens " +
      "because optionality is invisible: nothing in the source distinguishes a " +
      "field that is always present from one that usually is.",
  );

  blank();
  js('"note" in order  vs  order.note === undefined');
  detonate('"note" in order', () => "note" in order);
  detonate("order.note === undefined", () => order.note === undefined);
  note(
    "Both say the field is not usable, but they answer DIFFERENT questions, " +
      "and `{ note: undefined }` would make them disagree. JavaScript cannot " +
      "keep the two states apart in a type.",
  );

  blank();
  section("Nested shapes multiply the risk");

  js("order.shipping.postcode  — the field is postalCode");
  detonate("order.shipping.postcode", () => order.shipping.postcode);
  js("order.billing.postalCode  — `billing` does not exist at all");
  detonate("order.billing.postalCode", () => order.billing.postalCode);
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'postalCode')",
    "One level of nesting turned a silent `undefined` into a crash. Which of " +
      "the two you get is decided by how deep the typo is — not by how serious " +
      "it is.",
  );

  blank();
  section("The shape that only exists in someone's head");
  table(
    ["access", "outcome", "who finds out", "when"],
    [
      ["order.total", "undefined", "nobody", "never"],
      ["order.total / 100", "NaN", "nobody", "never"],
      ["`$${order.total/100}`", '"$NaN" in an email', "the customer", "immediately, painfully"],
      ["order.totlaCents = x", "a second, parallel field", "nobody", "never"],
      ["order.note.length", "TypeError", "on-call engineer", "3 a.m."],
      ["order.billing.postalCode", "TypeError", "on-call engineer", "3 a.m."],
    ],
  );
}
