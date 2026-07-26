# typescriptes

List of problems in JavaScript that TypeScript solves.

**A 30-point series** — each point a self-contained, executable, granular
dissection rather than a blog post.

Every point is built to the same standard:

- **Scientist** — no claim about compiler behaviour without the real `tsc`
  output or the mechanism that produces it.
- **Expert** — correct terminology (soundness, narrowing, erasure, variance,
  control flow graph), defined the first time it appears.
- **Artist** — the invisible made visible: console traces of what the compiler
  believes at each line, before/after tables, and a concept map per point.

---

## Status

| # | point | status |
|---|---|---|
| 01 | [Type errors at runtime vs compile time](./point-01-type-errors/) | ✅ **complete** — 15 demos, 4 levels, evidence lab |
| 02–30 | see the table of contents below | 🚧 planned |

```bash
cd point-01-type-errors
npm install
npm run demo:all      # 15 demos + the final report
npm run evidence      # real tsc diagnostics, unsuppressed
```

---

## Table of contents — the 30 points

Each row is a **class of JavaScript defect**, the **TypeScript mechanism** that
eliminates it, and the level at which the series treats it. The ordering is
deliberate: each point assumes only the points before it.

### Part I — The core claim (points 01–05)

| # | Point | The JavaScript problem | The TypeScript answer |
|---|---|---|---|
| **01** | **Type errors at runtime → compile time** | a defect is discovered by a user, on one input, in production | static checking over all executions; erasure; `never`; the soundness holes |
| 02 | Implicit coercion, `==`, and truthiness | `"5" - 3`, `0 \|\| default`, `if ("false")` | operator operand rules, literal types, `??`, `!== undefined` |
| 03 | `undefined is not a function` | prototype-chain lookup fails at call time | static member resolution; `unknown`; optional chaining |
| 04 | Null and undefined — the billion-dollar mistake | every value is secretly nullable | `strictNullChecks`, narrowing, `NonNullable`, `?.` and `??` |
| 05 | Function contracts | arity, argument order, and return types are suggestions | signatures, overloads, optional/rest params, branded parameters |

### Part II — Shapes and data (points 06–10)

| # | Point | The JavaScript problem | The TypeScript answer |
|---|---|---|---|
| 06 | Object shape drift | a renamed field breaks callers silently | `interface`/`type`, structural typing, freshness, `Omit`/`Pick` |
| 07 | Arrays, tuples, and heterogeneous data | one stray element changes a fold's meaning | element types, tuples, `readonly`, `noUncheckedIndexedAccess` |
| 08 | Magic strings and enums | `"activ"` compiles, ships, and matches nothing | literal types, `as const`, unions vs `enum`, exhaustive `Record` |
| 09 | Unhandled states | a new case makes every `switch` silently return `undefined` | discriminated unions, `never`, `assertNever`, exhaustive `match` |
| 10 | Immutability and accidental mutation | a shared object is mutated three modules away | `readonly`, `as const`, `Readonly<T>`, and where they stop working |

### Part III — The runtime model (points 11–15)

| # | Point | The JavaScript problem | The TypeScript answer |
|---|---|---|---|
| 11 | `this`, bound and unbound | an extracted method loses its receiver | `ThisParameterType`, `noImplicitThis`, `strictBindCallApply`, arrow semantics |
| 12 | Classes, visibility, and initialization | `_private` is a naming convention; fields may be `undefined` | `private`/`#`, `abstract`, `override`, `strictPropertyInitialization` |
| 13 | Asynchrony and promises | a forgotten `await` silently yields a `Promise` | `Promise<T>` inference, `await` typing, floating-promise detection, typed rejections |
| 14 | Iterators, generators, async iteration | protocol conformance is checked by crashing | `Iterable<T>`, `AsyncIterable<T>`, generator yield/return/next types |
| 15 | Modules and interop | a wrong import path fails at load time | module resolution, `verbatimModuleSyntax`, ESM/CJS interop, circular imports |

### Part IV — The boundary (points 16–20)

