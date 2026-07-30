# 10 — Function overloading and overload resolution: dissected

**Run it:** `npm run demo:10-overloads`

---

## An overloaded function's type has MULTIPLE call signatures

Manifesto §1 mentions a type can carry more than one call signature. That is
literally what an overloaded declaration produces:

```ts
function findOrder(id: number): Order | undefined;
function findOrder(filter: { status: Order["status"] }): Order | undefined;
function findOrder(criteria: number | { status: Order["status"] }): Order | undefined { ... }
```

The first two lines are **overload signatures** — together they *are* the
public type of `findOrder`, a type with exactly two call signatures. The
third line is the **implementation signature**: it must be general enough
to actually handle every overload's parameters, but it is not itself part
of the callable surface external code checks against.

---

## Overload resolution: how a call is matched

For a call `findOrder(x)`, the compiler tries each overload signature, **in
declaration order**, asking the ordinary assignability question (manifesto
§3) against each one: *is `x`'s type assignable to this signature's
parameter type?* The first signature that accepts it wins, and the call's
result type is *that* signature's return type. If **every** overload
rejects the argument, the call is illegal — **TS2769**, *"No overload
matches this call"* — even though the implementation signature underneath
might, mechanically, have been able to run the code without throwing. This
is deliberate: the implementation signature describes what the function
body can survive, not what callers are allowed to ask for.

---

## Why the JavaScript failure here is worse than a `TypeError`

Every other demo in this project ends in a thrown `TypeError`, which is at
least loud. `findOrder((o) => o.status === "pending")` in the unchecked
version does not throw at all — `typeof` matches neither `"number"` nor a
truthy `"object"` check for a function value in the way the code expects,
every branch is skipped, and the function returns `undefined` *silently*.
The actual `TypeError: ... is not a function` this produces happens later,
wherever the caller of `findOrder` tries to use the returned `undefined` as
if it were an `Order` — one or more stack frames away from the real
mistake. TypeScript's overload check collapses that entire deferred failure
back to the original call site, before either function runs.
