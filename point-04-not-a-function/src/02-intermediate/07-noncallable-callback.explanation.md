# 07 — A non-callable argument where a callback is expected: dissected

**Run it:** `npm run demo:07-noncallable-callback`

---

## Callback parameters are ordinary parameters

`onComplete: (result: string) => void` is a parameter whose type happens to
be a function type. Checking an argument against it follows the exact same
rule as checking an argument against `count: number` — *is the supplied
value's type assignable to the declared parameter type?* — because
assignability is defined uniformly over the whole type system (manifesto
§1). `retryOperation(() => "charged", "payment complete")` fails this check
because `string` is not assignable to `(result: string) => void`; the
diagnostic, **TS2345**, is the identical code demo 03 used for a plain
type-mismatched argument (`shout(inventoryCount)`) — nothing about it is
callback-specific.

---

## Why the mistake is invisible until invocation, in JavaScript

```js
retryOperation(() => "charged", "payment complete"); // compiles (there's nothing to compile)
// ... later, inside retryOperation:
onComplete(result); // TypeError: onComplete is not a function
```

The call to `retryOperation` itself never fails in JavaScript — arguments
are accepted unconditionally, regardless of what the function's body
eventually does with them. The crash is deferred to whatever line inside
`retryOperation` actually invokes `onComplete`, which may be nested several
calls deep, guarded by conditionals, or run asynchronously — none of which
change the fact that the actual mistake (passing a string instead of a
function) happened at the call site, one frame up from where the stack trace
points.

---

## Why TypeScript reports the error at the call site, not the definition

`retryOperation`'s own body is proven correct exactly once, against its
declared parameter types (`operation: () => string`, `onComplete: (result:
string) => void`) — the body never has to defend itself against a caller
supplying the wrong thing, because the compiler already guarantees every
caller supplies the right thing before the body ever runs. This is the same
"prove once, verify at every use" principle demo 03 introduced: a function's
internal logic and its external contract are checked as two entirely
separate concerns, and a violation of the contract is always attributed to
the caller who violated it, never to the callee whose contract was
violated.
