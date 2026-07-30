# 13 — Discriminated unions: making illegal states unrepresentable

**Run it:** `npm run demo:13-discriminated-unions`

---

## The inversion

Every previous demo asked: *how does the compiler catch my mistake?*
This one asks: *how do I design types so the mistake cannot be written?*

That is the difference between using a type system as a **checker** and using it
as a **design tool**, and it is where the leverage is.

---

## The problem: boolean soup

```js
{ isLoading, data, error }
```

Three independent fields describe **2 × 2 × 2 = 8** states. Four are
meaningful. The other four are *impossible states* — and all eight are
representable, constructible, and reachable by ordinary assignment.

| isLoading | data | error | meaning |
|---|---|---|---|
| false | null | null | idle |
| true | null | null | loading |
| false | set | null | success |
| false | null | set | failure |
| **true** | **set** | null | **impossible** — spinner over data that arrived |
| **true** | null | **set** | **impossible** |
| false | **set** | **set** | **impossible** — which one wins depends on `if` order |
| **true** | **set** | **set** | **impossible** |

Add `isStale` and `retryCount` and the table has dozens of rows. The defensive
`if`s scattered through the codebase are an attempt to enforce, by hand and at
runtime, a constraint that should have been part of the data model.

The consequences are not stack traces. They are a spinner over data that has
already arrived, an error hiding a good result, and a `render({})` on the very
first render — the state right after `useState({})`.

---

## The solution

```ts
type RequestState =
  | { status: "idle" }
  | { status: "loading"; startedAt: number }
  | { status: "success"; order: Order; fetchedAt: number }
  | { status: "failure"; error: string; retryable: boolean };
```

**Four representable states. Four meaningful states. Zero illegal states.**

Three properties, and they compound:

1. **Exclusivity.** `order` exists only in the success member. No value of this
   type is both loading and holding an order. The impossible states are not
   *checked for*; they are **unrepresentable**.
2. **Narrowing.** Comparing the discriminant selects exactly one member,
   unlocking its fields and hiding the others (demo 07).
3. **Exhaustiveness.** The member list is finite and known, so `assertNever`
   can prove every case is handled (demos 10 and 14).

---

## The diagnostics the four impossible states now produce

| attempt | diagnostic |
|---|---|
| `{ status: "loading", startedAt: 1, order: {…} }` | **TS2353** — `'order' does not exist in type '{ status: "loading"; startedAt: number; }'` |
| `{ status: "success", …, error: "boom" }` | **TS2353** — `'error' does not exist in the success member` |
| `{}` (the `useState({})` state) | **TS2739** — `Type '{}' is missing the following properties` |
| `{ status: "success", order: {…} }` (forgot `fetchedAt`) | **TS2741** — `Property 'fetchedAt' is missing` |
| `state.order` before discriminating | **TS2339** — `Property 'order' does not exist on type 'RequestState'` |

The fourth row is the most valuable in practice: it kills the **partial update**
bug, the most common state-management defect in React-shaped code.

---

## Why transitions should return whole states

```ts
case "resolved":
  return { status: "success", order: event.order, fetchedAt: event.at };
```

Not `{ ...state, data: … }`. Returning a **whole new state** means no field can
survive from the previous one, so "forgot to clear `isLoading`" is structurally
absent. The type enforces the discipline: you cannot spread a `loading` state
into a `success` state, because their members do not overlap.

Events deserve the same treatment — `RequestEvent` in the demo is itself a
discriminated union, so the reducer is exhaustive over both axes.

---

## Design rules

1. **Use a string-literal discriminant, not a boolean.** Booleans do not scale
   past two states, and `isLoading: false` tells you nothing about *why*.
2. **Name the discriminant consistently** across the codebase — `kind`, `type`,
   or `status`. Pick one; mixed conventions defeat tooling and habit alike.
3. **Give each member only the data that state actually has.** Shared data goes
   in a wrapper (`{ requestId: string; state: RequestState }`), not duplicated
   into every member.
4. **Always pair the union with `assertNever`** (demo 14), or the exhaustiveness
   guarantee is available but not collected.
5. **Reach for `as const`** when building literal values, so the discriminant
   keeps its literal type instead of widening to `string`.

---

## State-space accounting

| model | representable | meaningful | illegal |
|---|---|---|---|
| `{ isLoading, data, error }` | 8 | 4 | 4 (defended by hand) |
| `+ isStale, + retryCount(0–3)` | 64 | ~8 | ~56 |
| discriminated union | **4** | **4** | **0** |

---

## Why this is the deepest form of Concept #1

Levels 01–03 catch mistakes *after* you write them: the diagnostic arrives
sooner than the runtime error, which is a large win. A discriminated union does
something categorically different — it **removes the region of the state space
where the mistake lives**, so there is nothing left to catch.

Design first, diagnostics second.
