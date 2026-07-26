# Foundations — the physics of Concept #1

> **Concept #1.** *Type errors that in JavaScript surface only at runtime are caught
> by TypeScript at compile time, as you write.*

Before any demo, four questions must be answered precisely. Everything else in
this project is a consequence of these four answers.

---

## 1. What exactly is "compile time" versus "runtime"?

They are two **disjoint phases of a program's life**, separated by a hard
boundary. Confusing them is the single most common source of misunderstanding
about TypeScript.

| | Compile time | Runtime |
|---|---|---|
| **When** | While you type; when `tsc` runs | When Node/the browser executes the emitted JS |
| **What exists** | Source text, syntax trees, *types*, scopes, the control-flow graph | Values, objects, memory, the call stack, I/O |
| **Who is reasoning** | The type checker, about **all possible executions** | The engine, about **this one execution** |
| **Cost of a bug** | A red squiggle | A 3 a.m. page, corrupt data, a refunded customer |
| **Input** | Your program | Your program **and** the data of one specific run |

The decisive asymmetry is in the "who is reasoning" row.

- A **test** observes one execution with one set of inputs. It tells you: *for
  these inputs, nothing went wrong*.
- A **type checker** performs a *static analysis*: it reasons about the program
  text itself and derives conclusions that hold for **every** execution, for
  every possible input, including the inputs nobody thought to test.

That is why `tsc` reporting `Type 'string' is not assignable to type 'number'`
is a categorically stronger statement than a green test suite. It is a
statement quantified over all runs.

A precise way to say it: the type checker computes a **conservative
over-approximation** of the set of values that can flow through each
expression. If that approximation contains a value the operation cannot accept,
the program is rejected. "Conservative" is the price: some programs that would
never actually fail are still rejected. That trade is the deal you sign.

**Where TypeScript sits.** TypeScript is a compile-time-only layer over
JavaScript. It adds a checking phase *before* the runtime phase and then gets
out of the way entirely — which brings us to the second question.

---

## 2. What does "type erasure" mean?

**Type erasure** is the property that types have **no representation in the
emitted program**. Compilation from TypeScript to JavaScript is, in the main,
*deletion*: annotations, `interface`s, `type` aliases, generics, `as`
assertions and `satisfies` clauses are removed, and what remains is JavaScript.

```ts
// TypeScript in
interface Order { id: string; total: number }
function applyDiscount(order: Order, percent: number): number {
  return order.total * (1 - percent / 100);
}
```

```js
// JavaScript out — the interface is simply gone
function applyDiscount(order, percent) {
  return order.total * (1 - percent / 100);
}
```

Run `npm run erasure` to watch this happen to a real file in this project.

Three consequences follow, and every one of them is load-bearing:

1. **Zero runtime cost.** No type tags, no reflection, no boxing. TypeScript's
   safety is paid for entirely at build time. The emitted code is exactly as
   fast as the JavaScript you would have written.
2. **No runtime type information.** You *cannot* ask "is this value an `Order`?"
   at runtime, because `Order` does not exist at runtime. `typeof`,
   `instanceof`, and property probing inspect **JavaScript's** runtime tags
   (`"object"`, `"string"`, a prototype chain) — not your types. This is why
   **type guards** and **discriminated unions** exist: they are the bridge that
   converts a runtime-checkable fact into compile-time knowledge.
3. **The boundary is unguarded.** `JSON.parse`, `fetch`, `process.env`, a
   database driver, and `any` all inject values whose types were *asserted*,
   not *verified*. Erasure means nothing checks them at the door. This is the
   principal hole in TypeScript's guarantees, dissected in
   `04-expert/12-soundness-holes`.

> **`erasableSyntaxOnly`.** This project sets that flag in `tsconfig.json`. It
> rejects the few TypeScript constructs that are *not* pure erasure — `enum`,
> `namespace`, constructor parameter properties — because each of them emits
> real JavaScript. With the flag on, "compilation is erasure" stops being a
> slogan and becomes a machine-checked invariant of this codebase.

---

## 3. What *is* a type, formally?

**A type is a set of values, together with the operations valid on that set.**

That single sentence explains almost every message `tsc` will ever print.

