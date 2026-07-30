// @ts-nocheck
/**
 * 03-wrong-type-method — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A method that genuinely exists — just not on the receiver's actual type.
 * `.toUpperCase()` is real, well-documented, callable — on `String.prototype`.
 * A `number` has no such method. This is subtly different from demo 02's
 * typo: there is no misspelling anywhere; the method name is spelled
 * perfectly. The mistake is entirely about WHICH type the value belongs to.
 *
 * DOMAIN: formatting a product's inventory count for a receipt, where a
 * refactor accidentally passed the numeric count where a formatted string
 * was expected.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function shout(value) {
  return value.toUpperCase();
}

export function runBroken(): void {
  section("A real method, called on the wrong kind of value");

  js("(5).toUpperCase()  — toUpperCase is real, but not on numbers");
  detonate("(5).toUpperCase()", () => (5).toUpperCase());
  runtimeSays(
    "TypeError: 5.toUpperCase is not a function",
    "Same failure shape as every other demo in this level: the engine " +
      "resolved '.toUpperCase' against Number.prototype (and its chain), " +
      "found nothing, got undefined, then tried to call it.",
  );

  blank();
  section("The realistic version: a value of the wrong type reaches a formatter");

  const inventoryCount = 42; // a NUMBER, not the formatted string callers expect
  js("shout(inventoryCount)  — shout() expects a string-like value");
  detonate("shout(inventoryCount)", () => shout(inventoryCount));
  runtimeSays(
    "TypeError: value.toUpperCase is not a function",
    "'shout' was written assuming its argument supports '.toUpperCase()'. " +
      "Nothing enforced that assumption — any caller can pass anything, " +
      "including a plain number, and the crash surfaces INSIDE 'shout', far " +
      "from the actual mistake (the caller passing the wrong value).",
  );

  blank();
  table(
    ["receiver", "method exists on...", "exists on the receiver's type?", "outcome"],
    [
      ["\"hello\" (string)", "String.prototype", "yes", "\"HELLO\""],
      ["5 (number)", "String.prototype", "no", "TypeError"],
      ["inventoryCount (number)", "String.prototype", "no", "TypeError, inside shout()"],
    ],
  );
}
