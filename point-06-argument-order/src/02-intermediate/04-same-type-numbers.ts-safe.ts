/**
 * 04-same-type-numbers — THE TYPESCRIPT VERSION
 * ---------------------------------------------------------------------------
 * The `.ts-safe` file that is not safe.
 *
 * Every other demo in this project puts `// @ts-expect-error` above the bad
 * call. This one cannot: there is no error to expect. The file compiles under
 * `strict: true` with every strict flag enabled, and it produces the wrong
 * answer at runtime — which is exactly the point being made.
 *
 * WHY, precisely.
 *
 * Assignability compares TYPES. For `aspectRatio(width: number, height: number)`
 * the check at each position is `number → number`, which succeeds at both
 * positions in both orderings. The types agree; only the MEANING differs, and
 * meaning is not part of a type in a STRUCTURALLY TYPED system.
 *
 *   > Structural typing: two types are compatible when their shapes are
 *   > compatible. A type's identity is its structure, not its declared name.
 *
 * `width: number` and `height: number` have identical structure. To TypeScript
 * they are THE SAME TYPE — not "confusingly similar", the same. That is what
 * `number` means: the set of all IEEE-754 doubles, with no further distinction.
 *
 * So this is not the compiler being lax, and it is not a gap that a future
 * release will close. It is a direct consequence of the type-identity rule.
 * The only way out is to stop writing two parameters of the same type, which is
 * demo 07.
 */

import {
  section,
  ts,
  bad,
  warn,
  note,
  good,
  positionTrace,
  table,
  blank,
  detonate,
} from "../99-runner/trace.js";
import { proveType, proofBlock, type Equals, type Expect } from "../99-runner/type-assert.js";

const aspectRatio = (width: number, height: number): number => width / height;
const areaOfRectangle = (width: number, height: number): number => width * height;
const orientationOf = (width: number, height: number): "landscape" | "portrait" | "square" =>
  width > height ? "landscape" : width < height ? "portrait" : "square";
const cropTo = (x: number, y: number, width: number, height: number): string =>
  `${width}x${height}+${x}+${y}`;

/**
 * A compile-time proof of the blind spot itself.
 *
 * `Equals<A, B>` is `true` when the compiler considers A and B the SAME type.
 * The alias below type-checks — which means the compiler agrees that the type
 * of the `width` parameter and the type of the `height` parameter are
 * identical. The blind spot is not an observation about behaviour; it is a
 * fact the type system will confirm on request.
 */
type WidthParam = Parameters<typeof aspectRatio>[0];
type HeightParam = Parameters<typeof aspectRatio>[1];
type _TheBlindSpot = Expect<Equals<WidthParam, HeightParam>>;

