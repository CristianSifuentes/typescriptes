/**
 * registry.ts — the index of every demo in the project.
 *
 * Each entry pairs the two halves of a demo:
 *   `broken` — the JavaScript version (`@ts-nocheck`), which runs and misbehaves
 *   `safe`   — the TypeScript version, which shows what the compiler rejected
 *
 * Keeping the list here (rather than scanning the filesystem) means the runner
 * is itself type-checked: a renamed or deleted demo is a compile error, not a
 * runtime surprise. Concept #1, applied to the project's own tooling.
 */

import { runBroken as broken01 } from "../01-basic/01-primitive-annotations.js-broken.js";
import { runSafe as safe01 } from "../01-basic/01-primitive-annotations.ts-safe.js";
import { runBroken as broken02 } from "../01-basic/02-string-number-coercion.js-broken.js";
import { runSafe as safe02 } from "../01-basic/02-string-number-coercion.ts-safe.js";
import { runBroken as broken03 } from "../01-basic/03-nonexistent-method.js-broken.js";
import { runSafe as safe03 } from "../01-basic/03-nonexistent-method.ts-safe.js";

import { runBroken as broken04 } from "../02-intermediate/04-function-signatures.js-broken.js";
import { runSafe as safe04 } from "../02-intermediate/04-function-signatures.ts-safe.js";
import { runBroken as broken05 } from "../02-intermediate/05-object-shapes.js-broken.js";
import { runSafe as safe05 } from "../02-intermediate/05-object-shapes.ts-safe.js";
import { runBroken as broken06 } from "../02-intermediate/06-typed-arrays.js-broken.js";
import { runSafe as safe06 } from "../02-intermediate/06-typed-arrays.ts-safe.js";

import { runBroken as broken07 } from "../03-advanced/07-control-flow-narrowing.js-broken.js";
import { runSafe as safe07 } from "../03-advanced/07-control-flow-narrowing.ts-safe.js";
import { runBroken as broken08 } from "../03-advanced/08-union-types.js-broken.js";
import { runSafe as safe08 } from "../03-advanced/08-union-types.ts-safe.js";
import { runBroken as broken09 } from "../03-advanced/09-type-guards.js-broken.js";
import { runSafe as safe09 } from "../03-advanced/09-type-guards.ts-safe.js";
import { runBroken as broken10 } from "../03-advanced/10-never-exhaustiveness.js-broken.js";
import { runSafe as safe10 } from "../03-advanced/10-never-exhaustiveness.ts-safe.js";

import { runBroken as broken11 } from "../04-expert/11-type-environment.js-broken.js";
import { runSafe as safe11 } from "../04-expert/11-type-environment.ts-safe.js";
import { runBroken as broken12 } from "../04-expert/12-soundness-holes.js-broken.js";
import { runSafe as safe12 } from "../04-expert/12-soundness-holes.ts-safe.js";
import { runBroken as broken13 } from "../04-expert/13-discriminated-unions.js-broken.js";
import { runSafe as safe13 } from "../04-expert/13-discriminated-unions.ts-safe.js";
import { runBroken as broken14 } from "../04-expert/14-assert-never.js-broken.js";
import { runSafe as safe14 } from "../04-expert/14-assert-never.ts-safe.js";
import { runBroken as broken15 } from "../04-expert/15-decidability-limits.js-broken.js";
import { runSafe as safe15 } from "../04-expert/15-decidability-limits.ts-safe.js";

export type Level = "01-basic" | "02-intermediate" | "03-advanced" | "04-expert";

export interface Demo {
  readonly id: string;
  readonly level: Level;
  readonly title: string;
  /** The single granular mechanism this demo isolates. */
  readonly feature: string;
  /** The diagnostics the demo demonstrates, for the final report. */
  readonly codes: readonly string[];
  readonly broken: () => void;
  readonly safe: () => void;
}

