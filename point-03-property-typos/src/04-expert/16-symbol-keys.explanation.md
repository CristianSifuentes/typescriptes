# 16 — Symbol keys and computed properties: a closing note, dissected

**Run it:** `npm run demo:16-symbol-keys`

---

## Why symbol keys don't appear in `Object.keys`

`Object.keys`, `for...in`, and `JSON.stringify` all enumerate a JavaScript
object's **string-keyed, enumerable** own properties. This is a runtime
fact about the ECMAScript object model, not a TypeScript invention — symbol
keys were designed from the start to hold metadata that ordinary
enumeration should never see (well-known symbols like `Symbol.iterator`
rely on exactly this invisibility to avoid colliding with user code).

TypeScript's contribution is only to make this fact **checkable rather than
merely documented**: `Object.keys` is typed as `(o: object) => string[]`.
The return type already excludes symbols — there is no separate rule "and
also, symbol keys are filtered out at runtime, trust us." The type
signature and the runtime behaviour say the identical thing, so code that
relies on `Object.keys` capturing *every* property is caught the moment it
tries to treat the result as anything wider than `string[]`.

---

## What "misspelling" means for a key that isn't a string

Every property-name bug in this project, up to now, has been a **spelling**
problem: the wrong sequence of characters. A symbol has no spelling to get
wrong — `Symbol()` values are compared by **reference identity**, not by
their optional `description` string. `Symbol("validated") !==
Symbol("validated")`; calling `Symbol(...)` twice, even with the identical
argument, produces two permanently distinct values.

The typo-equivalent bug for symbols is therefore not "spelled it wrong" but
**"created a second, independent symbol instead of importing the shared
one."** This is arguably *worse* than a string typo in plain JavaScript,
because there is no `Did you mean...?` heuristic that could ever apply —
there is nothing textually similar being compared.

---

## How `unique symbol` makes this checkable

`declare const VALIDATED: unique symbol` gives `VALIDATED` a type inhabited
by **exactly one value**: itself. A second declaration, `declare const
ALSO_VALIDATED: unique symbol`, gets its *own*, equally exclusive type —
`typeof ALSO_VALIDATED` and `typeof VALIDATED` share no values, regardless
of how the two symbols were constructed or what description string either
one carries. Indexing `validated[ALSO_VALIDATED]` against a type that
declares only `[VALIDATED]: true` is therefore rejected — **TS7053**, with
an elaboration naming the exact symbol that does not match — for the same
underlying reason `order.emial` is rejected in demo 01: the key used at the
access site is not a member of the property map.

---

## The general principle this closes

> TypeScript's property-checking machinery is not, at its core, about
> *strings*. It is about verifying that a **key** — whatever notion of
> identity that key's type carries — is a member of a type's property map.
> For string keys, identity is spelling, and the checkable artefact is
> `keyof T`'s literal-string union (demo 10). For symbol keys, identity is
> reference, and the checkable artefact is `unique symbol`. Both are the
> same check, parameterised over what "the same key" means.
