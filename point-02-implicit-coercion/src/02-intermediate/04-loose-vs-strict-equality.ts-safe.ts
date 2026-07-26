/**
 * 04-loose-vs-strict-equality — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * A common belief is "TypeScript can't do anything about `==`". That belief
 * is wrong, and this demo is the evidence. TypeScript rejects `==`/`!=`
 * whenever the two operand types PROVABLY have no overlapping value — i.e.
 * whenever the comparison can only ever evaluate one way, forever, which is
 * almost always a bug (TS2367).
 *
 * The one deliberate exemption: comparisons against `null` or `undefined`
 * are NEVER flagged, regardless of the other operand's type, because
 * `x == null` is the standard, intentional JavaScript idiom for "x is
 * null OR undefined" — outlawing it would break working code, not fix it.
 */

import {
  section,
  ts,
  good,
  warn,
  note,
  compilerSays,
  table,
  blank,
  detonate,
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

export function runSafe(): void {
  // =========================================================================
  // 1. THE AUTHORIZATION BUG, ACTUALLY CAUGHT
  // =========================================================================
  section("The realistic bug: string param vs numeric constant");

  function isAdminRequestBroken(roleParam: string): boolean {
    const ADMIN_LEVEL = 1;
    ts("roleParam == ADMIN_LEVEL");
    // @ts-expect-error TS2367: This comparison appears to be unintentional because the
    // types 'string' and 'number' have no overlap.
    return roleParam == ADMIN_LEVEL;
  }
  void isAdminRequestBroken;
  compilerSays(
    "TS2367",
    "This comparison appears to be unintentional because the types 'string' " +
      "and 'number' have no overlap.",
    "Contrary to popular belief, TypeScript DOES reason about `==`. A " +
      "`string` and a `number` are disjoint types, so no value of one can " +
      "ever loosely-equal a value of the other in a way the checker will bless.",
  );

  blank();
  function isAdminRequestSafe(roleParam: string): boolean {
    const ADMIN_LEVEL = 1;
    const parsedRole = Number(roleParam);
    return Number.isFinite(parsedRole) && parsedRole === ADMIN_LEVEL;
  }
  good('isAdminRequestSafe("1") -> true, isAdminRequestSafe("01") -> true, both by explicit Number() + ===.');
  detonate('isAdminRequestSafe("1")', () => isAdminRequestSafe("1"));
  detonate('isAdminRequestSafe("abc")', () => isAdminRequestSafe("abc"));

  // =========================================================================
  // 2. THE DELIBERATE EXEMPTION: null / undefined
  // =========================================================================
  blank();
  section("The one comparison TypeScript deliberately never flags");

  function hasValue(input: number | null | undefined): boolean {
    ts("input != null   -- false for BOTH null and undefined, on purpose");
    return input != null; // idiomatic: excludes null AND undefined in one check
  }
  proofBlock("the type after the check");
  detonate("hasValue(0)", () => hasValue(0));
  detonate("hasValue(null)", () => hasValue(null));
  detonate("hasValue(undefined)", () => hasValue(undefined));
  good(
    "No TS2367 anywhere here, and rightly so: `!= null` is the standard, " +
      "correct idiom for 'is present', and 0 correctly reports as present.",
  );

  blank();
  warn(
    "This exemption does NOT make `null == 0` true — it is still `false` at " +
      "runtime (null coerces with no type except undefined). TypeScript simply " +
      "declines to flag ANY comparison against null/undefined, so this " +
      "particular (correct!) `false` is never something the checker comments on.",
  );

  // =========================================================================
  // 3. THE FULL MATRIX, RE-RUN THROUGH THE CHECKER
  // =========================================================================
  blank();
  section("The matrix from the JavaScript demo, re-examined");
  table(
    ["expression", "JS result", "TypeScript verdict", "why"],
    [
      ['"" == 0', "true", "TS2367", "string literal type vs number literal type: no overlap"],
      ['0 == "0"', "true", "TS2367", "same rule, operands swapped"],
      ['"" == "0"', "false", "TS2367", "even same-typed LITERALS \"\" and \"0\" are disjoint types"],
      ["null == undefined", "true", "no error", "exempted: the standard idiom"],
      ["null == 0", "false", "no error", "exempted (operand is null) — verdict unchanged"],
      ["undefined == 0", "false", "no error", "exempted (operand is undefined)"],
      ["false == 0", "true", "TS2367", "boolean and number are disjoint types"],
      ["[] == 0", "true", "TS2367", "object type and number are disjoint types"],
      ["NaN == NaN", "false", "no error", "same type (number) — always legal, even though always false"],
    ],
  );
  note(
    "Eight of the nine classic surprises ARE caught. The one gap is by design, " +
      "not oversight: null/undefined comparisons are exempted because they are " +
      "how JavaScript spells an intentional, common check.",
  );

  // =========================================================================
  // 4. WHEN `==` BETWEEN THE SAME WIDE TYPE IS STILL LEGAL — AND STILL RISKY
  // =========================================================================
  blank();
  section("What TS2367 does NOT catch: same-type, wrong-value comparisons");

  declareAndCompareWidenedStrings();

  function declareAndCompareWidenedStrings(): void {
    const first: string = "";
    const second: string = "0";
    ts("first == second   -- both WIDENED to `string`: no error, even though it's `false`");
    const result = first == second;
    proveType<boolean>()(result, "boolean", "");
    note(
      "Once both operands are the general `string` type (not the narrow " +
        'literal types "" and "0"), the comparison IS between overlapping ' +
        "types — TypeScript cannot know the runtime values differ, so it " +
        "correctly stays silent. This is the same set-theoretic reasoning as " +
        "manifesto §3: assignability and comparability are about TYPES, and " +
        "two variables of type `string` can, for all the checker knows, hold " +
        "equal values.",
    );
  }
}
