# 17 — Making a wrong-arity call a compile-time error via `never`: dissected

**Run it:** `npm run demo:17-never-arity-guard`

---

## `never` as "the type nothing can satisfy"

`never` denotes the empty set of values (point-01's manifesto — a type is a
set of values; `never` is the set with none). A parameter typed `never` is
therefore a parameter **no argument can ever legally fill**, except a value
that is itself already typed `never` (which, structurally, cannot exist as
a literal). `ExactTuple<T, N>` exploits this: when `T`'s length doesn't
match `N`, the conditional type doesn't produce an informative custom
error type — it produces `never`, and lets the ordinary "argument not
assignable to parameter" machinery (demo 01/03's mechanism) do the actual
rejecting.

---

## Why the inference order makes the trick work

`assertRGB([255, 87] as const)` proceeds in two phases the compiler
performs automatically: first, `T` is **inferred** from the argument's own
type — `readonly [255, 87]`, because `as const` locks in both the values
and the tuple's literal length. Only *after* `T` is fixed does the compiler
substitute it into the parameter's declared type, `ExactTuple<T, 3>`,
collapsing it to `never` because `2` is not `3`. The argument is then
checked against *that* substituted type — `never` — and fails, because
nothing (short of an actually-`never`-typed expression) is assignable to
it. The mechanism relies entirely on ordinary generic inference and
conditional type evaluation; no special-cased "arity" logic exists in the
compiler beyond what demos 01–10 already established.

---

## Why this guard has a real, principled boundary

This technique only works when a tuple's length is **known at the type
level** — which requires the value to be a literal, locked with `as const`,
written directly where the compiler can see it. An array built at runtime
(parsed from JSON, accumulated in a loop, read from a file) has a length
that is a *runtime* fact; no amount of conditional-type cleverness can
recover it, because the type checker never runs the program. This is not a
limitation specific to `ExactTuple` — it is the exact soundness boundary
demo 15 draws explicitly: compile-time arity checking, in any form, applies
only to values whose shape the compiler can see in the source text, not to
values whose shape is determined by what happens when the program runs.
