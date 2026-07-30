/**
 * registry.ts — the index of every demo in the project.
 *
 * Each entry pairs the two halves of a demo:
 *   `broken` — the JavaScript version (`@ts-nocheck`), which runs and misbehaves
 *   `safe`   — the TypeScript version, which shows what the compiler rejected
 *
 * Keeping the list here (rather than scanning the filesystem) means the
 * runner is itself type-checked: a renamed or deleted demo is a compile
 * error, not a runtime surprise — appropriately, Concept #5 applied to the
 * project's own tooling (every entry here is a real, checked call).
 *
 * This file grows by one entry per demo, each addition its own commit, so
 * the project is runnable at every step of the series.
 */

import { runBroken as broken01 } from "../01-basic/01-too-few-arguments.js-broken.js";
import { runSafe as safe01 } from "../01-basic/01-too-few-arguments.ts-safe.js";
import { runBroken as broken02 } from "../01-basic/02-too-many-arguments.js-broken.js";
import { runSafe as safe02 } from "../01-basic/02-too-many-arguments.ts-safe.js";
import { runBroken as broken03 } from "../01-basic/03-wrong-type-argument.js-broken.js";
import { runSafe as safe03 } from "../01-basic/03-wrong-type-argument.ts-safe.js";
import { runBroken as broken04 } from "../01-basic/04-undefined-vs-missing.js-broken.js";
import { runSafe as safe04 } from "../01-basic/04-undefined-vs-missing.ts-safe.js";

import { runBroken as broken05 } from "../02-intermediate/05-optional-parameters.js-broken.js";
import { runSafe as safe05 } from "../02-intermediate/05-optional-parameters.ts-safe.js";
import { runBroken as broken06 } from "../02-intermediate/06-default-parameters.js-broken.js";
import { runSafe as safe06 } from "../02-intermediate/06-default-parameters.ts-safe.js";
import { runBroken as broken07 } from "../02-intermediate/07-rest-parameters.js-broken.js";
import { runSafe as safe07 } from "../02-intermediate/07-rest-parameters.ts-safe.js";
import { runBroken as broken08 } from "../02-intermediate/08-required-after-optional-ordering.js-broken.js";
import { runSafe as safe08 } from "../02-intermediate/08-required-after-optional-ordering.ts-safe.js";

import { runBroken as broken09 } from "../03-advanced/09-tuple-parameters.js-broken.js";
import { runSafe as safe09 } from "../03-advanced/09-tuple-parameters.ts-safe.js";
import { runBroken as broken10 } from "../03-advanced/10-spread-arguments.js-broken.js";
import { runSafe as safe10 } from "../03-advanced/10-spread-arguments.ts-safe.js";
import { runBroken as broken11 } from "../03-advanced/11-overload-arity-resolution.js-broken.js";
import { runSafe as safe11 } from "../03-advanced/11-overload-arity-resolution.ts-safe.js";
import { runBroken as broken12 } from "../03-advanced/12-destructured-parameters.js-broken.js";
import { runSafe as safe12 } from "../03-advanced/12-destructured-parameters.ts-safe.js";

