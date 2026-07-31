# 05 — Optional parameters: dissected

**Run it:** `npm run demo:05-optional-parameters`

---

## `?` changes TWO things, not one

`metadata?: Record<string, unknown>` does two separate jobs at once:

1. **Lowers the function's minimum arity by one** (manifesto §1) — a call
   supplying only `message` now satisfies the count check (manifesto §3,
   step 2), where without the `?` it would fail exactly like demo 01.
2. **Widens `metadata`'s type, inside the function body, to include
   `undefined`** — `Record<string, unknown> | undefined`, not
   `Record<string, unknown>`.

These are both necessary, and neither alone would be sound: relaxing arity
without widening the type would let a real omission produce a value whose
declared type lies about being always-present (exactly JavaScript's
behavior); widening the type without relaxing arity would still force every
caller to write `logEvent("x", undefined)` explicitly, arity untouched.

---

## Why this is point-04's `?.()` mechanism, one level removed

Point-04's demo 06 dissected `onError?:` — an optional *method* — and
showed that invoking it unguarded fails `strictNullChecks` (TS18048)
because the union includes a non-callable member. This demo's `metadata?:`
is the same union-with-`undefined` mechanism, just attached to an ordinary
*parameter* instead of a method property. `Object.keys(metadata)` fails for
the identical reason `plugin.onError(error)` failed there: an operation
(property access, in this case `Object.keys`) that is illegal on one member
of a union (`undefined`) is illegal on the whole union until narrowed.

---

## Why "optional" is not "unchecked" — it's "checked differently"

The JavaScript version's bug was never really about `metadata` being
optional — omitting it is completely legitimate application behavior. The
bug was `logEvent` treating "present" as the *only* case worth handling.
TypeScript does not remove that risk by making `metadata` easier to ignore;
it does the opposite; it makes the absent case **impossible to ignore
silently** — `Object.keys(metadata)` simply will not compile until the
`undefined` branch has been accounted for, one way or another, exactly at
the point where the optional parameter is actually used.
