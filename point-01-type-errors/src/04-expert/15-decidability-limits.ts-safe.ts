/**
 * 15-decidability-limits — WHERE THE COMPILER RUNS OUT OF ROAD
 * ---------------------------------------------------------------------------
 * THE THEORETICAL SITUATION, stated precisely.
 *
 * A checker for a non-trivial semantic property of a Turing-complete language
 * cannot be simultaneously SOUND, COMPLETE, and DECIDABLE (Rice's theorem, via
 * the halting problem). Every real type system therefore picks two:
 *
 *   sound + decidable    → incomplete: rejects some correct programs
 *                          (ML, Haskell, Rust — plus escape hatches)
 *   complete + decidable → unsound: accepts some incorrect programs
 *                          (**TypeScript**, by explicit design)
 *   sound + complete     → undecidable: the checker may never terminate
 *                          (dependent types, full program verification)
 *
 * TypeScript is unusual in that its type system is itself TURING-COMPLETE:
 * conditional types + recursion + mapped types can express arbitrary
 * computation (people have implemented SQL parsers and Turing machines in it).
 * A Turing-complete checker can loop forever on a well-formed program — so the
 * compiler imposes HARD BUDGETS and reports when it hits one.
 *
 * That is the honest answer to "why can't the compiler just check everything?":
 * for some questions it provably cannot, and for others it could only by
 * running arbitrarily long. The budgets are where theory becomes a diagnostic
 * you can see.
 */

import {
  section,
  ts,
  good,
  warn,
  note,
  compilerSays,
  table,
  blank,
  detonate,
} from "../99-runner/trace.js";
import { proveType, proofBlock, type Equals, type Expect } from "../99-runner/type-assert.js";

// ===========================================================================
// TYPE-LEVEL COMPUTATION — real programs, executed by the type checker
// ===========================================================================

/** Build a tuple of length N. Recursion at the type level, with an accumulator. */
type BuildTuple<N extends number, Acc extends unknown[] = []> = Acc["length"] extends N
  ? Acc
  : BuildTuple<N, [...Acc, unknown]>;

/** Addition, implemented in the type system. */
type Add<A extends number, B extends number> = [
  ...BuildTuple<A>,
  ...BuildTuple<B>,
]["length"];

/** Split a string literal on a delimiter — a parser, at compile time. */
type Split<S extends string, D extends string> = S extends `${infer Head}${D}${infer Tail}`
  ? [Head, ...Split<Tail, D>]
  : [S];

/** The proof that the checker really did compute these. */
type _Arithmetic = Expect<Equals<Add<7, 5>, 12>>;
type _Parsing = Expect<Equals<Split<"a,b,c", ",">, ["a", "b", "c"]>>;

