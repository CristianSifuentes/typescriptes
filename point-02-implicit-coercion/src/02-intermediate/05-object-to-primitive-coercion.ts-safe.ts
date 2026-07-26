/**
 * 05-object-to-primitive-coercion — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `+`'s typing rule (demo 01) is "number+number -> number, OR at least one
 * side is `string` -> string". That second branch is UNCONDITIONAL on the
 * other operand's type — which produces a genuine, important asymmetry:
 *
 *   [] + []            -> REJECTED (TS2365): neither side is string/number
 *   "[" + event + metadata -> ACCEPTED, typed `string`: one side IS a string
 *
 * So `array + array` is caught, but `string + plainObject` is NOT — the
 * `+ string` branch does not care whether the other operand has a sensible
 * `toString()`. This is one of this project's few genuine LIMITS, not a
 * bug in the checker: refusing `string + T` for every object type `T`
 * would also refuse `"total: " + count` where `count` later turns out to be
 * a `Money` class with a well-designed `toString()` — a legitimate pattern
 * the checker has no static way to distinguish from the "[object Object]" case.
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
  // 1. THE LOG-LINE BUG — A GENUINE GAP, STATED HONESTLY
  // =========================================================================
  section("Building a log line: the object still disappears silently");

  interface OrderMetadata {
    readonly orderId: string;
    readonly total: number;
  }

  function buildLogLineBroken(orderEvent: string, metadata: OrderMetadata): string {
    ts('"[" + orderEvent + "] " + metadata   -- COMPILES. No error at all.');
    return "[" + orderEvent + "] " + metadata;
  }
  warn(
    "No TS2365 here, and none is coming: the RIGHT operand of the final `+` " +
      "is `OrderMetadata`, but the LEFT operand at that point is already " +
      "`string` (`\"[\" + orderEvent + \"] \"`), so the unconditional " +
      "'string + anything -> string' branch fires. TypeScript's `+` rule was " +
      "never designed to ask 'does this object have a MEANINGFUL toString?' " +
      "— only 'is either side a string?'.",
  );
  detonate(
    "log line",
    () => buildLogLineBroken("order.created", { orderId: "ORD-42", total: 59.97 }),
  );
  note(
    '"[object Object]" — identical to the JavaScript version. This is a real, ' +
      "documented limit (see the explanation file), not a demo bug.",
  );

  blank();
  function buildLogLineSafe(orderEvent: string, metadata: OrderMetadata): string {
    return `[${orderEvent}] ${JSON.stringify(metadata)}`;
  }
  good('buildLogLineSafe: the metadata is explicitly, intentionally serialized.');
  detonate(
    "log line",
    () => buildLogLineSafe("order.created", { orderId: "ORD-42", total: 59.97 }),
  );

  // =========================================================================
  // 2. ARRAYS: THE SAME RULE, A DIFFERENT-LOOKING OPERAND
  // =========================================================================
  blank();
  section("`[] + []`, `[] + {}` — the identical TS2365 rule, wider operands");

  ts("[] + []");
  // @ts-expect-error TS2365: Operator '+' cannot be applied to types 'never[]' and 'never[]'.
  const bothEmpty = [] + [];
  void bothEmpty;

  ts("[1, 2] + [3, 4]");
  // @ts-expect-error TS2365: Operator '+' cannot be applied to types 'number[]' and 'number[]'.
  const numberArrays = [1, 2] + [3, 4];
  void numberArrays;
  compilerSays(
    "TS2365",
    "Operator '+' cannot be applied to types 'number[]' and 'number[]'.",
    "In JavaScript this silently joins into \"1,23,4\" — a string that LOOKS " +
      "like it could be a malformed number. TypeScript refuses the array-" +
      "array combination outright: arrays are never accepted as `+` operands " +
      "against each other.",
  );

  blank();
  section("The explicit, intentional version");
  const joined: string = [1, 2].join(",") + "," + [3, 4].join(",");
  proveType<string>()(joined, "string", "Array.prototype.join is the named, explicit operation");
  detonate("joined", () => joined);
  good('"1,2,3,4" — reached through a method whose NAME says what it does.');

  // =========================================================================
  // 3. THE EXCEPTION THAT PROVES THE RULE: `Date`
  // =========================================================================
  blank();
  section("`Date + string` compiles — because the RIGHT side is already string");

  const createdAt = new Date("2024-01-01T00:00:00Z");
  ts('createdAt + " (created)"');
  const humanReadable = createdAt + " (created)";
  proofBlock('the type of `createdAt + " (created)"`');
  proveType<string>()(humanReadable, "string", "the string-operand branch of + fires regardless of the left type");
  warn(
    "No error, and there should be none: the `+ string` branch of the rule " +
      "applies no matter what the OTHER operand is, so this is legal for the " +
      "same reason `42 + \"\"` is legal. It happens to read nicely here only " +
      "because `Date.prototype.toString()` is a sensible, human-authored format.",
  );

  blank();
  ts("+createdAt   -- unary plus: ToNumber, not ToPrimitive(hint:\"default\")");
  const timestamp = +createdAt;
  proveType<number>()(timestamp, "number", "unary + always numerifies, even for objects with a custom toString");
  note(
    "Same `Date`, opposite outcome, because unary `+` requests hint " +
      '"number" — which makes `Date` try `valueOf()` (the epoch millisecond ' +
      "count) FIRST, unlike binary `+`'s hint \"default\".",
  );

  // =========================================================================
  // 4. THE RULE TABLE, NOW INCLUDING OBJECT OPERANDS
  // =========================================================================
  blank();
  section("The `+` rule, extended to object types");
  table(
    ["left", "right", "TypeScript verdict"],
    [
      ["never[] (`[]`)", "never[] (`[]`)", "TS2365 — neither side is string/number"],
      ["number[]", "number[]", "TS2365 — same reason"],
      ["{ ... } (plain object)", "{ ... } (plain object)", "TS2365 — same reason"],
      ["string", "{ ... } (plain object)", "accepted — string branch fires unconditionally"],
      ["Date", "string", "accepted — string branch fires unconditionally"],
      ["Date (unary +)", "n/a", "accepted — unary + always requests ToNumber"],
    ],
  );
  note(
    "The pattern: `+` is rejected only when NEITHER side is string/number/" +
      "bigint. The moment one side is `string`, the rule stops looking at the " +
      "other operand's type at all — which is what catches array+array but " +
      "misses string+object.",
  );
}