export const demos: readonly Demo[] = [
  {
    id: "01-primitives",
    level: "01-basic",
    title: "Primitive annotations",
    feature: "assignability of primitive types; rejection of incompatible assignments",
    codes: ["TS2322", "TS2363", "TS2551"],
    broken: broken01,
    safe: safe01,
  },
  {
    id: "02-coercion",
    level: "01-basic",
    title: '`"5" - 3` vs `"5" + 3`',
    feature: "operand-type rules for arithmetic operators; the overloaded `+`",
    codes: ["TS2362", "TS2363", "TS2365", "TS18050", "TS2322"],
    broken: broken02,
    safe: safe02,
  },
  {
    id: "03-nonexistent-method",
    level: "01-basic",
    title: "Calling a method that does not exist",
    feature: "static member resolution vs runtime prototype-chain lookup",
    codes: ["TS2339", "TS2551"],
    broken: broken03,
    safe: safe03,
  },
  {
    id: "04-function-signatures",
    level: "02-intermediate",
    title: "Function signatures",
    feature: "arity, argument position, return type, completeness of returns",
    codes: ["TS2554", "TS2345", "TS2322", "TS2366", "TS7006"],
    broken: broken04,
    safe: safe04,
  },
  {
    id: "05-object-shapes",
    level: "02-intermediate",
    title: "Object shapes",
    feature: "declared members, freshness / excess-property checking, optionality",
    codes: ["TS2339", "TS2551", "TS2741", "TS2561", "TS18048", "TS2375"],
    broken: broken05,
    safe: safe05,
  },
  {
    id: "06-typed-arrays",
    level: "02-intermediate",
    title: "Typed arrays and tuples",
    feature: "element homogeneity, mutation, index bounds, tuple arity",
    codes: ["TS2322", "TS2345", "TS2339", "TS2532", "TS2540"],
    broken: broken06,
    safe: safe06,
  },
  {
    id: "07-narrowing",
    level: "03-advanced",
    title: "Control flow analysis and narrowing",
    feature: "flow-sensitive typing: set subtraction along the control flow graph",
    codes: ["TS18047", "TS2339"],
    broken: broken07,
    safe: safe07,
  },
  {
    id: "08-unions",
    level: "03-advanced",
    title: "Union types",
    feature: "an operation is valid on a union only if valid for every member",
    codes: ["TS2339", "TS2362", "TS2345"],
    broken: broken08,
    safe: safe08,
  },
  {
    id: "09-type-guards",
    level: "03-advanced",
    title: "User-defined type guards",
    feature: "`value is T` and `asserts value is T`: runtime checks that narrow",
    codes: ["TS18046", "TS2677", "TS2339"],
    broken: broken09,
    safe: safe09,
  },
  {
    id: "10-never-exhaustiveness",
    level: "03-advanced",
    title: "`never` and exhaustiveness",
    feature: "the empty set as a proof of unreachability; exhaustive switches",
    codes: ["TS2345", "TS2322", "TS2678", "TS2367"],
    broken: broken10,
    safe: safe10,
  },
  {
    id: "11-type-environment",
    level: "04-expert",
    title: "The compiler's mental model",
    feature: "Γ, declaration spaces, widening, freshness, contextual typing",
    codes: ["TS1294"],
    broken: broken11,
    safe: safe11,
  },
  {
    id: "12-soundness-holes",
    level: "04-expert",
    title: "Where TypeScript cannot protect you",
    feature: "`as`, `any`, the I/O boundary, method bivariance, readonly aliasing",
    codes: ["TS2352", "TS2322", "TS4104"],
    broken: broken12,
    safe: safe12,
  },
  {
    id: "13-discriminated-unions",
    level: "04-expert",
    title: "Making illegal states unrepresentable",
    feature: "tagged unions; deleting the illegal region of the state space",
    codes: ["TS2353", "TS2739", "TS2741", "TS2339"],
    broken: broken13,
    safe: safe13,
  },
  {
    id: "14-assert-never",
    level: "04-expert",
    title: "The exhaustiveness toolkit",
    feature: "assertNever, exhaustive Record, `satisfies`, a typed `match`",
    codes: ["TS2345", "TS2741", "TS2344"],
    broken: broken14,
    safe: safe14,
  },
  {
    id: "15-decidability-limits",
    level: "04-expert",
    title: "Decidability, budgets, and Rice's theorem",
    feature: "a Turing-complete type system and the limits it must impose",
    codes: ["TS2589"],
    broken: broken15,
    safe: safe15,
  },
];

export const findDemo = (id: string): Demo | undefined =>
  demos.find((demo) => demo.id === id);
