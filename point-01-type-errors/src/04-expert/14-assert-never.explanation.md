# 14 — The exhaustiveness toolkit

**Run it:** `npm run demo:14-assert-never`

Demo 10 introduced `assertNever`. This one builds the family around it and, more
usefully, says *when each member fires*.

---

## What JavaScript can offer, and why each defence fails

| defence | when it fires | what the user sees | who is woken |
|---|---|---|---|
| nothing | never | `undefined` in the UI | nobody |
| `default: throw` | on the first affected request | a 500 | on-call |
| lookup object `{…}` | never (missing key → `undefined`) | an empty notification | nobody |
| a hand-written test | never — it enumerates the cases the author knew | everything above | nobody |
| **a type checker** | **at build time** | nothing — it never shipped | the author, immediately |

`default: throw` is the best of the JavaScript options and it is still a
production incident. The test is the subtlest failure: it stays green forever,
because adding a case to the *system* does not add a case to the *test*.

---

## The toolkit

### 1. `assertNever` — the classic

```ts
function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
```

| position | job |
|---|---|
| parameter `value: never` | the call is legal only where the compiler proved ∅ |
| return type `: never` | tells control-flow analysis the call does not return, so it may sit in `default:` |

Incomplete ⇒ **TS2345**, naming the missing member.

### 2. The non-throwing variant

```ts
function exhaustiveFallback<T>(value: never, fallback: T): T { return fallback; }
```

Identical compile-time guarantee, graceful runtime behaviour. Use it in
renderers and log formatters that must not crash. The choice between the two is
about **failure policy**, not about type safety.

### 3. `Record<Union, T>` — exhaustiveness without a switch

```ts
const TEMPLATES: Record<Channel, string> = { email: …, sms: …, push: … };
```

Missing key ⇒ **TS2741**. And note what indexing yields:

```ts
TEMPLATES["push"]   // string — NOT string | undefined
```

Contrast demo 06: `noUncheckedIndexedAccess` adds `| undefined` for an *array*
index because bounds are unknown, but a `Record<Channel, T>` indexed by a
`Channel` is provably in range. Precision, not pedantry.

### 4. `satisfies` — completeness without losing precision

```ts
const RETRY_POLICY = {
  email: { attempts: 5, backoffMs: 1_000 },
  sms:   { attempts: 2, backoffMs: 5_000 },
  push:  "disabled",
} satisfies Record<Channel, RetryPolicy | "disabled">;

RETRY_POLICY.email.attempts   // number — readable directly
```

With the annotation form (`const RETRY_POLICY: Record<Channel, RetryPolicy |
"disabled"> = {…}`) every member would be typed `RetryPolicy | "disabled"`, and
that access would be **TS2339** until narrowed. `satisfies` verifies conformance
and then gets out of the way — completeness checking with no loss of
information. This is usually the form you want for configuration tables.

### 5. A typed `match` — exhaustiveness as an expression

```ts
const match = <T extends string, R>(
  value: T,
  handlers: { readonly [K in T]: () => R },
): R => handlers[value]();
```

A **mapped type** over the union carries the obligation: omit a handler and the
argument is missing a property (**TS2345 / TS2739**). No `switch`, no `default`,
no `assertNever`.

### 6. `Expect<Equals<A, B>>` — type-only, zero runtime footprint

```ts
type _Covered = Expect<Equals<Channel, "email" | "sms" | "push">>;
```

For asserting that two unions stayed in sync when there is no `default:` branch
to put a call in. Failure is **TS2344**.

---

## Why `assertNever` still throws at runtime

If the compiler proved the branch unreachable, why keep the `throw`?

Because the proof is **conditional on the value having come from inside the type
system** (demo 12). These reach the branch anyway:

- a value from `JSON.parse` / `fetch` / a database, cast with `as`
- an `any` from an untyped dependency
- a caller compiled from JavaScript, or a `.d.ts` that lied
- a union widened at a boundary you do not control

Belt and braces. The demo passes `"fax" as Channel` and the throw fires at the
boundary of the lie, with the offending value in the message — a far better
failure than a silent `undefined`.

---

## Choosing

| situation | tool | diagnostic when incomplete |
|---|---|---|
| branching on a union | `switch` + `assertNever` | TS2345 |
| branching, must not crash | `switch` + `exhaustiveFallback` | TS2345 |
| a static lookup table | `Record<Union, T>` | TS2741 |
| a table whose literals matter | `satisfies Record<Union, T>` | TS2741 |
| an expression, not a statement | `match` + mapped type | TS2345 / TS2739 |
| two unions must stay in sync | `Expect<Equals<A, B>>` | TS2344 |
| JavaScript's best effort | `default: throw` | **none** — runtime only |

Every row but the last converts *"someone will remember to update this"* into
*"the build will not pass until someone does"*. That substitution — human
diligence replaced by a mechanical obligation — is the practical meaning of
Concept #1 over the lifetime of a codebase.
