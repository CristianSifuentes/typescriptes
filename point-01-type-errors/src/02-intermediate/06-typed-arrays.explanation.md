# 06 — Typed arrays and tuples: the mechanism, dissected

**Run it:** `npm run demo:06-typed-arrays`

---

## What a JavaScript array is

A heterogeneous, sparse, growable map from stringified integer keys to
arbitrary values. Four properties, four bug classes:

| property | consequence |
|---|---|
| heterogeneous | one stray string turns `reduce((a,b) => a+b)` into concatenation |
| growable | nothing stops `push`ing the wrong kind of element |
| unbounded | `arr[99]` is `undefined`, not an error |
| sparse | `[ , , ]` has holes that `map` skips and `length` counts |

The fold is the one to internalise:

```js
[1200, 3400, "5600"].reduce((a, b) => a + b, 0)
// 0 + 1200      = 1200        (number)
// 1200 + 3400   = 4600        (number)
// 4600 + "5600" = "46005600"  (string)  ← the accumulator changed type mid-fold
```

The accumulator's type changed **during the loop**, and nothing objected. In
TypeScript, `reduce<number>` fixes the accumulator type for the whole fold; a
callback returning `string` is rejected.

---

## What `number[]` claims

`number[]` is a **homogeneity claim over time**: every element is a `number`
now, and after every future mutation. It is enforced at three sites:

| site | example | diagnostic |
|---|---|---|
| construction | `const a: number[] = [1, 2, "3"]` | **TS2322** on the element |
| mutation | `a.push("4")` | **TS2345** (`push` is `(...items: number[]) => number`) |
| consumption | `a[0].toFixed(2)` | **TS2532** — see below |

`readonly number[]` simply **does not declare** the mutating members, so
`push` is **TS2339** — immutability by absence rather than by convention, and
erased entirely at runtime (`Object.freeze` is the runtime tool; this is the
compile-time one).

---

## `noUncheckedIndexedAccess`: the most philosophically honest flag

Consider:

```ts
const totals: number[] = [1200, 3400, 5600];
totals[0]    // in range
totals[99]   // out of range
```

To the type system these two expressions are **identical**: a `number[]`
indexed by a `number`. The compiler has no way to know that `0` is in range and
`99` is not — that would require tracking array lengths through arbitrary
control flow, which is not decidable in general.

So it must choose:

| flag off (default) | flag on |
|---|---|
| `totals[0]: number` | `totals[0]: number \| undefined` |
| convenient | honest |
| **lies about `totals[99]`** | forces you to handle the case |
| the lie is discovered by `.toFixed` at runtime | **TS2532: Object is possibly 'undefined'** |

This flag is where the project's thesis becomes uncomfortable and therefore
interesting. Turning it off is a legitimate engineering trade — most codebases
do — but it should be a *decision*, made with the knowledge that the compiler is
then asserting something it has not proved.

Four disciplined ways to consume an element:

```ts
const v = totals[0];
if (v !== undefined) v.toFixed(2);         // narrowing         → number
const withDefault = totals[0] ?? 0;        // ??                → number
const last = totals.at(-1);                // honest by design  → number | undefined
const sum = totals.reduce((a, b) => a+b, 0); // no index at all → number
```

The last is the real lesson: **iteration methods hand you elements, not
indices**, so the bounds question never arises. Code written with `map` /
`reduce` / `for..of` is largely unaffected by this flag — which is itself an
argument for that style.

---

## Tuples: length and position as types

```ts
type LatLong = readonly [latitude: number, longitude: number];
```

| operation | result |
|---|---|
| `const c: LatLong = [52.52, 13.4, 0]` | **TS2322** — arity is part of the type |
| `c[0] = 0` | **TS2540** — `Cannot assign to '0' because it is a read-only property` |
| `c[0]` | `number`, **not** `number \| undefined` |

That last row is important: a tuple's length is known statically, so the bounds
question is decided at compile time and `noUncheckedIndexedAccess` has nothing
to warn about. Choosing a tuple over an array is choosing to move a fact from
runtime to compile time.

Labelled members (`latitude:`, `longitude:`) improve tooling and readability but
do **not** prevent passing latitude where longitude is expected — both are
`number`. For that, brand them (demo 04).

---

## Where this demo admits a limit — again

```ts
[10, 9, 100].sort()   // [10, 100, 9]
```

Type-correct: `sort()` on `number[]` returns `number[]`, and it does. The bug
is in the semantics of the **default comparator** (which stringifies), not in
the types. TypeScript accepts it, and should.

Contrast with the comparator bug from demo 04:

```ts
[3, 1, 2].sort((a, b) => a < b)
// TS2345: '(a: number, b: number) => boolean' is not assignable to
//         '(a: number, b: number) => number'
```

Here the *type* is wrong, so it is caught. The pair is a clean illustration of
the boundary: **type systems catch type errors, not logic errors.** Everything
in levels 03 and 04 is an exercise in moving as much logic as possible *into*
the types — and level 04 shows where that movement stops.
