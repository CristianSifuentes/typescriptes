# Point 02 — Implicit coercion (JavaScript) vs blocked at compile time (TypeScript)

> **Concept #2.** JavaScript silently coerces values between types
> (`"5" + 3 === "53"`, `0 == ""`, `null - 1 === -1`), producing results the
> programmer never intended. TypeScript blocks these invalid mixed-type
> operations at compile time and forces every conversion to be explicit.

An executable, self-contained dissection of that sentence: **14 demos across
4 levels**, each one written twice — once as the JavaScript that coerces
silently, once as the TypeScript that either refuses to compile or, in a
handful of demos, honestly documents that it cannot — plus a foundations
essay, a concept map, and an evidence lab that prints real `tsc` diagnostics.

Nothing here is asserted without proof:

- every **runtime** claim is produced by actually running the code;
- every **compile-time** claim is either verified by a type-level assertion
  that breaks the build if it is wrong, or transcribed from
  `npm run evidence`, which compiles deliberately-broken fixtures and prints
  the compiler's own words;
- every place TypeScript **cannot** help is stated as plainly as every place
  it can — demos 03, 05, 09, and 12 exist specifically to draw that line.

---

## Quick start

```bash
npm install
npm run demo:all        # every demo, in order, then the final report
npm run evidence        # real tsc diagnostics, unsuppressed, with TSxxxx codes
```

Requires Node ≥ 20. TypeScript is a dev dependency; nothing is installed
globally.

---

## Every command

| command | what it does |
|---|---|
| `npm run build` | compile `src/` → `dist/` (must succeed with **zero** errors) |
| `npm run check` | type-check only, no emit |
| `npm run demo:all` | run all 14 demos, then print the final report |
| `npm run evidence` | **the evidence lab** — compile the error fixtures and print real diagnostics |
| `node dist/99-runner/run.js --list` | list the demos (after `npm run build`) |

### The 14 demos

| level | command | granular feature |
|---|---|---|
| **01 basic** | `npm run demo:01-plus-operator` | string concatenation vs numeric addition; the `+` result-type rule |
| | `npm run demo:02-arithmetic-coercion` | unconditional `ToNumber` on `-`/`*`/`/`; `NaN` never throws |
| | `npm run demo:03-truthy-falsy` | `ToBoolean`'s fixed eight-value list; the honest limit of `strictNullChecks` |
| **02 intermediate** | `npm run demo:04-loose-vs-strict-equality` | the abstract equality algorithm's non-transitivity; TS2367's real coverage |
| | `npm run demo:05-object-to-primitive` | `ToPrimitive`'s `valueOf`/`toString` chain; a genuine `string + object` gap |
| | `npm run demo:06-null-undefined-arithmetic` | `ToNumber(null)=0` vs `ToNumber(undefined)=NaN`; TS18047/TS18048/TS18050 |
| **03 advanced** | `npm run demo:07-abstract-equality-algorithm` | `IsLooselyEqual`'s eleven branches, traced; a typed `Overlaps<A,B>` guard |
| | `npm run demo:08-union-narrowing` | an operation on a union is legal only if legal for every member |
| | `npm run demo:09-template-literal-coercion` | `ToString` is total; every `${...}` hole accepts every type (a genuine gap) |
| | `npm run demo:10-toprimitive-hooks` | `valueOf`/`Symbol.toPrimitive`; a distinct policy per operator family |
| **04 expert** | `npm run demo:11-branded-types` | structural typing's blind spot, closed with a `unique symbol` brand |
| | `npm run demo:12-soundness-holes` | **where TypeScript cannot protect you** — `as` and `any` |
| | `npm run demo:13-boundary-validation` | a hand-rolled `Schema<T>` that is both the type and the runtime check |
| | `npm run demo:14-never-guarded-op` | a `never`-typed witness that makes a mixed-type call unwritable |

---

## Layout

