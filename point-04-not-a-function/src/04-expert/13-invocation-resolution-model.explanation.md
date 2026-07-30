# 13 — The compiler's invocation-resolution algorithm, in slow motion

**Run it:** `npm run demo:13-invocation-resolution-model`

---

## Every call expression in this project runs the same five steps

Manifesto §3 gave the algorithm for member-and-call resolution in outline.
This demo makes the algorithm's five steps individually observable by
forcing each one onto a different piece of syntax, via a generic RPC
dispatcher:

```
resolve(f(...args), T):
  1. is f's type callable at all?            (a call signature must exist)
  2. bind any generic type parameters         (here: M, from the first argument)
  3. compute the applicable parameter types    (Parameters<...>, or an overload's params)
  4. is `args` assignable to those parameters? (ordinary argument checking)
  5. the call's type = the matched signature's return type
```

For an ordinary, non-generic call like `"hello".toUpperCase()`, steps 1–3
are trivial (there is one signature, with no type parameters to bind) and
the whole algorithm collapses to "does `toUpperCase` exist and is it
callable" (demo 01/02) plus "are there zero arguments, as required" (step
4, vacuously true). `callRpc` makes every step land on a distinct,
independently-checkable piece of code, which is exactly why it is useful as
a teaching example rather than as production API-client code.

---

## Why a renamed method is caught at step 2, not step 4

`callRpc("fetchUser", 1)` fails while binding `M` — step 2 — because
`"fetchUser"` was never a member of `keyof RpcMethods` in the first place.
The compiler never reaches step 3 (computing `Parameters<RpcMethods[M]>`)
because there is no valid `M` to compute it from. This is the generic
analogue of demo 02's member-existence check happening *before* demo 01's
callability check: **existence is always resolved before signature
matching**, whether the lookup is a static `.` access or, as here, a
type-parameter binding driven by a string literal argument.

---

## Why this collapses an entire class of dynamic-dispatch bugs

The JavaScript version's `rpcMethods[methodName]` is a plain runtime object
lookup: any string produces either a function or `undefined`, and nothing
distinguishes "a method that used to exist" from "a method that never did."
`callRpc<M extends keyof RpcMethods>` replaces that open-ended string with a
**closed, compiler-verified key set** — the same idea demo 15 develops into
a full dispatch registry. The renamed-method bug this demo dissects, and
the missing-handler bug demo 15 dissects, are the same defect at two
different scales: a dynamic lookup whose key set was never verified against
what actually exists.
