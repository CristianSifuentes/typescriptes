# 15 — Decidability, budgets, and why the compiler cannot check everything

**Run it:** `npm run demo:15-decidability-limits`

---

## The theorem behind the whole subject

**Rice's theorem.** Every non-trivial *semantic* property of programs in a
Turing-complete language is undecidable. "This program never applies an
operation to a value that does not support it" is exactly such a property.

So no checker can be simultaneously:

| | | |
|---|---|---|
| **sound** | accepts only correct programs | no false negatives |
| **complete** | accepts every correct program | no false positives |
| **decidable** | always terminates | no hangs |

Pick two:

| choice | consequence | examples |
|---|---|---|
| sound + decidable | incomplete — rejects some correct programs | ML, Haskell, Rust (plus escape hatches) |
| complete + decidable | **unsound** — accepts some incorrect programs | **TypeScript**, by explicit design |
| sound + complete | undecidable — may never terminate | dependent types, program verification |

TypeScript's position is a deliberate choice, not a defect. Its stated non-goal
is "apply a sound or 'provably correct' type system"; its stated goal is to type
idiomatic JavaScript. Demo 12 enumerates exactly what that costs.

---

## TypeScript's type system is itself Turing-complete

Conditional types + recursion + mapped types can express arbitrary computation.
People have implemented Turing machines, SQL parsers, and sudoku solvers in the
type system. The demo runs two small ones:

```ts
type Add<A extends number, B extends number> =
  [...BuildTuple<A>, ...BuildTuple<B>]["length"];

type Split<S extends string, D extends string> =
  S extends `${infer H}${D}${infer T}` ? [H, ...Split<T, D>] : [S];

const twelve: Add<7, 5> = 12;                 // computed by tsc
const parts: Split<"a,b,c", ","> = ["a","b","c"];  // parsed by tsc
```

No JavaScript performed that addition or that parse. The **compiler** did, while
checking the file, and then erased every trace of it.

Which raises the obvious question: if the type system can compute anything, what
stops `tsc` from computing forever?

---

## The budgets

Nothing, except hard limits — and a diagnostic when one is hit:

```
error TS2589: Type instantiation is excessively deep and possibly infinite.
```

| budget | approximate limit | protects against |
|---|---|---|
| instantiation depth | 100 nested instantiations | runaway generic expansion |
| instantiation count | ~5 000 000 per check | exponential blow-up |
| tail-recursive conditional types | 1 000 iterations | type-level infinite loops |
| type relation depth | ~100 | cyclic structural comparison |
| union member count | ~100 000 | combinatorial explosion of distributed unions |

These are **heuristics, not theorems**. They are tuned so realistic programs
pass and pathological ones stop. A different budget would accept different
programs — which tells you the checker's accept/reject boundary is partly an
engineering decision, not purely a mathematical one.

TS2589 is therefore not a bug report about your code. It is the compiler saying
*"I ran out of budget on a question that may not terminate."*

---

## The three obstacles, and TypeScript's answer to each

### (a) The value depends on the outside world

```ts
const v: string | number = Date.now() % 2 === 0 ? "42" : 42;
```

No analysis can know which branch ran. TypeScript's answer is not to guess but
to **carry both possibilities** — that is precisely what a union *is* — and
require you to discriminate before use. Guessing is how you get an unsound
checker; carrying both is how you get a union type.

### (b) Reachability reduces to the halting problem

"Is this line reachable?" is undecidable in general. TypeScript
**over-approximates**: it assumes more code is reachable than may actually be
and type-checks it anyway. Over-approximating is the safe direction — it can
only cause false positives, never false negatives.

The exception is the narrow, decidable fragment it *can* settle: narrowing to
`never` (demo 10) is a genuine reachability proof, but only over the finite
lattice of declared union members — never over arbitrary arithmetic.

### (c) The program does not exist until it runs

`eval`, `new Function`, and dynamic member names produce code no static analysis
can see. TypeScript's answer is `any` — an admission, made explicit. Note that
the demo needs an `as` to use the result: an unverified claim, exactly the hole
from demo 12.

---

## Practical consequences of a Turing-complete checker

| symptom | cause | mitigation |
|---|---|---|
| slow builds / laggy editor | type-level computation is real computation | simplify types; `tsc --generateTrace` |
| TS2589 inside library types | deep conditional recursion | raise the base case; pass explicit type arguments |
| `skipLibCheck: true` everywhere | checking all `.d.ts` is expensive | accepted trade — but it hides real errors |
| an inference that "should" work | the checker is incomplete | annotate explicitly and move on |
| union blow-up in a mapped type | distribution is combinatorial | constrain the union; avoid distribution |

The fourth row deserves emphasis: when the compiler refuses something you know
is correct, you are meeting **incompleteness**, not stupidity. Annotate and
continue; do not spend an afternoon proving a point to a machine that is
provably unable to concede it.

---

## The takeaway

TypeScript is not "unsound because it is sloppy". It sits at a deliberately
chosen point in a space where perfection is provably unavailable: it accepts
idiomatic JavaScript, terminates quickly, and gives up soundness in a small set
of documented places.

Concept #1 — *"type errors that JavaScript surfaces only at runtime are caught
by TypeScript at compile time"* — is therefore **true, load-bearing, and
bounded**. The bounds are not a disappointment. They are the reason the tool is
usable at all.
