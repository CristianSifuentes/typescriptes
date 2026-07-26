/**
 * type-assert.ts — turning compiler beliefs into checkable evidence.
 *
 * PROBLEM
 * -------
 * A type is a *compile-time* object. By the time your program runs, every
 * type annotation has been erased. So when a tutorial writes
 *
 *     console.log("here TypeScript knows the value is a number");
 *
 * that sentence is unverified folklore: it is a string literal, and string
 * literals cannot be wrong at runtime — they can only be wrong in reality.
 *
 * SOLUTION
 * --------
 * Encode the claim as a type-level obligation the compiler must discharge.
 * If the compiler's belief differs from the claim, the project fails to
 * build. The printed trace then becomes a *rendering* of a proved fact
 * rather than a promise.
 */

/**
 * Exact type equality.
 *
 * Why the odd `(<T>() => T extends X ? 1 : 2)` shape? Because TypeScript
 * compares two *deferred* conditional types structurally, by identity of
 * their check type, rather than by mutual assignability. Mutual
 * assignability would wrongly report `any` as equal to everything, and
 * `string | number` as equal to `number | string`'s widened form. This
 * encoding distinguishes `any`, `unknown`, `never`, and each union member
 * exactly — which matters here, because coercion results are precisely the
 * `string | number | boolean` unions this project needs to tell apart.
 */
export type Equals<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

/**
 * A compile-time assertion. `type _ = Expect<Equals<A, B>>` fails to compile
 * (TS2344: "Type 'false' does not satisfy the constraint 'true'") when A ≠ B.
 */
export type Expect<T extends true> = T;

/** Assert assignability rather than equality (subtyping, not identity). */
export type ExpectAssignable<Narrow, Wide> = Narrow extends Wide ? true : false;

/**
 * The witness argument used by `proveType`. When the claimed type and the
 * real type disagree, the call site is required to supply a value of type
 * `never`, which no expression can produce. The compiler reports the
 * shortfall as TS2554 ("Expected N arguments, but got M").
 */
type ImpossibleWitness<_Actual, _Expected> = never;

/**
 * Prove *and* print what the compiler believes about a value at this exact
 * program point.
 *
 *     const total = proveType<number>()(onHand + row.incoming, "number", "both numeric");
 *
 * - Compile time: `Actual` is inferred from the value. If it is not
 *   *exactly* `Expected`, the extra `never` parameter becomes mandatory and
 *   the build breaks. The claim cannot rot.
 * - Runtime: a row is printed showing the value and the proved type.
 *
 * The value is returned unchanged, so the helper can be dropped into an
 * expression without perturbing control flow.
 */
export function proveType<Expected>() {
  return <Actual>(
    value: Actual,
    renderedType: string,
    why = "",
    ...witness: Equals<Actual, Expected> extends true
      ? []
      : [proof: ImpossibleWitness<Actual, Expected>]
  ): Actual => {
    void witness;
    const shown =
      typeof value === "string" ? JSON.stringify(value) : String(value as unknown);
    const suffix = why ? `  [90m// ${why}[0m` : "";
    console.log(
      `    [2m│[0m [36m${renderedType.padEnd(24)}[0m ${shown}${suffix}`,
    );
    return value;
  };
}

/**
 * Runtime-visible header for a `proveType` block, so the console output reads
 * like a compiler trace rather than a pile of logs.
 */
export function proofBlock(title: string): void {
  console.log(`    [2m┌─ proved by the type checker: ${title}[0m`);
}
