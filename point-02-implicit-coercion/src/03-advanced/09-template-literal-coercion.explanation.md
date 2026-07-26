# 09 — Template literal coercion: `ToString` on everything, and a real gap

**Run it:** `npm run demo:09-template-literal-coercion`

---

## The JavaScript side: `ToString`, unconditionally

Every `${expression}` inside a template literal calls `ToString(expression)`.
Unlike `+` (which sometimes means arithmetic) or `-`/`*`/`/` (which never
accept strings), template-literal interpolation has exactly **one**
behavior, for **every** type:

```
`${42}`          -> "42"
`${undefined}`   -> "undefined"
`${null}`        -> "null"
`${NaN}`         -> "NaN"
`${[1,2,3]}`     -> "1,2,3"
`${{}}`          -> "[object Object]"
```

There is no failure mode here in the sense of `NaN` or a thrown exception —
`ToString` is total, and every result is a syntactically valid string. That
totality is precisely what makes the bug class dangerous: a missing field
does not produce an error, it produces the **word** "undefined", embedded in
otherwise normal-looking text, on a customer-facing receipt.

---

## The TypeScript side: an honest, stated gap

This is the second demo (after 05) whose central lesson is a **documented
limit** rather than a catch. TypeScript places no type constraint on a
template-literal hole — `${x}` type-checks for literally any `x`, including
`number | undefined`, `null`, and whole object types. There is no
diagnostic to suppress in the `.ts-safe` file's first section because there
genuinely is no error.

**The fix is architectural, not a compiler flag**: route every interpolated
value through a **named, explicitly-typed function** before it reaches the
template. A function parameter — unlike a template hole — is an ordinary,
fully type-checked position:

```ts
function formatCurrency(price: number): string {
  return `$${price.toFixed(2)}`;
}

formatCurrency(order.price);
//             ^^^^^^^^^^^ TS2345: Argument of type 'number | undefined' is
//                          not assignable to parameter of type 'number'.
```

The exact same `order.price` that slipped through `${order.price}` with zero
diagnostics is rejected the moment it is passed as an argument, because
`strictNullChecks` governs assignability everywhere **except** the
interpolation hole itself.

---

## Comparison table

| Position | Type restriction? | Diagnostic |
|---|---|---|
| `` `${x}` `` (template literal hole) | none — every type accepted | *(none — this is the gap)* |
| function parameter | yes — ordinary assignability | **TS2345** if the argument type doesn't match |
| arithmetic operand | yes | **TS2362/TS2363/TS2365** (demos 01, 02, 08) |
| `==`/`===` operand | yes, if provably disjoint | **TS2367** (demo 04) |

---

## Where this demo admits a limit

There is no `tsconfig.json` flag that makes `${x}` type-restrictive —
interpolation's whole purpose is to stringify arbitrary values, so
restricting it would break enormous amounts of legitimate code
(`` `User ${id} logged in` `` where `id` is a `number`, `` `Items: ${count}` ``,
etc.). The mitigation is a **naming discipline** identical to demo 05's
conclusion: values that need validation or formatting should pass through a
function whose parameter type does the checking, rather than being embedded
directly. The type system's boundary here is drawn at the language-feature
level (interpolation is universally permissive by design), not at the level
of any individual value.

---

## Verify

```bash
npm run evidence                          # see TS2345 emitted for the formatter call
npm run demo:09-template-literal-coercion
```
