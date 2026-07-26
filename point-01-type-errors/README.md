# Point 01 — Type errors at runtime (JavaScript) vs at compile time (TypeScript)

> **Concept #1.** Type errors that in JavaScript surface only at runtime are
> caught by TypeScript at compile time, as you write.

An executable, self-contained dissection of that sentence: **15 demos across 4
levels**, each one written twice — once as the JavaScript that misbehaves, once
as the TypeScript that refuses to compile — plus a foundations essay, a concept
map, and an evidence lab that prints real `tsc` diagnostics.

Nothing here is asserted without proof:

- every **runtime** claim is produced by actually running the code;
- every **compile-time** claim is either verified by a type-level assertion that
  breaks the build if it is wrong, or transcribed from `npm run evidence`, which
  compiles deliberately-broken fixtures and prints the compiler's own words.

---

## Quick start

```bash
npm install
npm run demo:all        # every demo, in order, then the final report
npm run evidence        # real tsc diagnostics, unsuppressed, with TSxxxx codes
npm run erasure         # watch the type system disappear at compile time
```

Requires Node ≥ 20. TypeScript is a dev dependency; nothing is installed
globally.

---

## Every command

| command | what it does |
|---|---|
| `npm run build` | compile `src/` → `dist/` (must succeed with **zero** errors) |
| `npm run check` | type-check only, no emit |
| `npm run demo:all` | run all 15 demos, then print the final report |
| `npm run evidence` | **the evidence lab** — compile the error fixtures and print real diagnostics |
| `npm run erasure` | the foundations demo: source vs emitted output, side by side |
| `node dist/99-runner/run.js --list` | list the demos (after `npm run build`) |

### The 15 demos

| level | command | granular feature |
|---|---|---|
| **01 basic** | `npm run demo:01-primitives` | primitive annotations; assignability |
| | `npm run demo:02-coercion` | `"5" - 3` vs `"5" + 3`; operator operand rules |
| | `npm run demo:03-nonexistent-method` | `(5).toUpperCase()`; static member resolution |
| **02 intermediate** | `npm run demo:04-function-signatures` | arity, argument order, return types |
| | `npm run demo:05-object-shapes` | interfaces, typos, freshness, optionality |
| | `npm run demo:06-typed-arrays` | element homogeneity, index bounds, tuples |
| **03 advanced** | `npm run demo:07-narrowing` | control flow analysis; flow-sensitive types |
| | `npm run demo:08-unions` | union rules; the apparent-member intersection |
| | `npm run demo:09-type-guards` | `value is T`, `asserts value is T`, `unknown` |
| | `npm run demo:10-never-exhaustiveness` | `never` as ∅; exhaustive switches |
| **04 expert** | `npm run demo:11-type-environment` | Γ, declaration spaces, widening, context |
| | `npm run demo:12-soundness-holes` | **where TypeScript cannot protect you** |
| | `npm run demo:13-discriminated-unions` | making illegal states unrepresentable |
| | `npm run demo:14-assert-never` | the exhaustiveness toolkit |
| | `npm run demo:15-decidability-limits` | Rice's theorem, budgets, TS2589 |

---

## Layout

```
point-01-type-errors/
├── README.md                     ← you are here
├── package.json                  one npm script per demo
├── tsconfig.json                 strict: true — every flag annotated with the
│                                 bug class it deletes
├── tsconfig.evidence.json        the evidence lab: compiles the broken fixtures
├── scripts/evidence.mjs          runs the lab and renders the diagnostics
├── docs/
│   └── concept-map.md            hierarchical decomposition of Concept #1
│                                 (nested lists + a Mermaid diagram)
└── src/
    ├── 00-foundations/
    │   ├── manifesto.md          compile time vs runtime · erasure · what a
    │   │                         type IS · why classes of bugs vanish
    │   └── type-erasure.demo.ts   reads its own source and its own output
    ├── 01-basic/                 demos 01–03
    ├── 02-intermediate/          demos 04–06
    ├── 03-advanced/              demos 07–10
    ├── 04-expert/                demos 11–15
    └── 99-runner/
        ├── trace.ts              banners, tables, type-state traces
        ├── type-assert.ts        compile-time proof helpers (see below)
        ├── registry.ts           the typed index of every demo
        ├── run-demo.ts           renders one demo
        ├── run.ts                CLI
        └── run-all.ts            everything + the final report
```

### The file pattern

Every demo is three (or four) files:

