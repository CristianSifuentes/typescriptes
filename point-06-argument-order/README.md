# Point 06 — Arguments in the wrong order

> **Concept #6.** In JavaScript, passing arguments in the wrong order
> (`createUser(25, "Ana")` when the signature is `createUser(name, age)`) runs
> silently and corrupts logic downstream. TypeScript checks each argument's type
> against the parameter in that exact position, catching swaps at compile time —
> and, when parameters share a primitive type, branded/nominal types make even
> same-typed swaps impossible.

An executable dissection of that sentence: **14 demos across 4 levels**, each
written twice — once as the JavaScript that misbehaves, once as the TypeScript
that catches it (or, at level 02, the TypeScript that *also* misbehaves, which is
the point of the project).

---

## The shape of the argument

This project has an unusual structure because the concept has an unusual shape.
It is not "TypeScript fixes this". It is **"TypeScript fixes half of this for
free, and you have to buy the other half."**

| level | what it shows |
|---|---|
| **01 basic** | positional checking catches every swap whose types **disagree** |
| **02 intermediate** | it catches **none** whose types agree — the blind spot, and it is not a defect |
| **03 advanced** | four ways to close it: brands, options objects, labeled tuples, builders |
| **04 expert** | the compiler's model, a reusable toolkit, the holes, and how to choose |

Level 02 is the hinge. Its three `.ts-safe` files contain **no
`@ts-expect-error` on the offending lines**, because there is no error to
expect — they compile under `strict: true` and produce the wrong answer.

---

## Quick start

```bash
npm install
npm run demo:all        # all 14 demos, then the final report
npm run evidence        # real tsc diagnostics — and the deliberate silences
npm run erasure         # proof that branded types cost nothing at runtime
```

Requires Node ≥ 20. TypeScript is a dev dependency; nothing is installed
globally.

---

## The 14 demos

| level | command | granular feature |
|---|---|---|
| **01 basic** | `npm run demo:01-swapped-arguments` | positional type matching: argument *i* against parameter *i* |
| | `npm run demo:02-positional-binding` | arity, optionals, rest parameters, spreads of arrays vs tuples |
| | `npm run demo:03-corruption-modes` | `NaN`, `[object Object]`, the wrong branch — and the plausible answer |
| **02 intermediate** | `npm run demo:04-same-type-numbers` | **the blind spot** — why structural typing cannot see it |
| | `npm run demo:05-same-type-strings` | the right action performed on the wrong entity |
| | `npm run demo:06-boolean-flags` | the boolean trap, and literal unions as the cheapest fix |
| **03 advanced** | `npm run demo:07-branded-types` | phantom members: nominal typing, encoded structurally, erased at emit |
| | `npm run demo:08-options-objects` | removing order entirely; diagnostics by name rather than index |
| | `npm run demo:09-labeled-tuples` | positions as a type — and why the *labels* check nothing |
| | `npm run demo:10-builder-pattern` | type-state: method names replace positions; `build` uncallable until complete |
| **04 expert** | `npm run demo:11-positional-assignability` | the call rule, `Parameters<T>`, variance, why names cannot help |
| | `npm run demo:12-brand-toolkit` | `Brand<T, K>`, smart constructors, `Unbrand`, the one-`as` discipline |
| | `npm run demo:13-soundness-holes` | `as`, `any`, `Function`, coarse brands, the I/O boundary |
| | `npm run demo:14-design-tradeoffs` | the two-question decision procedure and a `never`-based guard |

Other commands: `npm run build`, `npm run check`,
`node dist/99-runner/run.js --list`.

---

## Layout

```
point-06-argument-order/
├── README.md
├── package.json                  one npm script per demo
├── tsconfig.json                 strict: true — every flag annotated
├── tsconfig.evidence.json        the evidence lab
├── scripts/evidence.mjs          runs the lab and renders the diagnostics
├── docs/
│   └── concept-map.md            hierarchical decomposition + Mermaid diagram
└── src/
    ├── 00-foundations/
    │   ├── manifesto.md          positional binding · structural vs nominal ·
    │   │                         what brands are · why a class of bugs vanishes
    │   ├── brand-erasure.specimen.ts
    │   └── brand-erasure.demo.ts  diffs the source against its own output
    ├── 01-basic/                 demos 01–03
    ├── 02-intermediate/          demos 04–06
    ├── 03-advanced/              demos 07–10
    ├── 04-expert/                demos 11–14
    └── 99-runner/                traces, proofs, CLI, final report
```

Every demo is three or four files: `*.js-broken.ts` (runs and misbehaves),
`*.ts-safe.ts` (the checked version), `*.explanation.md` (the dissection), and
one `_level-NN.tsc-error.ts` evidence fixture per level.

---

## What makes this project falsifiable

### 1. The evidence lab records silences as well as errors

`npm run evidence` compiles fixtures full of deliberate mistakes. For this point
it does **double duty**: `_level-02.tsc-error.ts` contains a dozen swapped calls
and produces **exactly one** diagnostic. That single error in an otherwise silent
file *is* the shape of the blind spot, demonstrated rather than asserted.

Every diagnostic quoted anywhere in this project comes from that output —
including several that corrected an assumption while the project was being
written:

| I assumed | the compiler said |
|---|---|
| a two-argument swap gives two errors | **one** — the first bad position, then it stops |
| a short call gives TS2554 | **TS2555** when a rest parameter makes arity unbounded |
| `.apply` mismatches give TS2345 | **TS2322**, and one per element rather than one per call |
| an incomplete builder gives TS2339 | **TS2349** — the member exists, its *type* is `never` |
| `Unbrand<B>` works with `infer` | it does not — `infer` cannot decompose an intersection |

### 2. Compile-time proofs, not prose

The central claim of level 02 is proved by asking the compiler:

```ts
type _TheBlindSpot = Expect<Equals<
  Parameters<typeof aspectRatio>[0],
  Parameters<typeof aspectRatio>[1]
>>;                                     // compiles — the types ARE identical
```

and the central claim of level 03 by asking it again with brands in place. Type
claims printed in the console traces use `proveType<T>()`, which fails to compile
if the compiler's belief differs from the printed string.

### 3. The erroneous lines never execute

`@ts-expect-error` suppresses a *diagnostic*; it does not delete *code*. Lines
that would throw are wrapped in `compileTimeOnly(() => { … })` — the checker
still reads and rejects them, and Node never evaluates them.

---

## The four things to take away

1. **Positional checking is free and it catches a lot** — every swap whose types
   disagree, plus arity, optionals, and spreads. TS2345 lands on the argument
   that is wrong.
2. **It catches nothing when the types agree**, and that is a consequence of
   structural typing rather than a gap to be patched. For *n* same-typed
   parameters the compiler accepts all *n!* orderings.
3. **Branded types close it at zero runtime cost.** A `Width` *is* a `number` —
   same value, same arithmetic, same JSON. `npm run erasure` proves it.
4. **Choose per parameter pair.** Would a swap be silent? Would it be expensive?
   Brand only where both answers are yes; two of the eight rows in demo 14's
   table conclude "do nothing".

---

*Part of a 30-point series on the problems JavaScript has and TypeScript
solves. See the [repository README](../README.md) for the full table of
contents.*
