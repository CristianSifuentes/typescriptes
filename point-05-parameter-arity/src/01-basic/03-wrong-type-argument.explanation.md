# 03 — The right count, the wrong type: the mechanism, dissected

**Run it:** `npm run demo:03-wrong-type-argument`

---

## Arity and per-position typing are two independent checks

Manifesto §3 splits call resolution into a counting step and a typing step
on purpose: a call can satisfy one while violating the other. `lineItemTotal(19.99,
"3")` supplies exactly two arguments — arity is fully satisfied — yet fails
because position 1's supplied type (`string`) is not assignable to its
declared type (`number`). This demo isolates that second check in complete
independence from the first, which demos 01 and 02 isolated on its own.

---

## Why JavaScript's failure mode here is uniquely dangerous: it depends on content, not shape

Every other demo in this project's basic level produces a *consistent*
JavaScript symptom for a *consistent* class of mistake. This one does not:
`lineItemTotal(19.99, "3")` returns `59.97` — the numerically correct
answer — because `*` coerces a numeric-looking string before multiplying.
`lineItemTotal(19.99, "3 units")` returns `NaN`, because that string does
not coerce. **The same category of mistake** (a `string` where a `number`
belongs) produces a *correct-looking* result for some inputs and an
obviously-wrong one for others, purely as a function of what the string
happens to contain. A test suite exercising only `"3"`-shaped inputs would
never catch this bug at all.

---

## Why the compiler's rejection is uniform where JavaScript's crash isn't

TypeScript's `TS2345` fires from the **static type** `string`, never from
the runtime value. `"3"` and `"3 units"` are rejected identically, at the
identical call site, for the identical reason — the type checker has no
concept of "numeric-looking" versus "not," because deciding that would
require running the program, which is exactly what compile-time checking
is designed not to need. This is the single clearest illustration in the
basic level of why static typing is not "a fancier runtime check moved
earlier" — it is a categorically different kind of check, indifferent to
the specific value that will eventually flow through it.
