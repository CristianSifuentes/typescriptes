# 01 — Reading a misspelled property: the mechanism, dissected

**Run it:** `npm run demo:01-read-typo`

---

## What actually happens when you write `user.nam`

The compiler resolves `user.nam` in three steps:

1. Infer the **static type** of `user` — here, the nominal alias `User`,
   whose property map is `{ id: string, name: string, email: string }`
   (see the manifesto for what a property map is).
2. Look up the string `"nam"` as a **key** of that property map.
3. If found, the expression's type is the mapped value type. **If not
   found, the expression is rejected — TS2339 or, when a near-miss is
   detected, TS2551.**

This is **member resolution against the declared type**, not against the
runtime value. It happens entirely at compile time, using only the text of
your program — no `user` object needs to exist yet, no code needs to run.

---

## TS2339 vs TS2551 — the same failure, two messages

| you wrote | compiler's edit-distance verdict | code | message |
|---|---|---|---|
| `user.nam` | close to `name` (1 edit) | **TS2551** | `Property 'nam' does not exist on type 'User'. Did you mean 'name'?` |
| `user.username` | not close to any key | **TS2339** | `Property 'username' does not exist on type 'User'.` |

Both are the identical underlying failure — `"key" ∉ dom(propertyMap)` — but
`tsc` runs a spelling-suggestion pass over the property map's key set before
reporting. When a candidate is close enough (by edit distance), it upgrades
the diagnostic to TS2551 and names the fix inline. This is not a separate
mechanism from autocomplete: the editor's completion list *is* the same key
set, offered proactively instead of reactively.

---

## The JavaScript alternative, dissected

```js
user.nam                      // undefined            — no error, ever
`Welcome, ${user.nam}!`       // "Welcome, undefined!" — silent, user-visible
user.nam.toUpperCase()        // TypeError             — the ONLY point that throws
```

Three consecutive uses of the same typo produce three different runtime
behaviours, and the one that throws is the *last* one, not the first — it
throws at the point some other code assumed the `undefined` was a string,
which may be arbitrarily far (in files, in time, in team ownership) from
where the typo was written. JavaScript gives you no signal at the site of
the actual mistake.

---

## Why the error lands exactly where it does

TypeScript's diagnostic is reported **at the read** (`user.nam`), which is
also the earliest possible point — the instant you finish typing the
expression, before it is even assigned anywhere. Compare:

| | site of the mistake | site of the diagnostic/crash |
|---|---|---|
| JavaScript | `user.nam` | wherever the `undefined` is later dereferenced, or nowhere |
| TypeScript | `user.nam` | `user.nam` — the same line |

Collapsing "where the bug is" and "where it is reported" to the same line is
the entire practical value of this mechanism. It is also precisely what
makes autocomplete possible: the editor can only *suggest* `name` before you
finish typing because the same property map that rejects `nam` after the
fact is available to rank candidates before the fact.
