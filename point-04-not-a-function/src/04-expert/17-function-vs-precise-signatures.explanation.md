# 17 — `Function` versus precise signatures: dissected

**Run it:** `npm run demo:17-function-vs-precise-signatures`

---

## `Function` answers the wrong question

`Function` is TypeScript's built-in type for "some callable JavaScript
value." Its own call signature is `(...args: any[]) => any` — it answers
*"is this callable at all?"* (yes, always, for anything with `[[Call]]`) but
explicitly refuses to answer *"callable with what, returning what?"* by
typing every argument and the return value `any`. Demos 01–04 all involve a
value that is **not callable**; `Function` genuinely closes every one of
those. This demo is about a value that **is** callable, just with the
**wrong shape** — the exact case `Function` was never designed to catch,
because answering it requires a real call signature, not the absence of
one.

---

## Why the mistake compiles cleanly under `Function`, and not under a real `Hook`

```ts
function runHookWide(hook: Function, doc: Doc): unknown { return hook(doc); }
function runHook(hook: Hook, doc: Doc): string { return hook(doc); }
// type Hook = (doc: Doc) => string;
```

Both functions call their hook the same way. The difference is entirely in
what the PARAMETER type lets the compiler check at the call `hook(doc)` and
at every REGISTRATION of a hook value. `Function` has no parameter list to
check `doc` against (arguments are `any[]`, and passing extra or
mismatched arguments to an `any`-typed call is always accepted) and no
return type to check a hook's output against. `Hook` has both — a hook
whose parameters or return type disagree with `(doc: Doc) => string` fails
`TS2322` the moment it is assigned to a `Hook`-typed slot, long before
`runHook` ever calls it.

---

## Why "worse than a crash" is the right way to describe the JavaScript failure here

Most demos in this project end in a thrown `TypeError`. This one does not:
`startupStyleHook()` runs, ignoring its argument, and returns `42` — a
`number` silently returned from a slot every other hook fills with a
`string` summary. Nothing observes this as an error; it just becomes wrong
data flowing further into the program (logged, displayed, or concatenated
somewhere a string was expected), to be discovered — if it ever is —
somewhere entirely disconnected from `runHookWide`. `noImplicitAny`
prevents `Function`, and `any` generally, from appearing by *inference*;
only a deliberate, precise signature like `Hook` prevents it from being
written on purpose and then silently accepting a mismatched value.
