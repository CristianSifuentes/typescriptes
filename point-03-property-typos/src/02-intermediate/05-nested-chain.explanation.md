# 05 — Nested property access: the mechanism, dissected

**Run it:** `npm run demo:05-nested-chain`

---

## A chain is resolved link by link, not as one lookup

`order.customer.address.city` is not a single operation. The compiler
resolves it as three independent member-access steps, each one checked
against the property map produced by the step before it:

```
order                     : Order
order.customer             : Customer   (checked against Order's map)
order.customer.address     : Address    (checked against Customer's map)
order.customer.address.city: string     (checked against Address's map)
```

A typo at any step is a failure of *that* step's lookup, evaluated
independently of the steps before or after it. This is why the diagnostic
always names the type **immediately preceding** the typo, not the type at
either end of the chain:

| typo | checked against | code |
|---|---|---|
| `.adress` | `Customer`'s map | TS2551 (`Did you mean 'address'?`) |
| `.ciyt` | `Address`'s map | TS2339 |
| `.custmer` | `Order`'s map | TS2551 (`Did you mean 'customer'?`) |

---

## Why JavaScript's failure mode depends on depth, and TypeScript's does not

In JavaScript, `a.b.c` evaluates left to right *at runtime*: first `a.b` is
computed, then `.c` is read off the *result*. If `a.b` is `undefined` (a
typo one level up), reading `.c` off it throws immediately — a crash. If
only the *last* segment is wrong, there is nothing further to dereference,
so the expression just evaluates to `undefined` — silent. The **position**
of the typo in the chain determines whether you get a loud crash or a quiet
corruption; the compiler was never involved, so nothing about the
*seriousness* of the mistake enters into it.

TypeScript's resolution is purely static: every `.segment` is checked
against a property map that exists **before** any code runs, regardless of
where in the chain it sits. `order.customer.address.ciyt` — the one
JavaScript never complains about — is exactly as certainly rejected as
`order.custmer...`, the one that crashes two hops downstream. Depth is
irrelevant to whether the compiler notices; it only changes which type's
property map is consulted.

---

## The general principle

> **Member resolution is compositional.** The type of `expr.key` is a pure
> function of the type of `expr` and the literal string `key`. Chaining
> access simply iterates that function. There is no notion of "the whole
> chain succeeded or failed together" — each `.` is its own, independently
> checkable fact.

This compositionality is also why editor tooling can offer autocomplete at
*every* dot in a chain, not just the first: after `order.customer.`, the
editor already knows the static type of `order.customer` (it computed the
same resolution the compiler does) and can list `Customer`'s members before
you type another character.
