/**
 * 04-optional-vs-typo — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `note?: string` puts `"note"` IN the property map, with value type
 * `string | undefined`. That is categorically different from `"nots"` never
 * being a key of the map at all. The compiler reports two UNRELATED
 * diagnostics for what JavaScript renders as the same value:
 *
 *   legitimately-absent, used unguarded  → TS18048 ('possibly undefined')
 *   misspelled key                       → TS2339 (not a key at all)
 */

import { section, ts, good, note, compilerSays, table, blank, shapeTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface Order {
  readonly id: string;
  readonly totalCents: number;
  readonly note?: string;
}

function loadOrderWithoutNote(): Order {
  return { id: "o-2", totalCents: 1500 };
}

export function runSafe(): void {
  const order = loadOrderWithoutNote();

  section("The property map: 'note' IS a key, with an optional value");
  shapeTrace([["Order", "id, totalCents, note?", "interface Order (this file)"]]);
  note("'note' being optional means it IS in the map — with type `string | undefined`.");

  blank();
  section("Using the optional field without proving it is present");

  ts("order.note.length");
  compileTimeOnly(() => {
    // @ts-expect-error TS18048: 'order.note' is possibly 'undefined'.
    const noteLength = order.note.length;
    void noteLength;
  });
  compilerSays(
    "TS18048",
    "'order.note' is possibly 'undefined'.",
    "This is NOT 'note doesn't exist' — the compiler knows 'note' is a real, " +
      "declared member. It is refusing to let you call `.length` on a value " +
      "that might legitimately be absent, until you prove otherwise.",
  );

  blank();
  section("Misspelling the field entirely");

  ts("order.nots");
  // @ts-expect-error TS2339: Property 'nots' does not exist on type 'Order'.
  const misread = order.nots;
  void misread;
  compilerSays(
    "TS2339",
    "Property 'nots' does not exist on type 'Order'.",
    "A COMPLETELY DIFFERENT diagnostic: 'nots' is not in the property map at " +
      "all — this is a typo, not a case of legitimate absence. The compiler " +
      "never confuses the two, because it is checking against the map, not " +
      "against a runtime value.",
  );

  blank();
  section("The three disciplined ways to consume 'note'");
  if (order.note !== undefined) {
    proveType<string>()(order.note, "string", "narrowed by !== undefined");
  }
  const withFallback = order.note ?? "(no note)";
  proveType<string>()(withFallback, "string", "?? removes undefined from the union");
  const viaOptionalChain = order.note?.length;
  proveType<number | undefined>()(
    viaOptionalChain,
    "number | undefined",
    "?. propagates the undefined honestly, instead of throwing",
  );

  blank();
  good(`Correct read: "${order.note ?? "(no note)"}" — no TypeError, ever.`);

  blank();
  table(
    ["situation", "is 'note' a key of the map?", "TypeScript diagnostic"],
    [
      ["order.note used unguarded", "yes — string | undefined", "TS18048 (possibly undefined)"],
      ["order.nots (typo)", "no", "TS2339 (does not exist)"],
      ["order.note narrowed / ??/?.", "yes", "no diagnostic — legally consumed"],
    ],
  );
}
