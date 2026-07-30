# 12 — The soundness holes: where TypeScript cannot protect you

**Run it:** `npm run demo:12-soundness-holes`

This is the most important document in the project. Everything before it argued
that the compiler wins. This one draws the boundary of that claim precisely.

---

## Vocabulary, used exactly

| term | definition |
|---|---|
| **sound** | if the checker accepts a program, the property it claims really holds at runtime. No false negatives. |
| **complete** | the checker accepts every program that would in fact have run correctly. No false positives. |
| **decidable** | the check always terminates with an answer. |

By Rice's theorem (via the halting problem) you cannot have all three for a
non-trivial semantic property of a Turing-complete language. Every real type
system gives one up.

**TypeScript deliberately gives up soundness**, so that idiomatic JavaScript
remains typeable. This is stated in the project's own design goals ("Non-goal:
apply a sound or 'provably correct' type system"). The holes below are not
accidents; each buys a specific ergonomic benefit.

---

## Hole 1 — `as` (type assertion)

```ts
const trusted = raw as Customer;   // compiles. checks nothing. emits nothing.
```

`as` is an **assertion**, not a conversion. It overrides the checker's judgement
and produces no runtime check whatsoever. Everything downstream is then checked
against a claim nobody verified.

The one guard rail:

```
error TS2352: Conversion of type 'number' to type 'Customer' may be a mistake
              because neither type sufficiently overlaps with the other.
              If this was intentional, convert the expression to 'unknown' first.
```

And the message tells you how to defeat it: `x as unknown as T` bypasses even
the overlap check. That double assertion is the universal escape hatch; every
occurrence deserves a comment justifying it.

Related, and identical in kind: the non-null assertion `x!`, which is `as
NonNullable<typeof x>` with fewer characters and less visibility.

---

## Hole 2 — `any` and the I/O boundary

```ts
const parsed = JSON.parse(body);   // any
const c: Customer = parsed;        // accepted — `any` is assignable to everything
```

`any` is not a type in the set-theoretic sense. It is an **instruction to stop
checking**, and it is assignable in both directions, so it propagates through
inference silently.

`JSON.parse` is declared `(text: string) => any` — and that is the **correct**
declaration. No compiler can know the shape of bytes arriving from a network.
The same applies to `fetch().then(r => r.json())`, `process.env` (every value is
`string | undefined`), database drivers, `postMessage`, and any dependency
without types.

### The fix, which is the single most valuable habit in TypeScript

Parse to `unknown`, then narrow with a validated guard:

```ts
const value: unknown = JSON.parse(text);
if (!isCustomer(value)) throw new TypeError("bad payload");
// value is Customer here — and something actually checked
```

Better still, generate the guard from a schema (`zod`, `valibot`, `typia`) so
that the type and the validator cannot drift apart.

This moves the failure from deep inside the application to the boundary, where
it can be logged, rejected with a 400, and attributed to the caller.

---

## Hole 3 — method parameter bivariance

```ts
interface Handler { handle(event: { kind: string }): void }     // METHOD syntax

const h: Handler = {
  handle(event: { kind: string; detail: string }) {             // accepted!
    event.detail.toUpperCase();                                 // TypeError at runtime
  },
};
h.handle({ kind: "click" });                                    // boom
```

Under sound subtyping, parameter positions are **contravariant**: an
implementation may accept *more* than the interface promises, never less.
`strictFunctionTypes` enforces exactly that — but **only for members declared
with function-property syntax**:

```ts
interface Handler { handle: (event: { kind: string }) => void } // PROPERTY syntax
// error TS2322: Type '(event: { kind: string; detail: string; }) => undefined'
//               is not assignable to type '(event: { kind: string; }) => void'.
//   Types of parameters 'event' and 'event' are incompatible.
```

One character of syntax decides whether variance is enforced.

**Why keep the hole?** Because without it `Array<Dog>` would not be assignable
to `Array<Animal>` (arrays are mutable, so they are genuinely invariant), and
neither would any DOM event handler. The sound alternative is unusable in
practice. Practical rule: declare callbacks as **properties**, not methods, when
you want the check.

---

## Hole 4 — `readonly` is shallow, alias-blind, and erased

```ts
const mutable = { retries: 3 };
const frozen: Config = mutable;   // accepted — readonly is not part of this relation
mutable.retries = 99;             // frozen.retries is now 99
```

`readonly` prevents writes *through that reference*. It says nothing about other
references to the same object, it is not deep, and it does not exist at runtime.
`Object.freeze` is the runtime tool.

Interesting asymmetry: the **array** case *is* checked.

```
error TS4104: The type 'readonly number[]' is 'readonly' and cannot be assigned
              to the mutable type 'number[]'.
```

Worth knowing before you rely on either.

---

## Hole 5 — array index access

`arr[i]` is typed `T`, not `T | undefined`, unless `noUncheckedIndexedAccess` is
enabled (it is, in this project — hence the extra work in demo 06). Bounds are
not statically knowable in general, so the default is a lie of convenience. In
most TypeScript codebases this hole is wide open, and it is the leading source
of "undefined is not an object" in supposedly type-safe code.

---

## Hole 6 — declarations are claims too

A `.d.ts` file asserts the shape of code the compiler never sees. If it is
wrong — stale, hand-written, or generated from a different version — every
program that trusts it inherits the error. Likewise, `declare` statements assert
the existence of globals that may not exist.

---

## The complete map

| hole | why it exists | how to close it |
|---|---|---|
| `as` | you sometimes know more than the compiler | ban in review; use type guards |
| `x!` | shorter `as` | ban in review |
| `any` | gradual typing, untyped dependencies | `unknown` + validation |
| I/O (`JSON.parse`, `fetch`, env) | the world is not typed | schema validation at the edge |
| method bivariance | arrays and event handlers need it | property syntax + `strictFunctionTypes` |
| `readonly` aliasing | erasure — no runtime enforcement | `Object.freeze`, or don't share references |
| index access | bounds are undecidable | `noUncheckedIndexedAccess: true` |
| type-predicate bodies | verification ≠ type checking | generate guards from schemas |
| `.d.ts` claims | the compiler cannot see the implementation | pin versions, audit, test |

---

## The honest conclusion

> TypeScript's guarantee is: **given that the values entering your program have
> the types you claimed, no type error occurs inside it.**

Concept #1 is true, powerful, and **conditional** — and the condition is the
boundary.

That is not a disappointment; it is a design brief. The type system handles the
interior for free, so *all* of your validation effort belongs at the edge. That
is a far better place to spend it than sprinkled through every function, which
is where JavaScript forces you to spend it.
