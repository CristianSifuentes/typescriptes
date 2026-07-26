/**
 * registry.ts — the index of every demo in the project.
 *
 * Each entry pairs the two halves of a demo:
 *   `broken` — the JavaScript version (`@ts-nocheck`), which runs and misbehaves
 *   `safe`   — the TypeScript version, which shows what the compiler rejected
 *              (or, for demos 05/09/12/13, honestly shows what it does NOT reject)
 *
 * Keeping the list here (rather than scanning the filesystem) means the
 * runner is itself type-checked: a renamed or deleted demo is a compile
 * error, not a runtime surprise.
 */

import { runBroken as broken01 } from "../01-basic/01-plus-operator-overload.js-broken.js";
import { runSafe as safe01 } from "../01-basic/01-plus-operator-overload.ts-safe.js";
import { runBroken as broken02 } from "../01-basic/02-arithmetic-coercion.js-broken.js";
import { runSafe as safe02 } from "../01-basic/02-arithmetic-coercion.ts-safe.js";
import { runBroken as broken03 } from "../01-basic/03-truthy-falsy-coercion.js-broken.js";
import { runSafe as safe03 } from "../01-basic/03-truthy-falsy-coercion.ts-safe.js";

import { runBroken as broken04 } from "../02-intermediate/04-loose-vs-strict-equality.js-broken.js";
import { runSafe as safe04 } from "../02-intermediate/04-loose-vs-strict-equality.ts-safe.js";
import { runBroken as broken05 } from "../02-intermediate/05-object-to-primitive-coercion.js-broken.js";
import { runSafe as safe05 } from "../02-intermediate/05-object-to-primitive-coercion.ts-safe.js";
import { runBroken as broken06 } from "../02-intermediate/06-null-undefined-arithmetic.js-broken.js";
import { runSafe as safe06 } from "../02-intermediate/06-null-undefined-arithmetic.ts-safe.js";

import { runBroken as broken07 } from "../03-advanced/07-abstract-equality-algorithm.js-broken.js";
import { runSafe as safe07 } from "../03-advanced/07-abstract-equality-algorithm.ts-safe.js";
import { runBroken as broken08 } from "../03-advanced/08-union-narrowing-for-arithmetic.js-broken.js";
import { runSafe as safe08 } from "../03-advanced/08-union-narrowing-for-arithmetic.ts-safe.js";
import { runBroken as broken09 } from "../03-advanced/09-template-literal-coercion.js-broken.js";
import { runSafe as safe09 } from "../03-advanced/09-template-literal-coercion.ts-safe.js";
import { runBroken as broken10 } from "../03-advanced/10-valueof-tostring-symbol-toprimitive.js-broken.js";
import { runSafe as safe10 } from "../03-advanced/10-valueof-tostring-symbol-toprimitive.ts-safe.js";

