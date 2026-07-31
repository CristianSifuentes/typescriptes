/**
 * 11-overload-arity-resolution — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `schedule` declares THREE overload signatures, distinguished purely by
 * ARITY (1, 2, or 3 parameters) rather than by differing types at the same
 * position. A call is checked against each declared arity in turn
 * (point-04's manifesto §3, overload resolution, specialised here to counts
 * instead of types); a call whose argument COUNT matches none of them is
 * rejected outright — TS2575 — regardless of what the wider implementation
 * signature underneath could technically accept.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

// Overload signatures — the ONLY arities callers may use:
function schedule(task: () => string): string;
function schedule(task: () => string, delayMs: number): string;
function schedule(task: () => string, delayMs: number, repeat: boolean): string;
// Implementation signature — wider, never directly callable:
function schedule(task: () => string, delayMs?: number, repeat?: boolean): string {
  const effectiveDelay = delayMs ?? 0;
  const effectiveRepeat = repeat ?? false;
  return `scheduled (delay=${effectiveDelay}, repeat=${effectiveRepeat}): ${task()}`;
}

export function runSafe(): void {
  section("Three overloads, distinguished by ARITY");
  callableTrace([
    ["schedule", "(task: () => string) => string", "overload 1 — arity 1", "just the task"],
    ["schedule", "(task, delayMs: number) => string", "overload 2 — arity 2", "task + delay"],
    ["schedule", "(task, delayMs, repeat: boolean) => string", "overload 3 — arity 3", "task + delay + repeat"],
  ]);

  blank();
  section("Calling with a FOURTH argument that matches no overload's arity");

  ts("schedule(() => 'ran', 500, true, 'high')");
  compileTimeOnly(() => {
    // @ts-expect-error TS2575: No overload expects 4 arguments, but
    // overloads do exist that expect either 2 or 3 arguments.
    schedule(() => "ran", 500, true, "high");
  });
  compilerSays(
    "TS2575",
    "No overload expects 4 arguments, but overloads do exist that expect " +
      "either 2 or 3 arguments.",
    "The compiler tried EVERY declared overload's ARITY against the " +
      "supplied count (4) and found no match — even though the wider " +
      "implementation signature could technically ignore the 4th argument " +
      "the way the JavaScript version silently did. Declaring overloads " +
      "means the public contract is EXACTLY the listed arities, nothing " +
      "wider, no matter what the implementation could survive.",
  );

  blank();
  section("Calling in each declared arity");

  const one = schedule(() => "ran");
  proveType<string>()(one, "string", "matched overload 1 — arity 1");
  good(`schedule(() => "ran") → ${JSON.stringify(one)}`);

  const two = schedule(() => "ran", 500);
  proveType<string>()(two, "string", "matched overload 2 — arity 2");
  good(`schedule(() => "ran", 500) → ${JSON.stringify(two)}`);

  const three = schedule(() => "ran", 500, true);
  proveType<string>()(three, "string", "matched overload 3 — arity 3");
  good(`schedule(() => "ran", 500, true) → ${JSON.stringify(three)}`);

  blank();
  table(
    ["arguments supplied", "matches a declared overload's arity?", "outcome"],
    [
      ["1", "yes — overload 1", "compiles"],
      ["2", "yes — overload 2", "compiles"],
      ["3", "yes — overload 3", "compiles"],
      ["4", "no", "TS2575 — rejected, no silent discard"],
    ],
  );
  note(
    "If 'schedule' genuinely needed a 4th, 'priority' argument, the FIX is " +
      "adding a FOURTH overload signature on purpose — visibly, in one " +
      "place — rather than letting an arity nobody designed for compile by " +
      "accident.",
  );
}
