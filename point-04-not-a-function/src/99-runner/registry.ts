/**
 * registry.ts — the index of every demo in the project.
 *
 * Each entry pairs the two halves of a demo:
 *   `broken` — the JavaScript version (`@ts-nocheck`), which runs and misbehaves
 *   `safe`   — the TypeScript version, which shows what the compiler rejected
 *
 * Keeping the list here (rather than scanning the filesystem) means the
 * runner is itself type-checked: a renamed or deleted demo is a compile
 * error, not a runtime surprise — appropriately, Concept #4 applied to the
 * project's own tooling (every entry here is a real, checked call).
 *
 * This file grows by one entry per demo, each addition its own commit, so
 * the project is runnable at every step of the series.
 */

import { runBroken as broken01 } from "../01-basic/01-noncallable-value.js-broken.js";
import { runSafe as safe01 } from "../01-basic/01-noncallable-value.ts-safe.js";
import { runBroken as broken02 } from "../01-basic/02-misspelled-method.js-broken.js";
import { runSafe as safe02 } from "../01-basic/02-misspelled-method.ts-safe.js";
import { runBroken as broken03 } from "../01-basic/03-wrong-type-method.js-broken.js";
import { runSafe as safe03 } from "../01-basic/03-wrong-type-method.ts-safe.js";
import { runBroken as broken04 } from "../01-basic/04-function-typed-variable.js-broken.js";
import { runSafe as safe04 } from "../01-basic/04-function-typed-variable.ts-safe.js";

import { runBroken as broken05 } from "../02-intermediate/05-property-not-function.js-broken.js";
import { runSafe as safe05 } from "../02-intermediate/05-property-not-function.ts-safe.js";
import { runBroken as broken06 } from "../02-intermediate/06-optional-chaining-call.js-broken.js";
import { runSafe as safe06 } from "../02-intermediate/06-optional-chaining-call.ts-safe.js";
import { runBroken as broken07 } from "../02-intermediate/07-noncallable-callback.js-broken.js";
import { runSafe as safe07 } from "../02-intermediate/07-noncallable-callback.ts-safe.js";
import { runBroken as broken08 } from "../02-intermediate/08-strict-null-invocation.js-broken.js";
import { runSafe as safe08 } from "../02-intermediate/08-strict-null-invocation.ts-safe.js";

import { runBroken as broken09 } from "../03-advanced/09-call-signatures-hybrid.js-broken.js";
import { runSafe as safe09 } from "../03-advanced/09-call-signatures-hybrid.ts-safe.js";
import { runBroken as broken10 } from "../03-advanced/10-overloads.js-broken.js";
import { runSafe as safe10 } from "../03-advanced/10-overloads.ts-safe.js";
import { runBroken as broken11 } from "../03-advanced/11-this-binding.js-broken.js";
import { runSafe as safe11 } from "../03-advanced/11-this-binding.ts-safe.js";
import { runBroken as broken12 } from "../03-advanced/12-narrowing-to-callable.js-broken.js";
import { runSafe as safe12 } from "../03-advanced/12-narrowing-to-callable.ts-safe.js";

