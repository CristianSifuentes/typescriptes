// @ts-nocheck
/**
 * 03-corruption-modes — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A swap does not have one failure mode. It has four, and which one you get is
 * decided by the types that happen to be involved — not by how serious the
 * mistake is.
 *
 *   MODE 1  NaN                — the swapped value enters arithmetic
 *   MODE 2  "[object Object]"  — the swapped value enters a string context
 *   MODE 3  the wrong branch   — the swapped value enters a truthiness test
 *   MODE 4  a plausible answer — the swapped value is simply used, and the
 *                                result looks entirely normal
 *
 * Mode 4 is the dangerous one. Modes 1–3 leave a trace in the output that
 * someone might eventually notice. Mode 4 leaves nothing at all.
 *
 * DOMAIN: an invoicing service.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function priceIn(amountCents, currency) {
  return `${(amountCents / 100).toFixed(2)} ${currency}`;
}

function renderBadge(label, config) {
  return `<span class="${config.colour}">${label}</span>`;
}

function auditLog(message, verbose) {
  return verbose ? `VERBOSE: ${message}` : message;
}

function applyDiscount(subtotalCents, discountCents) {
  return subtotalCents - discountCents;
}

export function runBroken(): void {
  section("MODE 1 — NaN: the swapped value enters arithmetic");

  js('priceIn(4500, "EUR")   — intended');
  detonate("price", () => priceIn(4500, "EUR"));
  js('priceIn("EUR", 4500)   — swapped');
  detonate("price", () => priceIn("EUR", 4500));
  note(
    '"NaN 4500". `"EUR" / 100` is NaN, and `NaN.toFixed(2)` is the string ' +
      '"NaN" — a method call that SUCCEEDS on a corrupt value. The currency ' +
      "column of the invoice now contains a number, and the amount column " +
      "contains the letters N, a, N.",
  );

  blank();
  section("MODE 2 — \"[object Object]\": the swapped value enters a string context");

  const config = { colour: "red", outlined: true };
  js("renderBadge('SALE', config)   — intended");
  detonate("badge", () => renderBadge("SALE", config));
  js("renderBadge(config, 'SALE')   — swapped");
  detonate("badge", () => renderBadge(config, "SALE"));
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'colour')",
    "Here the swap DOES throw — but only because the string has no `.colour`. " +
      "Had the function interpolated the object directly, the output would " +
      'have been `<span class="undefined">[object Object]</span>`: valid HTML, ' +
      "rendered to a user, with no error anywhere.",
  );

  blank();
  js("the non-throwing variant of the same mistake");
  detonate("interpolating an object directly", () => `<span>${config}</span>`);
  note(
    '"[object Object]" is what `Object.prototype.toString` returns. It is a ' +
      "successful conversion of a perfectly good object into a useless string.",
  );

  blank();
  section("MODE 3 — the wrong branch: the swapped value enters a truthiness test");

  js('auditLog("disk full", true)   — intended');
  detonate("log", () => auditLog("disk full", true));
  js('auditLog(true, "disk full")   — swapped');
  detonate("log", () => auditLog(true, "disk full"));
  note(
    'VERBOSE: true. Every non-empty string is truthy, so `"disk full"` chose ' +
      "the verbose branch and the message became the boolean. The log line is " +
      "syntactically fine and semantically empty.",
  );

  blank();
  js("the same swap with a falsy string");
  detonate('auditLog(true, "")', () => auditLog(true, ""));
  note(
    "`true` — the message is now the literal boolean and the verbose flag is " +
      "an empty string. Which branch you get depends on the CONTENT of the " +
      "misplaced value, so the bug is intermittent.",
  );

  blank();
  section("MODE 4 — a plausible answer, and this is the dangerous one");

  js("applyDiscount(12950, 500)   — intended: subtotal minus discount");
  detonate("total", () => applyDiscount(12_950, 500));
  js("applyDiscount(500, 12950)   — swapped");
  detonate("total", () => applyDiscount(500, 12_950));
  note(
    "-12450. A number. It will be formatted as currency, stored, summed, and " +
      "reported. No NaN, no [object Object], no wrong branch, no exception — " +
      "just a wrong number that looks exactly like a right one.",
  );

  blank();
  js("and the version that does not even look wrong");
  detonate("applyDiscount(1000, 900)", () => applyDiscount(1_000, 900));
  detonate("applyDiscount(900, 1000)", () => applyDiscount(900, 1_000));
  note(
    "100 versus -100. Both are plausible amounts. Nothing about either output " +
      "identifies which one came from the swapped call.",
  );

  blank();
  section("The four modes, ranked by how likely you are to notice");
  table(
    ["mode", "produced by", "visible symptom", "chance of being noticed"],
    [
      ["3 — wrong branch", "truthiness test", "wrong behaviour, no output clue", "low"],
      ["4 — plausible value", "same-typed operands", "**none**", "**effectively zero**"],
      ["2 — [object Object]", "string context", "visible garbage in output", "medium"],
      ["1 — NaN", "arithmetic", "visible NaN in output", "medium"],
      ["— crash", "member access on the wrong type", "a stack trace", "high"],
    ],
  );
  note(
    "Sorted this way the lesson is uncomfortable: the modes that CRASH are the " +
      "friendly ones. The mode that silently returns a plausible number is the " +
      "one that reaches production and stays there — and it is exactly the mode " +
      "produced by the swaps TypeScript cannot see. Demo 04.",
  );
}
