// @ts-nocheck
/**
 * 07-abstract-equality-algorithm — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * `==` is not "compare, but looser". It is a SPECIFIC ALGORITHM,
 * `IsLooselyEqual(x, y)`, with eleven ordered branches. This file
 * REPRODUCES that algorithm by hand, one branch at a time, and traces every
 * step — so that "coercion happens" stops being folklore and becomes a
 * sequence you can watch.
 *
 * `===` (`IsStrictlyEqual`) is shown alongside it: it has ONE branch
 * ("different types => false"), and NEVER calls ToPrimitive or ToNumber.
 *
 * DOMAIN: validating a form field's submitted value against an expected
 * value coming from two different sources (a URL query string — always a
 * string — and an internal numeric/enum constant).
 */

import { section, js, note, table, blank, coercionStep, coercionPipeline, detonate } from "../99-runner/trace.js";

/** A hand-written reproduction of ECMA-262's IsLooselyEqual, traced. */
function abstractEquals(x, y) {
  const tx = x === null ? "Null" : x === undefined ? "Undefined" : typeof x;
  const ty = y === null ? "Null" : y === undefined ? "Undefined" : typeof y;

  coercionPipeline(`IsLooselyEqual(${JSON.stringify(x)}, ${JSON.stringify(y)})`);

  // 1. Same type: delegate to IsStrictlyEqual (no coercion needed at all).
  if (tx === ty) {
    coercionStep("Type(x) === Type(y)?", "yes", `both are ${tx}`);
    const result = strictEquals(x, y);
    coercionStep("=> IsStrictlyEqual(x, y)", String(result), "same type: no coercion, ever");
    return result;
  }
  coercionStep("Type(x) === Type(y)?", "no", `${tx} vs ${ty}`);

  // 2/3. null / undefined are equal ONLY to each other.
  if ((tx === "Null" && ty === "Undefined") || (tx === "Undefined" && ty === "Null")) {
    coercionStep("one is null, other is undefined?", "true", "special-cased pair");
    return true;
  }
  if (tx === "Null" || tx === "Undefined" || ty === "Null" || ty === "Undefined") {
    coercionStep("exactly one is null/undefined, other is not?", "false", "null/undefined equal NOTHING else");
    return false;
  }

  // 4/5. Number <-> String: coerce the String side with ToNumber.
  if (tx === "number" && ty === "string") {
    const yNum = Number(y);
    coercionStep(`ToNumber(${JSON.stringify(y)})`, String(yNum), "string side converted to number");
    return abstractEquals(x, yNum);
  }
  if (tx === "string" && ty === "number") {
    const xNum = Number(x);
    coercionStep(`ToNumber(${JSON.stringify(x)})`, String(xNum), "string side converted to number");
    return abstractEquals(xNum, y);
  }

  // 6/7. bigint <-> string
  if (tx === "bigint" && ty === "string") return abstractEquals(x, tryBigInt(y));
  if (tx === "string" && ty === "bigint") return abstractEquals(tryBigInt(x), y);

  // 8/9. boolean on either side: coerce the boolean to a number.
  if (tx === "boolean") {
    const xNum = Number(x);
    coercionStep(`ToNumber(${x})`, String(xNum), "boolean side converted to number");
    return abstractEquals(xNum, y);
  }
  if (ty === "boolean") {
    const yNum = Number(y);
    coercionStep(`ToNumber(${y})`, String(yNum), "boolean side converted to number");
    return abstractEquals(x, yNum);
  }

  // 10. bigint <-> number: compare numerically (spec has extra care for precision).
  if ((tx === "bigint" && ty === "number") || (tx === "number" && ty === "bigint")) {
    return Number(x) === Number(y);
  }

  // 11. One side is an object, the other a primitive: ToPrimitive the object.
  if ((tx === "object" || tx === "function") && ty !== "object" && ty !== "function") {
    const xPrim = toPrimitiveTrace(x);
    return abstractEquals(xPrim, y);
  }
  if ((ty === "object" || ty === "function") && tx !== "object" && tx !== "function") {
    const yPrim = toPrimitiveTrace(y);
    return abstractEquals(x, yPrim);
  }

  coercionStep("no branch matched", "false", "different, non-coercible types");
  return false;
}

function strictEquals(x, y) {
  if (typeof x !== typeof y) return false;
  if (typeof x === "number") return x === y; // NaN handled by real === below anyway
  return x === y;
}

function toPrimitiveTrace(obj) {
  const primitive = obj + ""; // ToPrimitive(obj, "default"), simplified for tracing
  coercionStep(`ToPrimitive(${JSON.stringify(obj)})`, JSON.stringify(primitive), "object reduced to a primitive");
  return primitive;
}

function tryBigInt(value) {
  try {
    return BigInt(value);
  } catch {
    return NaN;
  }
}

export function runBroken(): void {
  section("Reproducing IsLooselyEqual by hand, traced step by step");

  js("expectedRole (number, internal constant) == roleFromQueryString (string)");
  const traced = abstractEquals(1, "1");
  note(`abstractEquals(1, "1") = ${traced}  — matches real \`1 == "1"\` = ${1 == "1"}`);

  blank();
  js('abstractEquals("", 0)');
  abstractEquals("", 0);

  blank();
  js("abstractEquals(null, undefined)");
  abstractEquals(null, undefined);

  blank();
  js("abstractEquals([], false)");
  abstractEquals([], false);

  blank();
  section("=== takes none of these branches, ever");
  table(
    ["expression", "===  algorithm", "result"],
    [
      ['1 === "1"', "Type(x) !== Type(y) => false, immediately", "false"],
      ['"" === 0', "Type(x) !== Type(y) => false, immediately", "false"],
      ["null === undefined", "Type(x) !== Type(y) => false, immediately", "false"],
    ],
  );
  detonate("1 === '1'", () => 1 === "1");
  detonate('"" === 0', () => "" === 0);
  detonate("null === undefined", () => null === undefined);
  note(
    "Not one call to ToPrimitive or ToNumber was made for any `===` comparison " +
      "above. The type mismatch alone decides the answer — this is why === is " +
      "faster to reason about: it has no hidden branches to trace.",
  );
}
