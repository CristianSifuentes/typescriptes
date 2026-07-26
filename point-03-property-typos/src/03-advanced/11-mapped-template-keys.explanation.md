# 11 — Mapped and template-literal property names: the mechanism, dissected

**Run it:** `npm run demo:11-mapped-template-keys`

---

## Two type-level operations, composed

```ts
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
```

This declaration performs two distinct operations, and understanding each
separately is the whole mechanism:

1. **`[K in keyof T]`** — a **mapped type**: iterate over every member of the
   union `keyof T` (demo 10), binding each one to `K` in turn.
2. **`as \`get${Capitalize<string & K>}\`**` — a **key remapping clause**
   using a **template-literal type**: for each `K`, compute a *new* key by
   capitalizing it and prefixing `get`. `Capitalize<...>` is itself a
   built-in template-literal-based intrinsic that upper-cases the first
   character of a string-literal type.

The result, `Getters<Order>`, is a **freshly computed property map** —
`{ getId: () => string; getTotalCents: () => number; getCustomerEmail: ()
=> string }` — that exists nowhere as literal text in the source. It is
*derived*, the same way `keyof Order` was derived in demo 10, just one step
further: derive the key **set**, then derive a **transformation** of that
set.

---

## Why a typo in a generated key is still caught

The property-name checks this entire project has dissected — member
resolution (demos 01, 05), excess-property checking (demos 03, 09) — operate
on **property maps**, and make no distinction between a property map written
by hand (`interface Order { ... }`) and one computed by the type system
(`Getters<Order>`). By the time the checker validates the object literal
`{ getId, getTotalCent, getCustomerEmail }` against `Getters<Order>`, all it
has is a property map with three keys — exactly the same situation as demo
03's `User`. The excess-property check fires identically, and the
spelling-suggestion pass runs over the *generated* key set, correctly
proposing `getTotalCents` — a string that was never typed by a human, only
computed.

---

## Why this matters beyond the toy example

Generated keys are everywhere in realistic TypeScript: ORMs derive
`findByX` methods from column names, form libraries derive `validateX` from
field names, state-management libraries derive `setX`/`X` pairs from store
shape. Before mapped + template-literal types, these were either:

- **untyped** — the generated object was `Record<string, Function>`, and a
  typo in any consumer was invisible (the index-signature trade-off from
  demo 07, self-inflicted), or
- **duplicated** — someone hand-wrote a second interface listing every
  generated key, which drifts out of sync the moment the source type gains
  or loses a field.

`Getters<Order>` avoids both failure modes: it is exactly as protected
against typos as a hand-written interface, and it is *impossible* for it to
drift out of sync with `Order`, because it is not independent data — it is
a pure function of `Order`'s own property map, recomputed by the compiler
every time `Order` changes.
