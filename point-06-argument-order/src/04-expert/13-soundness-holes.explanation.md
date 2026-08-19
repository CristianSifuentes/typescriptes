# 13 — Where the protection stops

**Run it:** `npm run demo:13-soundness-holes`

Every remedy in this project protects **typed, branded call sites**. This
document enumerates the places where a call site stops being one.

---

## Hole 1 — `as`

```ts
credit(cust as unknown as AccountId, acct as unknown as CustomerId, money);
```

Compiles. Runs. Moves the money to the wrong place. `as` emits no runtime check
and overrides the checker's judgement.

The single guard rail:

```
error TS2352: Conversion of type 'number' to type 'AccountId' may be a mistake
              because neither type sufficiently overlaps with the other.
              If this was intentional, convert the expression to 'unknown' first.
```

…and note that the message explains how to bypass itself. Treat every
`as unknown as` in review as a claim requiring justification. The same applies
to `x!`, which is `as NonNullable<…>` with fewer characters and less visibility.

---

## Hole 2 — `any`

One `any` from an untyped dependency switches off arity, position, and brand
checking for every call it touches, and inference spreads it silently through
derived values.

The defence is `unknown` at the boundary plus a validated guard (demo 12).
`unknown` permits nothing until you prove something — exactly the question `any`
refuses to ask.

---

## Hole 3 — dynamic invocation

```ts
const asFunction: Function = credit;
asFunction.apply(null, ["cust-9", "acct-a", 100]);   // no diagnostic
```

The `Function` type has no signature, so `apply` on it accepts anything.

But this is important, and widely misunderstood:

```ts
credit.apply(null, [cust, acct, money]);
// error TS2322: Type 'CustomerId' is not assignable to type 'AccountId'.
// error TS2322: Type 'AccountId' is not assignable to type 'CustomerId'.
```

**`strictBindCallApply` does check `apply` when the callee's signature is
known** — so the hole is the `Function` *type*, not `apply` itself.

Two details in that output are worth noticing:

- **TS2322, not TS2345** — an array literal is being checked against a tuple,
  not arguments against parameters.
- **Both bad positions reported**, not just the first — element-wise checking of
  a literal does not stop at the first failure the way argument checking does.

**Practical rule: never annotate anything `Function`.** Write the signature —
`(...args: A) => R` — and `strictBindCallApply` does the rest.

---

## Hole 4 — a brand that is too coarse

This is the subtlest one, and the most likely to bite a team that has already
adopted branding.

```ts
const send = (to: AccountId, from: AccountId, amount: Cents) => …;
send(payer, payee, money);   // compiles. wrong direction.
```

Both values are `AccountId`. The level-02 blind spot has been **re-opened by a
brand that is too coarse**: the two values are the same **kind** (an account)
playing different **roles** (payer, payee), and a kind-level brand cannot see
roles.

> Kinds are cheap to brand. Roles are expensive.

The fixes, if the distinction is worth enforcing: role-level brands
(`PayerAccountId` / `PayeeAccountId`), or an options object with named fields.
Demo 14 decides which. The point here is that **branding is not automatically
enough — it is only as fine-grained as you made it.**

---

## Hole 5 — the I/O boundary

```ts
JSON.parse('{"from":"acct-payee","to":"acct-payer","amount":100}')
```

No compiler can know whether the sender put the payer in the `from` field. Types
describe the code you wrote, not the data the world sends you. Validation can
check **format** (is this an account id?) but never **intent** (is it the right
account?).

This is the genuinely irreducible hole. The remedies are outside the type
system: idempotency keys, confirmation steps, reconciliation, and designing the
API so the dangerous direction requires an explicit signal rather than a field
order.

---

## The complete map

| hole | recovered? | how |
|---|---|---|
| `as` / `as unknown as` | no | ban in review; confine to smart constructors |
| `x!` non-null assertion | no | ban in review |
| `any` from a dependency | no | `unknown` + validated guard at the edge |
| `Function`-typed callee | no | never annotate `Function`; write the signature |
| `apply` on a typed callee | **yes** | `strictBindCallApply` (on with `strict`) |
| spread of a tuple | **yes** | tuple types carry positions (demo 09) |
| spread of `any[]` | no | type the array, or validate it |
| dynamic dispatch by name | partly | a typed handler map + branded payloads |
| a coarse brand (kind, not role) | no | role-level brands or an options object |
| wrong order at the I/O boundary | **no** | outside the type system entirely |

---

## The honest statement of Concept #6

> Given that a call site is typed and its same-typed values are branded, an
> argument-order mistake is a compile error.

Both conditions are yours to maintain — and the last row of that table is not
maintainable at all, only designed around.
