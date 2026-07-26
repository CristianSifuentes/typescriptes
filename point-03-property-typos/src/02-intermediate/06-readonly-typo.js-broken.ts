// @ts-nocheck
/**
 * 06-readonly-typo — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * JavaScript has no notion of a "read-only field" (short of Object.freeze,
 * which almost nobody applies consistently, and which fails SILENTLY in
 * non-strict contexts). Two independent bugs stack here: mutating a field
 * that was never supposed to change, AND doing it under a misspelled name.
 *
 * DOMAIN: an invoice, whose id and issue date must never change once created.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function loadInvoice() {
  return { id: "inv-2024-0088", issuedAt: "2024-01-15", totalCents: 15_000 };
}

export function runBroken(): void {
  const invoice = loadInvoice();

  section("Mutating a field that should never change");

  js('invoice.id = "inv-2024-0099"  — ids are supposed to be immutable');
  detonate("mutation", () => {
    invoice.id = "inv-2024-0099";
    return invoice.id;
  });
  runtimeSays(
    "no error at all",
    "Nothing in the language stops this. Any code anywhere that holds a " +
      "reference to `invoice` can silently reassign its identity.",
  );

  blank();
  section("...and a typo compounds it, unnoticed");

  js('invoice.totlaCents = 0  — meant to zero the balance on totalCents');
  detonate("typo'd mutation", () => {
    invoice.totlaCents = 0;
    return `totalCents=${invoice.totalCents}, totlaCents=${invoice.totlaCents}`;
  });
  note(
    "The REAL totalCents is untouched (still 15000) — a second, orphaned " +
      "'totlaCents' field was created instead. The invoice was never actually " +
      "zeroed, and nothing here even complained about mutating a field that " +
      "shouldn't be mutable in the first place.",
  );

  blank();
  section("Two independent problems, neither one flagged");
  table(
    ["mistake", "should be prevented because", "was it caught?"],
    [
      ["invoice.id reassigned", "identity fields must be immutable", "no"],
      ["invoice.totlaCents = 0", "the field does not exist (typo)", "no"],
    ],
  );
}
