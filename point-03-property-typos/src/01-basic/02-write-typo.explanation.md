# 02 — Writing to a nonexistent property: the mechanism, dissected

**Run it:** `npm run demo:02-write-typo`

---

## Two independent checks on every assignment

`target.key = value` is checked in two independent stages:

1. **Is `key` a member of `target`'s property map?** If not: **TS2339**
   (or **TS2551** when the key is a close enough spelling of a real one),
   regardless of what `value` is. There is nothing to check the value
   against — the key does not exist, full stop.
2. **Is `value` assignable to the type the map promises for `key`?** Only
   reached if step 1 passed. If not: **TS2322**.

```ts
user.emial = "x";  // TS2551 — 'emial' is not a key (close to 'email', so suggested)
user.email = 42;   // TS2322 — 'email' is a key, but its type is `string`
```

Both are "you wrote something wrong on the left/right of `=`", but they are
*different* wrongs, caught by *different* checks, and the diagnostics say so
explicitly.

---

## Why the write typo is worse than the read typo in JavaScript

A misread (`user.nam`) fails to retrieve data that was never there — the
object itself stays correct, only the reader gets `undefined`. A miswrite
(`user.emial = x`) **corrupts the object itself**: it now silently carries
two competing answers to "what is this user's email?" —

```js
user.email  // "ada@old-domain.com"  — the field every reader still uses
user.emial  // "ada@new-domain.com"  — the field the (buggy) writer created
```

Neither value is individually wrong-looking. There is no `undefined`
anywhere to eventually crash on. The bug is a **fork in the data model**,
and its only symptom is behavioural: the update the user asked for silently
did not happen. This is strictly harder to debug than a read typo, because
nothing ever throws — you have to notice that the *wrong* field changed, not
that *a* field failed to change.

---

## Why TypeScript closes the object to writes, not just reads

A `User`-typed value's shape is exactly the property map `interface User`
declares. Assignability rules for member access apply identically on both
sides of `=`:

| operation | check performed | failure mode closed |
|---|---|---|
| `user.emial` (read) | is `"emial"` a key? | typo silently returns `undefined` |
| `user.emial = x` (write) | is `"emial"` a key? (TS2551 here — close to `email`) | typo silently creates a parallel field |
| `user.email = 42` (write) | is `42` assignable to the value type of `"email"`? | field silently holds the wrong kind of data |

There is no special-case leniency for the left-hand side of an assignment —
if anything, JavaScript's leniency there (silently creating new keys) is
precisely the behaviour this check exists to remove. TypeScript's object
types are, by design, **closed**: you may read and write exactly the members
declared, nothing more, nothing less.