import { runBroken as broken13 } from "../04-expert/13-invocation-resolution-model.js-broken.js";
import { runSafe as safe13 } from "../04-expert/13-invocation-resolution-model.ts-safe.js";
import { runBroken as broken14 } from "../04-expert/14-soundness-limits.js-broken.js";
import { runSafe as safe14 } from "../04-expert/14-soundness-limits.ts-safe.js";
import { runBroken as broken15 } from "../04-expert/15-typed-dispatch-registry.js-broken.js";
import { runSafe as safe15 } from "../04-expert/15-typed-dispatch-registry.ts-safe.js";
import { runBroken as broken16 } from "../04-expert/16-function-variance.js-broken.js";
import { runSafe as safe16 } from "../04-expert/16-function-variance.ts-safe.js";
import { runBroken as broken17 } from "../04-expert/17-function-vs-precise-signatures.js-broken.js";
import { runSafe as safe17 } from "../04-expert/17-function-vs-precise-signatures.ts-safe.js";

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
    id: "01-noncallable-value",
    level: "01-basic",
    title: "Calling a non-function value",
    feature: "callable-type checking: does the static type have a call signature at all?",
    codes: ["TS2349"],
    broken: broken01,
    safe: safe01,
  },
  {
    id: "02-misspelled-method",
    level: "01-basic",
    title: "A misspelled method call",
    feature: "member existence (Concept #3) checked before callability (Concept #4) is ever asked",
    codes: ["TS2551"],
    broken: broken02,
    safe: safe02,
  },
  {
    id: "03-wrong-type-method",
    level: "01-basic",
    title: "A method that exists, on the wrong type",
    feature: "correctly-spelled member absent from THIS type's property map; diagnostic moves to the call site across a function boundary",
    codes: ["TS2339", "TS2345"],
    broken: broken03,
    safe: safe03,
  },
  {
    id: "04-function-typed-variable",
    level: "01-basic",
    title: "Function-typed variables",
    feature: "a call signature is a type; assignability checked exactly like any other type",
    codes: ["TS2322"],
    broken: broken04,
    safe: safe04,
  },
  {
    id: "05-property-not-function",
    level: "02-intermediate",
    title: "A data field, called as a method",
    feature: "TS2349 reached through a realistic mixed data/callback config object",
    codes: ["TS2349"],
    broken: broken05,
    safe: safe05,
  },
  {
    id: "06-optional-chaining-call",
    level: "02-intermediate",
    title: "Optional methods and ?.()",
    feature: "onError?: is a union with undefined; calling it unguarded is TS18048, ?.() is the disciplined fix",
    codes: ["TS18048"],
    broken: broken06,
    safe: safe06,
  },
  {
    id: "07-noncallable-callback",
    level: "02-intermediate",
    title: "A non-callable argument where a callback is expected",
    feature: "callback parameters checked by ordinary argument assignability (TS2345), reported at the call site",
    codes: ["TS2345"],
    broken: broken07,
    safe: safe07,
  },
  {
    id: "08-strict-null-invocation",
    level: "02-intermediate",
    title: "strictNullChecks guarding a Fn | undefined field",
    feature: "a mutable field typed Fn | undefined, narrowed by `if` before the call — TS18048, the mutable-field counterpart to demo 06's optional property",
    codes: ["TS18048"],
    broken: broken08,
    safe: safe08,
  },
  {
    id: "09-call-signatures-hybrid",
    level: "03-advanced",
    title: "Call signatures as types, and hybrid callable objects",
    feature: "a type with BOTH a call signature and ordinary properties; a value missing either half fails assignability",
    codes: ["TS2322"],
    broken: broken09,
    safe: safe09,
  },
  {
    id: "10-overloads",
    level: "03-advanced",
    title: "Function overloading and overload resolution",
    feature: "a call matching none of the declared overload signatures is rejected, regardless of what the wider implementation signature could handle",
    codes: ["TS2769"],
    broken: broken10,
    safe: safe10,
  },
  {
    id: "11-this-binding",
    level: "03-advanced",
    title: "this binding: detached methods and explicit this parameters",
    feature: "an explicit `this` parameter turns 'what must this be for this call to be valid' into a checked part of the call signature",
    codes: ["TS2684"],
    broken: broken11,
    safe: safe11,
  },
  {
    id: "12-narrowing-to-callable",
    level: "03-advanced",
    title: "Narrowing a union down to its callable member",
    feature: "typeof x === \"function\" as a compiler-recognised type guard, narrowing a union of unrelated (not just optional) types",
    codes: ["TS2349"],
    broken: broken12,
    safe: safe12,
  },
  {
    id: "13-invocation-resolution-model",
    level: "04-expert",
    title: "The compiler's invocation-resolution algorithm, narrated",
    feature: "every call expression resolved in five explicit steps: callability, generic binding, parameter computation, argument assignability, return type",
    codes: ["TS2345"],
    broken: broken13,
    safe: safe13,
  },
  {
    id: "14-soundness-limits",
    level: "04-expert",
    title: "The limits of soundness: any, as, and unchecked lookups",
    feature: "three ways to make a call compile that still throws at runtime, and the boundary-validation fix that actually closes the hole",
    codes: [],
    broken: broken14,
    safe: safe14,
  },
  {
    id: "15-typed-dispatch-registry",
    level: "04-expert",
    title: "A closed, typed dynamic-dispatch registry",
    feature: "a closed key union plus a total Record<Key, Handler> map close a missing/renamed handler from both directions; `never` adds a third, switch-based net",
    codes: ["TS2345", "TS2741"],
    broken: broken15,
    safe: safe15,
  },
  {
    id: "16-function-variance",
    level: "04-expert",
    title: "Contravariance of function parameter assignability",
    feature: "a handler assignable into a slot only if its parameter type is the same or WIDER than the slot's — strictFunctionTypes enforcing the sound direction",
    codes: ["TS2345"],
    broken: broken16,
    safe: safe16,
  },
  {
    id: "17-function-vs-precise-signatures",
    level: "04-expert",
    title: "The wide `Function` type versus a precise call signature",
    feature: "`Function`'s (...args: any[]) => any closes 'not callable at all' but reopens 'callable with the wrong shape' — only a real signature closes both",
    codes: ["TS2322"],
    broken: broken17,
    safe: safe17,
  },
];

export const findDemo = (id: string): Demo | undefined =>
  demos.find((demo) => demo.id === id);
