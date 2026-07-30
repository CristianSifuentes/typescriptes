/**
 * 02-arithmetic-coercion — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * The rule here is simpler than `+`'s, because these operators have no
 * legitimate string-handling branch to preserve:
 *
 *   Both operands of `-`, `*`, `/`, `%`, `**` must be `any`, `number`,
 *   `bigint`, or an enum member.
 *
 * There is no "but sometimes I mean it" exception, because subtracting a
 * `string` is NEVER a real operation in well-typed code — it is always
 * either a bug or a missing `Number()` call. TypeScript therefore refuses
 * the operator itself, at the point of use, rather than waiting for the
 * NaN to surface downstream (contrast with demo 01's `+`, which cannot be
 * refused outright).
 */

import {
  section,
  ts,
  good,
  warn,
  note,
  compilerSays,
  table,
  blank,
  detonate,
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

interface MarketingCsvRow {
  readonly sku: string;
  readonly discountPercent: string; // CSV: everything is text
  readonly couponValue: string;
  readonly tag: string;
}

interface DiscountRow {
  readonly sku: string;
  readonly discountPercent: number;
  readonly couponValue: number;
}

/** The single, auditable place text becomes number — and where a garbage
 *  column (like `tag`) is REJECTED rather than silently producing NaN. */
function parseDiscountRow(row: MarketingCsvRow): DiscountRow {
  const discountPercent = Number(row.discountPercent);
  const couponValue = Number(row.couponValue);
  if (!Number.isFinite(discountPercent) || !Number.isFinite(couponValue)) {
    throw new TypeError(`row ${row.sku}: discountPercent/couponValue must be numeric`);
  }
  return { sku: row.sku, discountPercent, couponValue };
}

export function runSafe(): void {
  const basePrice = 80;
  const csv: MarketingCsvRow = {
    sku: "SKU-42",
    discountPercent: "15",
    couponValue: "3.50",
    tag: "SUMMER",
  };

  // =========================================================================
  // 1. EVERY NON-`+` ARITHMETIC OPERATOR, REFUSED ON STRING OPERANDS
  // =========================================================================
  section("`-`, `*`, `/`, `%`, `**` — coercion refused outright");

  ts("basePrice * (1 - csv.discountPercent / 100)");
  // @ts-expect-error TS2362: The left-hand side of an arithmetic operation must be of
  // type 'any', 'number', 'bigint' or an enum type.
  const discounted = basePrice * (1 - csv.discountPercent / 100);
  void discounted;
  compilerSays(
    "TS2362",
    "The left-hand side of an arithmetic operation must be of type 'any', " +
      "'number', 'bigint' or an enum type.",
    "`csv.discountPercent` is `string`. In JavaScript, ToNumber would silently " +
      'succeed here ("15" → 15) — but the checker does not know the CONTENT of ' +
      "the string, only its type, so it refuses the whole class uniformly.",
  );

  ts("basePrice * csv.tag");
  // @ts-expect-error TS2363: The right-hand side of an arithmetic operation must be of
  // type 'any', 'number', 'bigint' or an enum type.
  const corrupted = basePrice * csv.tag;
  void corrupted;
  compilerSays(
    "TS2363",
    "The right-hand side of an arithmetic operation must be of type 'any', " +
      "'number', 'bigint' or an enum type.",
    "This is the operand that would have silently produced NaN. There is no " +
      "runtime distinction between 'a string that happens to parse' and 'a " +
      "string that does not' — TypeScript is right to reject both identically.",
  );

  // =========================================================================
  // 2. THE HONEST TRADE-OFF: TYPESCRIPT CANNOT TELL "15" FROM "SUMMER"
  // =========================================================================
  blank();
  section("Why TypeScript rejects the operator, not the specific value");
  table(
    ["operand type", "TypeScript's information", "runtime outcome if allowed"],
    [
      ['"15" (string)', "just: string", "ToNumber succeeds → 15"],
      ['"SUMMER" (string)', "just: string", "ToNumber fails → NaN"],
    ],
  );
  warn(
    "Both rows have the SAME static type. A type system reasons about types, " +
      "not about the runtime content of values, so it must reject (or accept) " +
      "the entire type uniformly. Rejecting `string` here is the conservative, " +
      "correct choice: it trades a few false positives (strings that WOULD " +
      "have parsed) for zero false negatives (strings that silently become NaN).",
  );

  // =========================================================================
  // 3. THE PROGRAM THAT COMPILES
  // =========================================================================
  blank();
  section("Doing it properly: convert and validate once, at the boundary");

  const row = parseDiscountRow(csv);
  proofBlock("after parsing at the boundary");
  proveType<number>()(row.discountPercent, "number", "Number() + Number.isFinite check");
  proveType<number>()(row.couponValue, "number", "Number() + Number.isFinite check");

  const discountedPrice: number = basePrice * (1 - row.discountPercent / 100);
  const finalPrice: number = discountedPrice - row.couponValue;

  proveType<number>()(discountedPrice, "number", "");
  proveType<number>()(finalPrice, "number", "");

  blank();
  detonate("discounted price", () => discountedPrice);
  detonate("final price after coupon", () => finalPrice);
  good("68 and 64.5 — real numbers, guaranteed finite, never silently NaN.");

  blank();
  section("What happens to the malformed row (`tag`) in the safe version");
  ts('parseDiscountRow({ ...csv, discountPercent: csv.tag })');
  note(
    "This throws a `TypeError` with the offending SKU at the exact row that " +
      "failed to parse — loudly, at import time — instead of returning NaN to " +
      "be discovered three joins later in a batch total.",
  );
}
