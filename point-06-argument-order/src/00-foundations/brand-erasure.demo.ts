/**
 * brand-erasure.demo.ts — proving that nominal typing costs nothing.
 *
 * Run with: `npm run erasure`
 *
 * The central objection to branded types is "that sounds expensive" or "so now
 * I have wrapper objects everywhere". Neither is true, and this demo settles it
 * by reading `brand-erasure.specimen.ts` and its own compiled output off disk
 * and comparing them.
 *
 * The claim under test: a `Width` IS a `number` at runtime — same value, same
 * arithmetic, same memory, no wrapper, no tag, no check. The entire nominal
 * distinction exists only while `tsc` is running.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { banner, section, note, table, log, good, warn, blank } from "../99-runner/trace.js";
import { aspectRatio, width, height, type Width } from "./brand-erasure.specimen.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..", "..");

const sourcePath = path.join(projectRoot, "src", "00-foundations", "brand-erasure.specimen.ts");
const emittedPath = path.join(projectRoot, "dist", "00-foundations", "brand-erasure.specimen.js");

const readOrEmpty = (file: string): string => {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
};

/** `tsc` preserves comments, so a JSDoc mention is not evidence of survival. */
const stripComments = (text: string): string =>
  text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");

const sourceText = readOrEmpty(sourcePath);
const emittedText = readOrEmpty(emittedPath);
const sourceCode = stripComments(sourceText);
const emittedCode = stripComments(emittedText);

/** Extract a named function from a text blob, brace-balanced. */
function extractFunction(text: string, name: string): string[] {
  const start = text.indexOf(`function ${name}`);
  if (start === -1) return ["<not found>"];
  let depth = 0;
  let index = start;
  let seenBrace = false;
  while (index < text.length) {
    const char = text[index];
    if (char === "{") {
      depth += 1;
      seenBrace = true;
    } else if (char === "}") {
      depth -= 1;
      if (seenBrace && depth === 0) break;
    }
    index += 1;
  }
  return text.slice(start, index + 1).split("\n");
}

banner(
  "FOUNDATIONS — BRAND ERASURE",
  "Nominal typing, bought at compile time, paid for with exactly zero runtime cost.",
);

section("1. The branded function, before and after compilation");

const sourceFn = extractFunction(sourceCode, "aspectRatio");
const emittedFn = extractFunction(emittedCode, "aspectRatio");
const rowCount = Math.max(sourceFn.length, emittedFn.length);

table(
  ["TypeScript — src/…/brand-erasure.specimen.ts", "JavaScript — dist/…/brand-erasure.specimen.js"],
  Array.from({ length: rowCount }, (_, i) => [
    (sourceFn[i] ?? "").replace(/\t/g, "  "),
    (emittedFn[i] ?? "").replace(/\t/g, "  "),
  ]),
);

note(
  "`w / h` in both columns. No unwrapping, no `.value`, no conversion — the " +
    "branded value is the primitive.",
);

section("2. Which parts of the brand survived?");
note("(comments are stripped from both sides first — a JSDoc mention is not evidence)");

const constructs: readonly (readonly [construct: string, probe: RegExp])[] = [
  ["the `Brand<T, K>` alias", /type Brand/],
  ["the `unique symbol` declaration", /unique symbol/],
  ["the phantom member `[brand]: K`", /\[brand\]/],
  ["the `Width` type", /type Width/],
  ["the parameter annotations `w: Width, h: Height`", /w: Width, h: Height/],
  ["the `as Width` assertion in the constructor", /as Width/],
  ["the smart constructor VALUE `width`", /const width/],
  ["the arithmetic `w \\/ h`", /w \/ h/],
];

table(
  ["construct", "in .ts source", "in emitted .js", "verdict"],
  constructs.map(([label, probe]) => [
    label,
    probe.test(sourceCode) ? "present" : "absent",
    probe.test(emittedCode) ? "present" : "absent",
    probe.test(emittedCode) ? "SURVIVED — it is a value" : "ERASED — it was a type",
  ]),
);

note(
  "One row is the whole design: the smart constructor SURVIVES (it is a " +
    "function you call) while everything that makes it nominal is ERASED. " +
    "At runtime `width(3)` is the identity function.",
);

section("3. The runtime evidence");

const w: Width = width(3);
const h = height(10);

log(`width(3)             → ${String(w)}`);
log(`typeof width(3)      → ${typeof w}`);
log(`width(3) === 3       → ${String((w as number) === 3)}`);
log(`width(3) + 1         → ${String((w as number) + 1)}`);
log(`Object.keys(width(3))→ ${JSON.stringify(Object.keys(Object(w)))}`);
log(`JSON.stringify       → ${JSON.stringify({ w, h })}`);
log(`aspectRatio(w, h)    → ${aspectRatio(w, h).toFixed(4)}`);

good(
  "`typeof` says `number`, `=== 3` is true, and the object has no keys. There " +
    "is no brand at runtime to find, because there was never a brand at " +
    "runtime to create.",
);

section("4. What this means for Concept #6");

good(
  "Branding is a COMPILE-TIME relabelling of values you already have. It adds " +
    "no allocation, no wrapper class, no validation call, and no indirection.",
);
good(
  "Because the value is still a primitive, branded types compose with every " +
    "existing API: `Math.max`, `JSON.stringify`, a database driver, arithmetic.",
);
warn(
  "And because the brand does not exist at runtime, nothing at runtime can " +
    "CHECK it. A value that arrives from JSON and is cast with `as Width` is a " +
    "`Width` as far as the compiler is concerned, and a lie as far as reality " +
    "is concerned. That is why brands need smart constructors — see demo 12.",
);

blank();
log(
  "The trade, stated plainly: you accept a compile-time obligation (construct " +
    "your values deliberately) in exchange for making an entire class of " +
    "silent, symmetric, review-proof bugs unrepresentable — at zero cost to " +
    "the program that actually runs.",
);
blank();
