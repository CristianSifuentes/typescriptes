/**
 * 11-positional-assignability — THE COMPILER'S MENTAL MODEL
 * ---------------------------------------------------------------------------
 * What the checker is holding in its hands when it looks at `f(a, b)`.
 *
 * THE CALL RULE, stated formally. For a call `f(a₀, …, aₙ₋₁)` against a
 * signature `(p₀: T₀, …, pₘ₋₁: Tₘ₋₁) => R`:
 *
 *     Γ ⊢ aᵢ : Sᵢ        for each i
 *     Sᵢ <: Tᵢ           for each i          ("Sᵢ is assignable to Tᵢ")
 *     n within arity(signature)
 *     ─────────────────────────────────────
 *     Γ ⊢ f(a₀, …, aₙ₋₁) : R
 *
 * Everything in this project is a consequence of the second premise, and of one
 * fact about it: `<:` relates TYPES, and nothing else. Not names, not
 * intentions, not documentation. If `Sᵢ` and `Tᵢ` are the same type, the
 * premise holds no matter what the two positions MEAN.
 *
 * This demo makes the machinery inspectable using the type system itself:
 * `Parameters<T>` extracts the parameter list as a tuple, so we can ask the
 * compiler what it demands at each position — and ask it, directly, whether two
 * positions are distinguishable.
 */

import {
  section,
  ts,
  good,
  warn,
  note,
  compilerSays,
  positionTrace,
  table,
  blank,
  compileTimeOnly,
} from "../99-runner/trace.js";
import { proveType, proofBlock, type Equals, type Expect } from "../99-runner/type-assert.js";

declare const brand: unique symbol;
type Brand<T, K extends string> = T & { readonly [brand]: K };
type Width = Brand<number, "Width">;
type Height = Brand<number, "Height">;

const unbranded = (width: number, height: number): number => width / height;
const branded = (width: Width, height: Height): number => width / height;

// ===========================================================================
// THE PARAMETER LIST, AS AN INSPECTABLE VALUE
// ===========================================================================

type UnbrandedParams = Parameters<typeof unbranded>; // [width: number, height: number]
type BrandedParams = Parameters<typeof branded>; // [width: Width, height: Height]

/** A type-level predicate: "can the compiler tell these two positions apart?" */
type PositionsAreDistinguishable<F extends (...args: never[]) => unknown> =
  Equals<Parameters<F>[0], Parameters<F>[1]> extends true ? false : true;

/** The blind spot and its remedy, as two compile-time assertions. */
type _UnbrandedIsBlind = Expect<Equals<PositionsAreDistinguishable<typeof unbranded>, false>>;
type _BrandedIsNot = Expect<Equals<PositionsAreDistinguishable<typeof branded>, true>>;

