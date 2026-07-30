# 01 — Calling a non-function value: the mechanism, dissected

**Run it:** `npm run demo:01-noncallable-value`

---

## What "not callable" means to the compiler

`retryBudget()` is checked by asking exactly one question: *does the static
type of `retryBudget` include a call signature?* `retryBudget`'s type is
`number`. The `number` type's property map (the set of operations valid on
every `number`) contains no call signature — there is no way to write
`n(...)` for an arbitrary `number` and have it mean anything. The compiler
reports:

```
error TS2349: This expression is not callable.
  Type 'Number' has no call signatures.
```

`Number` (capitalised) here refers to the global `Number` interface
TypeScript's standard library declares — the same interface `number`
resolves methods against for calls like `n.toFixed()`. The message is
precise: it is not saying "3 is not a function" (a runtime, value-level
fact); it is saying "the *type* `number` declares no call signature" — a
static, universally-quantified fact about every value that type could ever
hold.

---

## Why this needs no runtime value at all

Nothing about detecting this defect required `retryBudget` to actually equal
`3`, or to exist at all at check time. The compiler only needs `retryBudget`'s
**declared type** — inferred here from `loadRetryBudget()`'s return type — to
know, with certainty, that `retryBudget()` can never succeed for *any*
`number`. This is the same universal-quantification argument point-01's
manifesto makes for ordinary type errors, specialised to the question "is
this invokable?" instead of "is this the right primitive type?"

---

## Why JavaScript's crash carries no explanation

`TypeError: retryBudget is not a function` is accurate but incomplete: it
tells you the *symptom* (no `[[Call]]` slot) at the *exact moment* someone
tried to invoke the value, with zero information about *why* `retryBudget`
ended up holding a number instead of a function — was it always meant to be
a number and someone added stray parentheses? Was it supposed to be a
callback and a wiring mistake substituted a config value? The runtime
cannot distinguish these; it only knows the value it currently holds. The
compiler's diagnostic, by contrast, is reported **at the call site itself**,
the moment it is written — collapsing the "where's the bug" and "where's the
symptom" questions onto the same line, exactly as point-03 demonstrated for
property typos.

---

## The pattern repeats identically through a property

`config.retryBudget()` receives the identical diagnostic, because the
underlying check is identical: resolve `config.retryBudget`'s type (`number`,
via ordinary member resolution — point-03's mechanism, unchanged), then ask
whether that type has a call signature. Nothing about routing through a
property changes the question being asked; it only changes which
expression's type gets consulted first.
