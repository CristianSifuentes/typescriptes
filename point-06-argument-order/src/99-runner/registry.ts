/**
 * registry.ts — the index of every demo in the project.
 *
 * Keeping the list here (rather than scanning the filesystem) means the runner
 * is itself type-checked: a renamed or deleted demo is a compile error, not a
 * runtime surprise.
 */

import { runBroken as broken01 } from "../01-basic/01-swapped-arguments.js-broken.js";
import { runSafe as safe01 } from "../01-basic/01-swapped-arguments.ts-safe.js";
import { runBroken as broken02 } from "../01-basic/02-positional-binding.js-broken.js";
import { runSafe as safe02 } from "../01-basic/02-positional-binding.ts-safe.js";
import { runBroken as broken03 } from "../01-basic/03-corruption-modes.js-broken.js";
import { runSafe as safe03 } from "../01-basic/03-corruption-modes.ts-safe.js";

import { runBroken as broken04 } from "../02-intermediate/04-same-type-numbers.js-broken.js";
import { runSafe as safe04 } from "../02-intermediate/04-same-type-numbers.ts-safe.js";
import { runBroken as broken05 } from "../02-intermediate/05-same-type-strings.js-broken.js";
import { runSafe as safe05 } from "../02-intermediate/05-same-type-strings.ts-safe.js";
import { runBroken as broken06 } from "../02-intermediate/06-boolean-flags.js-broken.js";
import { runSafe as safe06 } from "../02-intermediate/06-boolean-flags.ts-safe.js";

import { runBroken as broken07 } from "../03-advanced/07-branded-types.js-broken.js";
import { runSafe as safe07 } from "../03-advanced/07-branded-types.ts-safe.js";
import { runBroken as broken08 } from "../03-advanced/08-options-objects.js-broken.js";
import { runSafe as safe08 } from "../03-advanced/08-options-objects.ts-safe.js";
import { runBroken as broken09 } from "../03-advanced/09-labeled-tuples.js-broken.js";
import { runSafe as safe09 } from "../03-advanced/09-labeled-tuples.ts-safe.js";
import { runBroken as broken10 } from "../03-advanced/10-builder-pattern.js-broken.js";
import { runSafe as safe10 } from "../03-advanced/10-builder-pattern.ts-safe.js";

import { runBroken as broken11 } from "../04-expert/11-positional-assignability.js-broken.js";
import { runSafe as safe11 } from "../04-expert/11-positional-assignability.ts-safe.js";
import { runBroken as broken12 } from "../04-expert/12-brand-toolkit.js-broken.js";
import { runSafe as safe12 } from "../04-expert/12-brand-toolkit.ts-safe.js";
import { runBroken as broken13 } from "../04-expert/13-soundness-holes.js-broken.js";
import { runSafe as safe13 } from "../04-expert/13-soundness-holes.ts-safe.js";
import { runBroken as broken14 } from "../04-expert/14-design-tradeoffs.js-broken.js";
import { runSafe as safe14 } from "../04-expert/14-design-tradeoffs.ts-safe.js";

export type Level = "01-basic" | "02-intermediate" | "03-advanced" | "04-expert";

export interface Demo {
  readonly id: string;
  readonly level: Level;
  readonly title: string;
  /** The single granular mechanism this demo isolates. */
  readonly feature: string;
  /** The diagnostics the demo demonstrates, for the final report. */
  readonly codes: readonly string[];
  /** Whether TypeScript catches the swap this demo is about. */
  readonly caught:
    | "yes"
    | "no — the blind spot"
    | "no — an escape hatch"
    | "yes, once branded"
    | "n/a";
  readonly broken: () => void;
  readonly safe: () => void;
}

