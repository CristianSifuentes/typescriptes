/**
 * 02-misspelled-method — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `code.toUpperCasee()` fails at STEP 1 of the resolution order from the
 * manifesto: 'toUpperCasee' is not a member of `string`'s property map at
 * all, so the compiler never even reaches the question "is it callable?"
 * (step 2). This demo exists to draw the line precisely between Concept #3
 * (member existence — point-03) and Concept #4 (callability — this
 * project): a misspelled method fails as a Concept #3 defect FIRST, and the
 * "not a function" framing, while true at runtime, is not what the
 * compiler is actually checking here.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

function normalizeCode(code: string): string {
  // @ts-expect-error TS2551: Property 'toUpperCasee' does not exist on type
  // 'string'. Did you mean 'toUpperCase'?
  return code.toUpperCasee();
}

export function runSafe(): void {
  section("What the compiler believes is callable on a string");
  callableTrace([
    ["code.toUpperCase", "() => string", "(this: String) => string", "a real member of String.prototype"],
    ["code.toUpperCasee", "does not exist", "n/a — step 1 fails first", "no member to even ask 'is it callable?'"],
  ]);

  blank();
  section("The typo, caught at member resolution — before callability is even asked");

  const code = "spring24";
  ts("code.toUpperCasee()");
  compileTimeOnly(() => {
    // @ts-expect-error TS2551: Property 'toUpperCasee' does not exist on
    // type 'string'. Did you mean 'toUpperCase'?
    const result = code.toUpperCasee();
    void result;
  });
  compilerSays(
    "TS2551",
    "Property 'toUpperCasee' does not exist on type 'string'. Did you mean 'toUpperCase'?",
    "This is step 1 of the resolution order (manifesto §3): does 'string' " +
      "declare a member named 'toUpperCasee'? No. The compiler stops HERE — " +
      "it never asks 'is this member's type callable?' (step 2), because " +
      "there is no member to ask about. Concept #3's mechanism (point-03, " +
      "demo 01) is doing all the work in this specific failure.",
  );

  blank();
  section("The same typo, one function boundary away");

  ts("normalizeCode(...)  — the typo lives inside the function body");
  note("normalizeCode itself fails to compile (see the @ts-expect-error above) — it can never even be built into a callable that reaches a caller.");

  blank();
  section("The correct call");
  const fixed = code.toUpperCase();
  proveType<string>()(fixed, "string", "a real call signature, resolved against String.prototype");
  good(`code.toUpperCase() = "${fixed}"`);

  blank();
  table(
    ["expression", "which step fails", "diagnostic"],
    [
      ["code.toUpperCasee (read)", "step 1 — member existence", "TS2551"],
      ["code.toUpperCasee() (call)", "step 1 — never reaches step 2", "TS2551 (same diagnostic, same cause)"],
      ["code.toUpperCase() (correct)", "neither — both steps pass", "no diagnostic"],
    ],
  );
  note(
    "The lesson: not every JavaScript 'is not a function' crash is a " +
      "Concept #4 defect at its root. Many — like this one — are Concept #3 " +
      "typos that only BECOME a callability crash because the code " +
      "immediately invokes the (nonexistent) result. TypeScript's step-1 " +
      "check catches it before step 2 is ever relevant.",
  );
}
