/**
 * type-erasure.demo.ts — watch the type system disappear.
 *
 * Run with: `npm run erasure`
 *
 * This demo reads `type-erasure.specimen.ts` and its own compiled output
 * (`dist/00-foundations/type-erasure.specimen.js`) off disk and compares them.
 * Nothing is mocked or hand-written: the right-hand column is the exact file
 * Node would execute.
 *
 * The point: everything in the left column that constitutes "the type system"
 * has no counterpart in the right column. That absence is the whole reason type
 * errors must be caught at compile time — after this transformation there is
 * nothing left to catch them with.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { banner, section, note, table, log, good, warn, blank } from "../99-runner/trace.js";
import { settle } from "./type-erasure.specimen.js";

const here = path.dirname(fileURLToPath(import.meta.url)); // .../dist/00-foundations
const projectRoot = path.resolve(here, "..", "..");

const sourcePath = path.join(projectRoot, "src", "00-foundations", "type-erasure.specimen.ts");
const emittedPath = path.join(projectRoot, "dist", "00-foundations", "type-erasure.specimen.js");

const readOrEmpty = (file: string): string => {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
};

/**
 * Remove comments before probing.
 *
 * `tsc` preserves comments in its output, so a JSDoc block mentioning
 * `interface Customer` would make the probe report that the interface survived
 * compilation. It did not — its *description* did. Only code counts as
 * evidence here.
 */
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
  "FOUNDATIONS — TYPE ERASURE",
  "Compilation is (almost) nothing but deletion. Watch the type system vanish.",
);

section("1. The same function, before and after compilation");

const sourceFn = extractFunction(sourceCode, "settle");
const emittedFn = extractFunction(emittedCode, "settle");
const rowCount = Math.max(sourceFn.length, emittedFn.length);

table(
  ["TypeScript — src/…/type-erasure.specimen.ts", "JavaScript — dist/…/type-erasure.specimen.js"],
  Array.from({ length: rowCount }, (_, i) => [
    (sourceFn[i] ?? "").replace(/\t/g, "  "),
    (emittedFn[i] ?? "").replace(/\t/g, "  "),
  ]),
);

note("Same algorithm. Same arithmetic. Zero types. Zero runtime checks added.");

section("2. Which constructs survived the trip?");
note("(comments are stripped from both sides first — a JSDoc mention is not evidence)");

const constructs: readonly (readonly [construct: string, probe: RegExp])[] = [
  ["type alias `Cents`", /type Cents/],
  ["union type `OrderStatus`", /"draft" \| "placed"/],
  ["interface `Customer`", /interface Customer/],
  ["generic parameter `<T extends Order>`", /<T extends Order>/],
  ["return annotation `: Cents`", /\): Cents/],
  ["explicit type argument `reduce<Cents>`", /reduce<Cents>/],
  ["`satisfies` clause", /satisfies Record/],
  ["`readonly` modifier", /readonly id/],
  ["the runtime value `Math.round`", /Math\.round/],
  ["the runtime call `.reduce`", /\.reduce/],
  ["the arithmetic `subtotal - discount`", /subtotal - discount/],
];

table(
  ["construct", "in .ts source", "in emitted .js", "verdict"],
  constructs.map(([label, probe]) => {
    const inSource = probe.test(sourceCode);
    const inEmitted = probe.test(emittedCode);
    return [
      label,
      inSource ? "present" : "absent",
      inEmitted ? "present" : "absent",
      inEmitted ? "SURVIVED — it is a value" : "ERASED — it was a type",
    ];
  }),
);

section("3. Size of the guarantee versus size of the payload");

table(
  ["artefact", "lines", "bytes"],
  [
    [
      "TypeScript source",
      String(sourceText.split("\n").length),
      String(Buffer.byteLength(sourceText, "utf8")),
    ],
    [
      "emitted JavaScript",
      String(emittedText.split("\n").length),
      String(Buffer.byteLength(emittedText, "utf8")),
    ],
  ],
);

section("4. The erased function still works, of course");

log(
  `settle({ lineTotals: [1200, 3400], discountBasisPoints: 1000 }, 0.19) = ${settle(
    {
      id: "o-1",
      status: "placed",
      customer: { id: "c-1", email: "ada@example.com", loyaltyTier: "gold" },
      lineTotals: [1200, 3400],
      discountBasisPoints: 1000,
    },
    0.19,
  )} cents`,
);

section("5. What this means for Concept #1");

good(
  "Every type check happened BEFORE this process started. The checking phase " +
    "and the running phase never overlap.",
);
good(
  "The emitted program contains no type tags, no validators, no reflection: " +
    "safety cost exactly zero nanoseconds at runtime.",
);
warn(
  "Therefore a type error MUST be caught at compile time — after erasure there " +
    "is no type information left to catch it with.",
);
warn(
  "Therefore values entering from outside (JSON.parse, fetch, process.env, a DB " +
    "driver) are NOT checked by types. Their types were asserted, not verified. " +
    "See 04-expert/12-soundness-holes.",
);

blank();
log(
  "Formally: TypeScript's typing judgement is over the *program text*; the emitted " +
    "program is the erasure ⟦e⟧ of the well-typed term e. Nothing about ⟦e⟧ " +
    "re-checks what the judgement established.",
);
blank();
