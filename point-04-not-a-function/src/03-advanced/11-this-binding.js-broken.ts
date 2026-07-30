// @ts-nocheck
/**
 * 11-this-binding — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A settings object whose `scale` method reads `this.multiplier`. Extracting
 * the method and calling it on its own — a very natural thing to do when
 * passing "a function" around (as a callback, into `.map`, as an event
 * handler) — silently detaches it from the object it was defined on.
 *
 * DOMAIN: a unit-conversion helper used both as a method and passed around
 * as a plain callback.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

const calculator = {
  multiplier: 2,
  scale(n) {
    return n * this.multiplier;
  },
};

export function runBroken(): void {
  section("Calling scale() AS A METHOD — this is bound correctly");

  js("calculator.scale(21)");
  detonate("calculator.scale(21)", () => calculator.scale(21));

  blank();
  section("Extracting scale and passing it around as a plain callback");

  // A very ordinary refactor: "I just need the function, not the whole
  // object" — e.g. to hand it to Array.prototype.map.
  const scale = calculator.scale;

  js("const scale = calculator.scale; scale(21)");
  detonate("scale(21) — called detached from calculator", () => scale(21));
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'multiplier')",
    "ES module code runs in strict mode, so calling 'scale' as a plain " +
      "function (not as 'calculator.scale(...)') leaves 'this' as " +
      "'undefined' inside the function body — 'this.multiplier' then fails " +
      "before 'scale' can even finish computing a result. The SAME root " +
      "cause as every other demo in this project — code assuming an implicit " +
      "context/value is present without it ever being checked — just " +
      "surfacing one property-read earlier than a direct '... is not a " +
      "function' would.",
  );

  blank();
  table(
    ["call form", "this inside scale()", "outcome"],
    [
      ["calculator.scale(21)", "calculator", "returns 42"],
      ["scale(21) (detached)", "undefined (strict mode)", "TypeError"],
    ],
  );
  note(
    "[21].map(calculator.scale) has the EXACT same bug — array methods " +
      "invoke callbacks as plain functions, silently detaching 'this' the " +
      "same way this example does explicitly.",
  );
}
