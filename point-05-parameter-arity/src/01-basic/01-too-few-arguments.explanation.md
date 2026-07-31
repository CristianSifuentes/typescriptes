# 01 — Too few arguments: the mechanism, dissected

**Run it:** `npm run demo:01-too-few-arguments`

---

## Arity checking is a counting question, asked before any typing question

Manifesto §3 lays out the algorithm as two independent steps: first, is the
supplied argument *count* within bounds; only then, is each supplied
argument's *type* correct. `greet()` fails at step 1 — there is nothing to
check about `name`'s type, because no argument occupies that position at
all. This is why the diagnostic reads purely in terms of counts:

```
error TS2554: Expected 1 arguments, but got 0.
```

Not "argument 0 has the wrong type" — there IS no argument 0. The message
is exact about what failed: a *count* mismatch, full stop.

---

## Why JavaScript can't even detect this as a distinct failure mode

Manifesto §2 describes the binding model: every declared parameter gets
bound to *something*, real argument or `undefined`, and the call proceeds
regardless. There is no step in that model with an opportunity to say "wait,
this call is short an argument" — by design, arity mismatches are not
failures in JavaScript's execution model at all. What *looks* like the
failure (a `TypeError` reading `.toUpperCase()` off `undefined`) is really a
**symptom**, several steps removed from the actual mistake (the missing
argument at the call site).

---

## Why the fix location matters

`greet`'s body in the checked version never has to defend itself against
being called with too few arguments — the compiler guarantees, for every
call in the program, that `name` is a real `string` by the time the
function body executes. This is the same "prove once, verify at every
call" principle point-04's manifesto and demo 07 established for callable
values, applied here to argument *count* rather than argument *callability*:
a violated arity contract is always attributed to the caller who violated
it, at the exact line they violated it, never discovered later inside a
function that did nothing wrong.
