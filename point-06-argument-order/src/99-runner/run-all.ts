/**
 * run-all.ts — run every demo in order, then print the final report.
 *
 * Usage: `npm run demo:all`
 *
 * The closing report is the deliverable asked for by the project brief:
 *   1. every demo and the granular feature it illustrates
 *   2. the TSxxxx diagnostics that appear, and what each one means
 *   3. a "JavaScript (silent swap) vs TypeScript (caught, or made impossible)"
 *      table, marking which swaps require branded types
 *   4. the places TypeScript cannot protect you, and how to design around them
 */

import { banner, section, note, good, warn, table, blank, colors } from "./trace.js";
import { demos } from "./registry.js";
import { runDemo } from "./run-demo.js";

/** Meaning of every diagnostic that appears anywhere in this project. */
const DIAGNOSTIC_GLOSSARY: readonly (readonly [code: string, meaning: string])[] = [
  ["TS2322", "Type 'X' is not assignable to type 'Y' — used for tuple elements and function types"],
  ["TS2339", "Property does not exist — a builder step removed by `Omit`"],
  ["TS2345", "Argument is not assignable to parameter — **the core argument-order diagnostic**"],
  ["TS2349", "This expression is not callable — a member whose type collapsed to `never`"],
  ["TS2352", "Neither type sufficiently overlaps — an `as` assertion the compiler doubts"],
  ["TS2554", "Expected N arguments, but got M — fixed arity"],
  ["TS2555", "Expected at least N arguments, but got M — a rest parameter makes arity unbounded"],
  ["TS2556", "A spread argument must have a tuple type or be passed to a rest parameter"],
  ["TS2561", "Object literal may only specify known properties (+ a spelling suggestion)"],
  ["TS2739", "Type is missing SEVERAL required properties — all of them named"],
  ["TS2741", "A required property is missing — including a tuple index"],
  ["TS2769", "No overload matches this call — the same rule, noisier output"],
  ["TS4104", "A readonly tuple/array cannot be assigned to a mutable one"],
];

