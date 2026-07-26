# 07 — The Abstract Equality Comparison Algorithm, reproduced by hand

**Run it:** `npm run demo:07-abstract-equality-algorithm`

---

## The JavaScript side: `IsLooselyEqual`, traced branch by branch

The ECMAScript spec defines `==` as an eleven-branch algorithm. This demo's
`.js-broken.ts` file reimplements the branches that matter in practice:

```
IsLooselyEqual(x, y):
  1. Type(x) == Type(y)?           -> IsStrictlyEqual(x, y)     (no coercion)
  2. x is null, y is undefined?    -> true
  3. x is undefined, y is null?    -> true
  4/5. one Number, other String    -> ToNumber the String side, retry
  6/7. one BigInt, other String    -> ToBigInt the String side, retry
  8/9. one Boolean                 -> ToNumber the Boolean, retry
  10. BigInt and Number            -> compare numerically
  11. one Object, other primitive  -> ToPrimitive the Object, retry
  otherwise                        -> false
```

The recursive structure is the point: `IsLooselyEqual` does not compare
directly except in branch 1 — every other branch performs ONE coercion and
then **recurses** with a strictly simpler pair of types. `[] == false`
therefore takes two hops: `ToPrimitive([])` gives `""`, then
`IsLooselyEqual("", false)` hits the boolean branch, `ToNumber(false)` gives
`0`, then `IsLooselyEqual("", 0)` hits the number/string branch,
`ToNumber("")` gives `0`, and finally `0 == 0` is `true` by branch 1.

`IsStrictlyEqual` (`===`) is branch 1 **and nothing else**: different types
means `false`, immediately, with no recursion and no coercion ever invoked.

---

## The TypeScript side: typing the *caller*, not the algorithm

The runtime control flow above is invisible to `tsc` — by the time the
program runs, all types are erased (`point-01-type-errors`, Concept #1).
What TypeScript *can* do is make miscalling an equality check a compile
error, by encoding "do these two types overlap?" as a type-level predicate:

```ts
type Overlaps<A, B> = A extends B ? true : B extends A ? true : false;

function typedLooseEquals<A extends Coercible, B extends Coercible>(
  a: A,
  b: B,
  ...witness: Overlaps<A, B> extends true ? [] : [proof: never]
): boolean { /* ... */ }
```

When `Overlaps<A, B>` is `false`, the trailing `witness` parameter becomes a
required `[never]` tuple — a type no expression can construct — so the call
itself fails to compile:

```
error TS2554: Expected 3 arguments, but got 2.
```

This is the same shape of proof `type-assert.ts`'s `proveType` uses (see
`00-foundations`), applied to a new purpose: instead of asserting a fact
about a value's type, it **forbids a call** whose argument types can never
share a value. It is a hand-built, visible version of the exact analysis
`tsc` performs internally to produce TS2367 for the native `==`/`===`
operators (demo 04) — reproduced here as an explicit, inspectable mechanism
rather than a compiler black box.

---

## Comparison table

| Expression | JavaScript path | TypeScript verdict |
|---|---|---|
| `1 == "1"` | number/string branch → `ToNumber("1")` → `1 == 1` → `true` | rejected by native `==` (**TS2367**, demo 04) |
| `typedLooseEquals(1, 1)` | same-type branch, no coercion | compiles — types overlap |
| `typedLooseEquals(true, "yes")` | boolean branch → `ToNumber` → number/string branch | **TS2554** — witness tuple unsatisfiable |
| `"1" === 1` | branch 1 only: different types → `false` | rejected (**TS2367** — applies to `===` too) |
| `null === undefined` | branch 1 only: different types → `false` | compiles — null/undefined are exempt |

---

## Where this demo admits a limit

`Overlaps<A, B>` is a **structural, subtype-based** approximation of "can
these share a value" — it says nothing about whether the ACTUAL coercion
algorithm would succeed for a specific pair of runtime values. It correctly
rejects `boolean`/`string` (genuinely disjoint types) but it cannot express
"these two `string`s happen to hold equal text" versus "these two `string`s
hold different text" — that is runtime information no type-level predicate
can see. This is the same boundary drawn in demo 04's closing section: once
two operands share a wide type, the type system's job is finished, and only
the running program can tell you whether they're actually equal.

---

## Verify

```bash
npm run evidence                                # see TS2554/TS2367 emitted for real
npm run demo:07-abstract-equality-algorithm
```
