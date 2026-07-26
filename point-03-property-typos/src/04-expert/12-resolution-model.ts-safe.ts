/**
 * 12-resolution-model — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * The compiler's mental model for resolving `expr.key` is STATIC and runs
 * ONCE, at compile time, against a property map that has already FLATTENED
 * every level of inheritance — there is no per-access "walk" the way the
 * runtime prototype chain works. The resolution order the checker follows,
 * in words:
 *
 *   1. OWN declared members of the type itself.
 *   2. INHERITED declared members, from every base class/interface,
 *      already merged into the same flat property map (steps 1 and 2 are
 *      not sequential lookups — they are precomputed into ONE map before
 *      any access is checked).
 *   3. An INDEX SIGNATURE, if the type declares one — matches ANY string
 *      (demo 07).
 *   4. Otherwise: TS2339 / TS2551.
 */

import { section, ts, good, note, compilerSays, table, blank, shapeTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

class Entity {
  readonly id: string;
  constructor(id: string) {
    this.id = id;
  }
}

class Invoice extends Entity {
  readonly totalCents: number;
  constructor(id: string, totalCents: number) {
    super(id);
    this.totalCents = totalCents;
  }
}

// A type with an index signature, for step 3 of the resolution order.
class DynamicRecord {
  [key: string]: unknown;
}

export function runSafe(): void {
  const invoice = new Invoice("inv-501", 9900);

  section("The FLATTENED property map the compiler actually checks against");
  shapeTrace([
    ["Invoice", "id (inherited from Entity), totalCents (own)", "computed once, before any access is checked"],
  ]);
  note(
    "There is no compile-time notion of 'check Invoice first, then Entity' — " +
      "the checker builds ONE property map for 'Invoice' that already " +
      "includes every inherited member, and every access is a single lookup " +
      "against it.",
  );

  blank();
  section("Step 1/2: own and inherited members resolve identically");

  const id = invoice.id; // inherited from Entity
  const total = invoice.totalCents; // own
  proveType<string>()(id, "string", "inherited member — same lookup cost as an own member");
  proveType<number>()(total, "number", "own member");
  good("Both resolved with the same certainty — inheritance depth is invisible to the check.");

  blank();
  section("Step 4: neither own, inherited, nor index-signature — rejected");

  ts("invoice.totlaCents");
  compileTimeOnly(() => {
    // @ts-expect-error TS2551: Property 'totlaCents' does not exist on type
    // 'Invoice'. Did you mean 'totalCents'?
    const bad = invoice.totlaCents;
    void bad;
  });
  compilerSays(
    "TS2551",
    "Property 'totlaCents' does not exist on type 'Invoice'. Did you mean 'totalCents'?",
    "No runtime prototype walk happened here — there was never an 'Invoice' " +
      "or 'Entity' object involved. The compiler consulted the flattened " +
      "property map ONCE and found no match at any of the first three steps.",
  );

  blank();
  section("Step 3: an index signature intercepts BEFORE step 4 is reached");

  const record = new DynamicRecord();
  ts('record["anything"]  — no declared member named "anything", but an index signature exists');
  const anything = record["anything"];
  proveType<unknown>()(anything, "unknown", "resolved via the index signature — step 3, not step 4");
  note(
    "'DynamicRecord' has NO own or inherited declared members at all — every " +
      "access falls straight through steps 1 and 2 to the index signature at " +
      "step 3, which accepts it (bracket notation required — " +
      "noPropertyAccessFromIndexSignature, see demo 07 for why that trade-off " +
      "exists at all).",
  );

  blank();
  section("The resolution order, end to end");
  table(
    ["step", "checked against", "invoice.id", "invoice.totalCents", "invoice.totlaCents", "record.anything"],
    [
      ["1", "own declared members", "-", "MATCH", "no match", "no own members"],
      ["2", "inherited declared members", "MATCH", "-", "no match", "n/a (no base)"],
      ["3", "index signature", "n/a", "n/a", "none declared", "MATCH"],
      ["4", "reject", "n/a", "n/a", "TS2551", "n/a"],
    ],
  );
}
