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

export const demos: readonly Demo[] = [];

export const findDemo = (id: string): Demo | undefined =>
  demos.find((demo) => demo.id === id);
