/**
 * EVIDENCE FIXTURE — level 04 (expert)
 * Compiled only by `tsconfig.evidence.json`. Run: `npm run evidence`
 *
 * This fixture is unusual: several specimens below produce NO diagnostic, and
 * that is precisely what they are here to demonstrate. They are the soundness
 * holes — places where the compiler accepts a program it cannot justify. Each
 * is marked "NO DIAGNOSTIC (by design)".
 */

// ===========================================================================
// 12 — SOUNDNESS: what `as` does and does not check
// ===========================================================================

interface Customer {
  readonly id: string;
  readonly email: string;
}

declare const raw: unknown;

/** NO DIAGNOSTIC (by design). `as` is an ASSERTION, not a conversion: it
 *  overrides the checker's judgement and emits no runtime check whatsoever.
 *  Every downstream use of `trusted` is now checked against a claim nobody
 *  verified. */
const trusted = raw as Customer;
const emailLength = trusted.email.length; // will throw at runtime if raw is {}

/** TS2352: Conversion of type 'number' to type 'Customer' may be a mistake
 *  because neither type sufficiently overlaps with the other. If this was
 *  intentional, convert the expression to 'unknown' first. */
declare const count: number;
const absurd = count as Customer;

/** NO DIAGNOSTIC (by design). Double assertion through `unknown` defeats even
 *  the overlap check. This is the universal escape hatch. */
const laundered = count as unknown as Customer;

/** NO DIAGNOSTIC (by design). `any` disables checking entirely — including
 *  member resolution, arity, and assignability. */
declare const loose: any;
const anythingGoes: number = loose.whatever.deeply.nested(1, 2, 3);

/** NO DIAGNOSTIC (by design). `JSON.parse` is declared `(text: string) => any`,
 *  because no compiler can know the shape of bytes from a network. */
const parsed = JSON.parse('{"id":1}');
const alsoAnything: Customer = parsed;

/** NO DIAGNOSTIC (by design). Method parameter positions are BIVARIANT, a
 *  deliberate unsoundness kept for ergonomics (chiefly for arrays and DOM
 *  event handlers). The strictFunctionTypes flag does NOT apply to members
 *  declared with method syntax. */
interface Handler {
  handle(event: { kind: string }): void;
}
const specific: Handler = {
  handle(event: { kind: string; detail: string }) {
    return void event.detail.length; // `detail` may be absent at runtime
  },
};

/** TS2322: strictFunctionTypes DOES apply to properties declared with function
 *  syntax — the same relation, checked contravariantly. */
interface HandlerAsProperty {
  handle: (event: { kind: string }) => void;
}
const specificProperty: HandlerAsProperty = {
  handle: (event: { kind: string; detail: string }) => void event.detail.length,
};

/** NO DIAGNOSTIC (by design). `readonly` is not deep and is not enforced
 *  through aliases: a mutable alias of the same object may still write. */
interface Config {
  readonly retries: number;
}
const mutable = { retries: 3 };
const frozen: Config = mutable;
mutable.retries = 99; // `frozen.retries` is now 99

/** TS4104: The type 'readonly number[]' is 'readonly' and cannot be assigned
 *  to the mutable type 'number[]'. — the reverse direction IS checked. Note the
 *  asymmetry with the `Config` case above: readonly-ness of an ARRAY is part of
 *  the type relation, readonly-ness of a PROPERTY is not. */
const readonlyList: readonly number[] = [1, 2, 3];
const mutableList: number[] = readonlyList;

// ===========================================================================
// 14 — EXHAUSTIVE MAPS
// ===========================================================================

type Channel = "email" | "sms" | "push";

/** TS2741 / TS2739: a Record keyed by a union must supply EVERY key. */
const templates: Record<Channel, string> = {
  email: "e",
  sms: "s",
};

/** TS2741: Property 'push' is missing in type '{ email: string; sms: string; }'
 *  but required in type 'Record<Channel, string>'.
 *  `satisfies` checks the value against a type WITHOUT widening it: the missing
 *  key is caught while the literal keeps its precise type. */
const partial = {
  email: "e",
  sms: "s",
} satisfies Record<Channel, string>;

// ===========================================================================
// 15 — RECURSION LIMITS AND UNDECIDABILITY
// ===========================================================================

/** TS2589: Type instantiation is excessively deep and possibly infinite.
 *  The checker enforces a hard recursion budget because type-level computation
 *  in TypeScript is Turing-complete: without a budget, `tsc` could loop
 *  forever on a well-formed program. */
type BuildTuple<N extends number, Acc extends unknown[] = []> = Acc["length"] extends N
  ? Acc
  : BuildTuple<N, [...Acc, unknown]>;
type Enormous = BuildTuple<5000>;
declare const enormous: Enormous;

export const evidence = {
  trusted,
  emailLength,
  absurd,
  laundered,
  anythingGoes,
  alsoAnything,
  specific,
  specificProperty,
  frozen,
  mutableList,
  templates,
  partial,
  enormous,
};
