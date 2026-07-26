// @ts-nocheck
/**
 * 04-loose-vs-strict-equality — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * `==` runs the Abstract Equality Comparison Algorithm, which coerces
 * operands of different types before comparing. `===` runs the Strict
 * Equality Comparison Algorithm, which returns `false` immediately if the
 * types differ — no coercion is ever attempted.
 *
 * The bug is that `==`'s coercion rules are NOT TRANSITIVE:
 *
 *     "" == 0     → true
 *     0  == "0"   → true
 *     "" == "0"   → false      <- breaks the expectation that equality chains
 *
 * DOMAIN: an authorization check comparing a user-supplied role/ID field
 * (often arriving as a string from a query param or a form) against an
 * internal numeric or boolean flag.
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

export function runBroken(): void {
  section("The matrix every JavaScript developer has been burned by");
  table(
    ["left", "right", "== result", "why (informally)"],
    [
      ['""', "0", "true", 'ToNumber("") is 0'],
      ["0", '"0"', "true", 'ToNumber("0") is 0'],
      ['""', '"0"', "false", "both strings: compared WITHOUT coercion, and they differ"],
      ["null", "undefined", "true", "special-cased by the spec, exclusively for each other"],
      ["null", "0", "false", "null coerces with NO type except undefined"],
      ["null", "false", "false", "same reason"],
      ["undefined", "0", "false", "same reason, for undefined"],
      ["false", "0", "true", 'ToNumber(false) is 0'],
      ["false", '""', "true", 'ToNumber(false) is 0, ToNumber("") is 0'],
      ['"\\t\\n "', "0", "true", "whitespace-only string coerces to 0"],
      ["[]", "0", "true", "ToPrimitive([]) is \"\", then \"\" == 0"],
      ["[]", "![]", "true", "the classic: ![] is false, [] == false, so [] == false is true"],
      ["NaN", "NaN", "false", "NaN is never equal to anything, including itself"],
    ],
  );

  blank();
  section("Why it breaks transitivity — a live check");
  const a = "";
  const b = 0;
  const c = "0";
  js(`a = ""; b = 0; c = "0"`);
  detonate("a == b", () => a == b);
  detonate("b == c", () => b == c);
  detonate("a == c", () => a == c);
  note(
    "a == b and b == c are both true. A transitive relation would require " +
      "a == c to also be true. It is false. `==` is not a consistent notion " +
      "of 'sameness' — it is a per-pair lookup table.",
  );

  blank();
  section("The bug in a realistic authorization check");
  function isAdminRequest(roleParam) {
    // roleParam arrives from `req.query.role`, which is ALWAYS a string —
    // but the internal constant being compared against is a number, because
    // roles are stored as numeric levels (0 = guest, 1 = admin) in the DB.
    const ADMIN_LEVEL = 1;
    return roleParam == ADMIN_LEVEL;
  }

  js('isAdminRequest("1")   — the string the query param actually sends');
  detonate('isAdminRequest("1")', () => isAdminRequest("1"));
  note("true — this happens to be correct, and THAT is what hides the bug.");

  js('isAdminRequest("1 ")  — a trailing space, e.g. from a copy-pasted URL');
  detonate('isAdminRequest("1 ")', () => isAdminRequest("1 "));
  note('Still true — ToNumber trims whitespace. Also "correct" by luck.');

  js('isAdminRequest("01") — a zero-padded value from a different client');
  detonate('isAdminRequest("01")', () => isAdminRequest("01"));
  note("Still true. Every one of these 'happens to work', which is exactly why nobody notices when it eventually does not.");
}