| # | Point | The JavaScript problem | The TypeScript answer |
|---|---|---|---|
| 16 | Untyped external data | `JSON.parse` returns whatever it likes | `unknown`, type guards, schema validation, parse-don't-validate |
| 17 | Configuration and environment | every `process.env` value is a string or missing | typed config objects, boundary parsing, `satisfies` |
| 18 | HTTP and API contracts | request/response shapes live in documentation | typed clients, types generated from OpenAPI/GraphQL, end-to-end inference |
| 19 | Databases and persistence | a row is `any` the moment it leaves the driver | typed query builders, generated row types, branded IDs |
| 20 | Errors as values | `catch (e)` gives you something; nobody knows what | `useUnknownInCatchVariables`, typed error unions, `Result<T, E>` |

### Part V — The type system as a language (points 21–25)

| # | Point | The JavaScript problem | The TypeScript answer |
|---|---|---|---|
| 21 | Reuse without `any` | generic code is written by giving up on types | generics, constraints, inference sites, variance |
| 22 | Higher-order functions | `compose`, `pipe`, and curried helpers lose all type information | generic inference, tuple types, variadic type parameters |
| 23 | Transforming types | shapes are duplicated by hand and drift apart | mapped types, key remapping, `Partial`/`Required`/`Record` and friends |
| 24 | Computing with types | a "type-safe" API is enforced by documentation | conditional types, `infer`, distributive conditionals, recursion budgets |
| 25 | String-typed APIs | routes, event names, and keys are stringly typed | template literal types, `keyof`, typed paths and event maps |

### Part VI — Living with it (points 26–30)

| # | Point | The JavaScript problem | The TypeScript answer |
|---|---|---|---|
| 26 | Structural typing is not always enough | two `string` IDs are interchangeable, and should not be | branded/nominal types, opaque types, unit-safe arithmetic |
| 27 | The DOM and platform APIs | `getElementById` returns something you hope is an input | `lib.dom`, element and event type maps, narrowing platform values |
| 28 | Untyped and wrongly-typed dependencies | a `.d.ts` is a claim about code the compiler never sees | writing `.d.ts`, declaration merging, module augmentation, auditing types |
| 29 | Testing and types | tests check values; nothing checks the types | type-level tests, `expect-type`/`tsd`, typed mocks and fixtures |
| 30 | Migration and scale | "we'll add types later", and a 40-second build | gradual adoption, JSDoc types, the strict-mode ratchet, build performance, `tsc --generateTrace` |

---

## The shape of every point

Each point is a standalone npm project with the same anatomy, so the series is
navigable in any order once point 01 is understood:

```
point-NN-<slug>/
├── README.md                 how to run every demo
├── package.json              one npm script per demo
├── tsconfig.json             strict: true, every flag annotated
├── tsconfig.evidence.json    the evidence lab
├── docs/concept-map.md       hierarchical decomposition (lists + Mermaid)
└── src/
    ├── 00-foundations/       manifesto.md — the theory, precisely
    ├── 01-basic/             the mechanism at its simplest
    ├── 02-intermediate/      realistic domain code
    ├── 03-advanced/          the machinery: narrowing, guards, exhaustiveness
    ├── 04-expert/            the compiler's model, and where it stops
    └── 99-runner/            traces, proofs, CLI, final report
```

And the same file pattern per demo:

| file | role |
|---|---|
| `*.js-broken.ts` | the JavaScript version (`// @ts-nocheck`) — it runs, and misbehaves |
| `*.ts-safe.ts` | the TypeScript version — the same defects, each `// @ts-expect-error`ed |
| `*.explanation.md` | the dissection: mechanism, set-theoretic reasoning, tables, limits |
| `_level-NN.tsc-error.ts` | the evidence fixture — real, unsuppressed diagnostics |

### Three non-negotiable rules

1. **`@ts-expect-error`, never `@ts-ignore`.** The former asserts that an error
   *exists* (TS2578 if it stops existing), so every demo doubles as a regression
   test of compiler behaviour.
2. **Compile-time claims must be machine-verified.** `proveType<T>()(value, …)`
   fails to compile unless the compiler's belief matches the printed string, so
   the traces are renderings of proved facts rather than promises.
3. **Every quoted diagnostic comes from the evidence lab.** `npm run evidence`
   compiles the broken fixtures and prints the compiler's own words, elaboration
   chains included.

---

## Licence

See [LICENSE](./LICENSE).
