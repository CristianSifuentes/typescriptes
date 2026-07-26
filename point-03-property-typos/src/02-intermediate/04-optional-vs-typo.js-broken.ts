// @ts-nocheck
/**
 * 04-optional-vs-typo — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A LEGITIMATELY-ABSENT optional field and a MISSPELLED field produce the
 * exact same runtime value: `undefined`. JavaScript has no way to tell them
 * apart from the read site alone — both are "the key is not there right
 * now", one because the domain says it's fine, one because someone fat-
 * fingered the name.
 *
 * DOMAIN: an order that may or may not carry a delivery note.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function loadOrderWithNote() {
  return { id: "o-1", totalCents: 4200, note: "Leave at the front desk" };
}

function loadOrderWithoutNote() {
  // `note` is legitimately absent: most orders have no special instructions.
  return { id: "o-2", totalCents: 1500 };
}

export function runBroken(): void {
  section("A legitimately absent optional field");

  const plainOrder = loadOrderWithoutNote();
  js("order.note  — legitimately absent this time");
  detonate("order.note", () => plainOrder.note);
  note("undefined. Correct behaviour: this order really has no note.");

  blank();
  section("A misspelled field, indistinguishable at the read site");

  const notedOrder = loadOrderWithNote();
  js("order.nots  — 'note', misspelled");
  detonate("order.nots", () => notedOrder.nots);
  note(
    "ALSO undefined — but WRONG this time: the order DOES have a note " +
      "('Leave at the front desk'), the code just asked for the wrong key. " +
      "Nothing distinguishes this from the previous, correct case.",
  );

  blank();
  js("order.note.length  — code that assumes the note, when present, is usable");
  detonate("plainOrder.note.length", () => plainOrder.note.length);
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'length')",
    "The crash happens on the LEGITIMATE case (no note), because the author " +
      "forgot optionality is a real possibility, not on the typo — the typo " +
      "just silently returns undefined and never crashes at all.",
  );

  blank();
  section("Two different kinds of undefined, one runtime representation");
  table(
    ["expression", "why it's undefined", "runtime value"],
    [
      ["orderWithoutNote.note", "legitimately absent (domain fact)", "undefined"],
      ["orderWithNote.nots", "misspelled key (bug)", "undefined"],
    ],
  );
  note("JavaScript cannot tell these apart. Both print the same thing: undefined.");
}
