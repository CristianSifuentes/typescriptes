/**
 * registry.ts — the index of every demo in the project.
 *
 * Each entry pairs the two halves of a demo:
 *   `broken` — the JavaScript version (`@ts-nocheck`), which runs and misbehaves
 *   `safe`   — the TypeScript version, which shows what the compiler rejected
 *
 * Keeping the list here (rather than scanning the filesystem) means the
 * runner is itself type-checked: a renamed or deleted demo is a compile
 * error, not a runtime surprise — which is, appropriately, Concept #3 applied
 * to the project's own tooling.
 *
 * This file grows by one entry per demo, each addition its own commit, so
 * the project is runnable at every step of the series.
 */

import { runBroken as broken01 } from "../01-basic/01-read-typo.js-broken.js";
import { runSafe as safe01 } from "../01-basic/01-read-typo.ts-safe.js";
import { runBroken as broken02 } from "../01-basic/02-write-typo.js-broken.js";
import { runSafe as safe02 } from "../01-basic/02-write-typo.ts-safe.js";
import { runBroken as broken03 } from "../01-basic/03-excess-property.js-broken.js";
import { runSafe as safe03 } from "../01-basic/03-excess-property.ts-safe.js";

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
    id: "01-read-typo",
    level: "01-basic",
    title: "Reading a misspelled property",
    feature: "member resolution against the declared property map; TS2551 spelling suggestions",
    codes: ["TS2551", "TS2339"],
    broken: broken01,
    safe: safe01,
  },
  {
    id: "02-write-typo",
    level: "01-basic",
    title: "Writing to a nonexistent property",
    feature: "write-side member resolution; independent key-check vs value-type-check",
    codes: ["TS2551", "TS2322"],
    broken: broken02,
    safe: safe02,
  },
  {
    id: "03-excess-property",
    level: "01-basic",
    title: "Excess-property checking on object literals",
    feature: "freshness: a fresh literal may declare no member the target does not",
    codes: ["TS2741", "TS2561"],
    broken: broken03,
    safe: safe03,
  },
];

export const findDemo = (id: string): Demo | undefined =>
  demos.find((demo) => demo.id === id);