function finalReport(): void {
  banner(
    "FINAL REPORT",
    "Concept #6 — argument order: caught by position, made impossible by brands",
  );

  // -------------------------------------------------------------------------
  section("1. Every demo, and the granular feature it illustrates");
  table(
    ["id", "level", "granular feature", "swap caught?"],
    demos.map((demo) => [
      demo.id,
      demo.level.replace(/^\d+-/, ""),
      demo.feature,
      demo.caught,
    ]),
  );

  // -------------------------------------------------------------------------
  blank();
  section("2. Diagnostics demonstrated, and what each one means");
  const used = new Set(demos.flatMap((demo) => demo.codes));
  table(
    ["code", "meaning", "seen in a demo"],
    DIAGNOSTIC_GLOSSARY.map(([code, meaning]) => [
      code,
      meaning,
      used.has(code) ? "yes" : "evidence lab only",
    ]),
  );
  note("`npm run evidence` compiles the fixtures that emit these for real.");

  blank();
  warn(
    "TWO REPORTING BEHAVIOURS WORTH KNOWING, both verified in the evidence lab:",
  );
  note(
    "    • A bad CALL yields ONE diagnostic, at the first mismatching position " +
      "— so a two-argument swap surfaces as a single error, and fixing it " +
      "reveals the next. The compiler never says 'these look swapped'; it says " +
      "'position 0 is wrong'.",
  );
  note(
    "    • A bad OBJECT or ARRAY LITERAL yields one diagnostic PER offending " +
      "member. Options objects and tuples therefore report the whole problem " +
      "at once, while positional arguments report it one step at a time.",
  );

  // -------------------------------------------------------------------------
  blank();
  section("3. JavaScript (silent swap) vs TypeScript (caught, or made impossible)");
  table(
    ["swapped call", "JavaScript result", "plain TypeScript", "needs a brand?"],
    [
      ['createUser(25, "Ana")', "{ name: 25, age: 'Ana' }, crash later", "TS2345", "no"],
      ['priceIn("EUR", 4500)', '"NaN 4500"', "TS2345", "no"],
      ["renderBadge(config, 'SALE')", "[object Object] / TypeError", "TS2345", "no"],
      ['auditLog(true, "disk full")', "inverted branch", "TS2345", "no"],
      ["scheduleJob(date, name, …)", "silent corruption", "TS2345", "no"],
      ["spread of a wrong tuple", "silent corruption", "TS2345", "no"],
      ["applyDiscount(500, 12950)", "-12450 — plausible", "**ACCEPTED**", "**yes**"],
      ["aspectRatio(10, 3)", "3.33 instead of 0.3", "**ACCEPTED**", "**yes**"],
      ["cropTo(640, 480, 10, 20)", "crop outside the image", "**ACCEPTED**", "**yes**"],
      ['fullName("Lovelace", "Ada")', '"Ada, Lovelace"', "**ACCEPTED**", "**yes**"],
      ["transfer(payee, payer, n)", "money moves backwards", "**ACCEPTED**", "**yes**"],
      ["createAccount(e, false, true)", "disabled administrator", "**ACCEPTED**", "literal union"],
      ["sync(path, true, false)", "live deletion, not a dry run", "**ACCEPTED**", "split the fn"],
      ["nightsBetween(end, start)", "negative duration", "**ACCEPTED**", "**yes**"],
      ["query().offset(20).limit(10)", "correct — no positions", "correct", "no — builder"],
    ],
  );
  good(
    "Rows 1-6: positional checking alone. Rows 7-14: the blind spot — same " +
      "types, different meanings, and every one of them SILENT in both " +
      "languages until a remedy is applied. Row 15: the builder, which needs " +
      "no brand because method names replace positions.",
  );

  // -------------------------------------------------------------------------
  blank();
  section("4. Where TypeScript CANNOT protect you from a wrong-order call");

  warn("(a) UNTYPED OR ASSERTED CALL SITES — `as`, `any`, `Function`, `x!`.");
  note(
    "    An `as` assertion overrides the checker and emits nothing; " +
      "`as unknown as` defeats even the overlap guard (TS2352). `any` from an " +
      "untyped dependency switches checking off and spreads through inference. " +
      "A `Function`-typed callee has no signature at all, so `apply` accepts " +
      "anything — note that `apply` on a TYPED callee IS checked, so the hole " +
      "is the `Function` type, not `apply`. DESIGN AROUND IT: confine `as` to " +
      "smart constructors, use `unknown` + a validated guard at the edge, and " +
      "never annotate anything `Function`.",
  );

  blank();
  warn("(b) SAME-TYPED PARAMETERS YOU CHOSE NOT TO BRAND — including ROLES.");
  note(
    "    This is the honest centre of the point. `aspectRatio(width: number, " +
      "height: number)` is unprotected until you brand it, and branding is a " +
      "decision with a real cost. Worse, a KIND-level brand does not " +
      "distinguish ROLES: `send(to: AccountId, from: AccountId)` re-opens the " +
      "blind spot with brands already in place. DESIGN AROUND IT: role-level " +
      "brands where the stakes justify them, an options object where they do " +
      "not, and a deliberate 'do nothing' where a swap would be visible or " +
      "harmless.",
  );

  blank();
  warn("(c) THE I/O BOUNDARY — data that arrives already in the wrong order.");
  note(
    "    No compiler can know whether the sender put the payer in the `from` " +
      "field. Validation checks FORMAT (is this an account id?), never INTENT " +
      "(is it the right account?). DESIGN AROUND IT: idempotency keys, " +
      "confirmation steps, reconciliation, and APIs where the dangerous " +
      "direction requires an explicit signal rather than a field order. This " +
      "one is outside the type system entirely.",
  );

  // -------------------------------------------------------------------------
  blank();
  section("The decision procedure, for the next signature you write");
  note("    Q1  Would a swap here be SILENT?     (no crash, no NaN, no garbage)");
  note("    Q2  Would it be EXPENSIVE?           (money, permissions, data loss)");
  note("");
  note("    both no  → do nothing");
  note("    Q1 only  → rename, or reorder so the types differ");
  note("    both yes → brand, or restructure (options object / builder / split)");

  blank();
  section("The one-sentence version");
  good(
    "TypeScript checks each argument against the parameter in that exact " +
      "position, which deletes every wrong-order call whose types disagree — " +
      "and for the ones whose types agree, branded types let you make the " +
      "types disagree, at zero runtime cost.",
  );
  blank();
  note("Read next:  src/00-foundations/manifesto.md   ·   docs/concept-map.md");
  blank();
}

function main(): void {
  banner(
    "POINT 06 — ARGUMENTS IN THE WRONG ORDER",
    `${demos.length} demos across 4 levels · every claim verified against real tsc output`,
  );

  for (const demo of demos) {
    console.log(`\n${colors.grey}${"·".repeat(78)}${colors.reset}`);
    runDemo(demo);
  }

  finalReport();
}

main();
