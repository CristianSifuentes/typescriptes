# Foundations — the physics of Concept #4

> **Concept #4.** In JavaScript, calling something that isn't callable — a
> misspelled method, a property that's actually a value, an `undefined`
> slot — throws `TypeError: undefined is not a function` at runtime, often
> deep in production. TypeScript verifies at compile time that whatever you
> invoke with `()` is actually a function with a compatible call signature,
> and that the method you're reaching for genuinely exists on that type.

Four questions must be answered precisely before any demo. Everything else
in this project is a consequence of these four answers.

---

## 1. What does "callable" mean, formally, and how is a call signature a type?

**Callable** is not a special case bolted onto TypeScript's type system — it
is an ordinary consequence of the same set-of-values model used throughout
this series (see point-01's manifesto §3: *"a type is a set of values,
together with the operations valid on that set"*). A value is callable when
its type includes a **call signature**: a description of the parameter
types it accepts and the return type it produces when invoked with `(...)`.

```ts
type Greeter = (name: string) => string;
```

`Greeter` denotes the set of *every function value* that can be called with
one `string` argument and that returns a `string`. This is exactly the same
kind of set `interface User { name: string }` denotes for objects — a
predicate on values, checkable at every point that predicate matters. The
difference is only *which* operation the type licenses: object types license
member access (`.key`); function types additionally license **invocation**
(`(...)`).

A type can carry **more than one** call signature (function overloading,
demo 10), and a single value's type can combine a call signature **with**
ordinary properties — a **hybrid type** (demo 09):

```ts
interface Middleware {
  (req: Request, res: Response): void;  // call signature
  readonly name: string;                // ordinary property
}
```

`Middleware` describes something that is simultaneously "a function you can
call" and "an object with a `.name`" — both facts live in the same property
map, because a call signature is, structurally, just another entry in that
map (with an unusual key: the empty string, conventionally written `()`
rather than `.propertyName`).

**The formal statement**, then: an expression `f(...)` type-checks iff the
static type of `f` contains a call signature `S`, and the arguments supplied
are assignable to `S`'s parameter types. Nothing about *values* is
consulted — this is exactly as static as every property-name check in
point-03.

---

## 2. Why does JavaScript throw `undefined is not a function` — what runtime step fails?

`f(...)` in JavaScript is a single opcode-level operation with two
sequential internal steps:

1. **Resolve `f` to a value.** This step is the same member-resolution
   walk point-03's manifesto described: own properties, then the prototype
   chain, then failure yields `undefined`.
2. **Check that the resolved value has an internal `[[Call]]` method**, and
   invoke it. Every JavaScript **function** object has `[[Call]]`. Every
   other value — numbers, strings, plain objects, `undefined`, `null` — does
   not.

`TypeError: x is not a function` is the engine reporting that step 2 failed:
it successfully resolved `x` to *some* value, and that value has no
`[[Call]]` slot. The message is technically accurate and diagnostically
useless: it tells you *that* the value was not callable, at the exact
runtime moment you tried to call it — nothing about *why* `x` ended up being
the wrong kind of value in the first place (a typo two lines up? a value of
the wrong type passed as a parameter? a config field that used to be a
function and was refactored to a number?). By the time the `TypeError`
surfaces, the cause is gone from the stack.

This project's entire premise is that step 2's failure is **decidable ahead
of time**, from the program text alone, whenever the target's *declared*
type is known — which is exactly when a type checker is watching.

---

## 3. How does TypeScript verify method existence *before* execution?

Exactly the way point-03 described property-name checking, specialised to
the case where the property's value type happens to be a function:

```
resolve(expr.method, T):
  1. is `method` a declared member of T's property map?
     → no:  TS2339 / TS2551 (does not exist)
  2. is the type of that member a function type with a compatible
     call signature for THIS call's arguments?
     → no:  TS2349 (not callable) or TS2345/TS2769 (bad arguments)
  3. otherwise: the call type-checks; its type is the signature's
     return type.
```

Step 1 is unchanged from point-03 — `"hello".toUpperCasee()` fails at step 1
(**TS2339/TS2551**), before the compiler even asks whether the (nonexistent)
member is callable. Step 2 is new to this project: even when the member
*does* exist, its type might not be a function type at all (`config.retry`
where `retry: number`) — that failure is **TS2349**, *"This expression is
not callable."* Both steps happen entirely from the declared type — no
`config` object needs to exist yet, no code needs to run — which is why the
diagnostic appears the instant the expression is written, not the instant it
executes.

---

## 4. Why does compile-time invocation checking eliminate a whole *class* of crashes?

Because, as with every mechanism in this series, the compiler's conclusion
is **universally quantified** over every execution, while a passing test (or
a lucky run in production) is **existentially quantified** over one.

Concretely: once

```ts
function dispatch(handler: (event: Event) => void, event: Event): void {
  handler(event);
}
```

compiles cleanly against every call site, the compiler has established —
for the call site you wrote today, the one a colleague writes next quarter,
and every one after that — that `handler` is never a number, never
`undefined`, never a typo'd property access. The category *"`dispatch` was
invoked with something that isn't a callable `(event: Event) => void`"* has
been **removed**, not caught one instance at a time after a user hit it in
production.

The specific bug classes this project's four levels delete:

| Bug class | Deleted by |
|---|---|
| Calling a value with no call signature at all (`5()`) | callable-type checking, level 01 |
| Calling a misspelled or nonexistent method | member resolution (point-03, reapplied here), level 01 |
| Calling a property that is a value, not a function | call-signature checking on the member's type, level 02 |
| Invoking something that might be legitimately absent | `strictNullChecks` + optional chaining, level 02 |
| Calling with arguments that match no valid signature | overload resolution, level 03 |
| Dispatching to a handler chosen dynamically by a wrong/missing key | typed, `keyof`-checked registries, level 04 |

And what remains — where compile-time checking cannot reach — is stated
plainly in `04-expert/14-soundness-limits`: `any`, `as`, and values crossing
an unvalidated I/O boundary. A type system proves things about the code you
wrote against the types you declared; it cannot prove anything about a
callable value whose type was merely *asserted*, never checked.

---

### The one-sentence version

> TypeScript moves the discovery of "this is not a function" from the one
> unlucky request that happened to exercise that code path in production to
> every call site, checked the instant it is written — because a function
> type is not "some opaque value that might work," it is a call signature
> the compiler can verify your arguments against, every time, for free.
