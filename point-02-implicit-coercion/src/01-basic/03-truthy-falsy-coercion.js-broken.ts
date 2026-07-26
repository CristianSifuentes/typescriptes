// @ts-nocheck
/**
 * 03-truthy-falsy-coercion — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * Every `if`, `while`, ternary condition, and `&&`/`||` short-circuit runs
 * the `ToBoolean` abstract operation on its operand. `ToBoolean` checks
 * membership in a FIXED, FINITE list of eight falsy values:
 *
 *     false, 0, -0, 0n, NaN, "", null, undefined
 *
 * Everything else — including EVERY object, `[]` and `{}` included — is
 * truthy. The bug is not that the rule is complicated; it is that three of
 * those eight values (`0`, `""`, `NaN`) are ORDINARY, VALID data a program
 * legitimately produces, and `ToBoolean` cannot tell "zero, meaning empty"
 * from "zero, meaning a real quantity of zero".
 *
 * DOMAIN: an inventory and form-validation system where legitimate falsy
 * values (a stock count of 0, a discount of 0%, an empty-but-valid string)
 * collide with "this field was never set".
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

export function runBroken(): void {
  section("The fixed list of eight falsy values");
  table(
    ["value", "typeof", "ToBoolean"],
    [
      ["false", "boolean", "false"],
      ["0", "number", "false"],
      ["-0", "number", "false"],
      ["0n", "bigint", "false"],
      ["NaN", "number", "false"],
      ['""', "string", "false"],
      ["null", "object", "false"],
      ["undefined", "undefined", "false"],
      ["[]", "object", "TRUE — arrays are objects, contents are irrelevant"],
      ["{}", "object", "TRUE — same reason"],
      ['"0"', "string", "TRUE — a NON-EMPTY string, even though it reads as zero"],
    ],
  );

  blank();
  section("Bug 1 — a real stock count of zero is treated as 'unset'");

  function describeStock(itemsInStock) {
    // The classic mistake: `||` falls through on ANY falsy left side.
    return itemsInStock || "quantity not yet counted";
  }

  js("describeStock(0)  — the warehouse counted the shelf: it is genuinely empty");
  detonate("describeStock(0)", () => describeStock(0));
  note(
    '"quantity not yet counted" — WRONG. Zero is a real, valid count. The `||` ' +
      "cannot distinguish 'falsy because unset' from 'falsy because the " +
      "legitimate value happens to be falsy'.",
  );

  blank();
  section("Bug 2 — an empty (but valid) note field disappears");

  function describeOrderNote(note) {
    if (note) {
      return `Note: ${note}`;
    }
    return "No note attached";
  }

  js('describeOrderNote("")  — customer explicitly cleared the note field');
  detonate('describeOrderNote("")', () => describeOrderNote(""));

  blank();
  section("Bug 3 — a failed calculation (NaN) silently passes an `if`");

  function applyDiscountIfAny(price, discountPercent) {
    // discountPercent came from a bad parse upstream and is now NaN
    if (discountPercent) {
      return price - price * (discountPercent / 100);
    }
    return price;
  }

  js('applyDiscountIfAny(100, NaN)  — NaN is falsy, so the branch is (correctly) skipped');
  detonate("applyDiscountIfAny(100, NaN)", () => applyDiscountIfAny(100, NaN));
  note(
    "This one happens to 'work' by accident — NaN being falsy skips the bad " +
      "math. Relying on that is fragile: rewrite the condition as `discountPercent > 0` " +
      "and this accidental safety net vanishes.",
  );

  blank();
  section("Objects are ALWAYS truthy — contents never matter");
  detonate("Boolean([])", () => Boolean([]));
  detonate("Boolean({})", () => Boolean({}));
  detonate('Boolean(new Boolean(false))', () => Boolean(new Boolean(false)));
  note(
    "`new Boolean(false)` is an OBJECT wrapping `false`. It is still truthy — " +
      "the box, not its contents, is what `ToBoolean` inspects.",
  );
}
