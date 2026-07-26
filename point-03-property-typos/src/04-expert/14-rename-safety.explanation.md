# 14 — Rename safety and `satisfies`: the mechanism, dissected

**Run it:** `npm run demo:14-rename-safety`

---

## Rename safety is member resolution, applied everywhere at once

There is no special "rename-tracking" feature in the compiler. What looks
like rename safety is the direct, mechanical consequence of a fact this
project has established twelve times over: **every `.` access is an
independent lookup against the current property map of its type.** A
"reference graph" is simply the informal name for "every expression in the
program whose static type is `UserV2`."

When `interface UserV2` is edited — `id` becomes `userId` — nothing about
`summarize`, `auditLog`, or a hypothetical `legacyExport` changes. What
changes is the property map every one of their `.` accesses is checked
against. The next compile re-runs every one of those (already-existing,
unchanged) checks, and the ones that said `.id` now fail, simultaneously,
for the identical reason a typo fails: `"id" ∉ dom(propertyMap)`. Rename
safety is typo-catching, performed at the scale of "every reference in the
project" instead of "one line you're currently editing."

This is also why an actual "Rename Symbol" feature in an editor is safe to
automate: it can find every reference by asking the same question the
compiler already answers for member resolution, then rewrite each one — and
if it misses one (say, a dynamically-constructed access, demo 13), that
site simply fails to compile afterward, exactly like `legacyExport` here.
Nothing is silently left behind.

---

## `satisfies` — a shape check that does not touch the value's type

`: T` (a type annotation) does two things at once: it CHECKS the literal
against `T`'s shape, and it WIDENS the expression's resulting type to `T`.
The second part is often unwanted — once `viaAnnotation.theme` is typed as
the full union `Theme`, the fact that this particular value is `"dark"` is
gone from the type system, even though it is still `"dark"` at runtime.

```ts
const viaAnnotation: AppConfig = { theme: "dark", retries: 3 };
// viaAnnotation.theme : Theme            ("light" | "dark" | "system")

const viaSatisfies = { theme: "dark", retries: 3 } satisfies AppConfig;
// viaSatisfies.theme  : "dark"           (the literal, preserved)
```

`expr satisfies T` performs exactly the first half: it validates that
`expr`'s shape is compatible with `T` — including excess-property checking
on a fresh literal, identically to `: T` — and then **discards `T` as the
resulting type**, keeping whatever narrower type `expr` would have inferred
on its own. The typo protection is unchanged; only the widening is opted
out of.

---

## Why this matters for typo-catching specifically

A config object checked with `satisfies` still rejects `reties` (typo of
`retries`) with the same **TS2561** as everywhere else in this project — the
shape validation is not weaker. What `satisfies` buys is downstream: code
that later needs to know the value was *specifically* `"dark"` (say, a
`switch` with a case for each literal theme, or a lookup keyed by the exact
string) keeps that precision instead of being handed the wider `Theme` and
having to re-narrow it. `satisfies` is the tool for exactly the situation
"I want typo protection AND the literal type" — two goals `: T` alone
cannot deliver simultaneously.
