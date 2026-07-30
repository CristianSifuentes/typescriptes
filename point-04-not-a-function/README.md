# point-04-not-a-function

### Concept #4 — `undefined is not a function`, caught before it ships

> In JavaScript, calling something that isn't callable — a misspelled
> method, a property that's actually a value, an `undefined` slot — throws
> `TypeError: undefined is not a function` at runtime, often deep in
> production. TypeScript verifies **at compile time** that whatever you
> invoke with `()` is actually a function with a compatible call signature,
> and that the method you're reaching for genuinely exists on that type.

This project doesn't just claim TypeScript "catches that." It **dissects
the mechanism**: how the compiler models "callable" as a first-class part
of the type system, how it resolves a call signature, how overloads are
matched, how `this` becomes checkable, why `strictNullChecks` refuses to
call something that might be absent — and, just as importantly, exactly
where that guarantee **stops**.

Every one of the 17 demos below is a runnable, three-file dissection of one
granular mechanism: the JavaScript bug that reaches production, the
TypeScript code that rejects it before a single line runs, and a written
explanation of *why*, backed by the compiler's real diagnostic text.

---

## Quick start

```bash
npm install
npm run demo:all          # every demo, in order, plus a final report
```

or run one demo at a time:

```bash
npm run demo:01-noncallable-value
npm run demo:09-call-signatures-hybrid
npm run demo:17-function-vs-precise-signatures
```

Each demo prints two parts to your terminal:

1. **PART 1 — JAVASCRIPT** (`@ts-nocheck`): the unchecked version actually
   runs, and you watch it throw `TypeError: ... is not a function` (or, in
   a couple of demos, something quieter and worse — a value silently
   corrupted instead of a crash).
2. **PART 2 — TYPESCRIPT** (`strict: true`): the checked version shows the
   exact `tsc` diagnostic that rejects the same mistake, followed by the
   corrected code actually running successfully.

Other useful commands:

```bash
npm run check              # tsc --noEmit over the whole project
npm run build               # compile src/ → dist/
npm run evidence            # (see docs/concept-map.md) real, unsuppressed tsc diagnostics
node dist/99-runner/run.js --list   # list every demo id, level, and feature
```

---

## Project structure

