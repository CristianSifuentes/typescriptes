// @ts-nocheck
/**
 * 03-nonexistent-method — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * `(5).toUpperCase()` → TypeError: 5.toUpperCase is not a function
 *
 * WHY IT HAPPENS, precisely:
 * JavaScript resolves a member access by walking the *prototype chain* of the
 * receiver AT THE MOMENT OF THE CALL. `5` is boxed to a `Number` object, the
 * engine looks for `toUpperCase` on `Number.prototype`, then `Object.prototype`,
 * finds nothing, and yields `undefined`. Then it tries to call `undefined`.
 *
 * Notice the two-step failure. Step one — the lookup — SUCCEEDS, in the sense
 * that it produces a value: `undefined`. Only step two, the call, throws. That
 * gap is where the entire family of "property is undefined" bugs lives:
 *
 *     user.emailAdress          → undefined, no error   (typo)
 *     user.emailAdress.trim()   → TypeError, one line later
 *
 * The property read is ALWAYS legal in JavaScript. Objects are open; there is
 * no such thing as an absent property, only a property whose value is
 * `undefined`. Which is why the error, when it comes, points at the innocent
 * `.trim()` rather than at the misspelled word.
 *
 * DOMAIN: a notification service formatting a user's display name and plan.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function loadUserRecord() {
  return {
    id: 90210,
    email: "ada@example.com",
    displayName: "Ada Lovelace",
    loyaltyPoints: 1420,
  };
}

export function runBroken(): void {
  section("The canonical case");

  js("(5).toUpperCase()");
  detonate("(5).toUpperCase()", () => (5).toUpperCase());
  runtimeSays(
    "TypeError: 5.toUpperCase is not a function",
    "Prototype-chain lookup found nothing, produced `undefined`, and the call " +
      "on `undefined` threw. The lookup itself was never an error. (Engines " +
      "word this differently — V8 says `5.toUpperCase is not a function`, " +
      "other runtimes say `(intermediate value).toUpperCase`. The message is " +
      "an implementation detail; the absence of a compile-time check is not.)",
  );

  blank();
  js("the lookup, without the call — this does NOT throw");
  detonate("(5).toUpperCase", () => (5).toUpperCase);
  note(
    "`undefined`, silently. THIS is the real defect; the TypeError is only its " +
      "symptom, and it can occur arbitrarily far away.",
  );

  blank();
  section("The same mechanism in ordinary application code");

  const user = loadUserRecord();

  js("user.id.toUpperCase()  — id is a number, not a string");
  detonate("user.id.toUpperCase()", () => user.id.toUpperCase());

  blank();
  js("user.emailAdress  — one transposed letter");
  detonate("user.emailAdress", () => user.emailAdress);
  note("undefined. No error. The typo is now a value flowing through your system.");

  blank();
  js("user.emailAdress.trim()  — the symptom finally surfaces");
  detonate("user.emailAdress.trim()", () => user.emailAdress.trim());
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'trim')",
    "The most common runtime error in the JavaScript ecosystem. Its cause is " +
      "on a different line from its report — usually a different file.",
  );

  blank();
  js("user.displayName.trimm()  — a misspelled method on the right type");
  detonate("user.displayName.trimm()", () => user.displayName.trimm());

  blank();
  js("template interpolation hides the corruption entirely");
  detonate(
    "greeting",
    () => `Hi ${user.emailAdress}, you have ${user.loyaltyPoints} points`,
  );
  note(
    "String interpolation calls ToString on `undefined`, producing the literal " +
      'text "undefined". The email goes out. The customer reads it.',
  );

  blank();
  section("Failure taxonomy");
  table(
    ["expression", "lookup result", "outcome", "distance from defect"],
    [
      ["(5).toUpperCase", "undefined", "no error", "—"],
      ["(5).toUpperCase()", "undefined", "TypeError", "same line"],
      ["user.emailAdress", "undefined", "no error", "—"],
      ["user.emailAdress.trim()", "undefined", "TypeError", "1+ lines, often 1+ files"],
      ["`Hi ${user.emailAdress}`", "undefined", '"Hi undefined" sent to a human', "never detected"],
    ],
  );
  note(
    "The worst row is the last one: it never throws, so no monitoring system " +
      "will ever page you about it.",
  );
}