export function runSafe(): void {
  // =========================================================================
  // 1. THE RULE, AND THE ONE FACT ABOUT IT THAT MATTERS
  // =========================================================================
  section("The call rule, and why it is blind to meaning");

  note("    Γ ⊢ aᵢ : Sᵢ   and   Sᵢ <: Tᵢ   for every i   ⟹   the call is well-typed");
  note("");
  note(
    "    `<:` relates TYPES. Not names, not intentions, not JSDoc. If Sᵢ and " +
      "Tᵢ are the same type, the premise holds no matter what the two " +
      "positions MEAN. That single sentence contains the entire blind spot.",
  );

  // =========================================================================
  // 2. ASKING THE COMPILER DIRECTLY
  // =========================================================================
  blank();
  section("Interrogating the signature with `Parameters<T>`");

  note("    type PositionsAreDistinguishable<F> =");
  note("      Equals<Parameters<F>[0], Parameters<F>[1]> extends true ? false : true;");
  note("");
  note("    type _A = Expect<Equals<PositionsAreDistinguishable<typeof unbranded>, false>>;");
  note("    type _B = Expect<Equals<PositionsAreDistinguishable<typeof branded>,   true>>;");

  good(
    "Both aliases type-check at the top of this file. The compiler is stating, " +
      "on the record, that it CANNOT distinguish the positions of the " +
      "unbranded function and CAN distinguish those of the branded one. The " +
      "blind spot is not folklore — it is a fact the type system will confirm " +
      "on request.",
  );

  const dims: BrandedParams = [3 as Width, 10 as Height];
  proofBlock("the parameter list, extracted as a value");
  proveType<[width: Width, height: Height]>()(
    dims,
    "[width: Width, height: Height]",
    "Parameters<typeof branded>",
  );

  // =========================================================================
  // 3. THE TWO TRACES, SIDE BY SIDE
  // =========================================================================
  blank();
  section("The same check, on two signatures");

  note("    unbranded(10, 3) — the swap:");
  positionTrace([
    ["0", "width", "number", "10 → number", "✔ number <: number"],
    ["1", "height", "number", "3 → number", "✔ number <: number"],
  ]);
  note("    branded(height(10), width(3)) — the same swap:");
  positionTrace([
    ["0", "width", "Width", "height(10) → Height", "✘ Height ≮: Width"],
    ["1", "height", "Height", "width(3) → Width", "✘ (unreported — one per call)"],
  ]);
  note(
    "    The rule did not change. The TYPES did, and that is the only lever " +
      "the rule responds to.",
  );

  // =========================================================================
  // 4. WHERE THE CHECK LOOKS DIFFERENT — variance
  // =========================================================================
  blank();
  section("The same relation, one level up: comparing two FUNCTIONS");

  note(
    "    Checking a CALL compares arguments to parameters. Checking whether one " +
      "FUNCTION can stand in for another compares parameter lists to each " +
      "other — and there the relation flips direction.",
  );

  type Handler = (event: { kind: string }) => void;
  const specific = (event: { kind: string; detail: string }): void => void event.detail;

  ts("const h: Handler = specific;   // wants MORE than it is promised");
  compileTimeOnly(() => {
    // @ts-expect-error TS2322: Type '(event: { kind: string; detail: string; }) => void'
    // is not assignable to type 'Handler'.
    const h: Handler = specific;
    void h;
  });
  compilerSays(
    "TS2322",
    "Type '(event: { kind: string; detail: string; }) => void' is not " +
      "assignable to type 'Handler'.\n" +
      "    Types of parameters 'event' and 'event' are incompatible.",
    "PARAMETER POSITIONS ARE CONTRAVARIANT: a substitute may accept MORE than " +
      "promised, never less. `strictFunctionTypes` enforces this for function-" +
      "PROPERTY syntax — but members written with METHOD syntax stay bivariant, " +
      "a deliberate unsoundness kept so `Array<Dog>` works as `Array<Animal>`. " +
      "One character of syntax decides whether the check happens.",
  );

  // =========================================================================
  // 5. WHY NAMES CANNOT HELP, EVEN IN PRINCIPLE
  // =========================================================================
  blank();
  section("Could the compiler just compare parameter NAMES?");

  warn(
    "It is the obvious idea and it does not survive contact with the language.",
  );
  note("    (a) Names are not part of a function type. These two are the SAME type:");
  note("            type A = (width: number, height: number) => number;");
  note("            type B = (w: number, h: number) => number;");

  type A = (width: number, height: number) => number;
  type B = (w: number, h: number) => number;
  type _NamesAreNotPartOfTheType = Expect<Equals<A, B>>;
  note("        …proved by `Expect<Equals<A, B>>` at the top of this file.");

  note(
    "    (b) Arguments are EXPRESSIONS, not names. `f(a, b)` might be " +
      "`f(rect.w, rect.h)`, `f(xs[0], xs[1])`, or `f(compute(), 3)`. Most " +
      "arguments have no name to compare against.",
  );
  note(
    "    (c) Even where both have names, agreement is not correctness: " +
      "`transfer(payee, payer, n)` uses well-named variables in the wrong " +
      "order, and a name-matching heuristic would happily approve " +
      "`transfer(from, to, n)` where `from` holds the payee's id.",
  );
  good(
    "Which is why the remedy is not a cleverer checker but a better model: " +
      "encode the distinction in the TYPES, where the rule can already see it.",
  );

  // =========================================================================
  // 6. SUMMARY
  // =========================================================================
  blank();
  section("The mental model in one table");
  table(
    ["question", "JavaScript", "TypeScript"],
    [
      ["what is a function?", "an object with [[Call]]", "a value with one or more signatures"],
      ["what is a signature?", "none — `length` is metadata", "arity + a type per position + a return type"],
      ["is this call legal?", "always", "if Sᵢ <: Tᵢ at every i, and arity fits"],
      ["can f stand in for g?", "always", "params contravariant, return covariant"],
      ["is argument i right for parameter i?", "unaskable", "**the whole check**"],
      ["…if Sᵢ and Tᵢ are the same type?", "unaskable", "**yes, vacuously — the blind spot**"],
    ],
  );
}
