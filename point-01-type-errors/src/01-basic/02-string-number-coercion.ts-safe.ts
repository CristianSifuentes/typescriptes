/**
 * 02-coercion — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * The honest version of this lesson is more interesting than the slogan.
 *
 * Slogan:  "TypeScript stops implicit coercion."
 * Reality: TypeScript stops the coercions that are *always* mistakes, and
 *          TYPES the one that is sometimes legitimate.
 *
 *   "5" - 3   →  ERROR TS2362. Subtraction has no meaning on strings, so the
 *                only way this expression can run is via a silent coercion.
 *                TypeScript refuses to perform it.
 *
 *   "5" + 3   →  NO ERROR. It is typed `string`. Concatenating a number onto a
 *                string is a real, intentional JavaScript operation
 *                (`"page " + 3`), and forbidding it would break the language.
 *
 * So how is the `+` bug caught? By the CONSEQUENCE, not by the operator: the
 * expression is `string`, and a `string` cannot flow into anything expecting a
 * `number`. The error appears at the first place where the wrong type meets a
 * declared type — which, in `strict` mode with annotated boundaries, is at most
 * one step away from the defect.
 *
 * That is the general shape of type-system protection: it is not a rule against
 * every suspicious expression, it is a proof that types agree END TO END.
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

interface StockCsvRow {
  readonly sku: string;
  readonly incoming: string; // CSV: everything is text
  readonly damaged: string;
}

interface StockRow {
  readonly sku: string;
  readonly incoming: number;
  readonly damaged: number;
}

/** The single, auditable place where text becomes number. */
function parseStockRow(row: StockCsvRow): StockRow {
  const incoming = Number(row.incoming);
  const damaged = Number(row.damaged);
  if (!Number.isInteger(incoming) || !Number.isInteger(damaged)) {
    throw new TypeError(`row ${row.sku}: quantities must be integers`);
  }
  return { sku: row.sku, incoming, damaged };
}

export function runSafe(): void {
  const csv: StockCsvRow = { sku: "WIDGET-1", incoming: "5", damaged: "2" };
  const onHand = 100;

  // =========================================================================
  // 1. THE OPERATORS THAT TYPESCRIPT REFUSES OUTRIGHT
  // =========================================================================
  section('`-`, `*`, `/`, `%`, `**` — coercion refused');

  ts('"5" - 3');
  // @ts-expect-error TS2362: The left-hand side of an arithmetic operation must be of
  // type 'any', 'number', 'bigint' or an enum type.
  const difference = "5" - 3;
  void difference;
  compilerSays(
    "TS2362",
    "The left-hand side of an arithmetic operation must be of type 'any', " +
      "'number', 'bigint' or an enum type.",
    "These operators are defined only over numeric types. In JavaScript the " +
      "engine reaches for ToNumber; TypeScript reaches for a diagnostic.",
  );

  ts("onHand * csv.incoming");
  // @ts-expect-error TS2363: The right-hand side of an arithmetic operation must be of
  // type 'any', 'number', 'bigint' or an enum type.
  const scaled = onHand * csv.incoming;
  void scaled;
  compilerSays(
    "TS2363",
    "The right-hand side of an arithmetic operation must be of type 'any', " +
      "'number', 'bigint' or an enum type.",
    "Same rule, other operand. The NaN that JavaScript would have produced is " +
      "never created.",
  );

  // =========================================================================
  // 2. THE OPERATOR TYPESCRIPT ALLOWS — AND WHY THAT IS CORRECT
  // =========================================================================
  blank();
  section("`+` — allowed, but typed");

  const concatenated = "5" + 3;
  proofBlock('the type of `"5" + 3`');
  proveType<string>()(concatenated, "string", "string operand ⇒ concatenation");
  warn(
    'No error here, and there SHOULD be none: `"page " + 3` is a legitimate ' +
      "program. What TypeScript guarantees is not that you never concatenate — " +
      "it is that the compiler knows you did.",
  );

  blank();
  ts("const total: number = onHand + csv.incoming;");
  // @ts-expect-error TS2322: Type 'string' is not assignable to type 'number'.
  const total: number = onHand + csv.incoming;
  void total;
  compilerSays(
    "TS2322",
    "Type 'string' is not assignable to type 'number'.",
    "Here is the catch, one step downstream of the defect. The `+` was legal; " +
      "its RESULT was not. Because the binding is annotated `number`, the " +
      "string has nowhere to go. Annotate your boundaries and the gap between " +
      "defect and diagnostic stays at zero or one line.",
  );
  good('The "1005 units in stock" bug is a build failure, not an audit finding.');

  // =========================================================================
  // 3. THE OPERATOR TABLE, AS THE CHECKER IMPLEMENTS IT
  // =========================================================================
  blank();
  section("The rule, precisely");
  table(
    ["expression", "JavaScript", "TypeScript verdict", "static type"],
    [
      ['"5" + 3', '"53"', "accepted", "string"],
      ["5 + 3", "8", "accepted", "number"],
      ['"5" - 3', "2", "ERROR TS2362", "—"],
      ['"5" * 3', "15", "ERROR TS2362", "—"],
      ['5 * "3"', "15", "ERROR TS2363", "—"],
      ["5 + true", "6", "ERROR TS2365", "—"],
      ['5 < "3"', "false", "ERROR TS2365", "—"],
      ["[] + {}", '"[object Object]"', "ERROR TS2365", "—"],
      ["1 + null", "1", "ERROR TS18050 (strictNullChecks)", "—"],
    ],
  );
  note(
    "`+`: result is `string` if either side is `string`, `number` if both are " +
      "numeric, `bigint` if both are bigint — otherwise TS2365. All other " +
      "arithmetic operators: both sides must be numeric, otherwise TS2362/TS2363.",
  );

  // =========================================================================
  // 4. THE PROGRAM THAT COMPILES
  // =========================================================================
  blank();
  section("Doing it properly: convert once, at the boundary");

  const row = parseStockRow(csv);
  proofBlock("after parsing at the boundary");
  proveType<number>()(row.incoming, "number", "Number() + integer check");
  proveType<number>()(row.damaged, "number", "Number() + integer check");

  const stockAfterDelivery: number = onHand + row.incoming;
  const usable: number = stockAfterDelivery - row.damaged;

  proveType<number>()(stockAfterDelivery, "number", "`+` on two numbers is addition");
  proveType<number>()(usable, "number", "");

  blank();
  detonate("stock after delivery", () => stockAfterDelivery);
  detonate("usable stock", () => usable);
  good("105 and 103 — the numbers the warehouse actually has.");

  blank();
  note(
    "The lesson is not 'coercion is evil'. It is: coercion is a decision, and " +
      "decisions belong in one explicit place (`parseStockRow`) rather than " +
      "scattered implicitly across every `+` in the codebase.",
  );
}
