/**
 * 08-options-objects — THE REMEDY THAT REMOVES ORDER ENTIRELY
 * ---------------------------------------------------------------------------
 * Branding (demo 07) makes the two positions DIFFERENT. An options object makes
 * the positions GO AWAY. The two remedies solve different halves of the problem
 * and compose well, which this demo ends by showing.
 *
 * What TypeScript adds to the JavaScript idea:
 *
 *   MISSING field       → TS2741, and it NAMES the field
 *   MISSPELLED field    → TS2561, and it SUGGESTS the correction
 *   WRONG type of field → TS2322/TS2345, by name rather than by index
 *   ORDER               → not a concept; there is nothing to get wrong
 *
 * Compare the diagnostics with the positional equivalents. "Expected 6
 * arguments, but got 5" tells you to count. "Property 'currency' is missing"
 * tells you what to write.
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
  compileTimeOnly,
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

declare const brand: unique symbol;
type Brand<T, K extends string> = T & { readonly [brand]: K };
type AccountId = Brand<string, "AccountId">;
const accountId = (raw: string): AccountId => raw as AccountId;

interface ReportOptions {
  readonly title: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly groupBy: "region" | "product" | "channel";
  readonly currency: "EUR" | "USD" | "GBP";
  /** Genuinely optional — and here `?` means what people wanted it to mean. */
  readonly includeCharts?: boolean;
}

interface Report {
  readonly title: string;
  readonly range: string;
  readonly groupBy: string;
  readonly currency: string;
  readonly charts: boolean;
}

const generateReport = (options: ReportOptions): Report => ({
  title: options.title,
  range: `${options.startDate.toISOString().slice(0, 10)}..${options.endDate
    .toISOString()
    .slice(0, 10)}`,
  groupBy: options.groupBy,
  currency: options.currency,
  charts: options.includeCharts ?? false,
});

