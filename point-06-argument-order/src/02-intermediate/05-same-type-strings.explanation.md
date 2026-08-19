# 05 — Two strings: the same blind spot, worse consequences

**Run it:** `npm run demo:05-same-type-strings`

---

## The same mechanism, a different kind of damage

Demo 04 established that `number ↔ number` swaps are invisible to the compiler.
`string ↔ string` is the identical mechanism, but the consequence differs in a
way worth naming:

> A swapped **number** gives you a wrong *value*.
> A swapped **identifier** gives you the right *action* performed on the wrong
> *entity*.

```ts
fullName("Lovelace", "Ada")                  // "Ada, Lovelace" — visibly wrong
transfer(ledger, payee, payer, 12_950)       // money moves backwards — invisibly wrong
```

---

## Why the money case defeats every defence

| defence | why it fails on a swapped `transfer` |
|---|---|
| the type checker | both parameters are `string` — nothing to compare |
| code review | `transfer(a, b, n)` and `transfer(b, a, n)` look identical |
| a unit test | catches it only if it asserts the **direction** explicitly |
| monitoring | no exception, no latency spike, no error-rate change |
| ledger invariants | **the totals still balance** — the money went somewhere real |
| the customer | eventually. This is the actual detection mechanism. |

The fifth row is the one people miss. Double-entry invariants do not help,
because a reversed transfer is still a well-formed transfer. Nothing is missing;
it is merely pointing the wrong way.

The last row is not a joke. For same-typed identifier swaps, the customer *is*
the error-detection system.

---

## The distinction that drives level 03

Two `string` parameters may be:

- **(a) genuinely interchangeable** — `join(a: string, b: string)`;
- **(b) semantically distinct** — `transfer(from: string, to: string)`.

TypeScript treats both identically, because in both cases the type is `string`.
You know which is which; the compiler cannot, until you tell it.

| signature | interchangeable? | brand it? |
|---|---|---|
| `max(a: number, b: number)` | yes — commutative | no, it would be noise |
| `join(a: string, b: string)` | no, but visibly wrong | probably not |
| `fullName(first, last)` | no — visibly wrong output | maybe |
| `aspectRatio(width, height)` | **no — silently wrong number** | **yes** |
| `transfer(from, to, amount)` | **no — silently wrong direction** | **yes** |
| `dateRange(start, end)` | **no — silently negative duration** | **yes** |

The design question is never *"should everything be branded?"*. It is:

> **Would a swap here be silent, and would it be expensive?**

Brand the rows where both answers are yes. Demo 14 turns this into a decision
procedure.

---

## The edge of the blind spot, again

```ts
transfer(ledger, "acct-payer", "acct-payee", "a lot")
// error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
```

Position 3 is still checked, because `number` and `string` still differ. The gap
is *"same type, different meaning"* — not *"calls are unchecked"*. Keeping that
distinction sharp is the difference between using the type system well and
distrusting it generally.
