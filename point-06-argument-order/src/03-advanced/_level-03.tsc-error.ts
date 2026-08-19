/**
 * EVIDENCE FIXTURE — level 03 (advanced) — THE REMEDIES
 * ---------------------------------------------------------------------------
 * Compiled only by `tsconfig.evidence.json` (`npm run evidence`).
 *
 * Level 02 showed the blind spot: two same-typed parameters cannot be told
 * apart by position. Level 03 closes it four different ways, and this fixture
 * shows the diagnostic each remedy produces for the SAME swap that level 02
 * accepted in silence.
 */

// ===========================================================================
// 07 — BRANDED (NOMINAL) TYPES
// ===========================================================================

declare const brand: unique symbol;

/** A phantom member that exists only in the type world and is erased at emit. */
type Brand<T, K extends string> = T & { readonly [brand]: K };

type Width = Brand<number, "Width">;
type Height = Brand<number, "Height">;
type FirstName = Brand<string, "FirstName">;
type LastName = Brand<string, "LastName">;

const width = (n: number): Width => n as Width;
const height = (n: number): Height => n as Height;
const firstName = (s: string): FirstName => s as FirstName;
const lastName = (s: string): LastName => s as LastName;

function aspectRatio(w: Width, h: Height): number {
  return w / h;
}

/** TS2345: the swap that level 02 accepted in silence is now an error, even
 *  though BOTH values are `number` at runtime. */
const swappedDimensions = aspectRatio(height(10), width(3));

/** TS2345: a raw `number` is no longer accepted either — you must state which
 *  quantity it is. That is the cost of the brand, and it is the point. */
const rawNumber = aspectRatio(3, 10);

function fullName(first: FirstName, last: LastName): string {
  return `${last}, ${first}`;
}

/** TS2345: two strings, no longer interchangeable. */
const swappedNames = fullName(lastName("Lovelace"), firstName("Ada"));

// ===========================================================================
// 08 — OPTIONS OBJECTS
// ===========================================================================

interface TransferRequest {
  readonly fromAccountId: string;
  readonly toAccountId: string;
  readonly amountCents: number;
}

function transfer(request: TransferRequest): string {
  return `${request.amountCents} from ${request.fromAccountId} to ${request.toAccountId}`;
}

/** TS2741: a missing field is named, where a missing positional argument was
 *  only ever "expected 3 arguments, but got 2". */
const missingField = transfer({ fromAccountId: "a", amountCents: 100 });

interface ReportOptions {
  readonly title: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly groupBy: "region" | "product" | "channel";
  readonly currency: "EUR" | "USD" | "GBP";
}
declare function generateReport(options: ReportOptions): string;

/** TS2739 when SEVERAL fields are missing: unlike argument checking (which
 *  stops at the first bad position), object checking reports them all. */
const severalMissing = generateReport({ title: "Q1", startDate: new Date() });

/** TS2561: a typo'd field is named AND corrected. */
const typoField = transfer({
  fromAccountId: "a",
  toAccountId: "b",
  amountCents: 100,
  amuntCents: 100,
});

/** NO DIAGNOSTIC (by design). An options object removes ORDER as a concept —
 *  writing the fields in any sequence is the same value. What it does NOT fix
 *  is putting the right VALUE under the wrong NAME: both fields are `string`,
 *  so this reversed transfer still compiles. Options objects and brands solve
 *  different halves of the problem, and the demo shows them combined. */
const stillReversible = transfer({
  fromAccountId: "acct-payee",
  toAccountId: "acct-payer",
  amountCents: 100,
});

// ===========================================================================
// 09 — LABELED TUPLES
// ===========================================================================

type DateRange = readonly [start: Date, end: Date];

