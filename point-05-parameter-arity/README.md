# point-05-parameter-arity

### Concept #5 — too many or too few function parameters, caught before it ships

> In JavaScript, calling a function with the wrong number of arguments is
> silently tolerated: extra arguments are ignored, missing ones become
> `undefined`, and the resulting `NaN`/`undefined`/garbage propagates until
> it fails somewhere unrelated. TypeScript enforces each function's
> **arity** and per-parameter **types** at compile time — you must pass
> exactly the required arguments (accounting for optional, default, and
> rest parameters), each of the correct type.

This project doesn't just claim TypeScript "catches that." It **dissects
the mechanism**: how the compiler models a parameter list as an
arity-bounded, per-position typed contract; how optional, default, and
rest parameters each relax that contract in a distinct, principled way; how
overload resolution and generic composition extend arity checking beyond a
single fixed signature — and, just as importantly, exactly where that
guarantee **stops**.

Every one of the 17 demos below is a runnable, three-file dissection of one
granular mechanism: the JavaScript bug that reaches production as a silent
`NaN` or `undefined`, the TypeScript code that rejects it before a single
line runs, and a written explanation of *why*, backed by the compiler's
real diagnostic text.

---

## Quick start

```bash
npm install
npm run demo:all          # every demo, in order, plus a final report
```

or run one demo at a time:

```bash
npm run demo:01-too-few-arguments
npm run demo:09-tuple-parameters
npm run demo:17-never-arity-guard
```

Each demo prints two parts to your terminal:

1. **PART 1 — JAVASCRIPT** (`@ts-nocheck`): the unchecked version actually
   runs, and you watch it silently produce `NaN`, `undefined`, or garbage —
   almost never a loud crash at the call site itself.
2. **PART 2 — TYPESCRIPT** (`strict: true`): the checked version shows the
   exact `tsc` diagnostic that rejects the same mistake, followed by the
   corrected code actually running successfully.

Other useful commands:

```bash
npm run check               # tsc --noEmit over the whole project
npm run build                # compile src/ → dist/
npm run evidence             # real, unsuppressed tsc diagnostics (see docs/concept-map.md)
node dist/99-runner/run.js --list   # list every demo id, level, and feature
```

---

## Project structure

```
point-05-parameter-arity/
├── README.md                    ← you are here
├── package.json                 ← one `npm run demo:<id>` script per demo
├── tsconfig.json                ← strict: true, every relevant flag annotated
├── src/
│   ├── 00-foundations/
│   │   └── manifesto.md         ← the four questions everything else answers
│   ├── 01-basic/                ← demos 01–04
│   ├── 02-intermediate/         ← demos 05–08
│   ├── 03-advanced/             ← demos 09–12
│   ├── 04-expert/               ← demos 13–17
│   └── 99-runner/               ← the CLI, the demo registry, and the trace/print toolkit
└── docs/
    └── concept-map.md           ← a navigable, hierarchical index of the whole project
```

Each demo lives as a triplet of files sharing one id, e.g. `07-rest-parameters`:

| file | purpose |
|---|---|
| `07-rest-parameters.js-broken.ts` | `@ts-nocheck` — the JavaScript version. It runs, and it silently misbehaves. |
| `07-rest-parameters.ts-safe.ts` | `strict: true` — the TypeScript version. The invalid call is left in place behind `@ts-expect-error`, annotated with the exact diagnostic. |
| `07-rest-parameters.explanation.md` | the mechanism, dissected in prose — no hand-waving, every claim tied to a real compiler behavior. |

---

## The four depth levels

### 00 — Foundations (`src/00-foundations/manifesto.md`)

Answers, with precision, the four questions every later demo assumes: what
"arity" is and how a parameter list is a type; why JavaScript's binding
model tolerates any argument count; how TypeScript's two-step arity + per-
position algorithm works; and why compile-time arity checking removes an
entire *class* of `NaN`/`undefined`-propagation bugs rather than one
instance of one.

### 01 — Basic (`src/01-basic/`)

| demo | what it isolates | diagnostic |
|---|---|---|
| `01-too-few-arguments` | calling with fewer arguments than required (`greet()`) | **TS2554** |
| `02-too-many-arguments` | calling with more arguments than declared, silently discarded in JS | **TS2554** |
| `03-wrong-type-argument` | the right count, the wrong type at a position — coercion masks the bug in JS | **TS2345** |
| `04-undefined-vs-missing` | explicit `undefined` vs. a genuinely omitted argument — two mistakes, one JS symptom | **TS2345** / **TS2554** |

### 02 — Intermediate (`src/02-intermediate/`)

| demo | what it isolates | diagnostic |
|---|---|---|
| `05-optional-parameters` | `b?: number` — lowers the minimum arity, types `b` as `number \| undefined` | **TS18048** |
| `06-default-parameters` | `b = 10` — substitutes on omission/`undefined`, never on `null` | **TS2345** |
| `07-rest-parameters` | `...nums: number[]` — unbounded arity, uniform per-element typing | **TS2345** |
| `08-required-after-optional-ordering` | why a required parameter can't (usefully) follow an optional one | **TS1016** / **TS2554** |

### 03 — Advanced (`src/03-advanced/`)

| demo | what it isolates | diagnostic |
|---|---|---|
| `09-tuple-parameters` | labeled tuples as a fixed-length argument shape, spread into a call | **TS2322** / **TS2554** |
| `10-spread-arguments` | why spreading a plain array into a fixed-arity call is refused outright | **TS2556** |
| `11-overload-arity-resolution` | multiple call signatures distinguished purely by parameter count | **TS2575** |
| `12-destructured-parameters` | a typo'd/missing field inside a destructured parameter | **TS2561** / **TS2345** |