| file | role |
|---|---|
| `NN-name.js-broken.ts` | the code as JavaScript would have it (`// @ts-nocheck`). It **runs**, and misbehaves, and the output shows exactly how. |
| `NN-name.ts-safe.ts` | the TypeScript version. The same defects are still written, each marked `// @ts-expect-error` with the diagnostic it produces. |
| `NN-name.explanation.md` | the dissection: the mechanism, the set-theoretic reasoning, the comparison table, the limits. |
| `_level-NN.tsc-error.ts` | one per level: the **evidence fixture**, full of real unsuppressed errors, compiled only by `npm run evidence`. |

---

## Three things that make this project unusual

### 1. `@ts-expect-error`, not `@ts-ignore`

`@ts-expect-error` is an *inverted assertion*: it says "the next line **must**
produce an error; if it ever stops, fail the build" (TS2578). So the `.ts-safe`
files are simultaneously demonstrations **and** regression tests of the
compiler's behaviour. A project built on `@ts-ignore` would quietly become
fiction as TypeScript evolved.

### 2. Compile-time proofs, not comments

Claims like "here the compiler knows the value is a `string`" are usually
unverifiable prose. Here they are machine-checked:

```ts
proveType<string>()(value, "string", "narrowed by typeof");
```

If the static type of `value` is not **exactly** `string`, that line fails to
compile (TS2554 — the helper demands a `never` argument no expression can
supply). The console trace is therefore a *rendering of a proved fact*, not a
promise. See `src/99-runner/type-assert.ts`.

### 3. The evidence lab

`npm run evidence` compiles `*.tsc-error.ts` — files that are excluded from the
main build precisely so their errors stay unsuppressed — and prints the raw
diagnostics with their elaboration chains:

```
▸ src/03-advanced/_level-03.tsc-error.ts  (12 errors)
   16:26   TS2339 Property 'toUpperCase' does not exist on type 'string | number'.
           ↳ Property 'toUpperCase' does not exist on type 'number'.
   ...
```

That failure is the deliverable. Every message quoted anywhere in this project
comes from that output.

### Also: the deliberately-erroneous lines never execute

`@ts-expect-error` suppresses a *diagnostic*; it does not delete *code*. Lines
that would throw are wrapped in `compileTimeOnly(() => { … })` — the checker
still reads and rejects them (that is the evidence), and Node never evaluates
them (that is the guarantee).

---

## The compiler configuration is part of the lesson

`tsconfig.json` is annotated flag by flag, each with the class of runtime bug it
converts into a compile-time error. Beyond `strict`, this project also enables:

| flag | what it buys |
|---|---|
| `noUncheckedIndexedAccess` | `arr[i]` is `T \| undefined` — the compiler stops asserting bounds it has not proved |
| `exactOptionalPropertyTypes` | "absent" and "present but undefined" become different states |
| `erasableSyntaxOnly` | rejects syntax that emits JavaScript — "compilation is erasure" as an invariant |
| `verbatimModuleSyntax` | the emitter never guesses whether an import was a type |
| `noPropertyAccessFromIndexSignature` | "this key may not exist" is visible at the call site |
| `noImplicitReturns`, `noFallthroughCasesInSwitch` | closes two classic control-flow holes |

`noUnusedLocals` is deliberately **off**: several demos declare proof-only type
aliases whose whole purpose is to exist and type-check.

---

## What the final report says

`npm run demo:all` ends with the four deliverables:

1. every demo and the granular feature it isolates;
2. every TSxxxx diagnostic and what it means;
3. a JavaScript-runtime vs TypeScript-compile-time comparison table;
4. the three places TypeScript **cannot** protect you — the I/O boundary,
   `as`/`any`, and the deliberate unsoundness inside the checker itself — plus
   the category error to avoid (a type checker catches *type* errors, not
   *logic* errors).

---

## Where to start reading

| if you want… | read / run |
|---|---|
| the theory first | `src/00-foundations/manifesto.md` |
| to watch types vanish | `npm run erasure` |
| the shortest convincing demo | `npm run demo:01-primitives` |
| the mechanism behind unions | demos 07 → 08 → 10 |
| the design lesson | demo 13, then 14 |
| the honest limits | demo 12, then 15 |
| a map of the whole thing | `docs/concept-map.md` |

---

*Part of a 30-point series on the problems JavaScript has and TypeScript
solves. See the [repository README](../README.md) for the full table of
contents.*
