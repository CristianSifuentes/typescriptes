// @ts-nocheck
/**
 * 12-soundness-holes — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * This file has no TypeScript counterpart to "fix" in the usual sense —
 * everything here is plain JavaScript, because the entire point of the
 * companion `.ts-safe.ts` file is that `as`/`any` make TypeScript produce
 * THIS SAME JavaScript, unchanged, despite full `strict` mode being on.
 *
 * DOMAIN: an HTTP response body, parsed with `JSON.parse`, and asserted
 * (not verified) to have a particular shape.
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

export function runBroken(): void {
  section("JSON.parse returns `any` — every coercion rule in this project stops mattering");

  const responseBody = '{"totalCents": "1999", "items": 3}'; // note: totalCents is a STRING
  const parsed = JSON.parse(responseBody);

  js('parsed.totalCents + parsed.items   -- both "look like" numbers in the JSON');
  detonate("total", () => parsed.totalCents + parsed.items);
  note(
    '"19993" — string concatenation, because `totalCents` deserialized as a ' +
      "string. `JSON.parse` performs NO type checking of any kind; it returns " +
      "whatever shape the bytes happened to contain, and every demo in this " +
      "project's rules about `+`, `-`, `==` becomes irrelevant the moment the " +
      "value's REAL type doesn't match what the code assumed.",
  );

  blank();
  section("A forced cast changes nothing at runtime — by definition");

  /** A hand-written "cast" — exactly what `as` compiles down to: NOTHING. */
  function assertShape(value) {
    return value; // no check performed, ever
  }

  const total = assertShape(parsed).totalCents;
  detonate("total, 'asserted' to be a number", () => total + 1);
  note(
    'NaN — "1999" + 1 is not what happened; `total` IS the string "1999", ' +
      "and string arithmetic coercion rules (demo 02) apply exactly as before. " +
      "Asserting a type changes nothing about the value.",
  );

  blank();
  section("Table: what actually protects a value from coercion bugs");
  table(
    ["mechanism", "checks the VALUE?", "protects against coercion bugs?"],
    [
      ["a type annotation", "no — compile-time only, erased at runtime", "only if the annotated type is TRUE"],
      ["an `as` assertion", "no — pure compiler instruction", "no — actively HIDES the mismatch from the checker"],
      ["`any`", "no — disables checking entirely", "no"],
      ["Number.isFinite / typeof / a schema validator", "YES — inspects the real runtime value", "yes"],
    ],
  );
}
