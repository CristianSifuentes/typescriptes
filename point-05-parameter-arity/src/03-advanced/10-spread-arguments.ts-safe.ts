/**
 * 10-spread-arguments — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `move(dx: number, dy: number)` has a FIXED, non-rest parameter list — its
 * arity is exactly 2, not "2 or more." Spreading a value into a fixed-arity
 * call requires the compiler to know, statically, how many elements that
 * spread contributes. A plain `number[]` carries no such guarantee (its
 * length is not part of its type), so TypeScript refuses the spread
 * OUTRIGHT — TS2556 — rather than silently trusting an unknown count.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

function move(dx: number, dy: number): string {
  return `moved by (${dx}, ${dy})`;
}

export function runSafe(): void {
  section("Why a plain array cannot be spread into a fixed-arity call");
  callableTrace([
    ["move", "(dx: number, dy: number) => string", "minimum/maximum arity 2 — FIXED, no rest parameter", "a spread source must supply EXACTLY 2 elements, statically known"],
    ["offset: number[]", "number[]", "n/a (not callable)", "length is NOT part of the type — could be 0, 2, or 100 elements"],
  ]);

  blank();
  section("Spreading a plain array into move()");

  const offset: number[] = [5, -3, 0];
  ts("move(...offset)  — offset: number[], length unknown to the type system");
  compileTimeOnly(() => {
    // @ts-expect-error TS2556: A spread argument must either have a tuple
    // type or be passed to a rest parameter.
    move(...offset);
  });
  compilerSays(
    "TS2556",
    "A spread argument must either have a tuple type or be passed to a " +
      "rest parameter.",
    "This is a DIFFERENT failure from a plain arity mismatch (TS2554) — " +
      "the compiler isn't saying 'wrong count', it's saying it CANNOT " +
      "DETERMINE the count at all from `number[]`'s type, and refuses to " +
      "guess. Spreading into a FIXED parameter list requires a statically " +
      "known length — exactly what a tuple type provides and a plain " +
      "array type does not.",
  );

  blank();
  section("The fix: a tuple type gives the spread a known length");

  const tupleOffset: [number, number] = [5, -3];
  ts("move(...tupleOffset)  — tupleOffset: [number, number], length = 2, known statically");
  const result = move(...tupleOffset);
  proveType<string>()(result, "string", "the tuple's length (2) exactly matches move's arity (2)");
  good(`move(...tupleOffset) → ${JSON.stringify(result)}`);

  blank();
  section("Spreading into a REST parameter has no such restriction");

  function moveMany(...offsets: number[]): string {
    return `applied ${offsets.length} offset(s)`;
  }
  const many = moveMany(...offset); // offset: number[] — fine here, arity is unbounded
  proveType<string>()(many, "string", "moveMany's arity is [0, ∞) — any array length is valid, so `number[]` is fine to spread");
  good(`moveMany(...offset) → ${JSON.stringify(many)}`);

  blank();
  table(
    ["spread source", "target parameter list", "outcome"],
    [
      ["number[] → move(dx, dy)", "fixed arity 2", "TS2556 — length unknown, refused"],
      ["[number, number] → move(dx, dy)", "fixed arity 2", "compiles — length known, matches exactly"],
      ["number[] → moveMany(...offsets)", "unbounded arity [0, ∞)", "compiles — any length is valid here"],
    ],
  );
  note(
    "TS2556 is the compiler drawing a precise line: a spread is checkable " +
      "against a FIXED arity only when its source type proves a length. " +
      "Against an UNBOUNDED (rest) arity, any array length is legitimate, " +
      "so no such proof is required — the two rules are consistent, not " +
      "contradictory.",
  );
}