```
point-04-not-a-function/
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

Each demo lives as a triplet of files sharing one id, e.g. `06-optional-chaining-call`:

| file | purpose |
|---|---|
| `06-optional-chaining-call.js-broken.ts` | `@ts-nocheck` — the JavaScript version. It runs, and it crashes. |
| `06-optional-chaining-call.ts-safe.ts` | `strict: true` — the TypeScript version. The invalid call is left in place behind `@ts-expect-error`, annotated with the exact diagnostic. |
| `06-optional-chaining-call.explanation.md` | the mechanism, dissected in prose — no hand-waving, every claim tied to a real compiler behavior. |

---

## The four depth levels

### 00 — Foundations (`src/00-foundations/manifesto.md`)

Answers, with precision, the four questions every later demo assumes:
what "callable" means formally and why a call signature is a type; why
JavaScript's runtime fails with `undefined is not a function`; how
TypeScript verifies method existence and callability *before* execution;
and why compile-time checking removes an entire *class* of crashes rather
than one instance of one.

### 01 — Basic (`src/01-basic/`)

| demo | what it isolates | diagnostic |
|---|---|---|
| `01-noncallable-value` | calling a plain non-function value (`const x = 5; x()`) | **TS2349** |
| `02-misspelled-method` | a typo'd method name (`"hello".toUpperCasee()`) | **TS2551** |
| `03-wrong-type-method` | a real method, called on the wrong type (`(5).toUpperCase()`) | **TS2339** |
| `04-function-typed-variable` | assigning a non-function into a `() => void` slot | **TS2322** |

### 02 — Intermediate (`src/02-intermediate/`)

| demo | what it isolates | diagnostic |
|---|---|---|
| `05-property-not-function` | a config field that's a value, called as a method (`config.retry()`) | **TS2349** |
| `06-optional-chaining-call` | an optional hook (`onError?:`), unguarded vs. `?.()` | **TS18048** |
| `07-noncallable-callback` | a non-callable argument passed where a callback is declared | **TS2345** |
| `08-strict-null-invocation` | a mutable `Handler \| undefined` field, narrowed with `if` before the call | **TS18048** |

### 03 — Advanced (`src/03-advanced/`)

| demo | what it isolates | diagnostic |
|---|---|---|
| `09-call-signatures-hybrid` | a **hybrid type** — callable *and* carrying properties — missing either half | **TS2322** |
| `10-overloads` | a call matching none of a function's declared overload signatures | **TS2769** |
| `11-this-binding` | a detached method losing `this`, caught via an explicit `this` parameter | **TS2684** |
| `12-narrowing-to-callable` | `typeof x === "function"` narrowing a `number \| Fn` union before invocation | **TS2349** |

### 04 — Expert (`src/04-expert/`)

| demo | what it isolates | diagnostic |
|---|---|---|
| `13-invocation-resolution-model` | the compiler's five-step call-checking algorithm, narrated explicitly | **TS2345** |
| `14-soundness-limits` | `any`, `as`, and an unchecked lookup each **reopening** the crash — and the real fix | *(escape hatches — see below)* |
| `15-typed-dispatch-registry` | a closed key union + a total `Record<Key, Handler>` + `never`-exhaustiveness | **TS2345** / **TS2741** |
| `16-function-variance` | contravariant parameter checking — why a *wider*-parameter handler substitutes safely and a *narrower* one doesn't | **TS2345** |
| `17-function-vs-precise-signatures` | the built-in `Function` type (`(...args: any[]) => any`) vs. a precise signature | **TS2322** |

---

## JavaScript vs. TypeScript, side by side

| call | JavaScript outcome | discovered | TypeScript | discovered |
|---|---|---|---|---|
| `const x = 5; x()` | `TypeError: x is not a function` | at runtime | **TS2349** | as you type |
| `"hi".toUpperCasee()` | `TypeError: ... is not a function` | at runtime | **TS2551** (spelling suggested) | as you type |
| `(5).toUpperCase()` | `TypeError: ... is not a function` | at runtime | **TS2339** | as you type |
| `fn = 42` where `fn: () => void` | `TypeError` at the *eventual* call | runtime, elsewhere | **TS2322** at the assignment | as you type |
| `config.retry()` where `retry: number` | `TypeError: retry is not a function` | at runtime | **TS2349** | as you type |
| `obj.onError()`, hook absent | `TypeError` (or a read on `undefined`) | at runtime | **TS18048** unless `?.` is used | as you type |
| a non-callable value passed as a callback | `TypeError`, inside the *consumer* | runtime, elsewhere | **TS2345** at the call site | as you type |
| `handler()` where `handler: Fn \| undefined` | `TypeError`, intermittently | runtime, some inputs | **TS18048** | as you type |
| a call matching no overload | wrong overload picked silently, or throws | at runtime | **TS2769** | as you type |
| a detached method (`const m = obj.method; m()`) | `TypeError` reading a property off `this` | at runtime | **TS2684** | as you type |
| a narrower handler registered where a wider one is required | `TypeError`, only for some event shapes | runtime, load-dependent | **TS2345** | as you type |
| a renamed/missing key in a dynamic dispatch table | `TypeError: ... is not a function` | at runtime | **TS2345** / **TS2741** | as you type |

---

## Where TypeScript **cannot** protect you

This project is honest about its own limits (`04-expert/14-soundness-limits`):

1. **`any` and `as`.** A value typed `any` has no call signature to check
   `()` against — every invocation compiles, right or wrong. `as` overrides
   the checker's judgement with no runtime check emitted. Both are ways to
   stop declaring a shape for the compiler to verify.
2. **Loose or `any`-typed dynamic dispatch.** `handlers[eventName]()` where
   `handlers` is indexed by plain `string` (or cast to `any` at the lookup)
   accepts any key, so a missing handler is `undefined()` at runtime —
   exactly the crash this project exists to prevent. The fix is a **closed**
   key set (`04-expert/15-typed-dispatch-registry`), not a wider one.
3. **The I/O boundary.** `JSON.parse`, `require()`/dynamic `import()`, and
   similar boundaries return values whose "this is callable" claim was
   never checked by the compiler — only asserted by whoever wrote the type
   annotation. The fix is validating with `typeof value === "function"` (or
   `in` / structural checks) **before** the first `as`, never after.

TypeScript proves things about the code you wrote against the types you
declared. It cannot prove anything about a callable value whose type was
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
  for demos 06/08, `strictFunctionTypes` for demo 16, `strictBindCallApply`
  and `noImplicitThis` for demo 11).
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
