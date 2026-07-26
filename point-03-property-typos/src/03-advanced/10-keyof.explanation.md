# 10 — `keyof`: property names as a checkable union, dissected

**Run it:** `npm run demo:10-keyof`

---

## What `keyof T` computes

For a type `T` with property map `dom(T)`, `keyof T` is the **union of
string-literal types**, one per key:

```ts
interface Order { id: string; totalCents: number; customerEmail: string; }

type OrderKeys = keyof Order;
// "id" | "totalCents" | "customerEmail"
```

This is not a separately-maintained list — it is *derived*, mechanically,
from the interface's own declaration. Add a field to `Order` and `keyof
Order` grows with it; rename a field and every literal in the union renames
with it. There is no way for `keyof Order` to drift out of sync with
`Order`, because it is not independent data — it is a *view* of the same
property map every other demo in this project has been checking against.

---

## Why generic accessors need it

`function getProperty(obj, key) { return obj[key] }`, written without
constraints, has to accept `key: string` — any string — because nothing
narrower is expressible. Bracket access on an unconstrained `string` key is
exactly as unprotected as an index signature (demo 07): every string
compiles, typo or not.

```ts
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

`K extends keyof T` constrains the *type parameter* `K` to be one of the
literal keys of `T`. Two consequences fall out of this single constraint:

1. **The argument is checked.** `getProperty(order, "totalCent")` requires
   `"totalCent"` (a literal type) to be assignable to `keyof Order` — it is
   not a member of that union, so **TS2345**.
2. **The return type is exact, not widened.** `T[K]` — an **indexed access
   type** — looks up the value type for whichever literal `K` actually was
   at each call site. `getProperty(order, "totalCents")` returns `number`,
   not `string | number | ...`, because `K` was inferred as exactly
   `"totalCents"`.

---

## `(keyof T)[]` — validating a whole configuration, not just one call

A CSV/export column list is naturally an *array* of keys, decided once and
reused. Typing it as `(keyof Order)[]` moves the same check from "one
function call" to "every element of this array, checked independently
against the identical union":

```ts
const columns: (keyof Order)[] = ["id", "totalCent", "customerEmail"];
//                                        ~~~~~~~~~~~ TS2322
```

The typo is now caught **where the configuration is written**, not months
later when a report ships with a silently blank column — the same "distance
between cause and symptom" argument from demo 01, applied to a whole list of
property names at once instead of a single access.

---

## The general pattern this demo establishes

> Whenever a property name needs to travel as a **value** — passed as an
> argument, stored in an array, used as a dictionary key — rather than
> appearing as literal `.` syntax, `keyof T` is the mechanism that keeps it
> checkable. It converts "a string that happens to be a property name" into
> "a member of the exact, always-current union of that type's real property
> names," closing the gap that generic, string-keyed code would otherwise
> reopen.

This is also the foundation demo 11 builds on: mapped and template-literal
types use `keyof T` as their *source* of keys when generating new,
derived property names.