export function runSafe(): void {
  // =========================================================================
  // 1. ORDER STOPS EXISTING
  // =========================================================================
  section("Order is not a concept, so there is no ordering mistake to make");

  const natural = generateReport({
    title: "Q1",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-03-31"),
    groupBy: "region",
    currency: "EUR",
    includeCharts: true,
  });

  const scrambled = generateReport({
    currency: "EUR",
    includeCharts: true,
    endDate: new Date("2026-03-31"),
    groupBy: "region",
    title: "Q1",
    startDate: new Date("2026-01-01"),
  });

  detonate("fields in the natural order", () => JSON.stringify(natural));
  detonate("the same fields, scrambled", () => JSON.stringify(scrambled));
  good("Identical. The 6! = 720 orderings of the positional version collapse to 1.");

  // =========================================================================
  // 2. THE DIAGNOSTICS ARE BY NAME
  // =========================================================================
  blank();
  section("Missing, misspelled, and mistyped fields — each named");

  ts("generateReport({ title, startDate })   // four fields missing");
  compileTimeOnly(() => {
    // @ts-expect-error TS2739: Type '{ title: string; startDate: Date; }' is missing the
    // following properties from type 'ReportOptions': endDate, groupBy, currency
    const incomplete = generateReport({ title: "Q1", startDate: new Date("2026-01-01") });
    void incomplete;
  });
  compilerSays(
    "TS2739",
    "Type '{ title: string; startDate: Date; }' is missing the following " +
      "properties from type 'ReportOptions': endDate, groupBy, currency",
    "Contrast the positional equivalent: 'Expected 6 arguments, but got 2.' " +
      "One message tells you to count; the other tells you what to write. " +
      "Note also that ALL missing fields are listed — object checking does not " +
      "stop at the first failure the way argument checking does.",
  );

  ts("generateReport({ …, currancy: 'EUR' })   // a typo");
  compileTimeOnly(() => {
    const typo = generateReport({
      title: "Q1",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-03-31"),
      groupBy: "region",
      currency: "EUR",
      // @ts-expect-error TS2561: Object literal may only specify known properties, but
      // 'currancy' does not exist in type 'ReportOptions'. Did you mean to write 'currency'?
      currancy: "EUR",
    });
    void typo;
  });
  compilerSays(
    "TS2561",
    "Object literal may only specify known properties, but 'currancy' does " +
      "not exist in type 'ReportOptions'. Did you mean to write 'currency'?",
    "The failure mode that options objects ADD in plain JavaScript — a " +
      "silently-ignored typo — is closed here by the excess-property check, " +
      "with the correction in the message.",
  );

  // =========================================================================
  // 3. OPTIONALITY THAT MEANS WHAT PEOPLE EXPECT
  // =========================================================================
  blank();
  section("`?` finally means 'omit this'");

  const withoutCharts = generateReport({
    title: "Q1",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-03-31"),
    groupBy: "region",
    currency: "EUR",
  });
  detonate("includeCharts omitted", () => JSON.stringify(withoutCharts));
  good(
    "Compare demo 02, where a positional optional could not be skipped without " +
      "shifting every later argument. Here omission is exactly omission.",
  );

  proofBlock("what the compiler knows about the optional field");
  proveType<boolean>()(withoutCharts.charts, "boolean", "`?? false` removed the undefined");

  // =========================================================================
  // 4. THE HONEST LIMIT
  // =========================================================================
  blank();
  section("What an options object does NOT fix");

  interface TransferRequest {
    readonly fromAccountId: string;
    readonly toAccountId: string;
    readonly amountCents: number;
  }
  const transfer = (r: TransferRequest): string =>
    `${r.amountCents} from ${r.fromAccountId} to ${r.toAccountId}`;

  detonate(
    "the intended transfer",
    () => transfer({ fromAccountId: "acct-payer", toAccountId: "acct-payee", amountCents: 100 }),
  );
  detonate(
    "the values exchanged under the field names",
    () => transfer({ fromAccountId: "acct-payee", toAccountId: "acct-payer", amountCents: 100 }),
  );
  warn(
    "Both compile. An options object removes ORDER, but it cannot stop you " +
      "putting the right VALUE under the wrong NAME — both fields are `string`, " +
      "so the same-typed blind spot has simply moved from positions to keys.",
  );

  // =========================================================================
  // 5. THE COMBINATION
  // =========================================================================
  blank();
  section("Options object + brands: the two halves together");

  interface BrandedTransfer {
    readonly from: AccountId;
    readonly to: AccountId;
    readonly amountCents: number;
  }
  const safeTransfer = (r: BrandedTransfer): string =>
    `${r.amountCents} from ${r.from} to ${r.to}`;

  detonate(
    "still fine",
    () => safeTransfer({ from: accountId("acct-payer"), to: accountId("acct-payee"), amountCents: 100 }),
  );
  note(
    "    Note what this does and does not buy. Both fields are `AccountId`, so " +
      "brands do NOT distinguish payer from payee here — the two really are " +
      "the same KIND of thing playing different ROLES. For roles, the honest " +
      "remedies are distinct brands (`PayerAccountId` / `PayeeAccountId`) if " +
      "the distinction is worth enforcing, or a named field plus a test if it " +
      "is not.",
  );
  warn(
    "That is a genuine residue, and demo 14 is where it gets decided rather " +
      "than hand-waved: brands separate KINDS cheaply and ROLES expensively.",
  );

  blank();
  table(
    ["failure", "positional", "options object", "options + brands"],
    [
      ["wrong order", "silent corruption", "impossible", "impossible"],
      ["missing value", "TS2554 (counts)", "TS2739 (names them)", "TS2739"],
      ["misspelled name", "n/a", "TS2561 (+ suggestion)", "TS2561"],
      ["wrong type", "TS2345 by index", "TS2322 by name", "TS2322 by name"],
      ["right value, wrong field", "n/a", "**silent**", "caught if the kinds differ"],
      ["readable call site", "no", "yes", "yes"],
    ],
  );
  good(
    "Rule of thumb: reach for an options object at three or more parameters, " +
      "or at two if either is a boolean. Reach for brands when two parameters " +
      "share a type and a swap would be silent.",
  );
}