export const demos: readonly Demo[] = [
  {
    id: "01-swapped-arguments",
    level: "01-basic",
    title: "The swapped call",
    feature: "positional type matching: argument i against parameter i",
    codes: ["TS2345"],
    caught: "yes",
    broken: broken01,
    safe: safe01,
  },
  {
    id: "02-positional-binding",
    level: "01-basic",
    title: "Positional binding",
    feature: "arity, optionals, rest parameters, and spreads of arrays vs tuples",
    codes: ["TS2554", "TS2555", "TS2345", "TS2556"],
    caught: "yes",
    broken: broken02,
    safe: safe02,
  },
  {
    id: "03-corruption-modes",
    level: "01-basic",
    title: "The four corruption modes",
    feature: "NaN, [object Object], the wrong branch — and the plausible answer",
    codes: ["TS2345"],
    caught: "yes",
    broken: broken03,
    safe: safe03,
  },
  {
    id: "04-same-type-numbers",
    level: "02-intermediate",
    title: "The same-type blind spot",
    feature: "why structural typing cannot see a number ↔ number swap",
    codes: [],
    caught: "no — the blind spot",
    broken: broken04,
    safe: safe04,
  },
  {
    id: "05-same-type-strings",
    level: "02-intermediate",
    title: "Two strings, and money",
    feature: "the right action performed on the wrong entity",
    codes: ["TS2345"],
    caught: "no — the blind spot",
    broken: broken05,
    safe: safe05,
  },
  {
    id: "06-boolean-flags",
    level: "02-intermediate",
    title: "The boolean trap",
    feature: "1-bit parameters, unreadable call sites, and literal unions",
    codes: ["TS2345"],
    caught: "yes, once branded",
    broken: broken06,
    safe: safe06,
  },
  {
    id: "07-branded-types",
    level: "03-advanced",
    title: "Branded (nominal) types",
    feature: "phantom members: nominal typing encoded structurally, erased at emit",
    codes: ["TS2345"],
    caught: "yes, once branded",
    broken: broken07,
    safe: safe07,
  },
  {
    id: "08-options-objects",
    level: "03-advanced",
    title: "Options objects",
    feature: "removing order entirely; diagnostics by name rather than by index",
    codes: ["TS2739", "TS2741", "TS2561"],
    caught: "yes, once branded",
    broken: broken08,
    safe: safe08,
  },
  {
    id: "09-labeled-tuples",
    level: "03-advanced",
    title: "Labeled tuples",
    feature: "positions as a type; labels are documentation and do no checking",
    codes: ["TS2741", "TS2322", "TS2345"],
    caught: "yes, once branded",
    broken: broken09,
    safe: safe09,
  },
  {
    id: "10-builder-pattern",
    level: "03-advanced",
    title: "Type-state builders",
    feature: "method names replace positions; `build` uncallable until complete",
    codes: ["TS2349", "TS2339"],
    caught: "yes",
    broken: broken10,
    safe: safe10,
  },
  {
    id: "11-positional-assignability",
    level: "04-expert",
    title: "The compiler's mental model",
    feature: "the call rule, `Parameters<T>`, variance, and why names cannot help",
    codes: ["TS2322"],
    caught: "n/a",
    broken: broken11,
    safe: safe11,
  },
  {
    id: "12-brand-toolkit",
    level: "04-expert",
    title: "A reusable brand toolkit",
    feature: "`Brand<T, K>`, smart constructors, `Unbrand`, the one-`as` discipline",
    codes: ["TS2345"],
    caught: "yes, once branded",
    broken: broken12,
    safe: safe12,
  },
  {
    id: "13-soundness-holes",
    level: "04-expert",
    title: "Where the protection stops",
    feature: "`as`, `any`, `Function`, coarse brands, and the I/O boundary",
    codes: ["TS2352", "TS2322"],
    caught: "no — an escape hatch",
    broken: broken13,
    safe: safe13,
  },
  {
    id: "14-design-tradeoffs",
    level: "04-expert",
    title: "Choosing a remedy",
    feature: "the two-question decision procedure and a `never`-based guard",
    codes: ["TS2554"],
    caught: "n/a",
    broken: broken14,
    safe: safe14,
  },
];

export const findDemo = (id: string): Demo | undefined => demos.find((demo) => demo.id === id);
