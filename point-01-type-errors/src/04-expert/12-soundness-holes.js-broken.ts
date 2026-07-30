// @ts-nocheck
/**
 * 12-soundness-holes — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * This demo's subject is the BOUNDARY: the line where data from outside your
 * program becomes data inside it.
 *
 * In JavaScript the boundary is invisible, because there is no inside. Every
 * value has the same standing whether it was computed by your code or arrived
 * as bytes from an untrusted network, and no line of code marks the transition.
 *
 * The consequence is not that JavaScript is unsound — soundness is a property
 * of type systems, and JavaScript has none. The consequence is that EVERY value
 * is untrusted, all the time, and the discipline of validating is entirely
 * voluntary.
 *
 * DOMAIN: consuming a partner API that returns a customer record.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

/** Three payloads: correct, incomplete, and actively hostile. */
const PAYLOADS = {
  good: '{"id":"c-1","email":"ada@example.com","balanceCents":4500}',
  incomplete: '{"id":"c-2"}',
  hostile: '{"id":"c-3","email":{"toString":"not a function"},"balanceCents":"1e999"}',
};

function greet(customer) {
  return `Hello ${customer.email.split("@")[0]}, balance ${(customer.balanceCents / 100).toFixed(2)}`;
}

export function runBroken(): void {
  section("The boundary that is not there");

  js("greet(JSON.parse(good))");
  detonate("greeting", () => greet(JSON.parse(PAYLOADS.good)));
  note("Works. And works for exactly the same reason a broken payload fails: luck.");

  blank();
  js("greet(JSON.parse(incomplete))");
  detonate("greeting", () => greet(JSON.parse(PAYLOADS.incomplete)));
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'split')",
    "The partner omitted a field. Your process crashed. Nothing between the " +
      "socket and `customer.email` had an opinion about it.",
  );

  blank();
  js("greet(JSON.parse(hostile))");
  detonate("greeting", () => greet(JSON.parse(PAYLOADS.hostile)));
  note(
    "A field whose type is wrong in a way designed to look right. Whether this " +
      "crashes, returns nonsense, or silently corrupts a ledger depends on " +
      "which method you happen to call first.",
  );

  blank();
  section("Everything else in JavaScript is the same story");

  js("a number that is not a number");
  detonate("Number('1e999')", () => Number("1e999"));
  detonate("Number('1e999') / 100", () => Number("1e999") / 100);
  note("Infinity. Still a `number`, still passes every check anyone wrote.");

  blank();
  js("an object pretending to be another object (duck typing at its worst)");
  detonate("a fake Date", () => {
    const fake = { getTime: () => "not a number" };
    return new Date(fake.getTime()).toISOString();
  });

  blank();
  js("mutation through an alias nobody expected");
  detonate("frozen config, mutated elsewhere", () => {
    const config = { retries: 3 };
    const readonlyView = config; // "readonly" by convention only
    config.retries = 99;
    return `readonlyView.retries = ${readonlyView.retries}`;
  });
  note(
    "There is no `readonly` in JavaScript. `Object.freeze` exists and is a " +
      "runtime cost that almost nobody pays.",
  );

  blank();
  table(
    ["boundary", "what JavaScript checks", "what you must do"],
    [
      ["JSON.parse", "that the text is valid JSON", "validate every field yourself"],
      ["fetch / HTTP", "nothing about the body", "validate every field yourself"],
      ["process.env", "nothing — every value is a string", "parse and validate"],
      ["a database driver", "nothing about the row shape", "validate every field yourself"],
      ["a library API", "nothing", "read the docs and hope"],
    ],
  );
  note(
    "In JavaScript this table is the whole story. The interesting question, " +
      "which the TypeScript twin answers, is: how much of it changes when you " +
      "add a static type system — and how much does NOT.",
  );
}
