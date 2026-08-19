# 11 — Positional assignability: the compiler's mental model

**Run it:** `npm run demo:11-positional-assignability`

---

## The call rule, formally

For a call `f(a₀, …, aₙ₋₁)` against a signature `(p₀: T₀, …, pₘ₋₁: Tₘ₋₁) => R`:

```
    Γ ⊢ aᵢ : Sᵢ        for each i
    Sᵢ <: Tᵢ           for each i          ("Sᵢ is assignable to Tᵢ")
    n within arity(signature)
    ─────────────────────────────────────
    Γ ⊢ f(a₀, …, aₙ₋₁) : R
```

Everything in this project follows from the second premise and one fact about
it:

> `<:` relates **types**. Not names, not intentions, not documentation. If `Sᵢ`
> and `Tᵢ` are the same type, the premise holds no matter what the two positions
> **mean**.

That sentence contains the entire blind spot.

---

## Interrogating the machinery with `Parameters<T>`

The demo does not assert this — it asks the compiler:

```ts
type PositionsAreDistinguishable<F extends (...args: never[]) => unknown> =
  Equals<Parameters<F>[0], Parameters<F>[1]> extends true ? false : true;

type _A = Expect<Equals<PositionsAreDistinguishable<typeof unbranded>, false>>;  // compiles
type _B = Expect<Equals<PositionsAreDistinguishable<typeof branded>,   true>>;   // compiles
```

Both aliases type-check, so the compiler is stating on the record that it
**cannot** distinguish the positions of `(width: number, height: number)` and
**can** distinguish those of `(width: Width, height: Height)`.

The rule did not change between those two functions. The **types** did, and that
is the only lever the rule responds to.

---

## One level up: comparing two functions

Checking a *call* compares arguments to parameters. Checking whether one
*function* can stand in for another compares parameter lists to each other — and
there the relation flips direction.

```ts
type Handler = (event: { kind: string }) => void;
const specific = (event: { kind: string; detail: string }) => void event.detail;

const h: Handler = specific;
// error TS2322: Type '(event: { kind: string; detail: string; }) => void'
//               is not assignable to type 'Handler'.
//   Types of parameters 'event' and 'event' are incompatible.
```

**Parameter positions are contravariant**: a substitute may accept *more* than
promised, never less. `strictFunctionTypes` enforces this for function-property
syntax — but members written with **method** syntax stay bivariant, a deliberate
unsoundness kept so that `Array<Dog>` works as `Array<Animal>`. One character of
syntax decides whether the check happens.

---

## "Why doesn't the compiler just compare parameter names?"

It is the obvious idea and it does not survive contact with the language.

**(a) Names are not part of a function type.** These are the *same* type, proved
in the demo with `Expect<Equals<A, B>>`:

```ts
type A = (width: number, height: number) => number;
type B = (w: number, h: number) => number;
```

**(b) Arguments are expressions, not names.** `f(a, b)` might be `f(rect.w,
rect.h)`, `f(xs[0], xs[1])`, or `f(compute(), 3)`. Most arguments have no name to
compare against.

**(c) Agreement is not correctness.** `transfer(payee, payer, n)` uses
well-named variables in the wrong order, and a name-matching heuristic would
happily approve `transfer(from, to, n)` where `from` holds the payee's id.

Which is why the remedy is not a cleverer checker but a **better model**: encode
the distinction in the types, where the rule can already see it.

---

## Summary

| question | JavaScript | TypeScript |
|---|---|---|
| what is a function? | an object with `[[Call]]` | a value with one or more signatures |
| what is a signature? | none — `length` is metadata | arity + a type per position + a return type |
| is this call legal? | always | if `Sᵢ <: Tᵢ` at every `i`, and arity fits |
| can `f` stand in for `g`? | always | parameters contravariant, return covariant |
| is argument *i* right for parameter *i*? | unaskable | **the whole check** |
| …if `Sᵢ` and `Tᵢ` are the same type? | unaskable | **yes, vacuously — the blind spot** |
