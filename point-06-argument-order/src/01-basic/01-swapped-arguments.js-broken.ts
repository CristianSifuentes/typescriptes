// @ts-nocheck
/**
 * 01-swapped-arguments — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * `// @ts-nocheck` switches the type checker off, leaving semantically plain
 * JavaScript. This is the baseline: the language as it behaves when nobody
 * checks the order of anything.
 *
 * THE CENTRAL FACT: a JavaScript call binds arguments to parameters BY POSITION
 * and by nothing else. Parameter names are local variables inside the body;
 * they do not exist at the call site. So
 *
 *     createUser("Ada", 25)   and   createUser(25, "Ada")
 *
 * are the SAME OPERATION applied to different values. Neither is more legal
 * than the other, and there is no runtime check of any kind.
 *
 * DOMAIN: user registration for a subscription service.
 *
 * WHAT GOES WRONG, AND WHEN:
 *   the call itself     → succeeds. Always. There is nothing to fail.
 *   the stored record   → { name: 25, age: "Ana" } — persisted, and now wrong
 *                         everywhere downstream.
 *   `age + 1`           → "Ana1" (string concatenation)
 *   `age >= 18`         → false ("Ana" >= 18 is false) — the adult check
 *                         silently rejects an adult
 *   `name.trim()`       → TypeError, eventually, in the rendering layer
 *
 * Note the shape: the crash, when it finally comes, is in a display function
 * that is entirely correct.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function createUser(name, age) {
  return { id: "u-1", name, age };
}

/** A downstream consumer, written correctly, that will receive the corruption. */
function eligibilityFor(user) {
  return user.age >= 18 ? "adult" : "minor";
}

/** A rendering function, also written correctly. This is where it finally dies. */
function renderProfile(user) {
  return `${user.name.trim()} (${user.age})`;
}

export function runBroken(): void {
  section("The call that should have failed, and did not");

  js('createUser("Ana", 25)   — the intended call');
  detonate("user", () => createUser("Ana", 25));

  blank();
  js("createUser(25, \"Ana\")   — the same call, arguments swapped");
  detonate("user", () => createUser(25, "Ana"));
  note(
    "No error. No warning. The function ran to completion and returned an " +
      "object. Binding is positional: `name` was bound to 25 and `age` to " +
      '"Ana", and JavaScript has no opinion about that.',
  );

  const good = createUser("Ana", 25);
  const bad = createUser(25, "Ana");

  blank();
  section("The corruption spreads, one silent step at a time");

  js("age + 1  — computing next year's age");
  detonate("correct", () => good.age + 1);
  detonate("swapped", () => bad.age + 1);
  note('"Ana1". `+` with a string operand concatenates. Still no error.');

  blank();
  js("age >= 18  — the adult eligibility check");
  detonate("correct", () => eligibilityFor(good));
  detonate("swapped", () => eligibilityFor(bad));
  note(
    '"minor". `"Ana" >= 18` coerces "Ana" to NaN, and every comparison with ' +
      "NaN is false. An adult was just classified as a minor, and the " +
      "comparison that did it looks perfectly reasonable.",
  );

  blank();
  js("JSON.stringify(user)  — what gets persisted");
  detonate("correct", () => JSON.stringify(good));
  detonate("swapped", () => JSON.stringify(bad));
  note(
    "The corrupt record is now in the database. Every future read of it is " +
      "wrong, including reads by code that has not been written yet.",
  );

  blank();
  js("renderProfile(user)  — the display layer, written correctly");
  detonate("correct", () => renderProfile(good));
  detonate("swapped", () => renderProfile(bad));
  runtimeSays(
    "TypeError: user.name.trim is not a function",
    "THE CRASH IS IN THE WRONG PLACE. `renderProfile` is flawless; it was " +
      "handed a record that was corrupted at a call site it has never heard " +
      "of, possibly in a different service, possibly weeks earlier.",
  );

  blank();
  section("Why review does not catch this either");
  table(
    ["property", "consequence"],
    [
      ["the call succeeds", "no exception, no alert, no error budget consumed"],
      ["output is plausible", '{ name: 25, age: "Ana" } looks like a record'],
      ["both calls look right", "`createUser(a, b)` vs `createUser(b, a)` — no visual cue"],
      ["corruption is persisted", "the bad value outlives the process that made it"],
      ["the crash is elsewhere", "the stack trace points at innocent code"],
    ],
  );
  note(
    "This is the profile of a bug that survives code review, unit tests, and " +
      "monitoring. The only defence that works is one that runs before the " +
      "code does.",
  );
}
