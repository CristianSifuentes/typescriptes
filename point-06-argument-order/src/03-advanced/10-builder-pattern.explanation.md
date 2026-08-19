# 10 — Type-state builders: eliminating positions by naming them

**Run it:** `npm run demo:10-builder-pattern`

---

## The idea, and why it belongs in this project

A builder replaces a positional argument list with a chain of **named method
calls**:

```ts
query().from("orders").where("status", "paid").limit(10).offset(20).build();
```

`.limit(10)` cannot be mistaken for `.offset(20)` because they are different
methods — even though both take a `number`.

That last clause is why builders belong here at all:

> **A builder is the only remedy in this project that separates two same-typed
> values without branding them.**

The method name does the job a parameter name could not, because a method name
*is* present at the call site while a parameter name is not.

---

## The three holes a plain-JavaScript builder leaves

| hole | plain JS behaviour |
|---|---|
| **incomplete build** | `build()` runs anyway → `SELECT * FROM undefined WHERE  LIMIT 10` |
| **duplicate step** | `.from("a").from("b")` silently keeps the last |
| **step order** | a step that depends on an earlier one runs on `undefined` — a failure mode the builder *introduces* |

The third is worth dwelling on: a builder converts *argument* order into *step*
order. It is a smaller problem, not no problem.

---

## Type-state closes all three

The builder is generic over the set of steps already taken:

```ts
interface QueryBuilder<Taken extends Step> {
  from(table: string): Omit<QueryBuilder<Taken | "from">, "from">;
  where(f: string, v: string): Omit<QueryBuilder<Taken | "where">, never>;
  limit(rows: number): Omit<QueryBuilder<Taken | "limit">, "limit">;
  offset(rows: number): Omit<QueryBuilder<Taken | "offset">, "offset">;
  build: "from" extends Taken ? ("where" extends Taken ? () => Query : never) : never;
}
```

Each method (a) adds its name to `Taken`, and (b) `Omit`s itself from the
returned view.

### Two different mechanisms, two different diagnostics

Precision matters here, and the evidence lab enforced it:

| attempt | what happens | diagnostic |
|---|---|---|
| `.limit(10).build()` | `build` **is present**, typed `never` → the *call* fails | **TS2349** — `This expression is not callable. Type 'never' has no call signatures.` |
| `.from("a").from("b")` | `Omit` **removed the member** → the *access* fails | **TS2339** — `Property 'from' does not exist on type 'Omit<QueryBuilder<"from">, "from">'.` |

A conditional type collapsing to `never` and an `Omit` removing a key are not
the same thing, and the compiler reports them differently. Saying "`build()`
doesn't exist until you're done" is the memorable version; "`build` is typed
`never` until you're done" is the true one.

### The state machine

| after | `Taken` | `build` | still offered |
|---|---|---|---|
| `queryBuilder()` | `never` | removed by `Omit` | from, where, limit, offset |
| `.from("orders")` | `"from"` | `never` — not callable | where, limit, offset |
| `.where("status","paid")` | `"from" \| "where"` | **`() => Query`** | where, limit, offset |
| `.limit(10)` | `… \| "limit"` | `() => Query` | where, offset |

The API's *shape* is a function of the steps taken. The editor's autocomplete
list shrinks as you type — the type is guiding the call, not merely checking it.

---

## The costs, stated honestly

**(a) The assertion.** `return api as unknown as Omit<QueryBuilder<never>, "build">`
— one double assertion, in the factory. The runtime object is a single mutable
shape while the type system sees a sequence of narrowing views of it, and
nothing checks that the two stories agree. It is the demo-13 hole, deliberately
taken, in one auditable place.

**(b) Type complexity.** `Omit<QueryBuilder<Taken | "limit">, "limit">` is not
beginner-readable, error messages get long, and the compiler does real work at
each step. Weigh that against blast radius: worth it for a library used by
hundreds of call sites, overkill for a helper used twice.

**(c) It is still a sequence.** Type-state fixes steps that have prerequisites;
it does not make ordering disappear the way an options object does.

---

## Choosing between the remedies

| problem | positional | options object | builder + type-state |
|---|---|---|---|
| argument order | silent corruption | eliminated | eliminated |
| **same-typed values** | needs brands | needs brands | **method names suffice** |
| incomplete input | TS2554 | TS2739 | `build` typed `never` (TS2349) |
| duplicate value | n/a | TS1117 duplicate key | member removed from type |
| step prerequisites | n/a | n/a | **encoded in the type** |
| readability | poor | good | **best — reads as prose** |
| cost | none | one interface | **generic type-state machinery** |
