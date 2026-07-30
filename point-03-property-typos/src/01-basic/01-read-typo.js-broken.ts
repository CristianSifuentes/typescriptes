// @ts-nocheck
/**
 * 01-read-typo — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * The canonical typo: `user.nam` instead of `user.name`. In JavaScript this
 * is not a syntax error, not a runtime error, not even a warning — it is a
 * perfectly legal property read that evaluates to `undefined`, because
 * reading an absent key is legal by definition in a language where objects
 * are open hash maps with no declared domain.
 *
 * DOMAIN: rendering a user profile card.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function loadUser() {
  return {
    id: "u-501",
    name: "Ada Lovelace",
    email: "ada@example.com",
  };
}

export function runBroken(): void {
  const user = loadUser();

  section("Reading a misspelled property");

  js("user.nam  — the field is called 'name'");
  detonate("user.nam", () => user.nam);
  note("undefined. Legal. Silent. The typo is now a value, indistinguishable from a real absence.");

  blank();
  js('`Welcome, ${user.nam}!`  — building UI text from it');
  detonate("welcome message", () => `Welcome, ${user.nam}!`);
  runtimeSays(
    "no error at all",
    'Every visitor sees "Welcome, undefined!". Nothing threw, nothing logged — ' +
      "the bug shipped and nobody was paged.",
  );

  blank();
  js("user.nam.toUpperCase()  — one operation further downstream");
  detonate("user.nam.toUpperCase()", () => user.nam.toUpperCase());
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'toUpperCase')",
    "THIS is where the bug finally becomes visible — not at the typo, but at " +
      "the first place code assumed the typo's result was a usable string. In " +
      "a real app that could be a different file, a different team, days later.",
  );

  blank();
  section("The distance between cause and symptom");
  table(
    ["expression", "outcome", "who notices", "when"],
    [
      ["user.nam", "undefined", "nobody", "never"],
      ["`Welcome, ${user.nam}!`", '"Welcome, undefined!"', "the user, maybe", "immediately, silently"],
      ["user.nam.toUpperCase()", "TypeError", "on-call engineer", "whenever that code path runs"],
    ],
  );
  note(
    "Three lines, three different outcomes, from the SAME typo. The typo itself " +
      "never produces an error — only what happens to touch its undefined value.",
  );
}
