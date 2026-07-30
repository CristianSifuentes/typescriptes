// @ts-nocheck
/**
 * 03-wrong-type-argument — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A function with the RIGHT number of arguments can still be called
 * completely wrong: JavaScript never checks that each argument's TYPE
 * matches what the function actually needs at that position. Arithmetic and
 * string operations then quietly coerce instead of failing.
 *
 * DOMAIN: an invoice line-item calculator.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function lineItemTotal(unitPrice, quantity) {
  return unitPrice * quantity;
}

export function runBroken(): void {
  section("Calling with two numbers — the intended shape");

  js("lineItemTotal(19.99, 3)");
  detonate("lineItemTotal(19.99, 3)", () => lineItemTotal(19.99, 3));

  blank();
  section("Calling with the arguments in the right COUNT, wrong TYPE");

  // 'quantity' arrives as a string here — maybe read straight from a form
  // input's .value, never parsed to a number.
  js('lineItemTotal(19.99, "3")');
  detonate('lineItemTotal(19.99, "3")', () => lineItemTotal(19.99, "3"));
  runtimeSays(
    "(no crash — silently WRONG, not even NaN this time)",
    "'*' coerces its string operand to a number when the string LOOKS " +
      "numeric, so 19.99 * \"3\" happens to equal 59.97 — the same answer " +
      "as the correct call. The bug is invisible here and would only " +
      "surface with a non-numeric string, e.g. quantity = \"3 units\".",
  );

  js('lineItemTotal(19.99, "3 units")');
  detonate('lineItemTotal(19.99, "3 units")', () => lineItemTotal(19.99, "3 units"));
  runtimeSays(
    "NaN",
    "The SAME kind of mistake (a string where a number belongs) produces " +
      "a DIFFERENT failure mode depending on the string's exact content — " +
      "sometimes a coincidentally correct number, sometimes 'NaN'. Neither " +
      "outcome is caught at the call site.",
  );

  blank();
  table(
    ["quantity argument", "type", "lineItemTotal(19.99, quantity)"],
    [
      ["3", "number", "59.97 — correct"],
      ['"3"', "string, numeric-looking", "59.97 — coincidentally correct"],
      ['"3 units"', "string, non-numeric", "NaN"],
    ],
  );
}