function nightsBetween(...range: DateRange): number {
  const [start, end] = range;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/** NO DIAGNOSTIC (by design). Labels are documentation, not types: both
 *  elements are `Date`, so a reversed range is accepted and returns a negative
 *  number. Labeled tuples improve editor hints; they do not add checking. */
const reversedRange = nightsBetween(new Date("2026-03-05"), new Date("2026-03-01"));

/** NO DIAGNOSTIC (by design). SPREADING a `readonly` tuple into a rest
 *  parameter is fine — worth checking rather than assuming, because the
 *  neighbouring case below is not. */
declare function nightsBetweenMutable(...range: [start: Date, end: Date]): number;
declare const frozenRange: readonly [start: Date, end: Date];
const spreadIsFine = nightsBetweenMutable(...frozenRange);

/** TS4104: The type 'readonly [start: Date, end: Date]' is 'readonly' and
 *  cannot be assigned to the mutable type '[start: Date, end: Date]'.
 *
 *  ASSIGNMENT is where readonly-ness bites, and it is how a generic forwarding
 *  helper meets it: `withRetry<A>(fn: (...args: A) => R, args: A)` infers `A`
 *  from the callee's rest parameter as a MUTABLE tuple, so passing a readonly
 *  tuple as `args` fails. Declare ARGUMENT tuples mutable and DATA tuples
 *  readonly. */
const mutablePair: [start: Date, end: Date] = frozenRange;

type BrandedRange = readonly [start: Brand<Date, "Start">, end: Brand<Date, "End">];
declare function nightsBetweenBranded(...range: BrandedRange): number;
declare const startDate: Brand<Date, "Start">;
declare const endDate: Brand<Date, "End">;

/** TS2345: brand the tuple elements and the reversal becomes an error. The
 *  labels are for humans; the brands are for the compiler. */
const reversedBrandedRange = nightsBetweenBranded(endDate, startDate);

// ===========================================================================
// 10 — BUILDERS WITH TYPE-STATE
// ===========================================================================

interface Query {
  readonly sql: string;
}
type Step = "from" | "where" | "limit" | "offset";

interface QueryBuilder<Taken extends Step> {
  from(table: string): Omit<QueryBuilder<Taken | "from">, "from">;
  where(field: string, value: string): Omit<QueryBuilder<Taken | "where">, never>;
  limit(rows: number): Omit<QueryBuilder<Taken | "limit">, "limit">;
  offset(rows: number): Omit<QueryBuilder<Taken | "offset">, "offset">;
  build: "from" extends Taken ? ("where" extends Taken ? () => Query : never) : never;
}

declare function queryBuilder(): Omit<QueryBuilder<never>, "build">;

/** NO DIAGNOSTIC (by design). `limit` and `offset` are both `number` — the
 *  level-02 blind spot — but they arrive through DIFFERENT METHODS, so the
 *  order of the two calls is irrelevant and both chains are identical. This is
 *  the only remedy in the project that separates two same-typed values WITHOUT
 *  branding them. */
const chainA = queryBuilder().from("o").where("s", "paid").limit(10).offset(20).build();
const chainB = queryBuilder().from("o").where("s", "paid").offset(20).limit(10).build();

/** TS2349: This expression is not callable. Type 'never' has no call signatures.
 *
 *  Precision matters here. `build` IS a member of the type — the conditional
 *  collapses its TYPE to `never`, it does not remove the member. So the
 *  property access succeeds and the CALL is what fails. (Contrast the
 *  duplicate-step case below, where `Omit` really does remove the member and
 *  the access itself is TS2339.) */
const incomplete = queryBuilder().limit(10).build();

/** TS2349 again: `from` is taken but `where` is not, so `build` is still
 *  typed `never`. */
const noFilter = queryBuilder().from("orders").build();

/** TS2339: a step already taken is removed from the returned type. */
const duplicated = queryBuilder().from("orders").from("customers");

export const evidence = {
  swappedDimensions,
  rawNumber,
  swappedNames,
  missingField,
  severalMissing,
  typoField,
  stillReversible,
  spreadIsFine,
  mutablePair,
  reversedRange,
  reversedBrandedRange,
  chainA,
  chainB,
  incomplete,
  noFilter,
  duplicated,
  aspectRatio,
  fullName,
  nightsBetween,
};
