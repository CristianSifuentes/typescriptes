/**
 * type-assert.ts — turning compiler beliefs into checkable evidence.
 *
 * PROBLEM
 * -------
 * A type is a *compile-time* object. By the time your program runs, every
 * type annotation has been erased. So when a tutorial writes
 *
 *     console.log("here TypeScript knows the property list is X");
 *
 * that sentence is unverified folklore.
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
 * The `(<T>() => T extends X ? 1 : 2)` shape compares two deferred
 * conditional types structurally, by identity of their check type, rather
 * than by mutual assignability — which would wrongly equate `any` with
 * everything.
 */
export type Equals<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

/**
 * A compile-time assertion. `type _ = Expect<Equals<A, B>>` fails to compile
 * (TS2344) when A ≠ B.
 */
export type Expect<T extends true> = T;

/** Assert assignability rather than equality (subtyping, not identity). */
export type ExpectAssignable<Narrow, Wide> = Narrow extends Wide ? true : false;

/**
 * Assert that a type's own, declared keys are EXACTLY the given union — the
 * type-level equivalent of "these and only these are valid property names".
 */
export type ExpectKeys<T, K extends string> = Equals<keyof T, K>;

/** The witness argument used by `proveType`; no expression can produce `never`. */
type ImpossibleWitness<_Actual, _Expected> = never;

/**
 * Prove *and* print what the compiler believes about a value at this exact
 * program point.
 *
 *     const parsed = proveType<Order>()(order, "Order", "returned by loadOrder");
 *
 * - Compile time: `Actual` is inferred from the value. If it is not *exactly*
 *   `Expected`, the extra `never` parameter becomes mandatory and the build
 *   breaks.
 * - Runtime: a row is printed showing the value and the proved type.
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
    const suffix = why ? `  \u001b[90m// ${why}\u001b[0m` : "";
    console.log(
      `    \u001b[2m│\u001b[0m \u001b[36m${renderedType.padEnd(24)}\u001b[0m ${shown}${suffix}`,
    );
    return value;
  };
}

/**
 * Runtime-visible header for a `proveType` block, so the console output reads
 * like a compiler trace rather than a pile of logs.
 */
export function proofBlock(title: string): void {
  console.log(`    \u001b[2m┌─ proved by the type checker: ${title}\u001b[0m`);
}
