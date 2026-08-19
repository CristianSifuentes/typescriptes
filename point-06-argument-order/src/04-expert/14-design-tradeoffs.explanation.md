# 14 — Choosing a remedy

**Run it:** `npm run demo:14-design-tradeoffs`

Five remedies have been built. Each costs something. None is right everywhere.

---

## The decision procedure

Two questions per parameter pair:

> **Q1 — Would a swap here be SILENT?** (No crash, no `NaN`, no visible garbage.)
> **Q2 — Would it be EXPENSIVE?** (Money, permissions, data loss, wrong output.)

| answers | action |
|---|---|
| both no | **do nothing.** `max(a, b)` needs no ceremony. |
| Q1 only | rename, or reorder so the types differ. Cheap fixes first. |
| both yes | brand, or restructure. This is where the cost is justified. |

Applied:

| signature | Q1 silent? | Q2 expensive? | verdict |
|---|---|---|---|
| `max(a: number, b: number)` | yes | no — commutative | do nothing |
| `join(a: string, b: string)` | no — output looks wrong | no | do nothing |
| `fullName(first, last)` | no — visibly wrong | no | rename at most |
| `aspectRatio(width, height)` | **yes** | **yes** — wrong layout | **brand** |
| `transfer(from, to, amount)` | **yes** | **yes** — money | **brand + options object** |
| `dateRange(start, end)` | **yes** | **yes** — negative duration | **brand** |
| `createAccount(e, isActive, isAdmin)` | **yes** | **yes** — privileges | **literal unions** |
| `sync(path, delete, dryRun)` | **yes** | **yes** — data loss | **split the function** |

The verdict column is **not** "brand everything". Four different remedies
appear, and two rows conclude "do nothing" — a real answer, not a failure of
nerve.

---

## What each remedy costs

| remedy | catches same-typed swap | call-site cost | type cost | best for |
|---|---|---|---|---|
| do nothing | no | none | none | commutative / visibly-wrong pairs |
| **reorder so types differ** | yes | none | none | when you control the signature |
| literal unions | yes | none | one alias | flags and enumerable modes |
| options object | order removed | a few keystrokes | one interface | 3+ params, or any 2 flags |
| branded types | yes | a constructor call | alias + constructor | same-typed **kinds** |
| builder + type-state | yes | a chain | generic machinery | wide APIs, many call sites |
| split the function | yes | none | none | a flag that selects behaviour |

Row 2 deserves more attention than it gets. If you own the signature, the
cheapest fix for `(width: number, height: number)` is often to make one of them a
different type for an unrelated good reason — accept a `Dimensions` object —
rather than introducing branding machinery.

---

## Enforcing the decision: a `never`-based guard

```ts
type RejectAmbiguousPair<A, B> = Equals<A, B> extends true
  ? [ambiguous_parameters_share_a_type_brand_them_or_use_an_options_object: never]
  : [];

function measure<A, B>(first: A, second: B, ...guard: RejectAmbiguousPair<A, B>): readonly [A, B]
```

When `A` and `B` are the same type the rest parameter becomes a one-element
tuple, so the call is short by one argument:

```
measure(3, 10)   // error TS2554: Expected 3 arguments, but got 2.
```

Brand the pair and the guard goes quiet. The type has become a **policy**: *this
API refuses to accept two indistinguishable values.*

### Its honest limitation

The **message** is the generic arity error. The explanation lives in the
required parameter's **name**, which editors show in signature help and hover
and which never reaches terminal output. TypeScript has no custom-diagnostic
mechanism, so a parameter name and a type name are the only channels available
for advice.

Deploy sparingly: genuinely useful on a small, high-stakes core API; on a
general-purpose library it produces a confusing arity error for users who have
done nothing wrong yet.

---

## The half no type system fixes: reading the call

- **Inlay parameter hints** render `refund(orderId: ord-1, customerId: cust-9, …)`
  inline. They are off by default in most setups and are arguably the
  highest-value editor setting for this bug class.
- **An options object** gets the same effect with no editor configuration,
  because the names are in the source. That is a real argument for objects over
  positions, independent of type safety.
- **Signature help** shows parameter names — including the advice encoded in the
  guard above.

---

## The fully-remedied call

```ts
refund({
  orderId: orderId("ord-1"),      // branded — kinds cannot be swapped
  customerId: customerId("cust-9"),
  amount: cents(2500),
  mode: "partial",                 // literal union, not a boolean
  notify: "silent",
});
```

Every defect from the JavaScript twin is now either a compile error or
unwriteable — and the call reads as English without any editor configuration.
