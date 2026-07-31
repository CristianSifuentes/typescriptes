#!/usr/bin/env node
/**
 * evidence.mjs — run the *evidence lab* and render real `tsc` diagnostics.
 *
 * Why this script exists
 * ----------------------
 * Every claim this project makes about arity/type checking must be
 * falsifiable. `tsconfig.evidence.json` compiles a set of files that contain
 * deliberate, unsuppressed type errors; this script runs that compilation,
 * parses the raw diagnostics, and prints them grouped by file with their
 * TSxxxx codes.
 *
 * A non-zero exit code from `tsc` is the SUCCESS condition here: it means the
 * compiler rejected the program before a single line of it could run.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const C = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

const result = spawnSync(
  process.execPath,
  [
    path.join(root, "node_modules", "typescript", "bin", "tsc"),
    "-p",
    path.join(root, "tsconfig.evidence.json"),
    "--pretty",
    "false",
  ],
  { cwd: root, encoding: "utf8" },
);

const raw = `${result.stdout ?? ""}${result.stderr ?? ""}`;

/** `src/a/b.tsc-error.ts(12,7): error TS2554: Expected 2 arguments, but got 1.` */
const DIAGNOSTIC = /^(.*?)\((\d+),(\d+)\): error (TS\d+): (.*)$/;

const byFile = new Map();
const codes = new Map();

let current = null;

for (const line of raw.split(/\r?\n/)) {
  const m = DIAGNOSTIC.exec(line.trim());
  if (m) {
    const [, file, ln, col, code, message] = m;
    const key = path.relative(root, path.resolve(root, file));
    if (!byFile.has(key)) byFile.set(key, []);
    current = { line: ln, col, code, message, elaborations: [] };
    byFile.get(key).push(current);
    codes.set(code, (codes.get(code) ?? 0) + 1);
    continue;
  }
  // Indented continuation lines are the compiler's ELABORATION chain.
  if (current && /^\s+\S/.test(line)) current.elaborations.push(line.trim());
}

const total = [...byFile.values()].reduce((n, list) => n + list.length, 0);

console.log(
  `\n${C.bold}${C.magenta}╔══════════════════════════════════════════════════════════════════════╗${C.reset}`,
);
console.log(
  `${C.bold}${C.magenta}║  EVIDENCE LAB — real diagnostics emitted by the TypeScript compiler  ║${C.reset}`,
);
console.log(
  `${C.bold}${C.magenta}╚══════════════════════════════════════════════════════════════════════╝${C.reset}\n`,
);
console.log(
  `${C.dim}config : tsconfig.evidence.json  (extends tsconfig.json, strict: true)${C.reset}`,
);
console.log(`${C.dim}command: tsc -p tsconfig.evidence.json --pretty false${C.reset}\n`);

if (total === 0) {
  console.log(
    `${C.red}${C.bold}UNEXPECTED:${C.reset} the evidence lab produced no diagnostics.\n` +
      `Either the compiler changed its behaviour or the fixtures were fixed.\n`,
  );
  if (raw.trim()) console.log(raw);
  process.exit(1);
}

for (const [file, list] of [...byFile.entries()].sort()) {
  console.log(`${C.bold}${C.cyan}▸ ${file}${C.reset}  ${C.dim}(${list.length} errors)${C.reset}`);
  for (const d of list) {
    const where = `${d.line}:${d.col}`.padEnd(8, " ");
    console.log(
      `   ${C.dim}${where}${C.reset}${C.red}${d.code}${C.reset} ${d.message}`,
    );
    for (const elaboration of d.elaborations) {
      console.log(`           ${C.dim}↳ ${elaboration}${C.reset}`);
    }
  }
  console.log("");
}

console.log(`${C.bold}Error codes observed${C.reset}`);
console.log(`${C.dim}${"─".repeat(70)}${C.reset}`);
for (const [code, count] of [...codes.entries()].sort()) {
  console.log(`  ${C.red}${code}${C.reset} ${C.dim}×${count}${C.reset}`);
}

console.log(
  `\n${C.green}${C.bold}✔ ${total} arity/type errors were caught at COMPILE TIME.${C.reset}`,
);
console.log(
  `${C.dim}  Zero of these programs ever reached Node. In JavaScript, each one\n` +
    `  would have silently bound 'undefined' or dropped an argument and\n` +
    `  crashed (or corrupted a value) somewhere else entirely.${C.reset}\n`,
);

// `tsc` exiting non-zero is the expected, desired outcome — normalise to 0 so
// that `npm run evidence` is not reported as a failed script.
process.exit(0);
