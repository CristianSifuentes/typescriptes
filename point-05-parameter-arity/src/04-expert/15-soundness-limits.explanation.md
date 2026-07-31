# 15 — The limits of soundness: where wrong-arity calls come back

**Run it:** `npm run demo:15-soundness-limits`

---

## TypeScript checks *declared* lengths, not *actual* ones

Every arity check in this project (demos 01, 02, 09, 10) relies on the
compiler being able to read a length — either a fixed parameter count or a
tuple's element count — directly from a **static type**. `as`, `any`,
`Function`, and an `any`-typed `.apply` argument each remove that length
from view in a different way, without removing the underlying runtime
array's *actual* length being wrong.

---

## `as`: proof by assertion is not proof

```ts
move(...(badArgs as [number, number]));
```

`badArgs` really has one element. `as [number, number]` does not *check*
that — it tells the compiler to stop asking. Every later use of the
asserted value, including the spread into `move`, is checked **as if** the
assertion were correct, which is exactly why this line passes `tsc
--noEmit` with zero output and still produces `dy: undefined` at runtime.

---

## `any` and `Function`: no length to violate

`5()` fails demo 01's `TS2349` because `number` is a *known* type with no
call signature. A wrong-arity call through `any` or `Function` never fails
analogously, because neither carries a parameter list to check a count
against: `any` disables checking entirely, and `Function`'s signature
(`(...args: any[]) => any`) accepts any number of arguments of any type by
construction. `noImplicitAny` prevents both from appearing **by accident**;
neither can be prevented from being written **on purpose**.

---

## `.apply`: real protection, with one gap

`strictBindCallApply` (enabled in this project) genuinely closes most of
this hole — `move.apply(null, someRealArray)` where `someRealArray` has a
proper array type (`number[]`, or better, a tuple) **is** checked, and a
plain `number[]` is correctly rejected as not assignable to the required
`[number, number]`. The gap is narrower than it looks: it only reopens when
the array's type is `any` — precisely what `JSON.parse` and similar
boundaries return. The mechanism protecting `.apply` is real; it simply
cannot protect a value whose type was never anything more than `any` to
begin with.

---

## The actual fix: prove the length, then trust it

```ts
function isPair(args: number[]): args is [number, number] {
  return args.length === 2;
}
```

A type predicate that checks `.length` at runtime and narrows the type
accordingly turns "an array of unknown length" into a real tuple **only
after** verifying it actually has the right number of elements. This is
the same discipline point-04's demo 14 establishes for callability —
validate at the boundary, before the first `as`, never after — applied
here to length instead of shape. TypeScript proves things about the code
you wrote against the types you declared; it cannot prove anything about an
array whose length was merely asserted at a boundary it does not control.
