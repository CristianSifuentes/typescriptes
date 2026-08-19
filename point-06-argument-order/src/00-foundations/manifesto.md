# Foundations — the physics of Concept #6

> **Concept #6.** In JavaScript, passing arguments in the wrong order runs
> silently and corrupts logic downstream. TypeScript checks each argument's type
> against the parameter in that exact position, catching swaps at compile time —
> and, when parameters share a primitive type, branded/nominal types make even
> same-typed swaps impossible.

Four questions must be answered precisely before any demo. Everything else in
this project follows from these four answers — including, importantly, the
project's central admission: **positional checking alone catches only half the
problem.**

---

## 1. What is positional argument binding, and how does TypeScript check it?

### The runtime half: what JavaScript does

A JavaScript call binds arguments to parameters **by position, and by nothing
else**. Parameter *names* are local variable names inside the function body;
they have no existence at the call site. The specification's
`FunctionDeclarationInstantiation` walks the parameter list in order and binds
the argument at the same index, filling missing positions with `undefined` and
collecting surplus ones into `arguments`.

Three consequences, and all three are load-bearing:

1. `createUser("Ada", 25)` and `createUser(25, "Ada")` are the **same
   operation** applied to different values. Neither is more legal than the other.
2. There is no runtime check of any kind. A swap is not "an error that
   JavaScript fails to report" — it is *not an error at all*, at the language
   level.
3. Therefore the corruption is entirely **downstream**. The call succeeds; what
   breaks is whatever the function does with the values, possibly much later,
   possibly never visibly.

### The compile-time half: what TypeScript adds

TypeScript adds one rule, applied at every call site:

> For a call `f(a₀, …, aₙ₋₁)` against a signature `(p₀: T₀, …, pₘ₋₁: Tₘ₋₁) => R`,
> the type of `aᵢ` must be **assignable to** `Tᵢ`, for every `i`.

That is the whole mechanism. Argument *i* is checked against parameter *i*, and
the parameter's *name* plays no part in the check — it only supplies the label
in the error message and the editor hint.

Failure produces:

```
error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.
```

### One detail that surprises almost everyone

A call with **two** wrong arguments produces **one** diagnostic. For a call with
a single (non-overloaded) signature, the checker reports the first mismatching
position and stops checking that call; fixing it reveals the next.

So the compiler never says *"these arguments look swapped."* It says
*"position 0 is wrong."* The word "swap" is an inference **you** make from the
message. The compiler is reporting positions, and the fact that a swap happens
to produce two symmetric position errors is a coincidence of your bug, not a
category the compiler knows about.

---

## 2. Why can structural typing catch a *differently*-typed swap but not a
*same*-typed one?

Because assignability compares **types**, and a swap of two same-typed
parameters produces no type disagreement to find.

Consider the two cases side by side:

| call | position 0 | position 1 | verdict |
|---|---|---|---|
| `createUser(25, "Ada")` | `number` → `string` ✗ | `string` → `number` ✗ | **TS2345** |
| `aspectRatio(10, 3)` | `number` → `number` ✓ | `number` → `number` ✓ | **accepted** |

In the second row the types agree perfectly. What differs is the *meaning* of
the two positions — width versus height — and meaning is not part of a type in
a **structurally typed** system.

> **Structural typing**: two types are compatible when their *shapes* are
> compatible. A type's identity is its structure, not its declared name.

`width: number` and `height: number` have identical structure. To TypeScript
they are the same type. They are the same type *because that is what `number`
means*: the set of all IEEE-754 doubles, with no further distinction. The
compiler is not failing to notice something; there is genuinely nothing to
notice, given the types you wrote.

This is why the blind spot is not a bug to be fixed in a future release. It is
a direct consequence of the type-identity rule, and the only way out is to stop
writing two parameters of the same type — which is exactly what level 03 does.

### How wide is the gap?

For a function with *n* parameters all of the same type, there are *n!*
orderings and the compiler accepts **all** of them. A four-parameter
`cropTo(x, y, width, height)` has 24 orderings, 23 of them wrong, none of them
reported.

---

## 3. What is nominal typing, and how do branded types simulate it?

> **Nominal typing**: two types are compatible only when they were *declared*
> to be — identity comes from the name, not the shape. C's `typedef`-with-struct,
> Java's classes, Rust's newtypes, and Haskell's `newtype` are nominal.

