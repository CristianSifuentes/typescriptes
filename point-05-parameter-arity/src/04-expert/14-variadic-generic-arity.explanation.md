# 14 — Generic arity with variadic tuple types: dissected

**Run it:** `npm run demo:14-variadic-generic-arity`

---

## `[...Fixed, ...Rest]` is a single type describing a SPLIT parameter list

A variadic tuple type lets a generic parameter list be expressed as the
**concatenation** of two (or more) tuples: `[...Fixed, ...Rest]` denotes
"however many elements `Fixed` has, followed by however many `Rest` has."
When `Fixed` and `Rest` are both inferred from a call — `partial(notify,
"slack")` supplies exactly one value for `Fixed`, forcing `Fixed = [string]`
— the compiler solves for `Rest` as *whatever's left* of `notify`'s
original parameter list: `[userId: number, message: string]`. This is not
string manipulation or reflection; it is ordinary generic inference,
applied to a tuple shape expressive enough to represent "split here."

---

## Why the composed function's signature is a real, checked type — not a guess

`partial`'s return type, `(...rest: Rest) => R`, uses the *same* `Rest`
that inference just solved. This means `notifySlack`'s type is not "some
function, inferred loosely from what `partial` happens to do at runtime" —
it is the *exact* algebraic remainder of `notify`'s parameter list after
removing the arguments already supplied. Every one of this project's
earlier checks — arity bounds (demo 01/02), per-position types (demo 03) —
apply to `notifySlack` with zero special-casing, because from the type
system's perspective, `notifySlack`'s signature is just as real and
concrete as if it had been hand-written.

---

## Why the JavaScript equivalent can never recover this information

`.bind()` and a hand-rolled closure both correctly implement partial
application *as a runtime behavior* — calling the returned function really
does forward the remaining arguments correctly. What neither can do is
preserve `notify`'s arity and per-position types as a *fact the language
itself tracks*. Once `fn(...fixed, ...rest)` is written inside a plain
closure, `rest`'s expected shape exists only in the original author's head
(or in a comment, which cannot be checked). Variadic tuple types close this
gap by making "what does the composed function still need" a **computed
type**, not a fact that has to survive, unchecked, in a developer's memory
across every future call site.
