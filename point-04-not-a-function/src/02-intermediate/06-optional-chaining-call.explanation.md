# 06 — Optional methods and `?.()`: the mechanism, dissected

**Run it:** `npm run demo:06-optional-chaining-call`

---

## What `onError?:` actually declares

`onError?: (err: Error) => void` is sugar for a property whose value type is
a **union**:

```ts
onError: ((err: Error) => void) | undefined
```

One member of that union — the function type — has a call signature. The
other — `undefined` — does not. Invoking `plugin.onError(error)` therefore
asks the compiler to call a value that, according to its own declared type,
might not be callable at all. This is exactly the union rule from point-01
(demo 08): *an operation is legal on a union only if it is legal for every
member.* `()` is legal for the function member and illegal for `undefined`,
so the whole expression is rejected — **TS18048**, "possibly undefined,"
the same diagnostic that governs reading any optional property (point-03,
demo 04), now applied to the *invocation* of one.

---

## Why `?.()` is not just a shorter `if` check

```ts
if (plugin.onError !== undefined) plugin.onError(error);  // narrowing
plugin.onError?.(error);                                   // optional call
```

Both are valid fixes, and both rely on the same underlying narrowing
machinery. `?.()` additionally has a precise TYPE of its own: the expression
`plugin.onError?.(error)` evaluates, at the type level, to `void |
undefined` — `void` when the call happens (the hook's own return type), and
literally `undefined` when it short-circuits. The compiler tracks this
exactly, so a chain of `?.` calls composes correctly without ever silently
discarding the "this might not have happened" information the way an
unguarded call would.

---

## Why this bug is specifically dangerous in a plugin architecture

The JavaScript version's crash punishes the **caller's** mistake but
manifests inside **someone else's correct code** — `analyticsPlugin` did
nothing wrong; omitting an optional hook is, by definition, valid. The
actual defect is entirely in `runPlugin`, which forgot that "optional" means
"might be absent," not "usually present." Because the crash only occurs when
a plugin *without* the hook runs, a test suite that happens to only exercise
plugins *with* `onError` implemented will never catch it — this is a case
where the JavaScript failure mode is not just late, but **conditionally
present**, depending on which plugin happens to be loaded. TypeScript's
check is unconditional: `plugin.onError(error)` is rejected regardless of
which plugin instance might eventually be passed in, because the check is
against the *type* `Plugin`, which is honest about every plugin that could
ever satisfy it.
