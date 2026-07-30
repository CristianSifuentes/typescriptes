# 04 — Function signatures: the mechanism, dissected

**Run it:** `npm run demo:04-function-signatures`

---

## What a JavaScript signature is *not*

ECMAScript defines parameter binding as follows: parameters that receive no
argument are bound to `undefined`, and surplus arguments are collected into the
`arguments` object and otherwise ignored. There is no arity check, no type
check, and no return check. A JavaScript signature is documentation with
parentheses.

```js
function shippingCost(weightKg, destination, express) { ... }

shippingCost(2.5, berlin)                    // express === undefined  → falsy → wrong quote
shippingCost(2.5, berlin, true, "priority")  // "priority" discarded   → feature silently absent
shippingCost(berlin, 2.5, true)              // NaN                    → five "successful" operations
```

The swapped-argument case is worth tracing, because it shows how a single
mistake produces a chain of individually-legal steps:

| step | expression | result |
|---|---|---|
| 1 | `{country:"DE"} * 3.5` | `NaN` (ToNumber of an object is NaN) |
| 2 | `(2.5).country` | `undefined` (property lookup on a boxed Number) |
| 3 | `undefined === "US"` | `false` |
| 4 | `NaN + 12` | `NaN` |
| 5 | `NaN * 2` | `NaN` |

Five operations. Zero errors. One wrong invoice.

---

## What the compiler checks at a call site

For `f(a₁, …, aₙ)` where `f: (p₁: T₁, …, pₘ: Tₘ) => R`:

1. **Arity.** `n` must be within `[required, m]`, where optional (`?`),
   defaulted, and rest parameters extend the range. Violation ⇒ **TS2554**
   *"Expected 3 arguments, but got 2."*
2. **Position.** For each `i`, `typeof aᵢ` must be assignable to `Tᵢ`.
   Violation ⇒ **TS2345** *"Argument of type 'X' is not assignable to parameter
   of type 'Y'."*
3. **Result.** The call expression itself is typed `R`, and `R` is then checked
   against whatever context consumes it.

And inside the function body:

4. **Return.** Every `return e` is checked against the declared `R`
   (⇒ **TS2322**), and every path must return when `undefined ∉ R`
   (⇒ **TS2366** *"Function lacks ending return statement…"*).

Callbacks get all four checks too, because a function is a value with a type.
`weights.map((w): string => …)` assigned to `number[]` fails as **TS2322 —
'string[]' is not assignable to 'number[]'**: the callback's return type flowed
through `map`'s generic parameter, so the error surfaces on the *result*. That
propagation is inference doing its job.

---

## The case TypeScript cannot catch

```ts
function transfer(fromAccountId: string, toAccountId: string, amount: number) { … }

transfer(accountB, accountA, 100);   // compiles. money moved backwards.
```

Positional checking compares types. When two adjacent parameters have the
**same** type, there is nothing to compare — the types agree and only the
*meaning* differs. This is a genuine limit, and pretending otherwise would be
dishonest.

Two standard remedies, both used in the demo:

### Remedy 1 — branded (nominal) types

```ts
type Brand<T, Tag extends string> = T & { readonly __brand: Tag };
type AccountId  = Brand<string, "AccountId">;
type CustomerId = Brand<string, "CustomerId">;
```

`AccountId` and `CustomerId` are both `string` at runtime — the `__brand`
member is a type-level fiction, erased entirely — but they are *mutually
unassignable* at compile time. Swapping them becomes **TS2345**.

TypeScript is structurally typed by default (shape decides compatibility);
branding is how you buy **nominal** typing at the specific places where two
values share a shape but not a meaning: `UserId` vs `OrderId`, `Celsius` vs
`Fahrenheit`, `Metres` vs `Feet`, `SanitizedHtml` vs `string`.

### Remedy 2 — a named-parameter object

```ts
transfer({ from, to, amountCents });
```

Order stops existing as a concept, so an ordering mistake becomes
unrepresentable. A missing member is **TS2741** instead of an `undefined`.

---

## Reference table

| Defect | JavaScript behaviour | TypeScript | Code |
|---|---|---|---|
| too few arguments | binds `undefined` | rejected | TS2554 |
| too many arguments | discards the surplus | rejected | TS2554 |
| swapped, different types | runs, produces `NaN` | rejected | TS2345 |
| swapped, same types | runs, corrupts data | **not caught** — brand or use an object | TS2345 after branding |
| wrong argument type | coerces or ignores | rejected | TS2345 |
| wrong return type | returns it anyway | rejected at the `return` | TS2322 |
| a path with no return | returns `undefined` | rejected | TS2366 |
| untyped parameter | implicit `any` | rejected | TS7006 |
| bad callback shape | called anyway | rejected | TS2322 / TS2345 |

---

## The compounding effect

A signature is checked at **every call site that exists and every one that will
ever exist**. Adding a fourth parameter to `shippingCost` produces an immediate,
complete list of the places that must change — across the whole program, in
milliseconds, with no test coverage required.

That is refactoring as a *mechanical* operation rather than an archaeological
one, and it is the single largest day-to-day dividend of Concept #1.
