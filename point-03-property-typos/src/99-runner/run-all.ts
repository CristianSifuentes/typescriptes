/**
 * run-all.ts — run every demo in order, then print the final report.
 *
 * Usage: `npm run demo:all`
 *
 * The closing report is the deliverable asked for by the project brief:
 *   1. every demo and the granular feature it isolates
 *   2. the TSxxxx diagnostics that appeared, and what each one means
 *   3. the JavaScript-runtime (silent `undefined`) vs TypeScript-compile-time
 *      (typo caught) comparison
 *   4. the places TypeScript cannot protect you from a bad property name
 */

import { banner, section, note, good, warn, table, blank, colors } from "./trace.js";
import { demos } from "./registry.js";
import { runDemo } from "./run-demo.js";

/** Meaning of every diagnostic that appears anywhere in this project. */
const DIAGNOSTIC_GLOSSARY: readonly (readonly [code: string, meaning: string])[] = [
  ["TS2339", "Property does not exist on type — the read/write target is not in the property map"],
  ["TS2551", "Property does not exist — with a spelling suggestion (near-miss typo)"],
  ["TS2561", "Object literal may only specify known properties, with a spelling suggestion (freshness)"],
  ["TS2353", "Object literal may only specify known properties, no suggestion available (freshness)"],
  ["TS2741", "A required property is missing from the object literal"],
  ["TS2739", "Type is missing several required properties"],
  ["TS18048", "Value is possibly 'undefined' — an optional property used unguarded"],
  ["TS2375", "Optional property given an explicit 'undefined' (exactOptionalPropertyTypes)"],
  ["TS2540", "Cannot assign to a read-only property"],
  ["TS4111", "Property comes from an index signature; must be accessed with bracket notation"],
  ["TS2353", "Object literal may only specify known properties (freshness, no suggestion available)"],
  ["TS7053", "Element implicitly has an 'any' type — indexing with a non-literal string key"],
  ["TS2322", "Type 'X' is not assignable to type 'Y' — the core assignability failure"],
  ["TS2345", "Argument is not assignable to parameter — includes exhaustiveness over keyof T"],
  ["TS2344", "Type does not satisfy the constraint — a type-level assertion failed"],
  ["TS2352", "Neither type sufficiently overlaps — an 'as' assertion the compiler doubts"],
  ["TS2578", "Unused '@ts-expect-error' directive — the expected error stopped occurring"],
];

function finalReport(): void {
  banner(
    "FINAL REPORT",
    "Concept #3 — typos in property names, caught at compile time instead of production",
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
  section("3. JavaScript (silent undefined) vs TypeScript (typo caught at compile time)");
  table(
    ["access", "JavaScript outcome", "when discovered", "TypeScript", "when"],
    [
      ["user.nam", "undefined", "never — propagates", "TS2551 (did you mean 'name'?)", "as you type"],
      ["order.totlaCents = x", "a second, parallel field", "never", "TS2339", "as you type"],
      ["{ name, emial }", "the typo is ignored", "never", "TS2561 (freshness)", "as you type"],
      ["order.customer.adress.city", "TypeError, N levels down", "runtime", "TS2551 at 'adress'", "as you type"],
      ["frozen.total = 0", "silently overwritten (loose obj)", "never/runtime", "TS2540 (readonly)", "as you type"],
      ["bag['tolal']", "undefined, no complaint", "never — index sig. accepts any string", "no error — the trade-off", "n/a"],
      ["get + Capitalize(key)", "undefined method call", "runtime", "TS2551 on the generated key", "as you type"],
      ["value as Order", "whatever shape actually arrived", "runtime, downstream", "no error — 'as' is unchecked", "n/a"],
      ["renamed field, old call site", "undefined at every old call site", "runtime, scattered", "TS2551 everywhere at once", "at the rename"],
    ],
  );

  // -------------------------------------------------------------------------
  blank();
  section("4. Where TypeScript CANNOT protect you from a bad property name");

  warn("(a) INDEX SIGNATURES — `[key: string]: T`.");
  note(
    "    Once a type declares an index signature, EVERY string is a valid key " +
      "as far as the checker is concerned — 'tolal' is exactly as legal as " +
      "'total'. The signature widens the property map to include every " +
      "possible spelling. Fix: prefer a closed interface, or a `Record` over a " +
      "union of literal keys, when the key set is actually known (demo 07).",
  );

  blank();
  warn("(b) `any`, `as`, AND DOUBLE ASSERTIONS THROUGH `unknown`.");
  note(
    "    `any` has no property map to check a name against, so every access " +
      "compiles, right or wrong. `as T` overrides the checker's judgement with " +
      "no runtime check emitted; `x as unknown as T` defeats even the overlap " +
      "guard. TypeScript protects the DECLARED shape — these three constructs " +
      "are exactly the ways to stop declaring it (demo 13).",
  );

  blank();
  warn("(c) THE I/O BOUNDARY — `JSON.parse`, `fetch`, `process.env`, DB drivers.");
  note(
    "    A value crossing this boundary is typed by ASSERTION, not by proof: " +
      "nothing checked that the bytes on the wire actually contain a `name` " +
      "field. `response.usre` on an `any` from `fetch().then(r => r.json())` " +
      "compiles and returns `undefined` at runtime, exactly like plain " +
      "JavaScript. Fix: validate at the edge with a schema library so the type " +
      "and the runtime check cannot drift (demo 13).",
  );

  // -------------------------------------------------------------------------
  blank();
  section("The one-sentence version");
  good(
    "TypeScript turns 'is this property spelled correctly?' from a question " +
      "answered by a user hitting a blank field in production into a question " +
      "answered by the compiler before the code is ever run — and the editor " +
      "answers it before you even finish typing, via autocomplete drawn from " +
      "the exact same property map.",
  );
  blank();
  note("Read next:  src/00-foundations/manifesto.md   ·   docs/concept-map.md");
  blank();
}

function main(): void {
  banner(
    "POINT 03 — TYPOS IN PROPERTY NAMES: silent 'undefined' (JavaScript) vs caught at compile time (TypeScript)",
    `${demos.length} demos across 4 levels · every claim verified against real tsc output`,
  );

  for (const demo of demos) {
    console.log(`\n${colors.grey}${"·".repeat(78)}${colors.reset}`);
    runDemo(demo);
  }

  finalReport();
}

main();