export function runSafe(): void {
  // =========================================================================
  // 1. THE TYPE SYSTEM AS AN INTERPRETER
  // =========================================================================
  section("The checker is a programming language, and it just ran a program");

  const twelve: Add<7, 5> = 12;
  proofBlock("computed entirely at compile time, erased before runtime");
  proveType<12>()(twelve, "12", "`Add<7, 5>` was evaluated by tsc, not by node");

  const parts: Split<"a,b,c", ","> = ["a", "b", "c"];
  proveType<["a", "b", "c"]>()(parts, '["a", "b", "c"]', "a parser, run by the type checker");

  good(
    "No JavaScript performed this addition or this parse. The compiler did, " +
      "while checking the file, and then erased every trace of it.",
  );
  warn(
    "Which raises the obvious question: if the type system can compute " +
      "anything, what stops `tsc` from computing forever?",
  );

  // =========================================================================
  // 2. THE BUDGETS
  // =========================================================================
  blank();
  section("The budgets, and the diagnostic that announces them");

  ts("type Enormous = BuildTuple<5000>;");
  compilerSays(
    "TS2589",
    "Type instantiation is excessively deep and possibly infinite.",
    "The checker gave up. This is not a bug report about your code — it is the " +
      "compiler telling you it hit its recursion budget and is refusing to " +
      "spend unbounded time on a question that may not terminate.",
  );

  blank();
  note("The limits, as implemented in the checker:");
  table(
    ["budget", "approximate limit", "what it protects against"],
    [
      ["instantiation depth", "100 nested instantiations", "runaway generic expansion"],
      ["instantiation count", "~5 000 000 per check", "exponential blow-up"],
      ["tail-recursive conditional types", "1 000 iterations", "type-level infinite loops"],
      ["type relation depth", "~100", "cyclic structural comparison"],
      ["union member count", "~100 000", "combinatorial explosion of distributed unions"],
    ],
  );
  note(
    "    These are HEURISTICS, not theorems. They are tuned so that realistic " +
      "programs pass and pathological ones stop. A different budget would " +
      "accept different programs — which tells you the checker's accept/reject " +
      "boundary is partly an engineering decision, not purely a mathematical one.",
  );

  blank();
  const withinBudget: BuildTuple<3> = [undefined, undefined, undefined];
  proveType<[unknown, unknown, unknown]>()(
    withinBudget,
    "[unknown, unknown, unknown]",
    "the same recursion, three levels deep — comfortably inside the budget",
  );

  // =========================================================================
  // 3. THE THREE OBSTACLES, AND TYPESCRIPT'S ANSWER TO EACH
  // =========================================================================
  blank();
  section("What is actually undecidable, and what TypeScript does instead");

  note("(a) THE VALUE DEPENDS ON THE OUTSIDE WORLD.");
  const fromTheWorld: string | number = Date.now() % 2 === 0 ? "42" : 42;
  note(
    "    No analysis can know which branch ran. TypeScript's answer is not to " +
      "guess but to carry BOTH possibilities — that is precisely what a union " +
      "is — and to require you to discriminate before using either.",
  );
  if (typeof fromTheWorld === "string") {
    proveType<string>()(fromTheWorld, "string", "one possibility");
  } else {
    proveType<number>()(fromTheWorld, "number", "the other possibility");
  }
  detonate("handled either way", () =>
    typeof fromTheWorld === "string" ? fromTheWorld.trim() : fromTheWorld.toFixed(0),
  );

  blank();
  note("(b) REACHABILITY REDUCES TO THE HALTING PROBLEM.");
  note(
    "    'Is this line reachable?' is undecidable in general. TypeScript " +
      "OVER-APPROXIMATES: it assumes more code is reachable than may actually " +
      "be, and type-checks it anyway. Over-approximating is the safe direction " +
      "— it can only cause false positives, never false negatives.",
  );
  note(
    "    The exception is the narrow, decidable fragment it CAN settle: " +
      "narrowing to `never` (demo 10) is a reachability proof — but only over " +
      "the finite lattice of declared union members, never over arbitrary " +
      "arithmetic.",
  );

  blank();
  note("(c) THE PROGRAM DOES NOT EXIST UNTIL IT RUNS.");
  detonate("new Function('x', 'return x * 2')(21)", () => {
    const fn = new Function("x", "return x * 2") as (x: number) => number;
    return fn(21);
  });
  warn(
    "`eval`, `new Function`, and dynamic member names produce code no static " +
      "analysis can see. TypeScript's answer is `any` — an admission, made " +
      "explicit. Note the `as` above: an unverified claim, exactly the hole " +
      "from demo 12.",
  );

  // =========================================================================
  // 4. WHY THIS MATTERS IN PRACTICE
  // =========================================================================
  blank();
  section("The practical consequences of a Turing-complete checker");

  table(
    ["symptom", "underlying cause", "mitigation"],
    [
      ["slow builds / slow editor", "type-level computation is real computation", "simplify types; `--generateTrace`"],
      ["TS2589 in library types", "deep conditional recursion", "raise the base case; add explicit type arguments"],
      ["`skipLibCheck: true` everywhere", "checking all .d.ts is expensive", "accepted trade — but it hides real errors"],
      ["an inference that 'should' work", "the checker is incomplete", "annotate explicitly and move on"],
      ["union blow-up in a mapped type", "distribution is combinatorial", "constrain the union; avoid distribution"],
    ],
  );

  blank();
  good(
    "THE TAKEAWAY. TypeScript is not 'unsound because it is sloppy'. It sits " +
      "at a deliberately chosen point in a space where perfection is provably " +
      "unavailable: it accepts idiomatic JavaScript, terminates quickly, and " +
      "gives up soundness in a small set of documented places (demo 12).",
  );
  note(
    "Concept #1 — 'type errors that JavaScript surfaces only at runtime are " +
      "caught by TypeScript at compile time' — is therefore TRUE, LOAD-BEARING, " +
      "and BOUNDED. The bounds are not a disappointment; they are the reason " +
      "the tool is usable at all.",
  );
}
