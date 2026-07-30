// @ts-nocheck
/**
 * 02-misspelled-method — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * `"hello".toUpperCasee()` — one extra 'e'. This looks like Concept #3
 * (a property typo), and it starts that way: the member-resolution walk
 * fails to find 'toUpperCasee' anywhere on the prototype chain, so the
 * property read yields `undefined`. But this demo is about what happens
 * ONE step further: the code doesn't stop at reading the typo'd member, it
 * immediately tries to CALL it — turning a silent `undefined` into an
 * immediate crash.
 *
 * DOMAIN: normalising a user-entered discount code before storing it.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function normalizeCode(code) {
  return code.toUpperCasee(); // typo: should be toUpperCase
}

export function runBroken(): void {
  section("Reading the misspelled member first — Concept #3's failure");

  const code = "spring24";
  js('code.toUpperCasee  — read only, no call');
  detonate("code.toUpperCasee", () => code.toUpperCasee);
  note("undefined. Exactly like point-03: a typo'd property read is silent.");

  blank();
  section("...then calling it — Concept #4's failure begins here");

  js('code.toUpperCasee()  — the SAME expression, immediately invoked');
  detonate("code.toUpperCasee()", () => code.toUpperCasee());
  runtimeSays(
    "TypeError: code.toUpperCasee is not a function",
    "The property read still silently returns undefined — nothing about " +
      "THAT step changed. What's new is the '()' immediately after it: " +
      "undefined has no [[Call]] slot, so the engine throws right there.",
  );

  blank();
  section("Where this actually happens: normalizing a discount code");

  js("normalizeCode('spring24')");
  detonate("normalizeCode('spring24')", () => normalizeCode("spring24"));
  runtimeSays(
    "TypeError: code.toUpperCasee is not a function",
    "The crash is now one function call away from the typo. In a large " +
      "codebase, 'normalizeCode' might be called from a dozen places — " +
      "every one of them inherits this crash, and the stack trace points at " +
      "the CALL, not the misspelled method name.",
  );

  blank();
  table(
    ["expression", "step that fails", "outcome"],
    [
      ["code.toUpperCasee", "member resolution (Concept #3)", "undefined, silent"],
      ["code.toUpperCasee()", "invocation (Concept #4)", "TypeError, immediate"],
    ],
  );
}