### 04 — Expert (`src/04-expert/`)

| demo | what it isolates | diagnostic |
|---|---|---|
| `13-call-resolution-model` | the compiler's five-step call-checking algorithm, narrated explicitly | **TS2345** |
| `14-variadic-generic-arity` | `[...Fixed, ...Rest]` variadic tuples powering a typed `partial()` | **TS2554** / **TS2345** |
| `15-soundness-limits` | `as`, `any`, `Function`, and `.apply` each **reopening** the arity hole — and the real fix | *(escape hatches — see below)* |
| `16-strict-function-types-bivariance` | arity substitution rules, plus `strictFunctionTypes`'s separate effect on parameter type variance | **TS2345** / **TS2322** |
| `17-never-arity-guard` | a `never`-collapsing conditional type making a compile-time-known wrong length a hard error | **TS2345** |

---

## JavaScript vs. TypeScript, side by side

| call | JavaScript outcome | discovered | TypeScript | discovered |
|---|---|---|---|---|
| `greet()` where `greet(name: string)` | `name = undefined`, returns `"Hello, undefined"` | at runtime | **TS2554** | as you type |
| `add(1, 2, 3)` where `add(a, b)` | the 3rd argument silently ignored | never (wrong result, no signal) | **TS2554** | as you type |
| `greet(42)` where `greet(name: string)` | `"Hello, 42"` — coerced, not rejected | never (wrong result, no signal) | **TS2345** | as you type |
| `charge(undefined)` where `charge(amount: number)` | `NaN` propagates silently | runtime, elsewhere | **TS2345** | as you type |
| `fn(a, b)` where `b` is genuinely optional | `b = undefined` if omitted — this one is fine | n/a — valid | no diagnostic | — |
| `sum(...nums)` with a non-number in `nums` | `NaN` propagates through the reduction | runtime, elsewhere | **TS2345** | as you type |
| a destructured call with a typo'd field | the typo'd field silently unused, the real one `undefined` | runtime, elsewhere | **TS2561** (spelling suggested) | as you type |
| a call matching no overload's arity | wrong overload silently picked, or throws | at runtime | **TS2575** | as you type |
| `fn.apply(null, untypedArray)` | `TypeError` or `NaN`, depending on contents | at runtime | not checked once the array's type is `any` — see below | never |

---

## Where TypeScript **cannot** protect you

This project is honest about its own limits (`04-expert/15-soundness-limits`):

1. **`any`, `Function`, and `as`.** A value typed `any` accepts a call with
   any number of arguments of any type. `Function` is `(...args: any[]) =>
   any` — callable with anything. `as` overrides the checker's judgement
   with no runtime check emitted. All three are ways to stop declaring a
   parameter list for the compiler to verify.
2. **`.apply` / spread of an untyped array.** `fn.apply(null,
   argsFromSomewhere)` hands the compiler an array whose *length* is not
   part of its type — `number[]` says nothing about how many numbers.
   Arity checking requires a **tuple** type to know a count at compile
   time; a plain array type (or an `any`-typed one, as `JSON.parse`
   returns) reopens the hole regardless of `strictBindCallApply`.
3. **The I/O boundary.** Arguments assembled from configuration, CLI
   flags, or deserialized data carry a length that is a *runtime* fact —
   no amount of compile-time cleverness can recover it. The fix is
   validating the shape (length and per-field type) at the edge, with a
   runtime predicate, before spreading it into a call (`demo 15`'s
   `isPair`, or `demo 17`'s compile-time-only `never` guard for literals
   whose length *is* known in source).

TypeScript proves things about the code you wrote against the types you
declared. It cannot prove anything about an argument list whose length was
merely *asserted*, never checked — and this project draws that boundary
explicitly rather than pretending it doesn't exist.

---

## Read next

- [`src/00-foundations/manifesto.md`](src/00-foundations/manifesto.md) — the physics of the concept, in four precise answers.
- [`docs/concept-map.md`](docs/concept-map.md) — a hierarchical, Mermaid-diagrammed index from the root claim down to every leaf mechanism.
- `npm run demo:all` — the entire series, back to back, ending in a generated final report (every demo, every diagnostic, the JS-vs-TS table above, and the soundness-limits summary — all produced live, not hand-copied).

---

## Technical notes

- **TypeScript**, `strict: true`, with every relevant strictness flag
  individually commented in [`tsconfig.json`](tsconfig.json) — including
  *why* each one matters to this specific concept (e.g. `strictNullChecks`
  for demos 04/05, `strictFunctionTypes` for demo 16, `strictBindCallApply`
  for demo 15's `.apply` hole).
- Every `*.ts-safe.ts` file's invalid call is left in the source, suppressed
  with `@ts-expect-error` and a comment transcribing the exact diagnostic —
  if the compiler's wording ever changes, `@ts-expect-error` (and
  `npm run check`) will fail loudly, keeping every claim in this README and
  in each `.explanation.md` falsifiable.
- `src/99-runner/trace.ts` and `type-assert.ts` are the project's own
  instrument panel: `proveType<T>()` encodes a claim about what the
  compiler believes as a type-level obligation the build fails if it's
  wrong, so every "TypeScript proved X here" comment printed at runtime is
  a *rendering* of a proof, not an assertion made in prose.
