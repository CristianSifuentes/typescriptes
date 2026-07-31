# 04 — Explicit `undefined` vs. a genuinely omitted argument: dissected

**Run it:** `npm run demo:04-undefined-vs-missing`

---

## Arity counts SLOTS, not "values that happen to be non-undefined"

Manifesto §3's step 2 asks a purely positional question: *how many argument
expressions were written at the call site?* `applyDiscount(100,
coupons["EXPIRED99"])` writes **two** expressions — the second one simply
*evaluates to* `undefined`. Arity checking does not evaluate anything; it
counts syntax. This is why that call satisfies arity (2 arguments supplied,
2 required) and yet still fails to compile: the failure has moved entirely
into step 3, the per-position **type** check, where the argument's type
(`number | undefined`) is compared against the parameter's declared type
(`number`) and found wanting.

---

## Why JavaScript erases a distinction TypeScript preserves

Manifesto §2's binding model treats "no argument was supplied" and "an
argument was supplied whose value is `undefined`" identically: both result
in the parameter being bound to `undefined` inside the function body.
Nothing downstream of that binding can recover which of the two actually
happened — the information is gone the instant the call completes. This
demo's two JavaScript mistakes — an unknown coupon lookup (a legitimate
`undefined`, explicitly passed) and a forgotten second argument (nothing
passed at all) — are therefore **the same bug**, from the function's point
of view, even though they are different bugs from the *caller's* point of
view.

TypeScript's two-step algorithm keeps the distinction alive precisely
because it never collapses "what was written" into "what it evaluates to."
`coupons["EXPIRED99"]` is an argument *expression*, counted at step 2 and
type-checked at step 3; a bare `applyDiscount(100)` never reaches step 3 for
position 1 at all, because step 2 already rejected it. The result: two
different mistakes, two different diagnostics (**TS2345** vs. **TS2554**),
each naming precisely what went wrong.

---

## Why `noUncheckedIndexedAccess` is what makes this demo possible

Without it, `coupons["EXPIRED99"]` would be typed simply `number` — a
promise that *every* string key produces a real number, which is false for
any object literal or `Record`. `noUncheckedIndexedAccess` types every
index lookup as `T | undefined` instead, forcing the "this key might not
exist" possibility into the type itself. That is exactly what turns "an
unknown coupon" into a value whose type honestly includes `undefined` —
and therefore into a value the `applyDiscount(price: number, discountPercent:
number)` signature is entitled to refuse.
