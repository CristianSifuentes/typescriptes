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

import { runBroken as broken04 } from "../02-intermediate/04-optional-vs-typo.js-broken.js";
import { runSafe as safe04 } from "../02-intermediate/04-optional-vs-typo.ts-safe.js";
import { runBroken as broken05 } from "../02-intermediate/05-nested-chain.js-broken.js";
import { runSafe as safe05 } from "../02-intermediate/05-nested-chain.ts-safe.js";
import { runBroken as broken06 } from "../02-intermediate/06-readonly-typo.js-broken.js";
import { runSafe as safe06 } from "../02-intermediate/06-readonly-typo.ts-safe.js";
import { runBroken as broken07 } from "../02-intermediate/07-index-signatures.js-broken.js";
import { runSafe as safe07 } from "../02-intermediate/07-index-signatures.ts-safe.js";

import { runBroken as broken08 } from "../03-advanced/08-structural-typing.js-broken.js";
import { runSafe as safe08 } from "../03-advanced/08-structural-typing.ts-safe.js";
import { runBroken as broken09 } from "../03-advanced/09-excess-property-subtlety.js-broken.js";
import { runSafe as safe09 } from "../03-advanced/09-excess-property-subtlety.ts-safe.js";
import { runBroken as broken10 } from "../03-advanced/10-keyof.js-broken.js";
import { runSafe as safe10 } from "../03-advanced/10-keyof.ts-safe.js";
import { runBroken as broken11 } from "../03-advanced/11-mapped-template-keys.js-broken.js";
import { runSafe as safe11 } from "../03-advanced/11-mapped-template-keys.ts-safe.js";

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
  {
    id: "04-optional-vs-typo",
    level: "02-intermediate",
    title: "Optional properties vs typos",
    feature: "optional keys stay IN the property map (TS18048); typos never are (TS2339)",
    codes: ["TS18048", "TS2339"],
    broken: broken04,
    safe: safe04,
  },
  {
    id: "05-nested-chain",
    level: "02-intermediate",
    title: "Nested property access",
    feature: "member resolution is compositional; each '.' checked independently, depth-agnostic",
    codes: ["TS2551", "TS2339"],
    broken: broken05,
    safe: safe05,
  },
  {
    id: "06-readonly-typo",
    level: "02-intermediate",
    title: "readonly properties and typos in assignment targets",
    feature: "existence is checked before mutability; a typo'd readonly member is never TS2540",
    codes: ["TS2540", "TS2551"],
    broken: broken06,
    safe: safe06,
  },
  {
    id: "07-index-signatures",
    level: "02-intermediate",
    title: "Index signatures loosen typo protection",
    feature: "[key: string]: T widens the property map's domain to every string",
    codes: ["TS4111"],
    broken: broken07,
    safe: safe07,
  },
  {
    id: "08-structural-typing",
    level: "03-advanced",
    title: "Structural typing vs nominal typing",
    feature: "assignability compares property maps, not declared names",
    codes: ["TS2353"],
    broken: broken08,
    safe: safe08,
  },
  {
    id: "09-excess-property-subtlety",
    level: "03-advanced",
    title: "Excess-property checking's subtlety",
    feature: "freshness is scoped to the literal expression, not the type; lost through any intermediate binding",
    codes: ["TS2561"],
    broken: broken09,
    safe: safe09,
  },
  {
    id: "10-keyof",
    level: "03-advanced",
    title: "keyof turns property names into a checkable union",
    feature: "keyof T computes the literal-key union; indexed access types T[K] track it exactly",
    codes: ["TS2345", "TS2322"],
    broken: broken10,
    safe: safe10,
  },
  {
    id: "11-mapped-template-keys",
    level: "03-advanced",
    title: "Mapped and template-literal property names",
    feature: "keys GENERATED via `get${Capitalize<K>}` form a real, checkable property map",
    codes: ["TS2561"],
    broken: broken11,
    safe: safe11,
  },
];

export const findDemo = (id: string): Demo | undefined =>
  demos.find((demo) => demo.id === id);
