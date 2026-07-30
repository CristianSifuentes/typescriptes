# 14 — A `never`-guarded generic: making a mixed-type call unwritable

**Run it:** `npm run demo:14-never-guarded-op`

---

## The JavaScript side: a `sum` that promises arithmetic and enforces nothing

A generic reporting utility like `sum`/`average` accumulates real risk over
a codebase's lifetime: it starts life summing a list of prices, and nothing
about its definition stops it from later being called on a list that
contains a string, an `undefined`, or a `null` — each of which silently
changes the operation's meaning (string concatenation, `NaN` propagation, or
an "accidentally correct" `null`-as-zero) with no exception anywhere. The
most striking row is `sum(['a', 'b'])`: a function named for arithmetic
returns `"ab"` and nothing in the language objects.

---

## The TypeScript side: `never` as a mandatory, unsatisfiable parameter

The straightforward fix, `function sum(values: number[]): number`, already
solves most of this — `sum([1, "2", 3])` fails with an ordinary TS2322 on
the array literal. This demo builds a **generic** version as the series'
capstone, reusing the exact `never`-witness technique demo 07 introduced,
to show the same idea generalized to arrays of unknown element type:

```ts
type AllNumbers<T extends readonly unknown[]> =
  T extends readonly (infer U)[] ? ([U] extends [number] ? true : false) : false;

function sum<T extends readonly unknown[]>(
  values: T,
  ...witness: AllNumbers<T> extends true ? [] : [proof: never]
): number { /* ... */ }
```

`AllNumbers<T>` infers the array's element type `U` and checks it against
`number`. When `U` is anything else — `string`, `number | string`,
`number | undefined` — the conditional resolves to `false`, and the witness
tuple becomes `[proof: never]`: a **mandatory second parameter of the empty
type**. No expression in TypeScript has type `never` (manifesto §3 of
`point-01-type-errors`: `never` is the empty set), so no call can supply it.

```
error TS2554: Expected 2 arguments, but got 1.
```

The diagnostic is an *arity* error, not an assignability error — which is
the tell that the call is not merely discouraged, it is **structurally
impossible to write**, the same way an exhaustive `switch` makes an
unhandled union member a `never`-typed impossibility in
`point-01-type-errors` (demo 10).

---

## Comparison table

| Call | JavaScript result | TypeScript verdict |
|---|---|---|
| `sum([1, 2, 3])` | `6` | accepted |
| `sum([1, "2", 3])` | `"33"` | **TS2554** — witness unsatisfiable |
| `sum([1, undefined, 3])` | `NaN` | **TS2554** |
| `sum([1, null, 3])` | `4` (accidentally correct) | **TS2554** — rejected even though it happened to work |
| `sum(['a', 'b'])` | `"ab"`, no error | **TS2554** — `U` is `string`, not `number` |

The `null` row is the sharpest illustration in the whole series: a call
that would have produced the *numerically correct* answer by accident
(`ToNumber(null) = 0`, demo 06) is rejected exactly as uniformly as one that
would have silently corrupted the result — because the guard reasons about
**types**, not about which specific runtime values would happen to work
this time.

---

## Where this demo admits a limit

`AllNumbers<T>` is exact: it requires every element to be precisely
`number`, with no room for a deliberately mixed but well-handled case (a
sparse array with intentional `undefined` holes summed via `?? 0`, for
instance, must be pre-processed before reaching `sum`). This is the correct
default for a function whose name promises pure arithmetic, but it is a
design choice, not a law — a codebase that legitimately needs to sum a
`(number | null)[]` with a stated null-as-zero policy would define a
*second*, differently-named function (`sumTreatingNullAsZero`) rather than
loosening this one, keeping the promise in the name and the promise in the
type aligned.

---

## Verify

```bash
npm run evidence                        # see TS2554 emitted for all three rejected calls
npm run demo:14-never-guarded-op
```
