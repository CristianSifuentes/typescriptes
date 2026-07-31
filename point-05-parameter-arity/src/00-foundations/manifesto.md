# Foundations — the physics of Concept #5

> **Concept #5.** In JavaScript, calling a function with the wrong number of
> arguments is silently tolerated: extra arguments are ignored, missing ones
> become `undefined`, and the resulting `NaN`/`undefined`/garbage propagates
> until it fails somewhere unrelated. TypeScript enforces each function's
> arity and per-parameter types at compile time — you must pass exactly the
> required arguments (accounting for optional, default, and rest
> parameters), each of the correct type.

Four questions must be answered precisely before any demo. Everything else
in this project is a consequence of these four answers.

---

## 1. What is a function's *arity*, and how does TypeScript represent a parameter list as part of a type?

**Arity** is the number of parameters a function declares — more precisely,
for this project's purposes, the *range* of argument counts a call may
legally supply, once optional (`?`), default (`= value`), and rest (`...`)
parameters are taken into account. A parameter list is not a loose grouping
of names; it is itself a type-level object with three properties:

- **A minimum count** — the number of *required* parameters (no `?`, no
  default, not part of a rest group).
- **A maximum count** — the number of *declared, non-rest* parameters, or
  **unbounded** if the list ends in a rest parameter.
- **A per-position type** — every parameter, required or not, carries its
  own declared type, checked independently at that position.

```ts
function charge(amount: number, currency?: string, ...tags: string[]): void { ... }
//               ^required        ^optional          ^rest: 0-or-more
```

`charge`'s type therefore encodes: *minimum arity 1, maximum arity
unbounded, position 0 is `number`, position 1 is `string | undefined`,
positions 2+ are each `string`.* This is exactly the same "type is a
predicate on values, together with the operations valid on it" model this
series has used throughout (point-01 §3, point-04's manifesto §1) — here,
the *operation* is "being called," and the *predicate* is arity-and-shape
membership: an argument list either satisfies this predicate or it doesn't,
decidable from the program text alone.

---

## 2. Why does JavaScript tolerate any argument count — what's the underlying binding model?

A JavaScript function call does not check anything about the number of
arguments before running the function body. Internally, the engine:

1. Creates a fresh **arguments binding** for the call — historically the
   `arguments` object, conceptually still the mechanism today even where
   `arguments` itself is unused.
2. **Binds each declared parameter name**, in order, to the corresponding
   supplied argument — or to `undefined` if no argument occupies that
   position.
3. **Discards** any supplied arguments beyond the declared parameter count
   (still reachable via `arguments`/rest syntax, but never bound to a
   named parameter, and never rejected).

Nothing in this sequence has an opportunity to fail. Binding parameter `n`
to `undefined` when argument `n` was never supplied is not an error
condition from the engine's point of view — it is *the defined behavior*.
The mismatch only becomes observable once the function body does something
with that `undefined` that assumes a real value: arithmetic silently
produces `NaN`, a method call throws "is not a function" (point-04's
concept, a frequent downstream *symptom* of an arity bug), or a value is
missing three call frames later where nobody remembers an argument was ever
dropped.

---

## 3. How does TypeScript's arity + positional type checking work, step by step?

For a call `f(a1, a2, ..., an)` against a declared parameter list:

```
resolve(f(a1, ..., an), T):
  1. compute f's arity bounds: [minRequired, maxAllowed] (maxAllowed = ∞ if T ends in a rest parameter)
  2. is n within [minRequired, maxAllowed]?
     → no:  TS2554 ("Expected X arguments, but got n")
  3. for each supplied argument ai at position i:
       is ai's type assignable to parameter i's declared type
       (or, for i beyond the fixed positions, the rest parameter's element type)?
     → no:  TS2345 ("Argument of type ... is not assignable to parameter of type ...")
  4. otherwise: the call type-checks; its type is f's return type.
```

Step 1 is where optional, default, and rest parameters each contribute
differently: an optional or defaulted parameter lowers `minRequired` by one
without changing `maxAllowed`; a rest parameter sets `maxAllowed` to
infinity. Step 2 is a pure **counting** check, entirely independent of what
any argument's type is — this is why a call can fail with TS2554 even when
every supplied argument's type would otherwise have been fine. Step 3 is
point-04's assignability check (manifesto §3), applied **once per
position** rather than once for a single call target. Both steps happen
from the declared *type* of `f` and the declared *types* of `a1..an` —
no code needs to run, no value needs to exist yet.

---

## 4. Why does compile-time arity checking eliminate a whole *class* of `undefined`/`NaN`-propagation bugs?

Because, as with every mechanism in this series, the compiler's conclusion
is **universally quantified** over every call site, while a test passing
(or a lucky production run) is **existentially quantified** over one.

Concretely: once

```ts
function computeTotal(price: number, taxRate: number, discount = 0): number {
  return price * (1 + taxRate) - discount;
}
```

compiles cleanly against every call site, the compiler has established —
for the call site written today, the one a colleague writes next quarter,
and every one after that — that `price` and `taxRate` are never silently
`undefined`, that a third argument is never silently ignored, and that a
misplaced string never quietly becomes `NaN` deep inside a tax calculation.
The category *"`computeTotal` was invoked with the wrong number or shape of
arguments"* has been **removed**, not caught one instance at a time after a
finance report came out wrong in production.

The specific bug classes this project's four levels delete:

| Bug class | Deleted by |
|---|---|
| Too few arguments, missing ones silently become `undefined` | arity's lower bound, level 01 |
| Too many arguments, extras silently discarded | arity's upper bound, level 01 |
| The right count, wrong type at one position | per-position assignability, level 01 |
| Confusing "omitted" with "explicitly `undefined`" | optional/default parameter semantics, level 02 |
| An unbounded-arity call (`...args`) with a bad element | rest-parameter element typing, level 02 |
| A tuple/destructured argument list with a missing or mistyped field | tuple and destructured parameter checking, level 03 |
| A composed/curried call losing track of arity across steps | variadic generic tuple types, level 04 |

And what remains — where compile-time checking cannot reach — is stated
plainly in `04-expert/15-soundness-limits`: `any`, `Function`, `as`, and
`.apply`/spread of an untyped array. A type system proves things about the
code you wrote against the types you declared; it cannot prove anything
about an argument list whose length and shape were merely *asserted*,
never checked.

---

### The one-sentence version

> TypeScript moves the discovery of "this call has the wrong number or
> shape of arguments" from a `NaN` or `undefined` quietly touring the
> program until it fails somewhere unrelated, to every call site, checked
> the instant it is written — because a parameter list is not "a name for
> where arguments roughly go," it is an arity-bounded, per-position typed
> contract the compiler can verify every call against, every time, for
> free.
