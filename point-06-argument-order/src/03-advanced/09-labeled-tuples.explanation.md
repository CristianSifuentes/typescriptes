# 09 — Labeled tuples: positions as a type, labels as documentation

**Run it:** `npm run demo:09-labeled-tuples`

---

## Why argument lists become arrays

The moment you store an argument list in a variable — to forward it, to log it,
to retry with it — it becomes an array, and an array's ordering is even less
visible than a call site's:

```js
const args = ["r-1", checkOut, checkIn, 2];   // built here
withRetry(bookRoom, args);                     // applied there
```

The two halves of an ordering bug can live in different files, written by
different people, months apart. There is no function name next to the array
literal to hint at what each slot means.

---

## What a tuple buys

```ts
type BookingArgs = [roomId: string, checkIn: Date, checkOut: Date, guests: number];
```

| property | plain array | tuple |
|---|---|---|
| fixed length | no | **yes** — TS2741 for a short literal |
| type per position | no | **yes** — TS2322 for a wrong slot |
| forwards generically | as `any[]` | **yes** |

And the checks happen **where the array is built**, which in the JavaScript twin
was a different file from the call. The tuple type carries the contract across
that boundary.

> **A note on `readonly`.** *Spreading* a `readonly` tuple into a rest parameter
> is fine. *Assigning* one to a mutable tuple is **TS4104** — and that is what a
> generic forwarding helper does: `withRetry<A>(fn: (...args: A) => R, args: A)`
> infers `A` from the callee's rest parameter as a **mutable** tuple, so a
> `readonly` `args` fails:
>
> ```
> error TS4104: The type 'readonly [start: Date, end: Date]' is 'readonly'
>               and cannot be assigned to the mutable type '[start: Date, end: Date]'.
> ```
>
> Declare argument tuples mutable; declare data tuples `readonly`. (Both halves
> of that were checked in the evidence lab — the first draft of this note
> claimed the *spread* failed, and it does not.)

---

## What the labels do NOT buy

This is the point of the demo, and it is widely misunderstood:

```ts
type LabelledOneWay   = readonly [start: Date, end: Date];
type LabelledOtherWay = readonly [end: Date, start: Date];
type _Proof = Expect<Equals<LabelledOneWay, LabelledOtherWay>>;   // COMPILES
```

Two tuple types with the same element types in the same order and **different
labels are the same type**. Labels affect editor hints and destructuring names.
They add exactly zero safety.

So where two positions share a type, a labeled tuple leaves you in the level-02
blind spot:

```ts
const reversed: BookingArgs = ["r-1", checkOut, checkIn, 2];
bookRoom(...reversed);   // nights: -4. Compiled without complaint.
```

Labels did not help, and were never going to.

---

## The combination that works

Brand the elements whose positions share a type:

```ts
type SafeBookingArgs = [roomId: string, checkIn: CheckIn, checkOut: CheckOut, guests: number];
```

```
error TS2322: Type 'CheckOut' is not assignable to type 'CheckIn'.
```

Two details in that diagnostic are worth noticing:

- **TS2322, not TS2345** — what is being checked is an *array literal* against a
  tuple type, not arguments against parameters.
- **Both bad elements are reported.** Element-wise checking of a literal does not
  stop at the first failure the way argument checking does.

> **Labels fix the readability of the positions; brands fix the checking of
> them.** Different jobs, and you usually want both.

---

## Where labeled tuples actually earn their keep

Rarely for declaring an ordinary function — parameters already have names. Their
real home is **generic forwarding**, where a helper must accept and re-apply
someone else's argument list without flattening it to `any[]`:

```ts
const withRetry = <A extends readonly unknown[], R>(
  fn: (...args: A) => R,
  args: A,
  attempts = 2,
): R => { … };
```

`A extends readonly unknown[]` captures the callee's parameter list as a tuple,
so the helper stays fully typed — including the brands:

```ts
withRetry(bookRoomSafe, ["r-1", from, to, 2]);
// error TS2345: Type 'Date' is not assignable to type 'CheckIn'.
```

This is the pattern behind `Parameters<T>`, `bind`, and every typed middleware
or decorator you will write.

---

## Summary

| property | plain array | tuple | labeled tuple | labeled + branded |
|---|---|---|---|---|
| fixed length | no | yes | yes | yes |
| type per position | no | yes | yes | yes |
| readable slots | no | no | **yes** | yes |
| catches same-typed swap | no | no | **no** | **yes** |
| forwards generically | as `any[]` | yes | yes | yes |

Rows 3 and 4 are the whole lesson.
