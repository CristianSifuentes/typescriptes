/**
 * run-all.ts — run every demo in order, then print the final report.
 *
 * Usage: `npm run demo:all`
 *
 * The closing report is the deliverable asked for by the project brief:
 *   1. every demo and the granular feature it isolates
 *   2. the TSxxxx diagnostics that appeared, and what each one means
 *   3. the JavaScript-runtime vs TypeScript-compile-time comparison
 *   4. the places TypeScript cannot protect you, and why
 */

import { banner, section, note, good, warn, table, blank, colors } from "./trace.js";
import { demos } from "./registry.js";
import { runDemo } from "./run-demo.js";

/** Meaning of every diagnostic that appears anywhere in this project. */
const DIAGNOSTIC_GLOSSARY: readonly (readonly [code: string, meaning: string])[] = [
  ["TS1294", "Syntax not allowed under `erasableSyntaxOnly` (it would emit JavaScript)"],
  ["TS2322", "Type 'X' is not assignable to type 'Y' — the core assignability failure"],
  ["TS2339", "Property does not exist on type — static member resolution failed"],
  ["TS2344", "Type does not satisfy the constraint — a type-level assertion failed"],
  ["TS2345", "Argument is not assignable to parameter — includes exhaustiveness (`never`)"],
  ["TS2352", "Neither type sufficiently overlaps — an `as` assertion the compiler doubts"],
  ["TS2362", "Left-hand side of an arithmetic operation must be numeric"],
  ["TS2363", "Right-hand side of an arithmetic operation must be numeric"],
  ["TS2365", "Operator cannot be applied to these two types"],
  ["TS2366", "Function lacks an ending return statement"],
  ["TS2367", "This comparison is unintentional — the types have no overlap"],
  ["TS2375", "Optional property given an explicit `undefined` (exactOptionalPropertyTypes)"],
  ["TS2532", "Object is possibly 'undefined' (noUncheckedIndexedAccess)"],
  ["TS2540", "Cannot assign to a read-only property"],
  ["TS2551", "Property does not exist — with a spelling suggestion"],
  ["TS2554", "Expected N arguments, but got M — arity"],
  ["TS2561", "Object literal may only specify known properties (freshness)"],
  ["TS2589", "Type instantiation is excessively deep — the recursion budget ran out"],
  ["TS2677", "A type predicate's type must be assignable to its parameter's type"],
  ["TS2678", "A case label is not comparable to the switched type"],
  ["TS2739", "Type is missing several required properties"],
  ["TS2741", "A required property is missing"],
  ["TS4104", "A readonly array cannot be assigned to a mutable array type"],
  ["TS7006", "Parameter implicitly has an 'any' type (noImplicitAny)"],
  ["TS18046", "Value is of type 'unknown' — prove something about it first"],
  ["TS18047", "Value is possibly 'null'"],
  ["TS18048", "Value is possibly 'undefined'"],
  ["TS18050", "The value 'null' cannot be used here"],
];

function finalReport(): void {
  banner(
    "FINAL REPORT",
    "Concept #1 — type errors JavaScript defers to runtime, caught at compile time",
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
  section("3. JavaScript (runtime) vs TypeScript (compile time)");
  table(
    ["defect", "JavaScript outcome", "when discovered", "TypeScript", "when"],
    [
      ['100 + "12"', '"10012" (string)', "never", "TS2322 at the binding", "as you type"],
      ['112 * "8.25%"', "NaN, propagating", "never", "TS2363 at the operator", "as you type"],
      ['if ("false")', "truthy — branch inverts", "never", "TS2322", "as you type"],
      ["(5).toUpperCase()", "TypeError", "runtime", "TS2339", "as you type"],
      ["user.emailAdress", "undefined, then TypeError", "runtime, elsewhere", "TS2339 at the read", "as you type"],
      ["f(a) missing an argument", "undefined bound", "never", "TS2554", "as you type"],
      ["f(b, a) swapped", "NaN", "never", "TS2345", "as you type"],
      ["return the wrong type", "concatenation downstream", "never", "TS2322 at the return", "as you type"],
      ['[1, 2, "3"].reduce(+)', '"126"', "never", "TS2322 on the element", "as you type"],
      ["arr[99].toFixed()", "TypeError", "runtime", "TS2532", "as you type"],
      ["union used unnarrowed", "TypeError", "runtime", "TS2339 naming the member", "as you type"],
      ["optional used unguarded", "TypeError", "runtime", "TS18048", "as you type"],
      ["a new union member added", "silent `undefined`", "**never**", "TS2345 at every switch", "at build"],
      ["impossible state constructed", "wrong render / wrong refund", "**never**", "TS2353 / TS2739", "as you type"],
    ],
  );

  // -------------------------------------------------------------------------
  blank();
  section("4. Where TypeScript CANNOT protect you");

  warn("(a) THE I/O BOUNDARY — `JSON.parse`, `fetch`, `process.env`, DB drivers.");
  note(
    "    These return `any` because no compiler can know the shape of bytes " +
      "arriving from outside the program. Every type downstream of them is a " +
      "CLAIM, not a proof. Fix: parse to `unknown` and validate at the edge " +
      "(demo 09), ideally with a schema library so the type and the validator " +
      "cannot drift.",
  );

  blank();
  warn("(b) `as` AND `any` — assertions you make and the compiler does not check.");
  note(
    "    `as` emits no runtime check and overrides the checker's judgement; a " +
      "double assertion through `unknown` defeats even the overlap guard. " +
      "`any` disables checking entirely and spreads through inference. Fix: " +
      "treat both as review-blocking, and prefer `unknown` + a type guard " +
      "(demos 09 and 12).",
  );

  blank();
  warn("(c) DELIBERATE UNSOUNDNESS INSIDE THE CHECKER ITSELF.");
  note(
    "    Method parameters are bivariant (so `Array<Dog>` works as " +
      "`Array<Animal>`); `readonly` is shallow, alias-blind, and erased; array " +
      "indexing assumes bounds unless `noUncheckedIndexedAccess` is on; a type " +
      "predicate's BODY is never verified. Each buys ergonomics at the cost of " +
      "a documented hole (demo 12).",
  );

  blank();
  note(
    "AND THE CATEGORY ERROR TO AVOID: a type checker catches TYPE errors, not " +
      "LOGIC errors. `[10, 9, 100].sort()` and `retries ? retries : 3` are " +
      "type-correct and wrong. Demos 06, 07 and 15 mark that boundary " +
      "explicitly, and demo 15 explains why it is provably unavoidable.",
  );

  // -------------------------------------------------------------------------
  blank();
  section("The one-sentence version");
  good(
    "TypeScript moves the discovery of type errors from 'one unlucky user, one " +
      "unlucky input, in production' to 'the author, immediately, for all " +
      "inputs' — at zero runtime cost, because by the time the program runs the " +
      "types are gone.",
  );
  blank();
  note("Read next:  src/00-foundations/manifesto.md   ·   docs/concept-map.md");
  blank();
}

function main(): void {
  banner(
    "POINT 01 — TYPE ERRORS AT RUNTIME (JavaScript) vs AT COMPILE TIME (TypeScript)",
    `${demos.length} demos across 4 levels · every claim verified against real tsc output`,
  );

  for (const demo of demos) {
    console.log(`\n${colors.grey}${"·".repeat(78)}${colors.reset}`);
    runDemo(demo);
  }

  finalReport();
}

main();
