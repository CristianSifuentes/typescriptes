# 09 — User-defined type guards: the mechanism, dissected

**Run it:** `npm run demo:09-type-guards`

---

## The problem guards solve

Types are erased (`00-foundations` §2). At runtime there is no `PaymentEvent`
to compare against — only a value, and JavaScript's own runtime tags
(`typeof`, prototype chains, property presence).

So the question "is this thing a `PaymentEvent`?" has to be answered by **code
you write**, and its answer has to be **communicated back to the type system**.
A type predicate is exactly that channel — the one bridge across the erasure
boundary.

```ts
function isPaymentEvent(value: unknown): value is PaymentEvent
//                                       ^^^^^^^^^^^^^^^^^^^^^ the channel
```

In JavaScript the same function returns a `boolean` and the conclusion dies at
the `return` statement. Four failures follow, all shown in the `.js-broken`
twin:

| failure | JavaScript cost | TypeScript |
|---|---|---|
| validator never called | `NaN` through the system | **TS18046** — `unknown` permits nothing |
| result discarded | `"charging NaN undefined"` | **TS18046** — no branch, no narrowing |
| applied to the wrong object | unvalidated data used anyway | inner value stays `unknown` |
| validator drifts from the data | everything rejected, silently | **TS2339** — one declared shape |

---

## `unknown` versus `any`

| | `any` | `unknown` |
|---|---|---|
| set reading | not a set — an instruction to stop checking | the universal set |
| operations permitted | all | **none**, until narrowed |
| assignable **to** | everything | only `unknown` (and `any`) |
| assignable **from** | everything | everything |
| effect on the program | a hole in the proof | a *question* the proof must answer |

`unknown` is the honest type for anything crossing a boundary: `JSON.parse`,
`fetch`, `process.env`, `postMessage`, a driver result. It permits nothing
because every value is a member, so no operation is valid for **all** members —
which is the same union rule from demo 08, taken to its limit.

---

## The three tools

```ts
function isT(v: unknown): v is T          // narrows the TRUE EDGE of a branch
function assertT(v: unknown): asserts v is T   // narrows the REST OF THE SCOPE
function assertOk(v: unknown): asserts v       // truthiness assertion
```

Assertion signatures have two requirements that trip people up:

1. The asserting function must have an **explicit type annotation** — TypeScript
   will not infer an `asserts` signature.
2. The call must be a **statement**, and the asserted reference must be a `const`
   or an explicitly-typed binding.

They narrow everything after the call, because the only way execution continues
is if the assertion held.

---

## The catch: a predicate is an unverified claim

This is the honest centre of the demo.

```ts
const isPaymentEvent = (value: unknown): value is PaymentEvent => true;  // accepted
```

The compiler checks exactly **one** thing about a predicate:

```
error TS2677: A type predicate's type must be assignable to its parameter's type.
  Type 'PaymentEvent' is not assignable to type 'number'.
```

— that the claimed type could plausibly inhabit the parameter's type. It does
**not** check that the body establishes the claim. It cannot: that is program
verification, not type checking.

So a type guard is a place where **you** take responsibility for the bridge
between runtime values and compile-time types. In the demo, a lying guard
produces `NaN` at runtime inside a fully `strict` program. That is not a
TypeScript defect; it is the boundary of what a type system is.

Practical mitigations, in order of strength:

1. **Generate guards from a schema** (`zod`, `valibot`, `typia`,
   `ts-json-schema-generator`) so the type and the validator have a single
   source of truth and cannot drift.
2. Keep hand-written predicates **tiny** and adjacent to the type they prove.
3. Treat every predicate as **security-critical code** — because a guard is
   precisely where untrusted input becomes trusted.

---

## Where each guard belongs

| tool | narrows | use when |
|---|---|---|
| `typeof` / `instanceof` / `in` / `Array.isArray` | both edges | primitives, classes, structural checks |
| discriminant (`r.kind === "x"`) | both edges, precisely | unions you designed yourself |
| `v is T` predicate | the true edge | you must handle both outcomes |
| `asserts v is T` | the rest of the scope | invalid input is a bug — throw |

Rule of thumb: use built-in guards where they suffice, write predicates **only
at the boundary**, and let the discriminated-union design (demo 13) remove the
need for most of them.