- `number` is the set of all IEEE-754 doubles (plus `NaN`, `±Infinity`).
- `boolean` is `{ true, false }` — literally the union `true | false`.
- `"pending"` is a **literal type**: the one-element set `{ "pending" }`.
- `string | number` is set **union**.
- `A & B` is set **intersection** — a value in both sets at once.
- `never` is the **empty set** `{}`. No value inhabits it. This is why `never`
  means "unreachable": to reach a program point typed `never`, a value would
  have to exist that does not.
- `unknown` is the **universal set**: every value is a member, therefore no
  operation is valid on it until you narrow it. It is the honest `any`.
- `any` is not a set at all. It is an **instruction to stop checking** — an
  explicit hole punched in the proof.

From the set reading, the core rules become arithmetic:

- **Assignability is (roughly) subset inclusion.** `S` is assignable to `T`
  when every value of `S` is an acceptable `T`. `"pending"` → `string` is legal
  because `{ "pending" } ⊆ string`. `string` → `"pending"` is not.
- **Narrowing is set subtraction.** Inside `if (typeof x === "string")`, the
  compiler removes every non-`string` member from `x`'s set. In the `else`
  branch it removes `string`. The sets in the two branches are disjoint and
  their union is the original — a *partition*.
- **Exhaustiveness is emptiness.** After a `switch` handles every member of a
  union, the remaining set is empty, i.e. `never`. `assertNever` simply asks
  the compiler to confirm that emptiness. If you later add a member to the
  union, the set is no longer empty and the assignment to `never` fails —
  turning "I forgot to handle the new case" into a build error.
- **An operation is legal only if it is legal for *every* member of the set.**
  This is why `string | number` supports `.toString()` (both members have it)
  but not `.toUpperCase()` (only one does). The compiler will not gamble on
  which member showed up today.

Two footnotes for precision:

- TypeScript's type system is **structural**, not nominal: membership is
  decided by shape, not by declared name. Two independently declared types with
  identical members are the same type.
- Sets here are sets of *values*, but assignability is not literally subset
  testing in every case (function parameter bivariance for methods, `any`, and
  fresh-object excess-property checks are deliberate deviations). The set model
  is the right intuition, and its exceptions are precisely the places where
  TypeScript trades soundness for ergonomics — see level 04.

---

## 4. Why does catching errors at compile time eliminate whole *classes* of bugs?

Because a type checker's conclusions are **universally quantified**, while a
test's conclusions are **existentially quantified**.

A passing test says: *there exists an input for which this code behaved.*
A passing type check says: *for all inputs, this expression cannot be handed a
value it does not support.*

Concretely, when the compiler accepts

```ts
function chargeCustomer(orderTotal: number): number { ... }
```

it has established — for every call site that exists now, plus every call site
you write tomorrow, plus every call site a colleague writes next year — that
`orderTotal` is never a `string`, never `undefined`, never an object. The
entire category *"`chargeCustomer` was called with a non-number"* has been
removed from the space of possible bugs. Not fixed one instance at a time:
**removed**.

This is the difference between draining water and closing the tap.

The classes deleted by this project's four levels:

| Bug class | Deleted by |
|---|---|
| Operations on values of the wrong primitive type (`NaN` propagation) | primitive annotations, level 01 |
| Calling a method that does not exist on the receiver | property/method resolution, level 01 |
| Wrong argument count, wrong argument order, wrong return type | function signatures, level 02 |
| Reading a misspelled or absent property (`undefined` leaks) | object shapes, level 02 |
| Operating on a union member before knowing which member you hold | narrowing + guards, level 03 |
| Forgetting to handle a state you added later | `never` + exhaustiveness, level 03/04 |
| Representing a state that must never exist | discriminated unions, level 04 |

And what remains — where the tap cannot be closed — is stated plainly, not
hidden, in `04-expert/12-soundness-holes`: values crossing the I/O boundary,
`as` assertions, and `any`. A type system is a proof about the code you wrote,
not about the data the world sends you.

---

### The one-sentence version

> TypeScript moves the discovery of type errors from *"one unlucky user, one
> unlucky input, in production"* to *"the author, immediately, for all inputs"*
> — and it does so at zero runtime cost, because by the time the program runs
> the types are gone.
