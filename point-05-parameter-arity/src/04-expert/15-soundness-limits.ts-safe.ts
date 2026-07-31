/**
 * 15-soundness-limits — THE TYPESCRIPT VERSION (checked, and where checking ENDS)
 * ---------------------------------------------------------------------------
 * Every other demo in this project ends with a compile-time rejection. This
 * one is different on purpose: it shows FOUR ways to make TypeScript
 * COMPILE a call with the wrong arity that still misbehaves at runtime —
 * `as`, `any`, `Function`, and `.apply` with an untyped array — and then
 * the one disciplined fix that actually closes the hole: validating the
 * array's LENGTH at the boundary, before trusting it as a tuple.
 *
 * This is not a bug in TypeScript. `as` and `any` are ESCAPE HATCHES the
 * language deliberately provides for the cases a static type system cannot
 * decide (parsed CLI input, `unknown` third-party data) — but every escape
 * hatch is a place where the compiler's guarantee stops applying.
 */

import { section, ts, good, warn, note, table, blank, callableTrace, detonate, runtimeSays } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

function move(dx: number, dy: number): string {
  return `moved by (${dx}, ${dy})`;
}

function parseCoordinateFlags(rawFlags: string): number[] {
  return rawFlags
    .split(" ")
    .filter((f) => f.includes("="))
    .map((f) => Number(f.split("=")[1]));
}

export function runSafe(): void {
  section("Hole #1 — `as`: asserting a tuple length instead of proving it");

  const badArgs = parseCoordinateFlags("--dx=5"); // length 1, but we're about to LIE
  ts("move(...(badArgs as [number, number]))");
  callableTrace([
    ["badArgs", "number[]", "n/a (not callable)", "REAL length: 1"],
    ["badArgs as [number, number]", "[number, number]", "n/a (not callable)", "ASSERTED length: 2 — nothing verifies this"],
  ]);
  detonate("move(...(badArgs as [number, number]))", () => move(...(badArgs as [number, number])));
  runtimeSays(
    "'moved by (5, undefined)' — compiled cleanly, still wrong",
    "`as [number, number]` told the compiler 'trust me, this array has " +
      "exactly two elements.' The compiler trusted it — TS2556 (demo 10) " +
      "never fires, because as far as the TYPE is concerned, this IS a " +
      "tuple now. The actual array underneath is still length 1.",
  );

  blank();
  section("Hole #2 — `any`: no arity to check against, ever");

  ts("let dynamicMove: any = move; dynamicMove(1, 2, 3, 4, 5)");
  const dynamicMove: any = move;
  detonate("dynamicMove(1, 2, 3, 4, 5)", () => dynamicMove(1, 2, 3, 4, 5));
  runtimeSays(
    "'moved by (1, 2)' — extra arguments silently accepted, no error at all",
    "`any` has no parameter list to check a call's arity against — TS2554 " +
      "(demo 01/02) requires a KNOWN signature to compare a call to; `any` " +
      "is not a known signature, it is the absence of one.",
  );

  blank();
  section("Hole #3 — `Function`: callable, arity and types both erased");

  function invokeWide(fn: Function, ...args: unknown[]): unknown {
    return fn(...args);
  }
  ts("invokeWide(move, 1)  — move needs 2 arguments, Function does not know that");
  detonate("invokeWide(move, 1)", () => invokeWide(move, 1));
  runtimeSays(
    "'moved by (1, undefined)' — compiled cleanly, still wrong",
    "`Function`'s call signature is `(...args: any[]) => any` — EVERY " +
      "argument is `any`, so `invokeWide` cannot check `args` against " +
      "'move's real parameter list; it doesn't have access to it anymore.",
  );

  blank();
  section("Hole #4 — `.apply` with arguments typed `any` at an I/O boundary");

  // Parsed straight from a config file via JSON.parse, which returns `any`
  // — exactly the boundary demo 14 in point-04 dissects. `strictBindCallApply`
  // DOES check `.apply`'s argument list against move's real parameter
  // tuple — but only when that argument list has a real, non-`any` type.
  const argsFromConfig: any = JSON.parse('[5]');
  ts("move.apply(null, argsFromConfig)  — argsFromConfig: any, length unknown, unchecked");
  detonate("move.apply(null, argsFromConfig)", () => move.apply(null, argsFromConfig));
  runtimeSays(
    "'moved by (5, undefined)' — compiled cleanly, still wrong",
    "`strictBindCallApply` (enabled in this project) DOES type-check " +
      "`.apply`'s argument list against 'move's real parameter tuple — " +
      "try replacing `argsFromConfig` with a plain `number[]` and the call " +
      "fails to compile (a real array's length is never assignable to a " +
      "fixed-length tuple). The hole only reopens once the array's type is " +
      "`any`, exactly as `JSON.parse` returns it: `any` is assignable to " +
      "ANY expected argument tuple, arity included, because `any` disables " +
      "checking rather than passing it.",
  );

  blank();
  section("The actual fix: validate the LENGTH at the boundary");

  function isPair(args: number[]): args is [number, number] {
    return args.length === 2;
  }

  function safeMove(rawFlags: string): string | undefined {
    const args = parseCoordinateFlags(rawFlags);
    if (isPair(args)) {
      return move(...args); // narrowed to [number, number] — a REAL tuple now
    }
    return undefined;
  }

  const rejected = safeMove("--dx=5");
  if (rejected === undefined) {
    good('safeMove("--dx=5") → undefined — the malformed flag string was REJECTED, not trusted.');
  }

  const accepted = safeMove("--dx=5 --dy=-3");
  proveType<string | undefined>()(accepted, "string | undefined", "isPair() proved the array's length before move() was ever called");
  good(`safeMove("--dx=5 --dy=-3") → ${JSON.stringify(accepted)}`);

  blank();
  table(
    ["hole", "how it compiles cleanly", "why the compiler cannot see the wrong arity"],
    [
      ["`as [number, number]`", "the assertion is accepted unconditionally", "`as` overrides checking; it is not a runtime check"],
      ["`any`", "no parameter list to check a call's arity against", "`any` has no arity to violate"],
      ["`Function`", "(...args: any[]) => any accepts any count", "the real parameter list is inaccessible once erased to Function"],
      ["`.apply` with number[]", "the array's TYPE carries no length", "arity checking needs a tuple; a plain array type provides none"],
    ],
  );
  warn(
    "TypeScript proves things about the code you wrote against the types " +
      "you declared. It cannot prove anything about an argument list whose " +
      "LENGTH was merely asserted at a boundary it does not control — the " +
      "fix is always the same: verify the length (a type predicate like " +
      "`isPair`) BEFORE the first `as`, never after.",
  );
}
