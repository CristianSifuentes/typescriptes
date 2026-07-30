# 12 — Narrowing a union down to its callable member: dissected

**Run it:** `npm run demo:12-narrowing-to-callable`

---

## `typeof x === "function"` is a compiler-recognised type guard

TypeScript special-cases a small set of runtime checks as **type guards** —
expressions whose result the control-flow analyser uses to narrow a union
inside the branch where the check is true (and, in the `else`, where it is
false). `typeof x === "function"` is one of them, alongside `typeof x ===
"string"`, `x instanceof Y`, and `"key" in x`. Inside

```ts
if (typeof retryDelay === "function") {
  retryDelay(attempt); // retryDelay: (attempt: number) => number
}
```

the compiler has **removed** every member of `RetryDelay` without a call
signature from the narrowed type — here, `number` — leaving only members
that are legal to invoke. The `()` on the next line is checked against that
narrowed type, not the original union, which is exactly why it is legal
inside the guard and would not be outside it.

---

## Why this is the general tool, and `?.` is the special case

Demo 06 and demo 08 both narrow a union down to a callable member, but
their union always has exactly two possibilities: "a function" or
"`undefined`" — a shape `?.` and `if (x)` are custom-built for. Here the
union is "a function" or "a `number`" — an unrelated, equally valid,
equally *present* alternative. `?.` cannot express this (there is nothing
"missing" about a `number`); the general mechanism is an explicit runtime
predicate the compiler happens to trust as a narrowing signal. Every
`?.`-solvable case is a special case of this one; not every
`typeof`-narrowing case can be solved with `?.`.

---

## Why the JavaScript bug reads as "the caller's fault" when it is not

`resolveDelay(500, 3)` looks, from the call site, exactly as valid as
`resolveDelay((a) => a * 100, 3)` — `500` is a legitimate, documented
configuration value, not a mistake. The defect is entirely inside
`resolveDelay`, which implicitly assumed its own parameter was always the
function branch of a two-shape contract. TypeScript's TS2349 is reported
**inside `resolveDelay`'s own body** (in the unguarded version) — at the
exact function that made the unchecked assumption — rather than waiting for
some particular caller to happen to pass the `number` shape and get blamed
for a bug that was never theirs.
