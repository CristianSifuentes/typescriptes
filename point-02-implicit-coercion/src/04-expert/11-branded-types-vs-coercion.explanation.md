# 11 — Branded types: when `string` is too coarse a type

**Run it:** `npm run demo:11-branded-types`

---

## The JavaScript side: one string type, every meaning collapsed into it

`"ORD-1001"` and `"USR-42"` are both, at runtime, instances of the single
JavaScript `string` type. Nothing in the language records that one is
meant as an order identifier and the other as a user identifier — that
distinction lives only in the programmer's head and the parameter names in
a function signature, which callers do not see and cannot be forced to
respect. Swapping them is either a loud failure (a lookup misses) or,
worse, a silent one, if a coincidentally-matching record exists.

---

## The TypeScript side: structural typing's blind spot, and its fix

TypeScript's type system is **structural**: two types are the same type if
they have the same shape, regardless of name. `type UserId = string` and
`type OrderId = string` are, to the checker, both simply `string` — giving
them different names buys **zero** protection, because a type alias is
purely a compile-time label with no effect on the underlying shape.

A **branded type** (also called nominal-by-convention, or a phantom-tagged
type) closes the gap by intersecting the primitive with a property that no
ordinary value could ever have:

```ts
declare const userIdBrand: unique symbol;
type UserId = string & { readonly [userIdBrand]: "UserId" };
```

`unique symbol` guarantees the brand key cannot collide with anything else
in the codebase. The intersection makes `UserId`'s **shape** — not its
runtime representation — different from plain `string`, which is enough for
structural comparison to tell them apart:

```
error TS2345: Argument of type 'UserId' is not assignable to parameter of type 'OrderId'.
```

The only way to *produce* a `UserId` is through a function
(`asUserId`) that asserts the brand via `as` — a **controlled, singular**
use of the type assertion the manifesto and demo 12 warn about elsewhere,
concentrated in one auditable place instead of scattered through the
codebase.

---

## Comparison table

| Call | JavaScript result | TypeScript verdict |
|---|---|---|
| `issueRefund(orderId, userId)` (correct order) | `{ ok: true, refunded: 1999 }` | accepted |
| `issueRefund(userId, orderId)` (swapped) | `{ ok: false, reason: "order not found" }` — or worse, a false match | **TS2345** |
| `issueRefund("ORD-1001", "USR-42")` (raw strings) | works, no validation performed | **TS2345** — forces `asOrderId`/`asUserId` first |

---

## Where this demo admits a limit

Branding is **erased at compile time** — `userId as UserId` performs no
runtime check by itself; the safety comes entirely from `asUserId`'s
validation logic (`raw.startsWith("USR-")`), which a determined caller could
still bypass with a raw `as UserId` assertion anywhere in the codebase
(demo 12 dissects exactly this hole). Branded types raise the cost of
getting it wrong from "always possible, often silent" to "requires
deliberately writing an unsafe cast" — they do not make the mistake
physically impossible the way, say, a `never`-returning exhaustiveness
check does (demo 14). The protection is proportional to how disciplined the
codebase is about routing every raw string through the brand's constructor
function.

---

## Verify

```bash
npm run evidence                    # see TS2345 emitted for the swap and the raw string
npm run demo:11-branded-types
```
