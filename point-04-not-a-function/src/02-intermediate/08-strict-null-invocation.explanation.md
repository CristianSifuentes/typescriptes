# 08 — `strictNullChecks` in action: the mechanism, dissected

**Run it:** `npm run demo:08-strict-null-invocation`

---

## Not every "maybe absent" callable is an optional property

Demo 06 dissected `onError?:` — an **optional property**, sugar for a union
with `undefined`. This demo dissects the other common shape of the same
problem: a field that is **always present** (never `delete`d, never
omitted) but whose **value** starts out `undefined` and is filled in later:

```ts
private onMessage: Handler | undefined = undefined;
```

There is no `?` here — `onMessage` is a mandatory field of every
`SocketClient`. What's optional is which *value* currently occupies it. The
type is still a union with a non-callable member, so the same rule applies:
`this.onMessage(data)` is illegal until `undefined` is excluded from the
union at that point in the code (manifesto §1, the union-legality rule).

---

## Why an `if` check, not `?.`, is the idiomatic fix here

`?.` is ideal when the *shape* of the check is "call it if present, and I
don't care about anything else in this expression." Here, the surrounding
method (`receive`) legitimately wants to do nothing at all when no handler
is registered yet — an `if` block reads as the natural expression of that
intent, and it narrows `this.onMessage` from `Handler | undefined` down to
`Handler` for every statement inside the block, not just for one call:

```ts
if (this.onMessage) {
  this.onMessage(data); // narrowed — no `?.` needed here
}
```

Both `?.` and `if` narrowing rest on the identical control-flow analysis:
the compiler tracks, expression by expression, which members of a union are
still possible at each program point, and only permits operations valid for
*all* remaining members.

---

## Why this bug is a race, not a typo

Unlike a misspelled method (demo 02) or a wrong-type member (demo 03), this
bug depends on **timing**: which of `setHandler()` and `receive()` a caller
happens to invoke first. That makes it exactly the kind of bug a type
checker is best at — one whose JavaScript reproduction requires a specific,
possibly rare, runtime interleaving (an early frame arriving before
application code finishes wiring up its handlers), while TypeScript's
rejection requires nothing but reading the declared type of `onMessage` and
noticing that no code path proves it non-`undefined` before the call.
