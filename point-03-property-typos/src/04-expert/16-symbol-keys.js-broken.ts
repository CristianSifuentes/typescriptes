// @ts-nocheck
/**
 * 16-symbol-keys — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A "validated" marker attached to an object via a Symbol key, so it never
 * collides with a real field name and never shows up in Object.keys,
 * JSON.stringify, or a for...in loop — it is metadata, deliberately
 * invisible to ordinary enumeration. The bug this file demonstrates is NOT
 * a spelling typo (symbols cannot be misspelled — they are compared by
 * IDENTITY, not by name) — it is a DUPLICATE symbol created by accident,
 * which is the symbol-keyed equivalent of a typo.
 *
 * DOMAIN: marking an order as having passed validation, without polluting
 * its visible field list.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

// The ONE shared symbol every part of the program is supposed to import.
const VALIDATED = Symbol("validated");

function markValidated(order) {
  return { ...order, [VALIDATED]: true };
}

export function runBroken(): void {
  const order = { id: "o-1", total: 4200 };
  const validated = markValidated(order);

  section("Symbol keys are invisible to ordinary enumeration");

  js("Object.keys(validated)");
  detonate("Object.keys(validated)", () => Object.keys(validated));
  note("The symbol key never appears — this is BY DESIGN, not a bug.");

  js("JSON.stringify(validated)");
  detonate("JSON.stringify(validated)", () => JSON.stringify(validated));
  note("Also absent from serialization — symbol-keyed metadata never leaks over the wire.");

  blank();
  section("The actual bug: a SECOND, accidentally-different symbol");

  // Some other module, written without importing the shared VALIDATED
  // symbol, defines its OWN with the same description string:
  const ALSO_VALIDATED = Symbol("validated"); // NOT the same symbol!

  js("validated[ALSO_VALIDATED]  — a different Symbol(), same description");
  detonate("validated[ALSO_VALIDATED]", () => validated[ALSO_VALIDATED]);
  runtimeSays(
    "undefined — no error",
    "Symbol('validated') !== Symbol('validated'): every call to Symbol() " +
      "creates a UNIQUE value, even with an identical description. The " +
      "'other module' is silently checking the wrong marker — the order " +
      "still looks unvalidated everywhere that module looks.",
  );

  blank();
  table(
    ["expression", "value"],
    [
      ["VALIDATED === ALSO_VALIDATED", String(VALIDATED === ALSO_VALIDATED)],
      ["validated[VALIDATED]", String(validated[VALIDATED])],
      ["validated[ALSO_VALIDATED]", String(validated[ALSO_VALIDATED])],
    ],
  );
}
