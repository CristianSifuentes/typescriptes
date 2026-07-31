/**
 * 01-too-few-arguments — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `greet(name: string)` declares ONE required parameter — manifesto §1's
 * "minimum arity 1." A call supplying zero arguments fails the compiler's
 * COUNT check (manifesto §3, step 2) before it ever asks whether any
 * argument's type is right, because there IS no argument yet to check.
 * The diagnostic, TS2554, names the exact expected/actual counts.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

function greet(name: string): string {
  return `Hello, ${name.toUpperCase()}!`;
}

export function runSafe(): void {
  section("The declared parameter list, and its arity");
  callableTrace([
    ["greet", "(name: string) => string", "1 required parameter: name: string", "minimum arity 1, maximum arity 1"],
  ]);

  blank();
  section("Calling with zero arguments");

  ts("greet()");
  compileTimeOnly(() => {
    // @ts-expect-error TS2554: Expected 1 arguments, but got 0.
    greet();
  });
  compilerSays(
    "TS2554",
    "Expected 1 arguments, but got 0.",
    "This is a pure COUNTING failure — the compiler never even reaches the " +
      "question 'is the argument's type right', because there is no " +
      "argument at position 0 to ask that question about. The error fires " +
      "the instant the call is written, not three lines into a function " +
      "body that assumed 'name' was real.",
  );

  blank();
  section("The correct call");

  const result = greet("Ada");
  proveType<string>()(result, "string", "name really is a string — .toUpperCase() is guaranteed to exist");
  good(`greet("Ada") → ${JSON.stringify(result)}`);

  blank();
  table(
    ["call", "arguments supplied", "required", "outcome"],
    [
      ['greet("Ada")', "1", "1", "compiles, runs correctly"],
      ["greet()", "0", "1", "TS2554 — rejected before it runs"],
    ],
  );
  note(
    "The JavaScript crash happened INSIDE 'greet', on whatever line first " +
      "touched the missing value. TypeScript's rejection happens AT THE " +
      "CALL — the exact line a human reviewing the diff would also need to " +
      "look at first.",
  );
}
