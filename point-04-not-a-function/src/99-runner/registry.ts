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
];

export const findDemo = (id: string): Demo | undefined =>
  demos.find((demo) => demo.id === id);