import { runBroken as broken13 } from "../04-expert/13-call-resolution-model.js-broken.js";
import { runSafe as safe13 } from "../04-expert/13-call-resolution-model.ts-safe.js";
import { runBroken as broken14 } from "../04-expert/14-variadic-generic-arity.js-broken.js";
import { runSafe as safe14 } from "../04-expert/14-variadic-generic-arity.ts-safe.js";
import { runBroken as broken15 } from "../04-expert/15-soundness-limits.js-broken.js";
import { runSafe as safe15 } from "../04-expert/15-soundness-limits.ts-safe.js";
import { runBroken as broken16 } from "../04-expert/16-strict-function-types-bivariance.js-broken.js";
import { runSafe as safe16 } from "../04-expert/16-strict-function-types-bivariance.ts-safe.js";
import { runBroken as broken17 } from "../04-expert/17-never-arity-guard.js-broken.js";
import { runSafe as safe17 } from "../04-expert/17-never-arity-guard.ts-safe.js";

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
    id: "01-too-few-arguments",
    level: "01-basic",
    title: "Too few arguments",
    feature: "arity checking: does the call supply at least as many arguments as required parameters?",
    codes: ["TS2554"],
    broken: broken01,
    safe: safe01,
  },
  {
    id: "02-too-many-arguments",
    level: "01-basic",
    title: "Too many arguments",
    feature: "arity checking, upper bound: extra arguments beyond the parameter list are rejected, not silently dropped",
    codes: ["TS2554"],
    broken: broken02,
    safe: safe02,
  },
  {
    id: "03-wrong-type-argument",
    level: "01-basic",
    title: "The right count, the wrong type at a position",
    feature: "positional assignability: each argument checked against its parameter's declared type, independently of arity",
    codes: ["TS2345"],
    broken: broken03,
    safe: safe03,
  },
  {
    id: "04-undefined-vs-missing",
    level: "01-basic",
    title: "Explicit undefined vs. a genuinely omitted argument",
    feature: "arity counts SUPPLIED arguments, not non-undefined ones — passing `undefined` still satisfies a required parameter's slot, but not its type unless the parameter says so",
    codes: ["TS2554", "TS2345"],
    broken: broken04,
    safe: safe04,
  },
  {
    id: "05-optional-parameters",
    level: "02-intermediate",
    title: "Optional parameters: T | undefined, and what may be omitted",
    feature: "`b?: number` relaxes arity's lower bound by one and types `b` as `number | undefined` inside the body",
    codes: ["TS18048"],
    broken: broken05,
    safe: safe05,
  },
  {
    id: "06-default-parameters",
    level: "02-intermediate",
    title: "Default parameters: omission vs. undefined vs. a real value",
    feature: "`b = 10` relaxes arity's lower bound AND substitutes a value when the argument is omitted or explicitly `undefined`",
    codes: ["TS2554"],
    broken: broken06,
    safe: safe06,
  },
  {
    id: "07-rest-parameters",
    level: "02-intermediate",
    title: "Rest parameters: variable arity, uniformly typed",
    feature: "`...nums: number[]` accepts any count from zero upward, each argument checked against the rest element type",
    codes: ["TS2345"],
    broken: broken07,
    safe: safe07,
  },
  {
    id: "08-required-after-optional-ordering",
    level: "02-intermediate",
    title: "Why a required parameter can't follow an optional one",
    feature: "parameter-list ordering rules: a required parameter after a truly optional one is refused at declaration; after a defaulted one, arity is silently computed stricter instead",
    codes: ["TS1016"],
    broken: broken08,
    safe: safe08,
  },
  {
    id: "09-tuple-parameters",
    level: "03-advanced",
    title: "Tuple parameters and labeled tuples",
    feature: "a fixed-shape argument list modeled as a tuple type, and spreading a typed tuple into a call",
    codes: ["TS2322", "TS2554"],
    broken: broken09,
    safe: safe09,
  },
  {
    id: "10-spread-arguments",
    level: "03-advanced",
    title: "Spread arguments checked against the parameter list",
    feature: "`fn(...args)` where `args` is a typed array/tuple — the compiler validates every spread element positionally",
    codes: ["TS2556", "TS2345"],
    broken: broken10,
    safe: safe10,
  },
  {
    id: "11-overload-arity-resolution",
    level: "03-advanced",
    title: "Overload resolution driven by parameter count",
    feature: "multiple call signatures distinguished by arity; a call matching none of them is rejected outright",
    codes: ["TS2575", "TS2554"],
    broken: broken11,
    safe: safe11,
  },
  {
    id: "12-destructured-parameters",
    level: "03-advanced",
    title: "Destructured parameters: typed, and checked field by field",
    feature: "a typo'd or missing field inside a destructured parameter is caught the same way a missing object property is",
    codes: ["TS2561", "TS2345"],
    broken: broken12,
    safe: safe12,
  },
  {
    id: "13-call-resolution-model",
    level: "04-expert",
    title: "The compiler's call-resolution algorithm, narrated",
    feature: "every call checked in explicit steps: arity bounds, optional/rest accounting, per-position assignability, chosen signature",
    codes: ["TS2554", "TS2345"],
    broken: broken13,
    safe: safe13,
  },
  {
    id: "14-variadic-generic-arity",
    level: "04-expert",
    title: "Generic arity with variadic tuple types (a typed curry)",
    feature: "a parameter list that is itself generic, preserving argument count and per-position types across function composition",
    codes: ["TS2554", "TS2345"],
    broken: broken14,
    safe: safe14,
  },
  {
    id: "15-soundness-limits",
    level: "04-expert",
    title: "The limits of soundness: any, Function, as, and .apply",
    feature: "ways to make a wrong-arity call compile that still misbehaves at runtime, and the boundary-validation fix that actually closes the hole",
    codes: [],
    broken: broken15,
    safe: safe15,
  },
  {
    id: "16-strict-function-types-bivariance",
    level: "04-expert",
    title: "strictFunctionTypes and the deliberate bivariant hole",
    feature: "plain function types checked contravariantly on parameters; method-shorthand signatures kept bivariant on purpose",
    codes: ["TS2322", "TS2345"],
    broken: broken16,
    safe: safe16,
  },
  {
    id: "17-never-arity-guard",
    level: "04-expert",
    title: "Making a wrong-arity call a compile error via never",
    feature: "a tuple-length guard that resolves to `never` for any argument list of the wrong shape, turning a runtime arity bug into a type error",
    codes: ["TS2345"],
    broken: broken17,
    safe: safe17,
  },
];

export const findDemo = (id: string): Demo | undefined =>
  demos.find((demo) => demo.id === id);
