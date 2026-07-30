# 06 — Default parameters: omission vs. `undefined` vs. a real value, dissected

**Run it:** `npm run demo:06-default-parameters`

---

## A default value does two jobs: relax arity, and seed a type

`pageSize = 20` is sugar for two simultaneous facts about `fetchPage`'s
type: its minimum arity drops from 2 to 1 (manifesto §1, exactly like `?:`
in demo 05), and — unless an explicit annotation says otherwise —
`pageSize`'s parameter type is **inferred from the default value's type**.
`20` is a `number` literal, so `pageSize`'s type becomes `number`
(technically `number | undefined` for the caller-facing signature, since
omitting or explicitly passing `undefined` are both valid ways to trigger
the default). Nothing about writing `= 20` ever mentions `null` — so `null`
was never added to the accepted type, on purpose or otherwise.

---

## Why "defaults trigger on `undefined`, never on `null`" is a JavaScript rule TypeScript inherits precisely

This distinction is not a TypeScript invention — it is exactly how
JavaScript's own default-parameter substitution works (`pageSize = 20`
substitutes `20` only when the bound value is `undefined`). TypeScript's
contribution is not changing that rule; it's refusing to let a caller act
on the **wrong belief** about it. A developer who assumes "passing `null`
opts into the default" — a reasonable assumption borrowed from APIs where
`null` conventionally means "unset" — is stopped immediately, at the exact
call site, with a diagnostic naming the precise type mismatch, rather than
being allowed to ship code that silently computes `` `fetching null items` ``.

---

## Why the fix is explicit, not automatic

TypeScript will not "fix" a caller who wants `null` to also mean "use the
default" by silently expanding `pageSize`'s type — that would be inventing
new runtime behavior no default-parameter syntax actually implements. The
correct fix visible in `ts-safe.ts` is to widen the type **and** the body's
handling explicitly: `pageSize: number | null = 20` paired with logic that
treats `null` the same as an omitted argument. This keeps the connection
between "what the type says is acceptable" and "what the function body
actually does with it" perfectly honest — no gap where a caller's
reasonable-sounding assumption silently diverges from actual behavior.