import { runBroken as broken11 } from "../04-expert/11-branded-types-vs-coercion.js-broken.js";
import { runSafe as safe11 } from "../04-expert/11-branded-types-vs-coercion.ts-safe.js";
import { runBroken as broken12 } from "../04-expert/12-soundness-holes.js-broken.js";
import { runSafe as safe12 } from "../04-expert/12-soundness-holes.ts-safe.js";
import { runBroken as broken13 } from "../04-expert/13-boundary-validation-layer.js-broken.js";
import { runSafe as safe13 } from "../04-expert/13-boundary-validation-layer.ts-safe.js";
import { runBroken as broken14 } from "../04-expert/14-never-guarded-mixed-type-op.js-broken.js";
import { runSafe as safe14 } from "../04-expert/14-never-guarded-mixed-type-op.ts-safe.js";

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
    id: "01-plus-operator",
    level: "01-basic",
    title: "The `+` operator overload",
    feature: "string concatenation vs numeric addition; the result-type rule for +",
    codes: ["TS2322", "TS2365", "TS18050"],
    broken: broken01,
    safe: safe01,
  },
  {
    id: "02-arithmetic-coercion",
    level: "01-basic",
    title: "Arithmetic coercion (-, *, /) and the silence of NaN",
    feature: "unconditional ToNumber on non-+ operators; NaN never throws",
    codes: ["TS2362", "TS2363"],
    broken: broken02,
    safe: safe02,
  },
  {
    id: "03-truthy-falsy",
    level: "01-basic",
    title: "Truthy/falsy coercion",
    feature: "ToBoolean's fixed eight-value list; the honest limit of strictNullChecks",
    codes: ["TS2367"],
    broken: broken03,
    safe: safe03,
  },
  {
    id: "04-loose-vs-strict-equality",
    level: "02-intermediate",
    title: "`==` vs `===`",
    feature: "the abstract equality algorithm's non-transitivity; TS2367's coverage",
    codes: ["TS2367"],
    broken: broken04,
    safe: safe04,
  },
  {
    id: "05-object-to-primitive",
    level: "02-intermediate",
    title: "Object-to-primitive coercion",
    feature: "ToPrimitive's valueOf/toString chain; a genuine string+object gap",
    codes: ["TS2365"],
    broken: broken05,
    safe: safe05,
  },
  {
    id: "06-null-undefined-arithmetic",
    level: "02-intermediate",
    title: "null vs undefined in arithmetic",
    feature: "ToNumber(null)=0 vs ToNumber(undefined)=NaN; TS18047/TS18048/TS18050",
    codes: ["TS18047", "TS18048", "TS18050", "TS2345"],
    broken: broken06,
    safe: safe06,
  },
  {
    id: "07-abstract-equality-algorithm",
    level: "03-advanced",
    title: "The abstract equality algorithm, reproduced by hand",
    feature: "IsLooselyEqual's eleven branches, traced; a typed Overlaps<A,B> guard",
    codes: ["TS2554", "TS2367"],
    broken: broken07,
    safe: safe07,
  },
  {
    id: "08-union-narrowing",
    level: "03-advanced",
    title: "Union types must narrow before arithmetic",
    feature: "an operation on a union is legal only if legal for every member",
    codes: ["TS2365"],
    broken: broken08,
    safe: safe08,
  },
  {
    id: "09-template-literal-coercion",
    level: "03-advanced",
    title: "Template literal coercion",
    feature: "ToString is total; template holes accept every type (a genuine gap)",
    codes: ["TS2345"],
    broken: broken09,
    safe: safe09,
  },
  {
    id: "10-toprimitive-hooks",
    level: "03-advanced",
    title: "valueOf / toString / Symbol.toPrimitive",
    feature: "custom coercion hooks; a distinct policy per operator family",
    codes: ["TS2365", "TS2367"],
    broken: broken10,
    safe: safe10,
  },
  {
    id: "11-branded-types",
    level: "04-expert",
    title: "Branded types close a coercion-adjacent hole",
    feature: "structural typing's blind spot; nominal-by-convention via unique symbol",
    codes: ["TS2345"],
    broken: broken11,
    safe: safe11,
  },
  {
    id: "12-soundness-holes",
    level: "04-expert",
    title: "Where TypeScript cannot protect you from coercion",
    feature: "`as` asserts without checking; `any` disables checking contagiously",
    codes: [],
    broken: broken12,
    safe: safe12,
  },
  {
    id: "13-boundary-validation",
    level: "04-expert",
    title: "A hand-rolled boundary validation layer",
    feature: "a Schema<T> that IS the type and the runtime check, in one place",
    codes: [],
    broken: broken13,
    safe: safe13,
  },
  {
    id: "14-never-guarded-op",
    level: "04-expert",
    title: "A never-guarded generic sum",
    feature: "a witness tuple that makes a mixed-type call structurally unwritable",
    codes: ["TS2554"],
    broken: broken14,
    safe: safe14,
  },
];

export const findDemo = (id: string): Demo | undefined =>
  demos.find((demo) => demo.id === id);
