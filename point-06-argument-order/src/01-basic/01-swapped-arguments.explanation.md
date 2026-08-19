# 01 — The swapped call: the mechanism, dissected

**Run it:** `npm run demo:01-swapped-arguments`
**Files:** `01-swapped-arguments.js-broken.ts` · `01-swapped-arguments.ts-safe.ts` · `_level-01.tsc-error.ts`

---

## The phenomenon in one sentence

A JavaScript call binds arguments to parameters **by position and by nothing
else**, so `createUser("Ada", 25)` and `createUser(25, "Ada")` are the same
operation applied to different values — and TypeScript's contribution is to
check the value at each position against the type declared for that position.

---

## What the compiler actually does

For a call `f(a₀, …, aₙ₋₁)` against a signature `(p₀: T₀, …, pₘ₋₁: Tₘ₋₁) => R`:

1. **Resolve the signature.** For an overloaded function, pick the first
   applicable overload (this matters — see below).
2. **Check arity.** `n` must be within the range the signature accepts.
   Violation ⇒ **TS2554** (fixed arity) or **TS2555** (rest parameter present).
3. **Check each position.** For each `i`, `typeof aᵢ` must be assignable to
   `Tᵢ`. Violation ⇒ **TS2345**.
4. **Type the call expression** as `R`.

The parameter's **name plays no part in step 3**. It supplies the label in the
message and the editor hint. That is not a detail — it is the seed of the blind
spot that the whole rest of this project is about. *If names do not participate
in checking, two parameters with the same type are indistinguishable.*

---

## The detail that surprises everyone

```ts
createUser(25, "Ana");
// error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.
```

**One** diagnostic — for a call with **two** wrong arguments.

For a call with a single (non-overloaded) signature the checker reports the
first mismatching position and stops checking that call. Fixing it reveals the
next.

Two consequences worth internalising:

1. **The compiler never says "these arguments look swapped."** It says
   "position 0 is wrong". The word *swap* is an inference **you** make from the
   message. A swap is not a category the checker knows about; it is two position
   errors that happen to be symmetric, and you only ever see the first.
2. `createUser(25, "Ana")` and `createUser(25, 25)` produce the **same message
   at the same position**. From the diagnostic alone they are indistinguishable
   — one is a swap, the other is just wrong.

(Overloaded functions behave differently: when no overload matches, TypeScript
reports **TS2769** *"No overload matches this call"* and then elaborates each
candidate. Same rule underneath, noisier output.)

---

## Why the JavaScript version is so much worse than "it crashes"

The `.js-broken` twin traces the corruption through five steps. Only the last
one throws:

| step | swapped result | error? |
|---|---|---|
| `createUser(25, "Ana")` | `{ name: 25, age: "Ana" }` | no |
| `user.age + 1` | `"Ana1"` | no |
| `user.age >= 18` | `false` → an adult classified as a minor | no |
| `JSON.stringify(user)` | the corrupt record is persisted | no |
| `user.name.trim()` | **TypeError** | yes — in the display layer |

Two things to notice.

**The crash is in the wrong place.** `renderProfile` is flawless. It was handed
a record corrupted at a call site it has never heard of, possibly in another
service, possibly weeks earlier. The stack trace points at innocent code.

**The record outlived the process.** By the time anything failed, the corrupt
value was already in the database. Every future read of it is wrong, including
reads by code that has not been written yet.

---

## Why this bug profile defeats every other quality practice

| property | why the usual defence fails |
|---|---|
| the call succeeds | no exception ⇒ monitoring sees nothing |
| output is plausible | `{ name: 25, age: "Ana" }` looks like a record |
| **both calls look right** | `f(a, b)` and `f(b, a)` have no visual difference ⇒ review sees nothing |
| corruption is persisted | the bad value outlives the request that made it |
| the crash is elsewhere | the stack trace blames correct code |

The third row is the decisive one. A misspelled property *looks* wrong on the
page. A swapped argument does not. There is no cue for a reviewer to catch, so
the only defence that works is one that runs **before** the code does.

---

## Reference

| defect | JavaScript | when found | TypeScript | code |
|---|---|---|---|---|
| swap of differently-typed arguments | silent corruption | never (until a crash elsewhere) | rejected at the argument | **TS2345** |
| too few arguments | binds `undefined` | never | rejected | **TS2554** / **TS2555** |
| too many arguments | collected, ignored | never | rejected | **TS2554** |
| no overload matches | silent corruption | never | rejected | **TS2769** |

---

## The limit, stated up front

Everything above worked because `string` and `number` **disagree**. Change the
signature to

```ts
aspectRatio(width: number, height: number)
```

and every guarantee on this page evaporates. That is demo 04, and it is the
reason this project has three more levels.
