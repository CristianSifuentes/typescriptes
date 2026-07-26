/**
 * 16-symbol-keys — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * A symbol key cannot be "misspelled" the way a string key can — symbols are
 * compared by IDENTITY, not by characters. The equivalent bug is creating a
 * SECOND, accidentally-different symbol with the same description. TypeScript
 * catches this too, via `unique symbol`: a type that is inhabited by exactly
 * ONE value, so two independently-declared symbols are NEVER the same type,
 * even if their `description` strings are identical.
 *
 * This is also why `Object.keys(T)` (and `for...in`, and `JSON.stringify`)
 * never see symbol keys: `Object.keys` returns `string[]` — its TYPE
 * signature already excludes symbols, mirroring the runtime behaviour
 * exactly.
 */

import { section, ts, good, note, compilerSays, table, blank, shapeTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

// `unique symbol` — a type with exactly one inhabitant: this specific symbol.
// (`const` + an explicit `unique symbol` annotation gives it BOTH a real
// runtime value and the maximally-narrow type — unlike `declare const`,
// which only promises a value exists elsewhere and erases to nothing.)
const VALIDATED: unique symbol = Symbol("validated");
// A SECOND, independently-created symbol — the bug this demo is about.
const ALSO_VALIDATED: unique symbol = Symbol("validated");

interface Order {
  readonly id: string;
  readonly total: number;
}

interface ValidatedOrder extends Order {
  readonly [VALIDATED]: true;
}

function markValidated(order: Order): ValidatedOrder {
  return { ...order, [VALIDATED]: true };
}

export function runSafe(): void {
  const order: Order = { id: "o-1", total: 4200 };
  const validated = markValidated(order);

  section("The property map now includes a SYMBOL-keyed member");
  shapeTrace([["ValidatedOrder", "id, total, [VALIDATED]", "the symbol key is a real map entry, just not a string one"]]);

  blank();
  section("Object.keys' own type signature excludes symbols");

  const keys = Object.keys(validated);
  proveType<string[]>()(keys, "string[]", "Object.keys is typed to return string[] — symbols were never eligible");
  good(`Object.keys(validated) = [${keys.join(", ")}] — matches the runtime behaviour exactly.`);

  blank();
  section("The correct access, via the shared unique-symbol constant");

  const isValidated = validated[VALIDATED];
  proveType<true>()(isValidated, "true", "accessed through the SAME 'unique symbol' the interface declares");
  good(`validated[VALIDATED] = ${isValidated}`);

  blank();
  section("The bug: a second, independently-declared symbol");

  ts("ALSO_VALIDATED  — declared separately from VALIDATED; a DIFFERENT unique symbol type");
  compileTimeOnly(() => {
    // @ts-expect-error TS7053: Element implicitly has an 'any' type because
    // expression of type 'unique symbol' can't be used to index type
    // 'ValidatedOrder'. Property '[ALSO_VALIDATED]' does not exist on type
    // 'ValidatedOrder'.
    const wrong = validated[ALSO_VALIDATED];
    void wrong;
  });
  compilerSays(
    "TS7053",
    "Element implicitly has an 'any' type because expression of type 'unique symbol' can't be used to index type 'ValidatedOrder'.",
    "Elaboration: \"Property '[ALSO_VALIDATED]' does not exist on type 'ValidatedOrder'.\" " +
      "'ALSO_VALIDATED' and 'VALIDATED' are each their OWN, single-value type " +
      "— structurally as distinct as two unrelated interfaces (demo 08), even " +
      "though both symbols would print the description 'validated' at " +
      "runtime. The compiler is comparing TYPES, and 'typeof ALSO_VALIDATED' " +
      "is simply not 'typeof VALIDATED'.",
  );

  blank();
  table(
    ["mechanism", "how identity works", "how TypeScript models it"],
    [
      ["string key", "character-by-character equality", "literal string type (\"email\", ...)"],
      ["symbol key", "reference equality — Symbol('x') !== Symbol('x')", "'unique symbol' — one type, one value"],
    ],
  );
  note(
    "The lesson is not 'symbols are safer than strings' in general — it is " +
      "that TypeScript's property-checking machinery is not string-specific. " +
      "It checks IDENTITY in whatever form a key actually has: spelling for " +
      "strings, reference for symbols. Both are property-map lookups; only " +
      "the notion of 'the same key' differs.",
  );
}