```
point-02-implicit-coercion/
├── README.md                     ← you are here
├── package.json                  one npm script per demo
├── tsconfig.json                 strict: true — every flag annotated
├── tsconfig.evidence.json        the evidence lab: compiles the broken fixtures
├── scripts/evidence.mjs          runs the lab and renders the diagnostics
├── docs/
│   └── concept-map.md            hierarchical decomposition of Concept #2
│                                 (nested lists + a Mermaid diagram)
└── src/
    ├── 00-foundations/
    │   └── manifesto.md          ToPrimitive/ToNumber/ToString/ToBoolean ·
    │                             why == is unpredictable · what TS checks
    ├── 01-basic/                 demos 01–03
    ├── 02-intermediate/          demos 04–06
    ├── 03-advanced/              demos 07–10
    ├── 04-expert/                demos 11–14
    └── 99-runner/
        ├── trace.ts              banners, tables, coercion-step traces
        ├── type-assert.ts        compile-time proof helpers
        ├── registry.ts           the typed index of every demo
        ├── run-demo.ts           renders one demo
        ├── run.ts                CLI
        └── run-all.ts            everything + the final report
```

### The file pattern

Every demo is three files:

| file | role |
|---|---|
| `NN-name.js-broken.ts` | the code as JavaScript would have it (`// @ts-nocheck`). It **runs**, and misbehaves, and the output shows exactly how. |
| `NN-name.ts-safe.ts` | the TypeScript version. Where TypeScript blocks the mistake, the line is marked `// @ts-expect-error` with the diagnostic it produces. Where it genuinely cannot (demos 05, 09, 12), the file says so explicitly — no line is falsely marked as an error. |
| `NN-name.explanation.md` | the dissection: the ECMAScript algorithm, the TypeScript rule (or its absence), the comparison table, and the limit. |
| `_level-NN.tsc-error.ts` | one per level: the **evidence fixture**, full of real unsuppressed errors, compiled only by `npm run evidence`. |

---

## Three things that make this project unusual

### 1. Some demos have nothing to `@ts-expect-error`

Most tutorials about TypeScript only show you what it catches. Demos 03, 05,
09, and 12 exist specifically to show what it **does not** — with the same
rigor as every catch: a real runtime trace, a real explanation of the
mechanism, and a real fix that isn't a compiler flag. A series that only
ever shows successful catches would be advertising, not a dissection.

### 2. Compile-time proofs, not comments

Claims like "here the compiler knows the value is a `string`" are usually
unverifiable prose. Here they are machine-checked:

```ts
proveType<string>()(concatenated, "string", "string operand ⇒ concatenation");
```

If the static type of `concatenated` is not **exactly** `string`, that line
fails to compile. The console trace is therefore a *rendering of a proved
fact*, not a promise. See `src/99-runner/type-assert.ts`.

### 3. The evidence lab

`npm run evidence` compiles `*.tsc-error.ts` — files excluded from the main
build precisely so their errors stay unsuppressed — and prints the raw
diagnostics with their elaboration chains:

```
▸ src/04-expert/_level-04.tsc-error.ts  (5 errors)
   30:13   TS2345 Argument of type 'UserId' is not assignable to parameter of type 'OrderId'.
           ↳ Property '[orderIdBrand]' is missing in type '... UserId ...' but required in type '... OrderId ...'.
   ...
```

Every message quoted anywhere in this project — 27 diagnostics across 4
files — comes from that output, re-verified against the TypeScript version
installed by `npm install`.

---

## What the final report says

`npm run demo:all` ends with four deliverables:

1. every demo and the granular feature it isolates;
2. every `TSxxxx` diagnostic used in this project and what it means;
3. a JavaScript (silent coercion) vs TypeScript (blocked at compile time)
   table covering all 14 cases;
4. the four places TypeScript **cannot** protect you from coercion —
   truthiness beyond `null`/`undefined`, `string + object` and template
   literals, `as`/`any`, and coercion hooks TS2367 cannot see into — and
   what to do about each instead of reaching for a compiler flag that does
   not exist.

---

## Where to start reading

| if you want… | read / run |
|---|---|
| the theory first | `src/00-foundations/manifesto.md` |
| the shortest convincing demo | `npm run demo:01-plus-operator` |
| the equality algorithm, traced | demo 04, then demo 07 |
| the design lesson | demo 11, then demo 13, then demo 14 |
| the honest limits | demos 03, 05, 09, then demo 12 |
| a map of the whole thing | `docs/concept-map.md` |

---

*Part of a series on the problems JavaScript has and TypeScript solves. See
the [repository README](../README.md) for the full table of contents.*