export function runSafe(): void {
  // =========================================================================
  // 1. THE PROOF
  // =========================================================================
  section("The blind spot, proved rather than asserted");

  note(
    "    type WidthParam  = Parameters<typeof aspectRatio>[0];   // number",
  );
  note("    type HeightParam = Parameters<typeof aspectRatio>[1];   // number");
  note("    type _Proof = Expect<Equals<WidthParam, HeightParam>>;  // compiles!");
  good(
    "That alias type-checks at the top of this file. The compiler is telling " +
      "us, on the record, that the two parameter types are IDENTICAL. It has " +
      "nothing to compare, so it has nothing to report.",
  );

  // =========================================================================
  // 2. THE SWAP THAT COMPILES
  // =========================================================================
  blank();
  section("The swap, accepted");

  const intended = aspectRatio(3, 10);
  const swapped = aspectRatio(10, 3);

  proofBlock("both calls, both well-typed");
  proveType<number>()(intended, "number", "aspectRatio(width, height)");
  proveType<number>()(swapped, "number", "aspectRatio(height, width) — no error");

  blank();
  detonate("aspectRatio(3, 10)  — a portrait image", () => intended);
  detonate("aspectRatio(10, 3)  — the same image, swapped", () => swapped);
  bad(
    "0.3 versus 3.3333. Compiled under `strict: true`, no diagnostic, no " +
      "`@ts-expect-error` on either line because neither line has an error.",
  );

  ts("orientationOf(10, 3)   // the classification inverts");
  detonate("orientationOf(3, 10)", () => orientationOf(3, 10));
  detonate("orientationOf(10, 3)", () => orientationOf(10, 3));
  bad('"portrait" became "landscape" — a wrong string, not a NaN, not a crash.');

  // =========================================================================
  // 3. WHAT THE COMPILER SEES AT EACH POSITION
  // =========================================================================
  blank();
  section("The position trace, and the column that has gone blank");

  note("    aspectRatio(3, 10) — the intended call:");
  positionTrace([
    ["0", "width", "number", "3 (number)", "✔ assignable"],
    ["1", "height", "number", "10 (number)", "✔ assignable"],
  ]);

  note("    aspectRatio(10, 3) — the swapped call:");
  positionTrace([
    ["0", "width", "number", "10 (number)", "✔ assignable — nothing to object to"],
    ["1", "height", "number", "3 (number)", "✔ assignable — nothing to object to"],
  ]);

  warn(
    "Compare with demo 01's trace, where one row read '✘ TS2345'. The check " +
      "still ran at both positions; it simply had nothing to say. The " +
      "information the compiler would need — that position 0 means WIDTH — was " +
      "never written down in a form it can read.",
  );

  // =========================================================================
  // 4. THE COMMUTATIVITY TRAP
  // =========================================================================
  blank();
  section("Why developers stop worrying about this");

  detonate("areaOfRectangle(3, 10)", () => areaOfRectangle(3, 10));
  detonate("areaOfRectangle(10, 3)", () => areaOfRectangle(10, 3));
  note(
    "Identical — multiplication is commutative, so this swap genuinely does " +
      "not matter. Most same-typed swaps a developer encounters are harmless " +
      "like this one, which teaches exactly the wrong lesson: 'width and " +
      "height are interchangeable, they're just numbers.'",
  );
  warn(
    "Then the same two values reach `/`, `>`, or a crop rectangle, and the " +
      "generalisation is suddenly false. The trap is not the dangerous case — " +
      "it is the long run of safe cases that precede it.",
  );

  // =========================================================================
  // 5. HOW BIG IS THE GAP
  // =========================================================================
  blank();
  section("The size of the accepted space");

  const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));
  detonate("orderings of cropTo(x, y, width, height)", () => `${factorial(4)} accepted`);
  detonate("of which correct", () => "1");
  detonate("crop A", () => cropTo(10, 20, 640, 480));
  detonate("crop B — same numbers, regrouped", () => cropTo(640, 480, 10, 20));

  blank();
  table(
    ["parameters of one type", "orderings accepted", "correct", "silently wrong"],
    [
      ["2", "2", "1", "1"],
      ["3", "6", "1", "5"],
      ["4", "24", "1", "23"],
      ["5", "120", "1", "119"],
    ],
  );
  note(
    "For n same-typed parameters the compiler accepts all n! orderings. This " +
      "is the strongest practical argument for options objects (demo 08): past " +
      "three parameters, position is a liability regardless of types.",
  );

  // =========================================================================
  // 6. WHAT IS STILL CAUGHT
  // =========================================================================
  blank();
  section("The blind spot is exactly and only 'same type, different meaning'");

  good(
    "As soon as ONE of the swapped parameters differs in type, positional " +
      "checking bites again — verified in the evidence lab, where " +
      "`createAccount(true, \"ada@example.com\", false)` is the single error in " +
      "an otherwise silent fixture.",
  );
  note(
    "    So the remedy suggests itself: if the check only works when the types " +
      "differ, MAKE THE TYPES DIFFER. Two numbers that mean different things " +
      "should be two different types. That is branding, and it is demo 07.",
  );
}
