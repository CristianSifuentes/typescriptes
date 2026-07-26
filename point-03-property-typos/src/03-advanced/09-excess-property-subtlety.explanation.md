# 09 — Excess-property checking's subtlety: the mechanism, dissected

**Run it:** `npm run demo:09-excess-property-subtlety`

---

## The two attempts, side by side

```ts
const direct: User = { id, name, email, emial };   // TS2561 — REJECTED
const viaVariable: User = loadLegacyDraft();        // no error — ACCEPTED
```

`loadLegacyDraft()` returns an object with the **exact same property map**
as the literal above — `id`, `name`, `email`, and the stray `emial`. One is
rejected, the other is not. This is not an inconsistency in the checker; it
is **freshness**, working exactly as specified, and this demo is the case
where the distinction actually matters in practice.

---

## What "fresh" precisely means

A **fresh object literal** is an object-literal *expression*, written
directly, in a position where the compiler already knows the target type —
the right-hand side of a typed `const`, an argument to a typed parameter, an
element of a typed array literal. Freshness is a property of the
**expression**, evaluated once, at the point it is written. It is not a
property of the *type* the expression produces, and it does not persist.

`loadLegacyDraft()` is a function call. Its result is an ordinary value of
whatever type the function's return position infers — here, an object type
with four members, none of them marked "fresh," because a function's return
value is never itself a literal at the call site. By the time
`viaVariable: User = loadLegacyDraft()` is checked, there is no literal left
to apply the freshness rule to — only an ordinary assignability question:
*"does this value's property map contain everything `User` requires?"* Yes,
trivially — it has `id`, `name`, `email`, and one extra key subtyping does
not mind. **Ordinary structural subtyping (demo 08) accepts it.**

---

## Why this is the design, not an oversight

If excess-property checking followed the *type* instead of the *literal*,
it would have to reject `viaVariable` too — but then it would also have to
reject every legitimate use of a wider type where a narrower one is
expected (a `PremiumUser` passed where `User` suffices), because "wider than
required" and "excess property from a typo" would become indistinguishable
once freshness stopped being scoped to the literal. TypeScript's designers
chose to catch typos at the one point they are overwhelmingly likely to
occur — the literal you are actively typing — and to let ordinary,
permissive structural subtyping govern everywhere else. The alternative
would break composability for a marginal gain in typo detection on values
that already passed through a function boundary.

---

## The practical lesson

Excess-property checking is a **typo heuristic at construction time**, not
a runtime guarantee that a `User`-typed value never carries extra keys. Once
a value has passed through *any* non-literal expression — a function call,
a variable, a spread — TypeScript's promise is only "everything `User`
requires is present and correctly typed," never "nothing else is present."
If a codebase genuinely needs to guarantee the *absence* of extra keys past
construction (not just at it), that requires either a runtime check (an
allow-listed key `Object.keys` comparison) or discipline about never
widening a literal's type away before its fields are validated — freshness
is a compile-time nicety, not a runtime seal.
