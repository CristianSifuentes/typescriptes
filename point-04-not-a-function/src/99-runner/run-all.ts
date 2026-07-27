/**
 * run-all.ts — run every demo in order, then print the final report.
 *
 * Usage: `npm run demo:all`
 *
 * The closing report is the deliverable asked for by the project brief:
 *   1. every demo and the granular feature it isolates
 *   2. the TSxxxx diagnostics that appeared, and what each one means
 *   3. the JavaScript ("is not a function" at runtime) vs TypeScript
 *      (blocked at compile time) comparison
 *   4. the places TypeScript cannot protect you from an invalid call
 */

import { banner, section, note, good, warn, table, blank, colors } from "./trace.js";
import { demos } from "./registry.js";
import { runDemo } from "./run-demo.js";

/** Meaning of every diagnostic that appears anywhere in this project. */
const DIAGNOSTIC_GLOSSARY: readonly (readonly [code: string, meaning: string])[] = [
  ["TS2349", "This expression is not callable — the target has no call signature"],
  ["TS2339", "Property does not exist on type — a misspelled or absent method"],
  ["TS2551", "Property does not exist — with a spelling suggestion"],
  ["TS2322", "Type 'X' is not assignable to type 'Y' — includes function-shape mismatches"],
  ["TS2345", "Argument is not assignable to parameter — includes non-callable arguments"],
  ["TS2769", "No overload matches this call — every candidate signature was rejected"],
  ["TS18048", "Value is possibly 'undefined' — an optional/nullable function used unguarded"],
];

function finalReport(): void {
  banner(
    "FINAL REPORT",
    "Concept #4 — invalid invocation, caught at compile time instead of production",
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
  section('3. JavaScript ("is not a function" at runtime) vs TypeScript (blocked at compile time)');
  table(
    ["call", "JavaScript outcome", "when discovered", "TypeScript", "when"],
    [
      ["const x = 5; x()", "TypeError: x is not a function", "runtime", "TS2349", "as you type"],
      ['"hi".toUpperCasee()', "TypeError: ... is not a function", "runtime", "TS2551 (spelling suggested)", "as you type"],
      ["(5).toUpperCase()", "TypeError: ... is not a function", "runtime", "TS2339", "as you type"],
      ["fn = 42 (fn: () => void)", "TypeError at the eventual call", "runtime, elsewhere", "TS2322 at the assignment", "as you type"],
      ["config.retry() (retry: number)", "TypeError: retry is not a function", "runtime", "TS2349", "as you type"],
      ["obj.onError() (optional, absent)", "TypeError: Cannot read / not a function", "runtime", "TS18048 unless '?.' used", "as you type"],
      ["non-callable passed as a callback", "TypeError, inside the consumer", "runtime, elsewhere", "TS2345 at the call site", "as you type"],
      ["handler() where handler: Fn | undefined", "TypeError, intermittent", "runtime, some inputs", "TS18048", "as you type"],
      ["a call matching no overload", "wrong overload silently picked, or throws", "runtime", "TS2769", "as you type"],
    ],
  );

  // -------------------------------------------------------------------------
  blank();
  section("4. Where TypeScript CANNOT protect you from an invalid call");

  warn("(a) `any` AND `as` — the target's call signature is asserted, not verified.");
  note(
    "    A value typed `any` has no call signature to check against, so every " +
      "invocation compiles, right or wrong. `as` overrides the checker's " +
      "judgement with no runtime check emitted. Both are exactly the ways to " +
      "stop declaring a shape for the compiler to verify (demo 14).",
  );

  blank();
  warn("(b) INDEX-SIGNATURE / DYNAMIC DISPATCH without a closed key set.");
  note(
    "    `handlers[eventName]()` where `handlers` has an index signature " +
      "typed loosely (or is `any`) accepts any string key, so a missing " +
      "handler is `undefined()` at runtime — exactly the crash this project " +
      "exists to prevent. Fix: a closed, `keyof`-checked registry (demo 15).",
  );

  blank();
  warn("(c) THE I/O BOUNDARY — a callback deserialized from configuration or a plugin loaded dynamically.");
  note(
    "    `JSON.parse`, `require()`/dynamic `import()`, and similar boundaries " +
      "return values whose 'this is callable' claim was never checked by the " +
      "compiler — only asserted by whoever wrote the type annotation. Fix: " +
      "validate at the edge with `typeof value === 'function'` before " +
      "invoking (demo 12's narrowing, applied at the boundary).",
  );

  // -------------------------------------------------------------------------
  blank();
  section("The one-sentence version");
  good(
    "TypeScript turns 'is this actually callable, with these arguments?' from " +
      "a question answered by a stack trace in production into a question " +
      "answered by the compiler before the code runs — because a function " +
      "type is not just 'some value', it is a call signature the checker can " +
      "verify every invocation against.",
  );
  blank();
  note("Read next:  src/00-foundations/manifesto.md   ·   docs/concept-map.md");
  blank();
}

function main(): void {
  banner(
    "POINT 04 — 'undefined is not a function' (JavaScript) vs blocked at compile time (TypeScript)",
    `${demos.length} demos across 4 levels · every claim verified against real tsc output`,
  );

  for (const demo of demos) {
    console.log(`\n${colors.grey}${"·".repeat(78)}${colors.reset}`);
    runDemo(demo);
  }

  finalReport();
}

main();
