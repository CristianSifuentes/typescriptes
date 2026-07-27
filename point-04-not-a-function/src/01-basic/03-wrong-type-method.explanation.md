# 03 — A method that exists, on the wrong type: the mechanism, dissected

**Run it:** `npm run demo:03-wrong-type-method`

---

## Correctly spelled, wrong property map

`(5).toUpperCase()` and demo 02's `code.toUpperCasee()` fail at the
identical step — step 1, member existence — but for opposite reasons:

| | demo 02 | demo 03 |
|---|---|---|
| the name | `toUpperCasee` — misspelled | `toUpperCase` — spelled correctly |
| where the real member lives | `String.prototype`, one edit away | `String.prototype`, exactly |
| suggestion offered | yes — TS2551, "Did you mean 'toUpperCase'?" | no — TS2339, nothing to suggest |

`toUpperCase` is not almost-right on `number`; it is *entirely* right, just
for a *different type*. The compiler's spelling-suggestion pass (point-03's
mechanism) only proposes names that are close matches within the SAME
type's property map — it does not search every other type in the program
for a plausible match. So the diagnostic degrades gracefully from TS2551 to
plain TS2339 the moment there is no near-miss to offer.

---

## Where the diagnostic moves once a function boundary is involved

`shout(inventoryCount)` demonstrates something demo 01 and 02 did not: the
compiler's diagnostic can be reported at a completely different location
than where JavaScript's crash would occur.

```js
// JavaScript: the crash happens INSIDE shout, on value.toUpperCase()
function shout(value) { return value.toUpperCase(); }
shout(42); // TypeError, reported deep inside shout's body
```

```ts
// TypeScript: the diagnostic is reported at the CALL SITE
function shout(value: string): string { return value.toUpperCase(); }
shout(inventoryCount); // TS2345, reported here — shout's body is untouched
```

This is not a stylistic choice — it follows directly from what each
diagnostic is actually checking. `value.toUpperCase()` inside `shout`'s body
is checked ONCE, against `shout`'s *declared* parameter type (`string`) —
and it passes, because `string` genuinely does have `.toUpperCase()`. The
defect is not in the body at all; it is in the *caller's* choice of
argument, which is a completely separate check (argument-to-parameter
assignability) performed at every call site independently. `shout` itself
is proven correct once; each of its callers is held to that promise
individually — precisely the "prove it once, verify it everywhere it is
used" pattern the entire series returns to.

---

## Why this matters for real debugging

In JavaScript, a `TypeError` inside a shared utility function looks
identical regardless of which caller triggered it — the stack trace shows
`shout`'s internals, not the caller's mistake. In TypeScript, the same class
of bug is caught **at the caller**, meaning the fix is proposed exactly
where the wrong data originated, not buried inside code that was never
actually wrong.
