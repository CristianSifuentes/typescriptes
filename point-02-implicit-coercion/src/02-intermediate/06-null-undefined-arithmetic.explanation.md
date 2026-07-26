# 06 — `null` vs `undefined` in arithmetic: two absence values, one operator, opposite outcomes

**Run it:** `npm run demo:06-null-undefined-arithmetic`

---

## The JavaScript side: `ToNumber` treats them as opposites

```
ToNumber(null)      = +0     -- an explicit spec rule
ToNumber(undefined) = NaN    -- a different, also explicit spec rule
```

Both values colloquially mean "nothing here", and JavaScript developers
routinely treat them as interchangeable (`x == null` matches both, `x ?? d`
treats both as absent). Arithmetic is the one place that equivalence breaks:
`null` behaves like a real zero, `undefined` poisons the computation with
`NaN`. A guard that checks `=== null` and forgets `undefined` (or vice versa)
"works" for one absence value and silently fails for the other —
`===` never coerces, so `undefined === null` is `false`.

---

## The TypeScript side: stopped before `ToNumber` is even relevant

With `strictNullChecks`, a value that might be absent must say so in its
type — `number | null`, `number | undefined`, or both. TypeScript then
refuses to let that value reach an arithmetic operator until the union is
narrowed:

```
error TS18047: 'discount' is possibly 'null'.
error TS18048: 'discount' is possibly 'undefined'.
error TS18050: The value 'null' cannot be used here.        (bare literal)
```

Two distinct diagnostic families are worth separating:

| Situation | Diagnostic | Meaning |
|---|---|---|
| a **union member** could be `null` | **TS18047** | "possibly null" |
| a **union member** could be `undefined` | **TS18048** | "possibly undefined" |
| the **literal** `null` appears directly in the expression | **TS18050** | "the value 'null' cannot be used here" (same code for a bare `undefined` literal — the message text names whichever literal was written) |

None of these is the TS2362/TS2363 pair from demo 02. Those reject a type
that is **never** numeric (`string`). These reject a type that is
**sometimes** numeric — `number | null` is a real `number` most of the time
— and force the "sometimes" branch to be resolved by name (`??`, an
explicit guard, a thrown error) before the operator runs.

The call-site enforcement is the sharper tool: if a function's parameter is
typed `number | null`, passing `undefined` to it is **TS2345**
("not assignable"), which catches the exact "guard checked the wrong
absence value" bug from the JavaScript demo — not by making the guard
smarter, but by making the two absence values impossible to confuse at the
boundary where they enter the function.

---

## Comparison table

| Expression | JavaScript result | TypeScript verdict |
|---|---|---|
| `subtotal - discount` (`discount: number \| null`) | `100` (if `discount` is `null`) | **TS18047** — must resolve first |
| `subtotal - discount` (`discount: number \| undefined`) | `NaN` (if `discount` is `undefined`) | **TS18048** — must resolve first |
| `computeTotal(100, undefined)` (param typed `number \| null`) | `NaN`, silently | **TS2345** — rejected at the call site |
| `null + 1` | `1` | **TS18050** |
| `undefined + 1` | `NaN` | **TS18050** |

---

## Where this demo admits a limit

TypeScript's rule operates on the **type**, not on which specific absence
value a given union was written to describe. Nothing stops a codebase from
using `null` in one module and `undefined` in another for the same business
concept ("no discount") — the compiler will faithfully enforce whichever
union you wrote at each boundary, but it has no opinion on **which absence
value your team should standardize on**. That consistency (a common style
guideline: "use `undefined` for missing, `null` for explicitly empty") is a
project convention, not a compiler guarantee.

---

## Verify

```bash
npm run evidence                          # see TS18047/TS18048/TS18050/TS2345
npm run demo:06-null-undefined-arithmetic
```
