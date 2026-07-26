// @ts-nocheck
/**
 * 15-decidability-limits — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * The question behind this demo is the deepest one in the project:
 *
 *     "Why can't the compiler just check EVERYTHING?"
 *
 * JavaScript's answer is the trivial one: it checks nothing, so the question
 * never arises. But running the code makes the underlying obstacle visible,
 * because the property you would want checked — "this program never applies an
 * operation to a value that does not support it" — is a SEMANTIC property of a
 * Turing-complete language, and by Rice's theorem no algorithm decides such a
 * property for all programs.
 *
 * The three specimens below are not contrived. Each is ordinary JavaScript
 * whose type-correctness genuinely cannot be settled without running it — and
 * in the second case, not even then.
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

export function runBroken(): void {
  section("Specimen 1 — correctness depends on runtime data");

  js("the type of `value` depends on a network response / the clock / a coin");
  detonate("correct or crashing, decided at runtime", () => {
    const fromTheWorld = Date.now() % 2 === 0 ? "42" : 42;
    return typeof fromTheWorld === "string" ? fromTheWorld.trim() : fromTheWorld.toFixed(0);
  });
  note(
    "This one is written defensively and is fine. But NO static analysis can " +
      "decide which branch runs, so any checker must either reason about BOTH " +
      "(which is what TypeScript does — that is exactly what a union is) or " +
      "guess. Guessing is how you get an unsound checker.",
  );

  blank();
  section("Specimen 2 — correctness depends on a halting question");

  js("does this loop terminate? then, and only then, is the next line reachable");
  detonate("collatz-style search, bounded here so the demo finishes", () => {
    let n = 27;
    let steps = 0;
    while (n !== 1 && steps < 10_000) {
      n = n % 2 === 0 ? n / 2 : 3 * n + 1;
      steps += 1;
    }
    return `terminated after ${steps} steps`;
  });
  note(
    "Whether the unbounded version halts for every starting value is an OPEN " +
      "MATHEMATICAL PROBLEM (the Collatz conjecture). If deciding reachability " +
      "of the following line required solving it, no compiler could be written. " +
      "So compilers do not try: they OVER-APPROXIMATE reachability instead, " +
      "which is why unreachable code is sometimes still type-checked.",
  );

  blank();
  section("Specimen 3 — the program builds its own operations");

  js("dynamic dispatch: the method name is a runtime string");
  detonate("obj[key]()", () => {
    const obj = { toUpperCase: () => "SHOUT", toFixed: () => "1.00" };
    const key = ["toUpperCase", "toFixed"][Date.now() % 2];
    return obj[key]();
  });

  js("code built from a string");
  detonate("new Function(...)", () => {
    const fn = new Function("x", "return x * 2");
    return fn(21);
  });
  note(
    "`eval` and `new Function` construct programs at runtime. Nothing static " +
      "can analyse a program that does not exist until the moment it runs. " +
      "This is not a corner case in the JavaScript ecosystem — it is how many " +
      "template engines, ORMs, and serialisers work.",
  );

  blank();
  table(
    ["obstacle", "why it is not decidable", "what a real checker does"],
    [
      ["value depends on I/O", "the input is not in the program", "reason about ALL possibilities (unions)"],
      ["reachability", "reduces to the halting problem", "over-approximate; check everything"],
      ["dynamic member names", "the name is a runtime value", "index signatures / `unknown`"],
      ["eval / new Function", "the program does not exist yet", "give up; return `any`"],
      ["arbitrary invariants", "Rice's theorem", "check types, not correctness"],
    ],
  );
  note(
    "Every row in the right-hand column is a COMPROMISE. The TypeScript twin " +
      "shows which compromises TypeScript chose, and where you can watch the " +
      "compiler run out of budget and say so.",
  );
}
