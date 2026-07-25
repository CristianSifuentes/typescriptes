# 11 — The type environment: the compiler's mental model

**Run it:** `npm run demo:11-type-environment`

---

## Γ, and what a typing judgement is

The type environment (written **Γ**, "gamma") is a mapping from names to types,
threaded through the program. The central object of type theory is the
*judgement*:

```
Γ ⊢ e : T          "under environment Γ, expression e has type T"
```

Type checking is the mechanical derivation of such judgements for every
expression, using rules of the form "if these premises hold, this conclusion
follows". For example, the rule for `+`:

```
Γ ⊢ a : number    Γ ⊢ b : number
────────────────────────────────
        Γ ⊢ a + b : number
```

When no rule applies, you get a diagnostic. `"5" - 3` has no derivation, so
TS2362 is what the compiler says instead of a conclusion.

---

## TypeScript maintains four environments, not one

Confusing them causes most "why does it think that?" questions.

| environment | what it maps | example |
|---|---|---|
| **value space** | names → values | `const x = 1`, `function f() {}` |
| **type space** | names → types | `type X = …`, `interface Y {}` |
| **namespace space** | names → containers of both | `namespace N {}`, a module |
| **flow state** | *references* → narrowed types at each CFG node | demo 07 |

Which space you are writing in is determined by *position*, not spelling. This
is why `typeof` means two different things:

```ts
const t1 = typeof cart;      // VALUE position → the runtime operator, returns a string
type   T2 = typeof cart;     // TYPE  position → the type QUERY operator, returns Cart
```

Two operators, one spelling.

### Which declarations inhabit which space

| declaration | value space | type space | survives emit? |
|---|---|---|---|
| `const` / `let` / `var` | yes | no | yes |
| `function` | yes | no | yes |
| `class` | yes (constructor) | yes (instance type) | yes |
| `interface` | no | yes | **no** |
| `type` alias | no | yes | **no** |
| `enum` | yes | yes | yes — banned by `erasableSyntaxOnly` |
| `namespace` | yes | yes | yes — likewise banned |

The last two rows are why this project sets `erasableSyntaxOnly`. A constructor
parameter property is in the same category:

```ts
class Cart { constructor(readonly lines: Money[]) {} }
// error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
```

It emits `this.lines = lines`, so it is not pure erasure. The flag turns
"compilation is erasure" from a slogan into a machine-checked invariant.

---

## Inference: widening, freshness, and context

### Widening

A literal expression gets a **fresh literal type**, which is widened to its base
type when the location it flows into can change:

```ts
const a = "coupon";                    // "coupon"  — a const cannot change
let   b = "coupon";                    // string    — a let can
const c = { kind: "percent" };         // { kind: string } — the member is mutable
const d = { kind: "percent" } as const // { readonly kind: "percent" }
```

`as const` is precisely the instruction "this structure is frozen, keep the
literal types". It is what makes discriminated unions (demo 13) and exhaustive
`as const` arrays convenient to write.

### Contextual typing

Inference is **bidirectional**, not merely bottom-up:

```ts
const handlers: Record<string, (amount: Money) => number> = {
  double: (m) => m.cents * 2,     // `m` is Money — the type flowed IN
};
```

Bottom-up: the type of `1 + 1` comes from its operands.
Top-down (contextual): a callback's parameter types come from the position it
is written in. `noImplicitAny` stays quiet here because the context supplied the
type — which is why "annotate everything" is bad advice: annotate *boundaries*,
and let context do the rest.

---

## Runtime environment versus type environment

| question | JavaScript answers by… | TypeScript answers by… |
|---|---|---|
| what type is `x` here? | running the program | consulting Γ at that node |
| what shapes can `x` have? | reading every assignment | the declared union |
| is this member present? | running it | member resolution |
| **for which inputs?** | **the one you ran** | **all of them** |
| how long does it take? | as long as the program runs | milliseconds, no execution |

The fourth row is the whole argument. `console.log(typeof x)` answers for one
execution; Γ answers for the program.

---

## Reading a diagnostic as a failed derivation

Once you hold this model, error messages stop being oracular:

- **TS2322 `Type 'X' is not assignable to type 'Y'`** — the assignability
  premise failed. Ask: what did Γ say the source was, and why?
- **TS2339 `Property 'p' does not exist on type 'T'`** — member resolution
  against the *apparent type* found nothing. Ask: is `T` what I think it is at
  this node, or did narrowing change it?
- **TS2345 `Argument of type 'X' is not assignable to parameter of type 'never'`**
  — the flow state at that node is ∅. Ask: which union member did I not handle?

Every message names the two types it compared. Reading them as Γ's opinion,
rather than as an obstacle, is the difference between fighting the compiler and
using it.
