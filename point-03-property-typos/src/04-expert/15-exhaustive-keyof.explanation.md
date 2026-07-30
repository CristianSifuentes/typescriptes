# 15 — An unknown-key guard and exhaustiveness over `keyof T`: dissected

**Run it:** `npm run demo:15-exhaustive-keyof`

---

## Two different failure shapes, one underlying fact

`Validators` requires one entry per key of `SignupForm`. "Missing
`confirmPassword`" and "typo'd `confirmPasword`" are, semantically, the same
bug — the form's `confirmPassword` field has no working validator — but the
compiler reports them through two different, complementary checks:

| what you wrote | what's actually wrong | code |
|---|---|---|
| object has 2 of 3 required keys | a key is **absent** | **TS2741** — required-member check |
| object has 3 keys, one misspelled | a key is **present under the wrong name** | **TS2561** — excess-property check |

Both checks have appeared throughout this project (demo 03 introduced
them together). What is new here is the *source* of "required": not a
hand-written list of required fields, but `{ [K in keyof SignupForm]: X }`
— a **homomorphic mapped type**, meaning it iterates `keyof T` without
remapping the keys (contrast with demo 11's `Getters<T>`, which *does*
remap them). A homomorphic mapped type produces a property map with
*exactly* `T`'s keys, no more, no fewer — which is precisely the totality
guarantee "one validator per form field" needs.

---

## Why this is an exhaustiveness check, not just a shape check

Point-01's `never`-exhaustiveness pattern makes forgetting to handle a new
**union member** in a `switch` a compile error. `{ [K in keyof T]: X }`
does the structurally identical thing for **object keys**: forgetting to
provide an entry for a **field** is a compile error, for the same reason —
the mapped type's key set is *derived* from `T`, so it grows or shrinks the
instant `T` does, and every already-written `Validators`-typed object is
re-checked against the new key set at the next compile. Add
`acceptedTerms: boolean` to `SignupForm` tomorrow, and every existing
`Validators` object in the codebase that hasn't been updated fails to
build — not silently passes with one field unvalidated, as the JavaScript
version does today.

---

## `keyof`-constrained helpers as a general pattern

`fieldOf<T>(key: keyof T): keyof T` exists only to demonstrate the general
shape: **any function whose parameter should only ever be a real property
name of `T`** can be given that guarantee for free, by constraining the
parameter's type to `keyof T` instead of `string`. This is the same
constraint demo 10's `getProperty` used for reading; the point of repeating
it here is that the technique is not specific to accessors — it applies
equally to validators, to formatters, to any utility that takes "a field
name" as an argument. The moment such a parameter is typed as plain
`string`, demo 13's soundness gap (dynamic keys) reopens; typed as `keyof
T`, it stays exactly as protected as `.` access itself.
