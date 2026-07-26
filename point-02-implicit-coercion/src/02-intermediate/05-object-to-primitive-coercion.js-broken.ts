// @ts-nocheck
/**
 * 05-object-to-primitive-coercion — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * Neither `+`, nor `-`, nor `==` can operate on an object directly. Every one
 * of them first calls `ToPrimitive(object)`, which — absent a
 * `Symbol.toPrimitive` method (see demo 10) — tries `valueOf()` then
 * `toString()` (hint "default"/"number"), or `toString()` then `valueOf()`
 * (hint "string").
 *
 *   Array.prototype.valueOf   → returns the array itself (NOT a primitive,
 *                                so ToPrimitive rejects it and falls through)
 *   Array.prototype.toString  → Array.prototype.join(",")
 *   Object.prototype.valueOf  → returns the object itself (same rejection)
 *   Object.prototype.toString → "[object Object]"
 *
 * DOMAIN: building a CSV/log line by "just concatenating with +", the single
 * most common way object-to-primitive coercion enters production code.
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

export function runBroken(): void {
  section("The four expressions everyone has seen and nobody predicts twice");
  table(
    ["expression", "ToPrimitive(left)", "ToPrimitive(right)", "result"],
    [
      ["[] + []", '""  (join of no elements)', '""', '""'],
      ["[] + {}", '""', '"[object Object]"', '"[object Object]"'],
      ["{} + []", "(parsed as a BLOCK, then +[])", "—", "0  (in statement position!)"],
      ["[1,2] + [3,4]", '"1,2"', '"3,4"', '"1,23,4"'],
    ],
  );
  note(
    "`{} + []` at the START of a statement is not even the object-literal " +
      "expression you think it is — `{}` parses as an empty BLOCK STATEMENT, " +
      "and `+[]` is then a unary-plus expression statement: `Number([])` = 0. " +
      "Wrap it in parens — `({} + [])` — to force the expression you meant, " +
      "which gives \"[object Object]\".",
  );

  blank();
  section("Building a log line 'by just concatenating'");

  function buildLogLine(event, metadata) {
    return "[" + event + "] " + metadata;
  }

  const orderEvent = "order.created";
  const metadata = { orderId: "ORD-42", total: 59.97 };

  js('buildLogLine("order.created", { orderId: "ORD-42", total: 59.97 })');
  detonate("log line", () => buildLogLine(orderEvent, metadata));
  note(
    'The metadata object silently becomes "[object Object]" — the orderId and ' +
      "total are GONE from the log line, with no error anywhere. This class of " +
      "bug is extremely common in ad-hoc string-built logging and error messages.",
  );

  blank();
  section("Dates are the one built-in with a DIFFERENT hint order");
  const createdAt = new Date("2024-01-01T00:00:00Z");
  detonate("createdAt + ' (created)'", () => createdAt + " (created)");
  note(
    "Date.prototype[Symbol.toPrimitive] uses hint \"default\" -> tries " +
      "toString() FIRST (unlike every other object). This is why date " +
      "concatenation gives a readable string instead of a numeric timestamp — " +
      "and why `+createdAt` (unary plus, hint \"number\") gives the timestamp instead.",
  );
  detonate("+createdAt", () => +createdAt);

  blank();
  section("Arrays with exactly one element masquerade as their element");
  detonate("[5] + [6]", () => [5] + [6]);
  detonate("[5] - [6]", () => [5] - [6]);
  note(
    '`[5] + [6]` -> "56" (string join), but `[5] - [6]` -> -1 (both single-' +
      "element arrays' toString ('5', '6') are then coerced with ToNumber, " +
      "since `-` has no string branch). Same operands, opposite operator, " +
      "completely different code path.",
  );
}