TypeScript is structural by design, and that design is right for describing
JavaScript, which has no nominal type information at runtime either. But
structural typing gives us the blind spot above, so we need a way to buy
nominality **locally**, for the specific parameters where shape is not enough.

The technique is a **branded type** (also: *tagged*, *opaque*, or *phantom*
type):

```ts
declare const brand: unique symbol;
type Brand<T, K extends string> = T & { readonly [brand]: K };

type Width  = Brand<number, "Width">;
type Height = Brand<number, "Height">;
```

`Width` is `number` intersected with an object carrying a **phantom member** —
a member that exists only in the type world and is never present on the value.
`Width` and `Height` now differ structurally (their `[brand]` members have
different literal types), so they are mutually unassignable:

```
error TS2345: Argument of type 'Height' is not assignable to parameter of type 'Width'.
  Type 'Height' is not assignable to type '{ readonly [brand]: "Width"; }'.
    Types of property '[brand]' are incompatible.
      Type '"Height"' is not assignable to type '"Width"'.
```

Read that elaboration chain: it shows the whole trick. We did not add a nominal
type system. We **encoded nominality structurally**, by giving each type a
structure nothing else can accidentally have.

Three properties worth stating precisely:

1. **Zero runtime cost.** The brand is erased with everything else. A `Width`
   *is* a `number` at runtime — you can do arithmetic on it, log it, serialise
   it. Run `npm run erasure` to watch the brand vanish from the emitted file.
2. **Values must be created deliberately.** Since no expression naturally has
   type `Width`, brands need a **smart constructor** — a function that validates
   a raw value and returns the branded type. The one `as` assertion in the
   codebase lives inside that constructor, where it can be tested.
3. **`unique symbol` over a string key.** Using a symbol declared `unique symbol`
   makes the phantom member impossible to write by hand from outside the module,
   so nobody can forge a branded value with an object literal.

The cost is real: raw literals no longer type-check, and every value needs
constructing. Level 04 weighs that cost against options objects and builders.

---

## 4. Why does closing this gap eliminate a *class* of bugs?

Because argument-order defects share a signature that makes them uniquely
resistant to every other quality practice:

| property | consequence |
|---|---|
| **No exception** | no stack trace, no alert, no error budget consumed |
| **Plausible output** | a ratio of 0.3 instead of 3.33 looks like a number |
| **Type-correct** | code review sees two `number`s going into two `number`s |
| **Symmetric** | the swapped call is *textually indistinguishable* from the right one |
| **Latent** | the bug is discovered by an auditor, a customer, or never |

The last two matter most. A misspelled property looks wrong on the page;
`transfer(payee, payer, amount)` looks *exactly* as right as
`transfer(payer, payee, amount)`. There is no visual cue, so review does not
catch it, and there is no crash, so monitoring does not catch it. A test catches
it only if someone thought to assert the *direction* — which is precisely the
thing they got wrong when writing the code.

Branding converts this from a matter of attention into a matter of arithmetic:

- Before: `transfer(a, b, n)` and `transfer(b, a, n)` are both well-typed. The
  correctness of every call site depends on a human reading two identical-looking
  identifiers in the right order, forever, including in code written next year
  by someone who has never seen the function.
- After: `transfer(b, a, n)` does not compile. Not "is flagged by a linter",
  not "is caught by a test if one exists" — **does not compile**, at every call
  site that exists and every one that ever will.

That is the same shape of win as every other point in this series: a property
that depended on continuous human diligence becomes a mechanical obligation
discharged by the build.

### And the honest boundary

Branding protects **typed, branded call sites**. It does not protect:

- values crossing the I/O boundary (`any` from `JSON.parse`, a database row);
- call sites using `as`, `!`, or `any` (a double assertion launders any brand);
- dynamic invocation (`Function.prototype.apply` on a value typed `Function`,
  `eval`, a spread of `any[]`);
- **two parameters that genuinely should share a type** — `max(a: number, b: number)`
  is commutative and branding it would be noise.

Level 04 dissects each of these. The design question is never "should everything
be branded?" but "which of these positions, if swapped, would be silent *and*
expensive?" Brand those.
