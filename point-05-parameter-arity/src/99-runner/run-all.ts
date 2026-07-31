/**
 * run-all.ts — run every demo in order, then print the final report.
 *
 * Usage: `npm run demo:all`
 *
 * The closing report is the deliverable asked for by the project brief:
 *   1. every demo and the granular feature it isolates
 *   2. the TSxxxx diagnostics that appeared, and what each one means
 *   3. the JavaScript (silent wrong arity) vs TypeScript (blocked at compile
 *      time) comparison
 *   4. the places TypeScript cannot protect you from a wrong-arity call
 */

import { banner, section, note, good, warn, table, blank, colors } from "./trace.js";
import { demos } from "./registry.js";
import { runDemo } from "./run-demo.js";

/** Meaning of every diagnostic that appears anywhere in this project. */
const DIAGNOSTIC_GLOSSARY: readonly (readonly [code: string, meaning: string])[] = [
  ["TS2554", "Expected N arguments, but got M — an arity mismatch, too few or too many"],
  ["TS2345", "Argument is not assignable to parameter — a type mismatch at a given position"],
  ["TS18048", "Value is possibly 'undefined' — an optional parameter used without narrowing"],
  ["TS1016", "A required parameter cannot follow an optional parameter — a declaration-order error"],
  ["TS2556", "A spread argument must either have a tuple type or be passed to a rest parameter"],
  ["TS2575", "No constituent of the union type is callable with the arguments supplied"],
  ["TS2322", "Type 'X' is not assignable to type 'Y' — includes parameter-list shape mismatches"],
];

function finalReport(): void {
  banner(
    "FINAL REPORT",
    "Concept #5 — wrong-arity calls, caught at compile time instead of production",
  );

  // -------------------------------------------------------------------------
  section("1. Every demo, and the granular feature it isolates");
  table(
    ["id", "level", "granular feature"],
    demos.map((demo) => [demo.id, demo.level.replace(/^\d+-/, ""), demo.feature]),
  );

  // -------------------------------------------------------------------------
  blank();
  section("2. Diagnostics demonstrated, and what each one means");
  const used = new Set(demos.flatMap((demo) => demo.codes));
  table(
    ["code", "meaning", "seen in this project"],
    DIAGNOSTIC_GLOSSARY.map(([code, meaning]) => [
      code,
      meaning,
      used.has(code) ? "yes" : "evidence lab only",
    ]),
  );
  note("`npm run evidence` compiles the fixtures that emit these for real.");

  // -------------------------------------------------------------------------
  blank();
  section("3. JavaScript (silent wrong arity) vs TypeScript (blocked at compile time)");
  table(
    ["call", "JavaScript outcome", "when discovered", "TypeScript", "when"],
    [
      ["greet() (greet(name: string))", "name = undefined, returns 'Hello, undefined'", "runtime", "TS2554", "as you type"],
      ["add(1, 2, 3) (add(a, b))", "3rd argument silently ignored", "runtime (never)", "TS2554", "as you type"],
      ["greet(42) (greet(name: string))", "'Hello, 42' — coerced, not rejected", "runtime (never)", "TS2345", "as you type"],
      ["charge(undefined) (charge(amount: number))", "NaN propagates silently", "runtime, elsewhere", "TS2345", "as you type"],
      ["fn(a, b) where b is optional", "b = undefined if omitted — fine", "n/a — this one is valid", "no diagnostic", "—"],
      ["sum(...nums) with a non-number in nums", "NaN propagates through the reduction", "runtime, elsewhere", "TS2345", "as you type"],
      ["log(level, ...meta) called with wrong meta shape", "garbage serialized into the log line", "runtime, elsewhere", "TS2345", "as you type"],
      ["a call matching no overload's arity", "wrong overload silently picked, or throws", "runtime", "TS2575/TS2769", "as you type"],
      ["fn.apply(null, untypedArray)", "TypeError or NaN, depending on contents", "runtime", "not checked — see §4", "never"],
    ],
  );

  // -------------------------------------------------------------------------
  blank();
  section("4. Where TypeScript CANNOT protect you from a wrong-arity call");

  warn("(a) `any`, `Function`, AND `as` — the target's parameter list is asserted, not verified.");
  note(
    "    A value typed `any` accepts a call with any number of arguments of " +
      "any type. `Function` is `(...args: any[]) => any` — callable with " +
      "anything. `as` overrides the checker's judgement with no runtime " +
      "check emitted. All three are ways to stop declaring a parameter list " +
      "for the compiler to verify (demo 15).",
  );

  blank();
  warn("(b) `.apply` / spread OF AN UNTYPED ARRAY.");
  note(
    "    `fn.apply(null, argsFromSomewhere)` or `fn(...(argsFromSomewhere as " +
      "any[]))` hands the compiler an array whose LENGTH is not part of its " +
      "type — `number[]` says nothing about how many numbers. Arity checking " +
      "requires a TUPLE type (demo 09/10) to know a count at compile time; " +
      "a plain array type reopens the wrong-arity hole regardless of " +
      "`strictBindCallApply`.",
  );

  blank();
  warn("(c) THE I/O BOUNDARY — arguments assembled from configuration, CLI flags, or deserialized data.");
  note(
    "    A CLI parser, a config file, or `JSON.parse` produces `any` or a " +
      "loosely-typed array/object whose 'this has the right shape for this " +
      "call' claim was never checked by the compiler — only asserted by " +
      "whoever wrote the type annotation. Fix: validate the SHAPE (length " +
      "and per-field type) at the edge before spreading it into a call " +
      "(demo 17's `never`-based guard, applied at the boundary).",
  );

  // -------------------------------------------------------------------------
  blank();
  section("The one-sentence version");
  good(
    "TypeScript turns 'does this call supply exactly the arguments this " +
      "function requires, each of the right type?' from a question answered " +
      "by a silently wrong 'NaN' or 'undefined' discovered three functions " +
      "later, into a question answered by the compiler before the code runs " +
      "— because a parameter list is not just 'some placeholders', it is a " +
      "typed, arity-bounded contract the checker can verify every call " +
      "against.",
  );
  blank();
  note("Read next:  src/00-foundations/manifesto.md   ·   docs/concept-map.md");
  blank();
}

function main(): void {
  banner(
    "POINT 05 — too many/too few function parameters (JavaScript) vs blocked at compile time (TypeScript)",
    `${demos.length} demos across 4 levels · every claim verified against real tsc output`,
  );

  for (const demo of demos) {
    console.log(`\n${colors.grey}${"·".repeat(78)}${colors.reset}`);
    runDemo(demo);
  }

  finalReport();
}

main();
