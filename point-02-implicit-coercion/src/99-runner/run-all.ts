/**
 * run-all.ts — run every demo in order, then print the final report.
 *
 * Usage: `npm run demo:all`
 *
 * The closing report is the deliverable asked for by the project brief:
 *   1. every demo and the granular feature it isolates
 *   2. the TSxxxx diagnostics that appeared, and what each one means
 *   3. a JavaScript (silent coercion) vs TypeScript (blocked at compile time) table
 *   4. the places TypeScript cannot protect you from coercion, and why
 */

import { banner, section, note, good, warn, table, blank, colors } from "./trace.js";
import { demos } from "./registry.js";
import { runDemo } from "./run-demo.js";

/** Meaning of every diagnostic that appears anywhere in this project. */
const DIAGNOSTIC_GLOSSARY: readonly (readonly [code: string, meaning: string])[] = [
  ["TS2322", "Type 'X' is not assignable to type 'Y' — the core assignability failure"],
  ["TS2345", "Argument is not assignable to parameter — includes exhaustiveness (`never`)"],
  ["TS2362", "Left-hand side of an arithmetic operation must be numeric"],
  ["TS2363", "Right-hand side of an arithmetic operation must be numeric"],
  ["TS2365", "Operator cannot be applied to these two types"],
  ["TS2367", "This comparison appears unintentional — the types have no overlap"],
  ["TS2554", "Expected N arguments, but got M — a mandatory `never` witness went unsupplied"],
  ["TS18047", "Value is possibly 'null'"],
  ["TS18048", "Value is possibly 'undefined'"],
  ["TS18050", "The value 'null'/'undefined' cannot be used here (bare literal)"],
];

function finalReport(): void {
  banner(
    "FINAL REPORT",
    "Concept #2 — implicit coercion, silenced by JavaScript, blocked at compile time by TypeScript",
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
  section("3. JavaScript (silent coercion) vs TypeScript (blocked at compile time)");
  table(
    ["expression / pattern", "JavaScript outcome", "TypeScript", "demo"],
    [
      ['unitPrice + "3"', '"19.993" (concatenation)', "typed `string`; TS2322 one step downstream", "01"],
      ['"5" - 3', "2 (works, by luck)", "TS2362, at the operator", "02"],
      ['basePrice * tag', "NaN, silently", "TS2363, at the operator", "02"],
      ["itemsInStock || fallback", "0 treated as unset (a logic bug, uncaught)", "no error — see demo 03's limit", "03"],
      ['"" == 0, 0 == "0"', "true, true (non-transitive)", "TS2367, both rejected", "04"],
      ["[] + [], [1,2] + [3,4]", '"" , "1,23,4"', "TS2365", "05"],
      ['"[" + e + "] " + metadata', '"[object Object]"', "no error — a genuine gap", "05"],
      ["null + 1 vs undefined + 1", "1 vs NaN (opposite outcomes)", "TS18050 / TS18047 / TS18048", "06"],
      ['1 == "1"', "true, via ToNumber", "TS2367; typedLooseEquals needs a witness (TS2554)", "07"],
      ["reduce over string | number", "silently flips to concatenation mid-batch", "TS2365 until narrowed", "08"],
      ["`${order.price}` when undefined", '"Widget — $undefined"', "no error — a genuine gap", "09"],
      ["price + tax (valueOf-enabled classes)", "2164 raw cents, not a Money", "TS2365", "10"],
      ["price == 1999 (valueOf-enabled)", "true, via valueOf", "TS2367 — declared types decide, not hooks", "10"],
      ["swap(userId, orderId)", "silent misuse of two plain strings", "TS2345, once branded", "11"],
      ["JSON.parse(...) as Shape", "the exact same coercion bugs, hidden", "no error — as/any are the hole", "12"],
      ["sum(['a', 'b'])", '"ab", no exception', "TS2554 — unwritable once never-guarded", "14"],
    ],
  );

  // -------------------------------------------------------------------------
  blank();
  section("4. Where TypeScript CANNOT protect you from coercion");

  warn("(a) TRUTHINESS BEYOND null/undefined — 0, \"\", NaN, false (demo 03).");
  note(
    "    `strictNullChecks` only ever removes null/undefined from a type. " +
      "`x || fallback` treating a real `0` or `\"\"` as absent is a LOGIC " +
      "error, not a type error — prefer `??` and named, explicit checks.",
  );

  blank();
  warn("(b) STRING + OBJECT VIA `+`, AND EVERY TEMPLATE LITERAL HOLE (demos 05, 09).");
  note(
    "    The moment one `+` operand is already `string`, or inside `${...}`, " +
      "EVERY type is accepted — including a plain object with no meaningful " +
      "`toString`. Fix: name the serialization (`JSON.stringify`, a formatter " +
      "function with a required parameter) instead of relying on the operator.",
  );

  blank();
  warn("(c) `as` AND `any` — assertions and disabled checking (demo 12).");
  note(
    "    `as` persuades the checker without running any check; `any` " +
      "disables every rule in this project and spreads through inference. " +
      "Fix: validate at the boundary with a real Schema<T> (demo 13), and " +
      "treat both as review-blocking elsewhere.",
  );

  blank();
  warn("(d) HOOKS THE CHECKER CANNOT SEE INTO (demo 10).");
  note(
    "    TS2367's comparability analysis is purely structural — it cannot " +
      "know a `valueOf`/`Symbol.toPrimitive` hook would make a comparison " +
      "succeed at runtime, so it sometimes rejects a comparison that was " +
      "actually intentional. The escape hatch is a named method (`.equals()`), " +
      "not a wider comparability rule.",
  );

  // -------------------------------------------------------------------------
  blank();
  section("The one-sentence version");
  good(
    "TypeScript does not abolish coercion — it converts every UNDECLARED " +
      "conversion into either a named function you can find in a diff, or a " +
      "compile error at the one line where the conversion would otherwise " +
      "have run silently, forever, in production.",
  );
  blank();
  note("Read next:  src/00-foundations/manifesto.md   ·   docs/concept-map.md");
  blank();
}

function main(): void {
  banner(
    "POINT 02 — IMPLICIT COERCION (JavaScript) vs BLOCKED AT COMPILE TIME (TypeScript)",
    `${demos.length} demos across 4 levels · every claim verified against real tsc output`,
  );

  for (const demo of demos) {
    console.log(`\n${colors.grey}${"·".repeat(78)}${colors.reset}`);
    runDemo(demo);
  }

  finalReport();
}

main();
