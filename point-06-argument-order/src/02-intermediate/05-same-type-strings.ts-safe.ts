/**
 * 05-same-type-strings — THE TYPESCRIPT VERSION
 * ---------------------------------------------------------------------------
 * The second `.ts-safe` file that is not safe. Same mechanism as demo 04, same
 * silence, but a sharper illustration of WHY it matters: a swapped number gives
 * you a wrong value, while a swapped identifier gives you the right action
 * performed on the wrong entity.
 *
 * This demo also introduces the distinction that drives level 03: two `string`
 * parameters may be
 *
 *   (a) genuinely interchangeable  — `join(a: string, b: string)`, or
 *   (b) semantically distinct      — `transfer(from: string, to: string)`.
 *
 * TypeScript treats both identically, because in both cases the type is
 * `string`. YOU know which is which; the compiler cannot, until you tell it.
 * Branding is how you tell it.
 */

import {
  section,
  ts,
  bad,
  warn,
  note,
  good,
  positionTrace,
  table,
  blank,
  detonate,
  compileTimeOnly,
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

const fullName = (firstName: string, lastName: string): string => `${lastName}, ${firstName}`;

interface Ledger {
  [accountId: string]: number;
}

const transfer = (
  ledger: Ledger,
  fromAccountId: string,
  toAccountId: string,
  amountCents: number,
): Ledger => ({
  ...ledger,
  [fromAccountId]: (ledger[fromAccountId] ?? 0) - amountCents,
  [toAccountId]: (ledger[toAccountId] ?? 0) + amountCents,
});

const show = (ledger: Ledger): string =>
  Object.entries(ledger)
    .map(([id, cents]) => `${id}=${(cents / 100).toFixed(2)}`)
    .join("  ");

export function runSafe(): void {
  // =========================================================================
  // 1. THE SWAP, ACCEPTED
  // =========================================================================
  section("Two strings, swapped, compiled");

  const intended = fullName("Ada", "Lovelace");
  const swapped = fullName("Lovelace", "Ada");

  proofBlock("both well-typed");
  proveType<string>()(intended, "string", "fullName(first, last)");
  proveType<string>()(swapped, "string", "fullName(last, first) — no error");

  blank();
  detonate('fullName("Ada", "Lovelace")', () => intended);
  detonate('fullName("Lovelace", "Ada")', () => swapped);
  bad("Both compile. One is wrong. The compiler cannot tell you which.");

  positionTrace([
    ["0", "firstName", "string", '"Lovelace" (string)', "✔ assignable"],
    ["1", "lastName", "string", '"Ada" (string)', "✔ assignable"],
  ]);

  // =========================================================================
  // 2. THE EXPENSIVE VERSION
  // =========================================================================
  blank();
  section("The same silence, applied to money");

  const opening: Ledger = { "acct-payer": 500_00, "acct-payee": 12_00 };
  detonate("opening", () => show(opening));

  const correct = transfer(opening, "acct-payer", "acct-payee", 129_50);
  const reversed = transfer(opening, "acct-payee", "acct-payer", 129_50);

  proveType<Ledger>()(correct, "Ledger", "transfer(from, to, amount)");
  proveType<Ledger>()(reversed, "Ledger", "transfer(to, from, amount) — also well-typed");

  blank();
  detonate("after the intended transfer", () => show(correct));
  detonate("after the swapped transfer", () => show(reversed));
  bad(
    "The money moved the wrong way, under `strict: true`, with no diagnostic " +
      "anywhere. Note also that the TOTALS STILL BALANCE — the funds went " +
      "somewhere real, so no invariant check catches it either.",
  );

  // =========================================================================
  // 3. WHAT IS STILL CAUGHT — the boundary of the blind spot
  // =========================================================================
  blank();
  section("The blind spot has a precise edge");

  ts("transfer(opening, 'acct-payer', 'acct-payee', 'a lot')   // amount is a string");
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'string' is not assignable to parameter
    // of type 'number'.
    const bogus = transfer(opening, "acct-payer", "acct-payee", "a lot");
    void bogus;
  });
  good(
    "Position 3 is still checked, because `number` and `string` still differ. " +
      "The gap is exactly and only 'same type, different meaning' — not 'calls " +
      "are unchecked'.",
  );

  // =========================================================================
  // 4. THE DISTINCTION THAT DRIVES LEVEL 03
  // =========================================================================
  blank();
  section("Two kinds of same-typed parameter pair");

  table(
    ["signature", "are the two interchangeable?", "should you brand them?"],
    [
      ["`max(a: number, b: number)`", "yes — commutative", "no, it would be noise"],
      ["`join(a: string, b: string)`", "no, but the result is visibly wrong", "probably not"],
      ["`fullName(first, last)`", "no — visibly wrong output", "maybe"],
      ["`aspectRatio(width, height)`", "**no** — silently wrong number", "**yes**"],
      ["`transfer(from, to, amount)`", "**no** — silently wrong direction", "**yes**"],
      ["`dateRange(start, end)`", "**no** — silently negative duration", "**yes**"],
    ],
  );
  note(
    "The design question is never 'should everything be branded?'. It is: " +
      "WOULD A SWAP HERE BE SILENT, AND WOULD IT BE EXPENSIVE? Brand the rows " +
      "where both answers are yes. Demo 14 turns this table into a decision " +
      "procedure.",
  );

  blank();
  warn(
    "One more property of the money case, worth naming because it is the " +
      "reason this is not a theoretical concern: for a swapped `transfer`, the " +
      "CUSTOMER is the error-detection system. Level 03 replaces them with the " +
      "compiler.",
  );
}
