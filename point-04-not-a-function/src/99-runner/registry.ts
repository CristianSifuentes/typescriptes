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
];

export const findDemo = (id: string): Demo | undefined =>
  demos.find((demo) => demo.id === id);
