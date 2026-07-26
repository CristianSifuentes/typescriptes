/**
 * EVIDENCE FIXTURE — level 03 (advanced)
 * ---------------------------------------------------------------------------
 * Excluded from `tsconfig.json`; compiled only by `tsconfig.evidence.json`
 * (`npm run evidence`). Every error below is real and unsuppressed.
 *
 * Expected outcome: compilation FAILS. That is the deliverable.
 */

// ===========================================================================
// 07 — TYPED LOOSE EQUALITY: THE HAND-BUILT OVERLAP CHECK
// ===========================================================================

type Coercible = string | number | boolean | null | undefined;
type Overlaps<A, B> = A extends B ? true : B extends A ? true : false;

function typedLooseEquals<A extends Coercible, B extends Coercible>(
  a: A,
  b: B,
  ...witness: Overlaps<A, B> extends true ? [] : [proof: never]
): boolean {
  void witness;
  return (a as unknown) === (b as unknown);
}

/** TS2554: Expected 3 arguments, but got 2 — boolean and string share no
 *  possible value, so `Overlaps` is `false` and the witness tuple `[proof:
 *  never]` becomes a mandatory third argument nothing can supply. */
typedLooseEquals(true, "yes");

/** TS2367: This comparison appears to be unintentional because the types
 *  'string' and 'number' have no overlap. Applies to === exactly as == . */
const literalMismatch = "1" === 1;

// ===========================================================================
// 08 — UNION TYPES MUST BE NARROWED BEFORE ARITHMETIC
// ===========================================================================

declare const weightGrams: string | number;
const runningTotal = 0;

/** TS2365: Operator '+' cannot be applied to types 'number' and 'string | number'. */
const total = runningTotal + weightGrams;

// ===========================================================================
// 09 — TEMPLATE LITERALS: THE GENUINE GAP (no error to reproduce here — see
// the note below the exports for why this section is intentionally absent)
// ===========================================================================

// ===========================================================================
// 10 — CUSTOM COERCION HOOKS: valueOf/toString, PER-OPERATOR POLICY
// ===========================================================================

class Money {
  readonly cents: number;
  constructor(cents: number) {
    this.cents = cents;
  }
  valueOf(): number {
    return this.cents;
  }
}

declare const price: Money;
declare const tax: Money;

/** TS2365: Operator '+' cannot be applied to types 'Money' and 'Money'. */
const summed = price + tax;

/** TS2367: This comparison appears to be unintentional because the types
 *  'Money' and 'number' have no overlap. valueOf() does not exempt this. */
const looksEqual = price == 1999;

// Relational comparison, included for contrast — this line produces NO
// diagnostic, because ordering operators trust `valueOf`. It is here so a
// reader of the evidence output can see its absence is not an oversight.
const isPriceCheaper = price < tax;

// Keep the bindings "used" so the only diagnostics reported are the type
// errors above rather than a wall of unused-variable noise.
export const evidence = {
  literalMismatch,
  total,
  summed,
  looksEqual,
  isPriceCheaper,
};
