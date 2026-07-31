# 10 — Spread arguments checked against the parameter list: dissected

**Run it:** `npm run demo:10-spread-arguments`

---

## Spreading needs a statically known count, and only a tuple provides one

`move(...offset)` asks the compiler to perform the ordinary arity check
(manifesto §3, step 2) — but that check requires knowing *how many*
arguments the spread contributes, and `number[]`'s type says nothing about
length. Rather than guessing, or silently falling back to "trust it,"
TypeScript refuses the expression outright: **TS2556**. This is a
categorically different diagnostic from **TS2554** (demos 01/02) — it is
not "the count is wrong," it is "the count cannot be determined," which is
a precondition failure for arity checking rather than an arity check that
failed.

---

## Why the SAME spread is fine into a rest parameter

`moveMany(...offsets: number[])` has an arity of `[0, ∞)` — every possible
array length is a valid argument count for it. There is no ambiguity to
protect against: whatever length `offset` turns out to have, that length
falls inside `moveMany`'s accepted range. TS2556's restriction only bites
when the *target* parameter list is fixed-arity, because that is the only
case where "exactly how many elements does this spread contribute" is a
question with a single correct answer that the type system must be able to
verify.

---

## Why the JavaScript version's bug is silent regardless of direction

Both "too few" and "too many" spread elements are silently tolerated in
JavaScript, for the same structural reason demos 01 and 02 established for
ordinary arguments: extra elements are discarded, missing ones bind to
`undefined`. The spread operator itself performs no reasoning about the
target function's arity at all — it is a pure syntactic unpacking, blind to
what it's being unpacked *into*. TypeScript's TS2556 closes this
specifically for fixed-arity targets by requiring the one piece of
information JavaScript's spread never needed and never checked: a
length the type system can see.
