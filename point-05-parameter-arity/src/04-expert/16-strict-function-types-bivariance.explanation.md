# 16 — `strictFunctionTypes` and parameter bivariance: dissected

**Run it:** `npm run demo:16-strict-function-types-bivariance`

---

## Function-type assignability checks TWO independent axes

Assigning one function into a slot of another function type asks two
separate questions, and both must pass:

1. **Arity**: does the assigned function require *no more* parameters than
   the slot promises to supply? (Requiring *fewer* is always fine — extra
   supplied arguments are simply unused.)
2. **Per-parameter type**: for every parameter the assigned function *does*
   declare, is the slot's corresponding parameter type assignable to it
   (contravariance — manifesto §1 of point-04's demo 16, in full)?

This demo isolates axis 1, which every earlier demo touching function
assignability (point-04's demo 16) left implicit. `bus.on`'s slot
*guarantees* exactly two arguments on every call, forever — a handler
declaring three is asking for something the slot has structurally never
promised, and no runtime behavior of `emit` could ever change that. The
rejection (`TS2345`, *"Target signature provides too few arguments"*)
fires at **registration**, catching a bug that would otherwise be
**guaranteed** to fire on **every single event**, not an occasional one.

---

## Why fewer parameters is always safe, unconditionally

`(event) => ...` ignoring `meta` is accepted with no diagnostic and no
flag required — this direction of the arity rule is not something
`strictFunctionTypes` turns on or off; it is structurally sound in every
configuration, because a function that never looks at an argument can never
be harmed by receiving one. This is the same principle that makes rest
parameters and optional parameters both valid ways to accept "0 or more" —
here applied the other direction: a *consumer* of a callback is always free
to supply more than the callback declares needing.

---

## Why the method-shorthand hole exists on purpose, not by oversight

`strictFunctionTypes` deliberately does **not** apply contravariant
checking to method-shorthand members (`handle(event, meta): void` inside an
interface) — only to plain function-typed properties (`handle: (event,
meta) => void`). This is a conscious trade-off: a large amount of
real-world object-oriented code (a subclass overriding a method with a
*narrower* parameter type, matching how many OOP languages actually behave)
relies on this bivariant hole and is, in aggregate, safe more often than
not. The type system's designers chose to keep that hole open specifically
for methods rather than force a breaking, stricter check onto a pattern the
ecosystem already depends on — while still closing the equivalent hole for
ordinary function-typed values, where no comparable practical need exists.
