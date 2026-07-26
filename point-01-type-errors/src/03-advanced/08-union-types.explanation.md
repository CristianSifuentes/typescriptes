# 08 — Union types: the mechanism, dissected

**Run it:** `npm run demo:08-unions`

---

## The definition, and everything that follows from it

`A | B` is the **set union** of the values of `A` and the values of `B`.

One consequence, derived not decreed:

> An operation is valid on `A | B` only if it is valid on `A` **and** on `B`.

Equivalently, in terms of members: **the apparent members of a union are the
intersection of its members' members.**

```ts
const key: string | number = …;
key.toString()    // ok      — both members have it
key.toUpperCase() // TS2339  — only `string` has it
key * 2           // TS2362  — only `number` supports arithmetic
```

The compiler's elaboration line is where the reasoning is visible:

```
error TS2339: Property 'toUpperCase' does not exist on type 'string | number'.
  Property 'toUpperCase' does not exist on type 'number'.
```

It did not reject the union. It **named the member** that cannot do this. Read
elaboration chains; they are the compiler showing its work.

**Union of values, intersection of capabilities.** That inversion is worth
memorising, and it is why `A & B` (intersection of values) has *all* members of
both: the arithmetic runs the other way.

---

## For unions of object types

```ts
type HttpResult = Success | Failure | TimedOut;
```

| access | verdict |
|---|---|
| `r.body` | **TS2339** — `Failure` has no `body` |
| `r.status` | ok — every member declares it |
| type of `r.status` | `200 \| 400 \| 404 \| 500 \| 0` — the **union of the member's type in each case** |

A common member's type is itself a union. Sets, all the way down. And when that
common member has **literal** types, it becomes a *discriminant* — the basis of
demos 10 and 13.

---

## Unions as whitelists

```ts
normaliseQuery(42)
// TS2345: Argument of type 'number' is not assignable to parameter of type 'Query'
```

A union does two jobs at once:

1. it **restricts** what may be passed in (a whitelist), and
2. it **enumerates** what must be handled inside (a checklist).

Job 2 is the one JavaScript can never do, because it has no artefact that lists
the cases. It is what makes exhaustiveness checking possible at all (demo 10).

---

## The three ways to read from a union

```ts
if ("body" in result) …          // structural: narrow by a declared key
if (result.status === 200) …     // discriminant: narrow by a literal-typed member
if (isSuccess(result)) …         // user-defined predicate (demo 09)
```

Prefer the discriminant when you own the type: it is the most precise, the
cheapest to check at runtime, and the only one that scales to exhaustiveness.

---

## Why writing the union down is the whole point

| question | JavaScript | TypeScript |
|---|---|---|
| what shapes can this be? | read every producer and hope | the union declaration |
| is this operation valid? | find out at runtime | TS2339 / TS2362 at the operator |
| which members are common? | unknowable | the apparent members |
| have I handled every case? | unanswerable | `never` + `assertNever` (demo 10) |
| did a new case appear? | silent `undefined` | build failure at every site, member named |

The last row is where unions pay for themselves. In the `.js-broken` twin, a
fourth response shape added next sprint makes every existing handler return
`undefined` — silently, forever. With the union written down, that same change
breaks the build at every site that pattern-matches, and each error names the
case you have not handled.

---

## Vocabulary

- **Union `A | B`** — a value that is one of them. Capabilities: the
  intersection.
- **Intersection `A & B`** — a value that is both at once. Capabilities: the
  union. `string & number` is `never`: no value is both.
- **Discriminated union** — a union whose members share a literal-typed member
  (`kind`, `status`, `type`) that identifies each one uniquely. Demo 13.
- **Apparent members** — the members the compiler will let you access on a type
  without narrowing.
