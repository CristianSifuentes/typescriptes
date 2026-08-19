# 07 — Branded types: buying nominal typing inside a structural system

**Run it:** `npm run demo:07-branded-types`

---

## The one-line remedy

The blind spot exists because `width: number` and `height: number` are the same
type. So: **make them different types.**

```ts
declare const brand: unique symbol;
type Brand<T, K extends string> = T & { readonly [brand]: K };

type Width  = Brand<number, "Width">;
type Height = Brand<number, "Height">;
```

`Width` is `number` intersected with an object carrying a **phantom member** — a
member that exists only in the type world and is never present on the value.

---

## Why it works, read from the compiler's own elaboration

```
error TS2345: Argument of type 'Height' is not assignable to parameter of type 'Width'.
  Type 'Height' is not assignable to type '{ readonly [brand]: "Width"; }'.
    Types of property '[brand]' are incompatible.
      Type '"Height"' is not assignable to type '"Width"'.
```

That chain is the whole trick, spelled out by the compiler:

1. compare `Height` against `Width`;
2. `Width` is an intersection, so check the object half;
3. both have a `[brand]` member — compare those;
4. `"Height"` and `"Width"` are different **string literal types**. Done.

We did not add a nominal type system to TypeScript. We **encoded nominality
structurally**, by giving each type a structure nothing else can accidentally
have. Structural typing was never the enemy; it is the mechanism the fix is
built out of.

> **Nominal typing**: two types are compatible only when *declared* to be —
> identity comes from the name. Java classes, Rust newtypes, Haskell `newtype`.
> **Structural typing**: compatibility comes from shape. TypeScript, by design.

---

## Why `unique symbol` rather than a string key

```ts
type Width = number & { readonly __brand: "Width" };      // forgeable
type Width = number & { readonly [brand]: "Width" };      // not forgeable
```

A string key can be written by hand from anywhere, so an object literal could
forge a branded value. A `unique symbol` declared in one module cannot be named
outside it, which closes that door. Use the symbol form for brands that carry a
real invariant (validated IDs, sanitised HTML, currency amounts); the string
form is fine for pure disambiguation.

---

## The three properties

### 1. The swap is a compile error

Both values are `number` at runtime. The distinction that blocks the call exists
only while `tsc` is running.

### 2. Zero runtime cost

`npm run erasure` proves it by diffing the source against its own emitted
JavaScript. `typeof width(3)` is `"number"`, `width(3) === 3` is `true`, and the
value has no keys. Compare the JavaScript twin's DEFENCE 3 — wrapper objects —
which buys the same guarantee with an allocation per value, a `.value` at every
use, a changed JSON shape, and a check that fires in production rather than in
your editor.

| defence | catches the swap? | when | runtime cost |
|---|---|---|---|
| naming convention | no | — | none |
| range check | sometimes, by luck | runtime | a comparison |
| wrapper objects | yes | runtime | **allocation + unwrap everywhere** |
| JSDoc | no | — | none |
| **branded types** | **yes** | **compile time** | **none** |

### 3. Values must be constructed deliberately

Since no expression naturally has type `Width`, brands need a **smart
constructor**:

```ts
const width = (value: number): Width => {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`bad width: ${value}`);
  return value as Width;
};
```

The single `as` per brand lives here, once, where it can be unit-tested — not at
every call site. Demo 12 builds the reusable toolkit.

---

## The costs, stated honestly

**Raw literals stop working.** `aspectRatio(3, 10)` is now TS2345. Every call
site must state which quantity it is passing. This is the ergonomic price, and
it is not small — but note that the price *is* the feature: the compiler is
asking exactly the question the bug depends on.

**Arithmetic strips the brand.** `w * 2` is `number`, not `Width`, because the
result of multiplying a width by a scalar is not automatically a width. If you
want it to be, say so — `width(w * 2)` — which forces you to decide whether it
is true. Some people consider this a defect; it is closer to a feature, and it
is why brands do not compose into a unit system on their own.

**Nothing checks a brand at runtime.** `JSON.parse(body).width as Width` is a
`Width` to the compiler and a lie to reality. Brands protect *typed, branded
call sites* — see demo 13.

---

## When to reach for this

Ask two questions about a pair of same-typed parameters:

1. **Would a swap be silent?** (No visible symptom, no crash.)
2. **Would it be expensive?** (Money, permissions, data loss, wrong output to a
   user.)

Brand where both answers are yes. `max(a: number, b: number)` is commutative —
branding it would be pure noise. `transfer(from, to, amount)` is neither
commutative nor cheap to get wrong. Demo 14 turns this into a decision
procedure.
