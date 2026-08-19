/**
 * 03-corruption-modes — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * Three of the four corruption modes are eliminated by the same rule — argument
 * *i* against parameter *i* — because in each case the swapped values had
 * DIFFERENT types.
 *
 * The fourth is not, and this demo ends by saying so plainly. `applyDiscount`
 * takes two `number`s; swapping them produces a wrong answer that is perfectly
 * well-typed. Everything from level 02 onwards exists because of that one row.
 */

import {
  section,
  ts,
  good,
  bad,
  warn,
  note,
  compilerSays,
  table,
  blank,
  detonate,
  compileTimeOnly,
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

interface BadgeConfig {
  readonly colour: string;
  readonly outlined: boolean;
}

const priceIn = (amountCents: number, currency: string): string =>
  `${(amountCents / 100).toFixed(2)} ${currency}`;

const renderBadge = (label: string, config: BadgeConfig): string =>
  `<span class="${config.colour}">${label}</span>`;

const auditLog = (message: string, verbose: boolean): string =>
  verbose ? `VERBOSE: ${message}` : message;

/** The one that gets away. Both parameters are `number`. */
const applyDiscount = (subtotalCents: number, discountCents: number): number =>
  subtotalCents - discountCents;

export function runSafe(): void {
  // =========================================================================
  // MODE 1 — NaN
  // =========================================================================
  section("MODE 1 — NaN, eliminated");

  ts('priceIn("EUR", 4500)');
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'string' is not assignable to parameter
    // of type 'number'.
    const price = priceIn("EUR", 4500);
    void price;
  });
  compilerSays(
    "TS2345",
    "Argument of type 'string' is not assignable to parameter of type 'number'.",
    "`\"EUR\" / 100` cannot happen because the argument never reaches the " +
      "division. The NaN has no origin.",
  );

  // =========================================================================
  // MODE 2 — "[object Object]"
  // =========================================================================
  blank();
  section('MODE 2 — "[object Object]", eliminated');

  ts("renderBadge(config, 'SALE')");
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type '{ colour: string; outlined: boolean; }'
    // is not assignable to parameter of type 'string'.
    const badge = renderBadge({ colour: "red", outlined: true }, "SALE");
    void badge;
  });
  compilerSays(
    "TS2345",
    "Argument of type '{ colour: string; outlined: boolean; }' is not " +
      "assignable to parameter of type 'string'.",
    "The compiler prints the whole structural type of the offending argument, " +
      "which usually makes the swap obvious at a glance — you can see the " +
      "shape that was meant for the other position.",
  );

  // =========================================================================
  // MODE 3 — the wrong branch
  // =========================================================================
  blank();
  section("MODE 3 — the wrong branch, eliminated");

  ts('auditLog(true, "disk full")');
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'boolean' is not assignable to parameter
    // of type 'string'.
    const line = auditLog(true, "disk full");
    void line;
  });
  compilerSays(
    "TS2345",
    "Argument of type 'boolean' is not assignable to parameter of type 'string'.",
    "The intermittent version of this bug — where the branch taken depends on " +
      "whether the misplaced string happened to be empty — cannot occur, " +
      "because the misplaced string cannot be placed.",
  );

  // =========================================================================
  // MODE 4 — THE ONE THAT GETS THROUGH
  // =========================================================================
  blank();
  section("MODE 4 — a plausible answer. NOT eliminated.");

  const correct = applyDiscount(12_950, 500);
  const swapped = applyDiscount(500, 12_950);

  proofBlock("both calls are perfectly well-typed");
  proveType<number>()(correct, "number", "applyDiscount(subtotal, discount)");
  proveType<number>()(swapped, "number", "applyDiscount(discount, subtotal) — also fine!");

  blank();
  detonate("applyDiscount(12950, 500)", () => correct);
  detonate("applyDiscount(500, 12950)", () => swapped);
  bad(
    "-12450, compiled without a murmur under `strict: true`. Both parameters " +
      "are `number`, so positional checking has nothing to compare: the types " +
      "agree and only the MEANING differs.",
  );

  ts("there is no @ts-expect-error on the line above, because there is no error");
  warn(
    "This is not the compiler being lax. `subtotalCents: number` and " +
      "`discountCents: number` ARE the same type — that is what `number` " +
      "means. To make them different you must make them different, which is " +
      "demo 07.",
  );

  // =========================================================================
  // THE SCOREBOARD
  // =========================================================================
  blank();
  section("Scoreboard for level 01");
  table(
    ["mode", "swapped types", "JavaScript result", "TypeScript", "code"],
    [
      ["1 — NaN", "string ↔ number", '"NaN 4500"', "rejected", "TS2345"],
      ["2 — [object Object]", "object ↔ string", "garbage or TypeError", "rejected", "TS2345"],
      ["3 — wrong branch", "boolean ↔ string", "inverted logic", "rejected", "TS2345"],
      ["4 — plausible value", "number ↔ number", "-12450", "**ACCEPTED**", "—"],
    ],
  );

  good(
    "Three of four modes deleted by a rule that fits in one sentence. That is " +
      "a genuinely large win and it is worth stating before the caveat.",
  );
  warn(
    "And the fourth row is the rest of this project. Note which mode survived: " +
      "the one with no visible symptom, the one review cannot see, the one no " +
      "monitoring system will ever page you about.",
  );
}
