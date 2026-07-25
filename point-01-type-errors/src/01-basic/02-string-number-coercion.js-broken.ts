// @ts-nocheck
/**
 * 02-coercion — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * THE CLASSIC: `"5" - 3` versus `"5" + 3`.
 *
 * This is the most famous demonstration of implicit coercion, and it is famous
 * for a precise reason: the two expressions differ by ONE CHARACTER and behave
 * according to two completely different algorithms.
 *
 *   "5" - 3   → 2       ToNumber("5") = 5, then numeric subtraction
 *   "5" + 3   → "53"    one operand is a string, so `+` concatenates
 *
 * Both are legal JavaScript. Neither warns. The bug is that you get the
 * *arithmetic* answer often enough to stop worrying about it.
 *
 * DOMAIN: an inventory service reconciling stock levels, where quantities
 * arrive from a CSV import (strings) and from an internal counter (numbers).
 *
 * WHAT GOES WRONG, AND WHEN:
 *   `onHand + incoming`   → "1005" instead of 105. No error, at any point.
 *   `onHand - reserved`   → works! coercion succeeds, hiding the type problem.
 *   `[] + {}`             → "[object Object]". Still no error.
 *   sorting mixed values  → lexicographic nonsense. Still no error.
 * The reconciliation report is wrong and nothing, anywhere, complains.
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

/** A CSV row, i.e. every field is a string. This is not a strawman: it is CSV. */
function readStockCsvRow() {
  return { sku: "WIDGET-1", incoming: "5", damaged: "2" };
}

export function runBroken(): void {
  section("The one-character difference");

  const row = readStockCsvRow();
  const onHand = 100; // from the internal counter — a real number

  js('the same operand pair, four operators');
  table(
    ["expression", "algorithm JavaScript picks", "result", "type of result", "warned?"],
    [
      ['"5" + 3', "string concatenation (`+` is overloaded)", '"53"', "string", "no"],
      ['"5" - 3', "ToNumber, then subtraction", "2", "number", "no"],
      ['"5" * 3', "ToNumber, then multiplication", "15", "number", "no"],
      ['"5" / 3', "ToNumber, then division", "1.666…", "number", "no"],
    ],
  );
  note(
    "Only `+` is overloaded. Every other arithmetic operator has a single, " +
      "numeric meaning and therefore coerces. That asymmetry is the trap: three " +
      "of the four operators 'work', so `+` feels like the anomaly rather than " +
      "the rule.",
  );

  blank();
  section("The trap in production code");

  js(`onHand (${onHand}, number) + incoming ("${row.incoming}", string)`);
  const total = onHand + row.incoming;
  detonate("total", () => total);
  note("Expected 105 units of stock. Recorded 1005. The warehouse is now wrong.");

  blank();
  js(`onHand (${onHand}) - damaged ("${row.damaged}")`);
  const usable = onHand - row.damaged;
  detonate("usable", () => usable);
  note(
    "This one is CORRECT — 98 — and that is precisely why the bug survives code " +
      "review. Subtraction coerces successfully, so the developer concludes the " +
      "CSV values are 'basically numbers'. They are not.",
  );

  blank();
  section("Coercion has no floor");

  detonate('"5" - "3"', () => "5" - "3");
  detonate('"5" + "3"', () => "5" + "3");
  detonate('"five" - 3', () => "five" - 3);
  detonate("[] + {}", () => [] + {});
  detonate("[] + []", () => [] + []);
  detonate("1 + null", () => 1 + null);
  detonate("1 + undefined", () => 1 + undefined);
  detonate('"" + true', () => "" + true);
  detonate("[10, 9, 100].sort()", () => [10, 9, 100].sort());
  note(
    "`[10, 9, 100].sort()` returns [10, 100, 9]: Array.prototype.sort coerces " +
      "elements to strings by default. Same family of bug, different disguise.",
  );

  blank();
  section("Why this class of bug is so expensive");
  table(
    ["property", "consequence"],
    [
      ["No exception", "no stack trace, no alert, no error budget consumed"],
      ["Plausible output", '"1005" looks like a number in a log line'],
      ["Delayed detection", "found during a stock audit, weeks later"],
      ["Corrupted persistence", "the wrong value is already in the database"],
      ["Untestable by luck", "a test with `-` instead of `+` would pass"],
    ],
  );
}
