# 16 — Contravariance of function parameters: dissected

**Run it:** `npm run demo:16-function-variance`

---

## "Assignable" for functions means "safe to call in the target's place"

A value of type `A => void` is assignable to a slot of type `B => void`
only if using it *as if it were* the second function can never go wrong.
Concretely: the slot's caller will hand the assigned function whatever `B`
values it wants. For that to be safe, the assigned function must be able to
accept **every** `B`, which means its own parameter type must be `B` or
**wider** — a supertype of `B`, not a subtype. This is **contravariance**:
function parameter types flip the usual subtype direction that return
types, properties, and most of the rest of the type system use.

```
(event: ClickEvent) => void   is NOT assignable to   (event: AnyEvent) => void
   ClickEvent is NARROWER than AnyEvent — the assigned function can't handle a HoverEvent

(event: AnyEvent) => void   IS assignable to   (event: ClickEvent) => void
   AnyEvent is WIDER than ClickEvent — the assigned function handles ClickEvent and more
```

---

## Why `strictFunctionTypes` exists at all

Without it, TypeScript (for historical, migration-driven reasons) checks
plain function-type parameters **bivariantly** — accepting assignments in
*either* direction, including the unsound one this demo rejects.
`strictFunctionTypes` (enabled in this project's `tsconfig.json`) restores
the theoretically correct, contravariant-only check for **plain function
types**. It deliberately does **not** apply to **methods** written with
shorthand syntax (`{ handle(event: ClickEvent): void }`) — that bivariant
hole is kept, on purpose, because a large amount of real-world OOP code
(array/collection methods overriding a narrower element type, for instance)
relies on it and is, in practice, safe more often than the general case.
Preferring `(event: E) => void` properties over `handle(event: E): void`
methods, as this demo's `Bus<E>` interface does, opts into the stricter,
fully-checked form.

---

## Why the JavaScript bug is a *registration*-time mistake with a *dispatch*-time symptom

`generalBus.subscribe(handleClick)` is where the actual error is committed
— a handler that only understands one event shape is registered somewhere
promising to deliver every shape. The crash (`event.onConfirm is not a
function`) only appears later, whenever a `HoverEvent` happens to be the
one that gets fired, which may be rare, load-dependent, or simply not
covered by whichever tests were run. TypeScript's contravariant check
rejects the subscription itself — the exact line the mistake was made on —
regardless of which event kinds the bus is ever actually asked to deliver.
