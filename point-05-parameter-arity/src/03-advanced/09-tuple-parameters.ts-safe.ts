/**
 * 09-tuple-parameters — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `type Point = [x: number, y: number]` is a LABELED TUPLE — an array type
 * with a fixed, known LENGTH baked into the type itself, unlike `number[]`
 * (any length). Assigning a malformed literal into a `Point` fails at
 * construction, before it can ever be spread into a call; and spreading a
 * genuine `Point` into `drawLine` is checked positionally, arity included,
 * because the compiler can see exactly how many elements a tuple contributes.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

type Point = [x: number, y: number];

function drawLine(x1: number, y1: number, x2: number, y2: number): string {
  return `line from (${x1},${y1}) to (${x2},${y2})`;
}

export function runSafe(): void {
  section("A tuple type's fixed length, vs. a plain array's unbounded one");
  callableTrace([
    ["Point", "[x: number, y: number]", "n/a (not callable)", "a FIXED length of exactly 2, unlike number[]"],
    ["drawLine", "(x1, y1, x2, y2: number) => string", "minimum/maximum arity 4", "...point spreads exactly 2 elements when point: Point"],
  ]);

  blank();
  section("Constructing a malformed point");

  ts("const badPoint: Point = [30];");
  compileTimeOnly(() => {
    // @ts-expect-error TS2322: Type '[number]' is not assignable to type
    // 'Point'. Source has 1 element(s) but target requires 2.
    const badPoint: Point = [30];
    void badPoint;
  });
  compilerSays(
    "TS2322",
    "Type '[number]' is not assignable to type 'Point'. Source has 1 " +
      "element(s) but target requires 2.",
    "The malformed array is rejected at CONSTRUCTION — long before it " +
      "could ever be spread into 'drawLine'. A tuple type's LENGTH is part " +
      "of the type, so a literal with the wrong number of elements fails " +
      "assignability exactly like a value of the wrong element TYPE would.",
  );

  blank();
  section("Spreading only ONE point into a 4-parameter call");

  const point: Point = [10, 20];
  ts("drawLine(...point)  — 2 elements spread, drawLine needs 4");
  compileTimeOnly(() => {
    // @ts-expect-error TS2554: Expected 4 arguments, but got 2.
    drawLine(...point);
  });
  compilerSays(
    "TS2554",
    "Expected 4 arguments, but got 2.",
    "Because `point`'s type is a TUPLE, the compiler knows PRECISELY how " +
      "many arguments `...point` contributes — 2, not 'some unknown " +
      "number' the way `...(point as number[])` would. Arity checking " +
      "(manifesto §3, step 2) applies to spread arguments exactly as it " +
      "does to individually written ones.",
  );

  blank();
  section("The correct call: two well-formed points, spread together");

  const start: Point = [10, 20];
  const end: Point = [30, 40];
  const result = drawLine(...start, ...end);
  proveType<string>()(result, "string", "2 + 2 = 4 elements spread, matching drawLine's arity exactly");
  good(`drawLine(...start, ...end) → ${JSON.stringify(result)}`);

  blank();
  table(
    ["expression", "elements contributed", "known at compile time?"],
    [
      ["...([10, 20] as number[])", "unknown — any length", "no — arity checking degrades to 'unknown'"],
      ["...([10, 20] as Point)", "exactly 2", "yes — arity checking applies precisely"],
    ],
  );
  note(
    "The fix is never 'be more careful with array literals' — it's giving " +
      "the array a TUPLE type so its length becomes part of what the " +
      "compiler already checks everywhere else. Demo 10 develops the same " +
      "idea for spreading arguments in general.",
  );
}
