/**
 * 06-readonly-typo — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `readonly` and property-name checking are TWO INDEPENDENT rules that
 * happen to both govern assignment targets. Given `target.key = value`, the
 * compiler asks, in order:
 *
 *   1. Is `key` a member of `target`'s property map at all?
 *      → no: TS2339 / TS2551. STOP — readonly is never even consulted.
 *   2. Is `key` marked `readonly` in the map?
 *      → yes: TS2540, regardless of what `value` is.
 *
 * A misspelled readonly field is caught by rule 1, not rule 2 — the
 * assignment target has to EXIST before "is it mutable?" is a meaningful
 * question.
 */

import { section, ts, good, note, compilerSays, table, blank, shapeTrace } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface Invoice {
  readonly id: string;
  readonly issuedAt: string;
  readonly totalCents: number;
}

function loadInvoice(): Invoice {
  return { id: "inv-2024-0088", issuedAt: "2024-01-15", totalCents: 15_000 };
}

export function runSafe(): void {
  const invoice = loadInvoice();

  section("The property map: every member marked readonly");
  shapeTrace([["Invoice", "readonly id, readonly issuedAt, readonly totalCents", "interface Invoice (this file)"]]);

  blank();
  section("Mutating a correctly-spelled, but readonly, field");

  ts('invoice.id = "inv-2024-0099";');
  // @ts-expect-error TS2540: Cannot assign to 'id' because it is a read-only property.
  invoice.id = "inv-2024-0099";
  compilerSays(
    "TS2540",
    "Cannot assign to 'id' because it is a read-only property.",
    "'id' IS a real member of the map — so the key-check (step 1) passes, " +
      "and the compiler proceeds to the readonly check (step 2), which fails.",
  );

  blank();
  section("Mutating a misspelled field that happens to be readonly");

  ts("invoice.totlaCents = 0;");
  // @ts-expect-error TS2551: Property 'totlaCents' does not exist on type
  // 'Invoice'. Did you mean 'totalCents'?
  invoice.totlaCents = 0;
  compilerSays(
    "TS2551",
    "Property 'totlaCents' does not exist on type 'Invoice'. Did you mean 'totalCents'?",
    "Notice this is NOT TS2540. 'totlaCents' is not a key at all, so the " +
      "key-check (step 1) fails FIRST, and readonly is never reached — there " +
      "is no meaningful answer to 'is this key mutable?' for a key that does " +
      "not exist.",
  );

  blank();
  section("The two rules, made explicit");
  table(
    ["assignment target", "step 1: is it a key?", "step 2: is it readonly?", "diagnostic"],
    [
      ["invoice.id", "yes", "yes -> fails", "TS2540"],
      ["invoice.totlaCents", "no -> fails here", "never reached", "TS2551"],
      ["invoice.totalCents (correct spelling, still readonly)", "yes", "yes -> fails", "TS2540"],
    ],
  );

  blank();
  good(
    "There is no legal way to assign to any member of 'Invoice' from outside " +
      "its constructor — which is exactly the contract an immutable invoice " +
      "record is supposed to have.",
  );
  proveType<Invoice>()(invoice, "Invoice", "unchanged since construction — readonly, enforced statically");
}
