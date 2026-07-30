# 11 — Overload resolution driven by arity: dissected

**Run it:** `npm run demo:11-overload-arity-resolution`

---

## Overloads can be distinguished by count alone, not just by type

Point-04's demo 10 dissected overloads distinguished by the **type** at a
shared position (a number vs. a filter object). This demo's three
`schedule` overloads share the same parameter *types* at each position —
what differs between them is purely how MANY parameters are declared:

```ts
function schedule(task: () => string): string;                              // arity 1
function schedule(task: () => string, delayMs: number): string;             // arity 2
function schedule(task: () => string, delayMs: number, repeat: boolean): string; // arity 3
```

Overload resolution (manifesto §3, applied per-signature) tries each
declared signature against the call, in order. Here, the very FIRST
question each attempt asks is arity — does the supplied count match this
overload's parameter count — before types are even considered. A call
whose count matches no overload fails resolution entirely, independent of
whether the *types* it supplied would have been fine.

---

## Why `TS2575`'s message is more informative than a single `TS2554`

`schedule(() => "ran", 500, true, "high")` could, in principle, be reported
as simply "expected 3 arguments, got 4" against the closest overload. TypeScript
does better: **TS2575** explicitly enumerates every arity that *is*
acceptable ("overloads do exist that expect either 2 or 3 arguments"),
because there is no single "the" expected count — there are three valid
ones, and the compiler surfaces all of them rather than picking one
arbitrarily to blame.

---

## Why the implementation signature's wider tolerance doesn't leak through

The implementation signature underneath (`delayMs?: number, repeat?:
boolean`) could technically be called with a 4-argument JavaScript call and
would silently ignore the extra one — exactly what the unchecked version
does. Declaring overload signatures deliberately **narrows** the type
callers see to exactly the arities intended, regardless of what the
implementation could survive. This is the same principle point-04's demo
10 established: the overload list, not the implementation body, defines
the actual public contract — and a fourth call shape being *tolerable* at
runtime is irrelevant to whether it is *intended*.
