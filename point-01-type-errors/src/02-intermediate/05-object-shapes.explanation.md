# 05 — Object shapes: the mechanism, dissected

**Run it:** `npm run demo:05-object-shapes`

---

## The JavaScript object model, stated exactly

1. **Reading an absent property is legal** and evaluates to `undefined`.
2. **Writing an absent property is legal** and creates it.
3. There is **no distinction** between "the key is missing" and "the key holds
   `undefined`" that ordinary code can rely on.

Each rule maps to a bug class:

```js
order.total            // undefined            — read typo, silent
order.total / 100      // NaN                  — silent
`$${order.total/100}`  // "$NaN" in an email   — silent, and customer-visible
order.totlaCents = 99  // creates a NEW field  — write typo, silent
order.note.length      // TypeError            — the crash everybody knows
```

The write typo is the cruellest: the object now carries **both**
`totalCents` and `totlaCents`. The intended update went to a parallel field
that nothing reads, so the discount is never applied and no code path can
detect it.

---

## The five checks TypeScript applies

| Situation | Diagnostic | Message |
|---|---|---|
| read an undeclared member | **TS2339** | `Property 'total' does not exist on type 'Order'.` |
| read an undeclared member, near miss | **TS2551** | `Property 'totalCent' does not exist on type 'Order'. Did you mean 'totalCents'?` |
| write an undeclared member | **TS2339** | `Property 'totlaCents' does not exist on type '{...}'.` |
| construct without a required member | **TS2741** | `Property 'totalCents' is missing in type '{...}' but required in type 'Order'.` |
| construct with an extra member (fresh literal) | **TS2561** | `Object literal may only specify known properties, but 'totlaCents' does not exist in type 'Order'.` |
| use an optional member unguarded | **TS18048** | `'order.note' is possibly 'undefined'.` |
| supply an explicit `undefined` for an optional member | **TS2375** | `… not assignable … with 'exactOptionalPropertyTypes: true'.` |

---

## Freshness: the most misunderstood rule in TypeScript

TypeScript is **structurally** typed. The governing rule is:

> A value with *more* members is assignable to a type with *fewer*.

This is correct and necessary — it is what lets you pass a `PremiumOrder` where
an `Order` is expected, and it is the reason interfaces compose. But applied
naively to object literals it would make **every typo legal**, because a typo
is just an extra member:

```ts
const o: Order = { id, customerEmail, totalCents, totlaCents: 999 };
//                                                ^^^^^^^^^^ an "extra" member
```

That object genuinely does satisfy `Order` — it has everything `Order`
requires. Pure structural subtyping would accept it.

So TypeScript adds a second, narrower rule. An object literal written *directly*
in a typed position is marked **fresh**, and freshness carries an additional
obligation: no members beyond those the target declares. Hence **TS2561**.

Freshness is **lost** as soon as the literal is stored:

```ts
const loose = { …, internalAuditFlag: true };
const widened: Order = loose;   // ACCEPTED — `loose` is no longer fresh
```

Both behaviours are intentional, and knowing which is which explains an entire
category of "why does TypeScript complain here but not there?" confusion. The
excess-property check is not part of the type relation; it is a **typo
heuristic** bolted on at the one syntactic position where a typo is likely and
subtyping would hide it.

---

## Optionality, and the state JSON destroys

`note?: string` means the type of `order.note` is `string | undefined`, and
`.length` is not a member of `undefined` — hence **TS18048**. This is the
compile-time form of *"Cannot read properties of undefined"*.

With `exactOptionalPropertyTypes: true` (enabled in this project), TypeScript
keeps two states apart that JavaScript conflates:

| declaration | `{}` | `{ note: undefined }` | `{ note: "hi" }` |
|---|---|---|---|
| `note?: string` | ok | **TS2375** | ok |
| `note?: string \| undefined` | ok | ok | ok |
| `note: string \| undefined` | **TS2741** | ok | ok |

This matters in practice: `PATCH { note: undefined }` ("clear the note") and
`PATCH {}` ("leave the note alone") are different requests, and without this
flag they have the same type.

The three disciplined ways to consume an optional member:

```ts
if (order.note !== undefined) order.note.length;  // narrowing  → string
const text = order.note ?? "(none)";              // ??         → string
const len  = order.note?.length;                  // ?.         → number | undefined
```

Each is a *different answer to a different question*, and the compiler tracks
which one you chose. Demo 07 formalises the mechanism behind the first:
control-flow narrowing.

---

## Why nesting makes JavaScript worse and TypeScript better

```js
order.shipping.postcode      // undefined — one level of typo, silent
order.billing.postalCode     // TypeError — two levels, crash
```

In JavaScript, *whether you get a silent `undefined` or a crash depends on how
deep the typo is*, which has nothing to do with how serious it is.

In TypeScript both are **TS2339**, reported on the member that is actually
wrong — `billing`, not `.postalCode`. The diagnostic points at the cause, not
at the symptom, which is the recurring theme of this entire project.
