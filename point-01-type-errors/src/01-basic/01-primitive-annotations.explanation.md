# 01 — Primitive annotations: the mechanism, dissected

**Run it:** `npm run demo:01-primitives`
**Files:** `01-primitive-annotations.js-broken.ts` · `01-primitive-annotations.ts-safe.ts` · `_level-01.tsc-error.ts`

---

## The phenomenon in one sentence

A primitive annotation converts an *assignment* from an unchecked memory write
into a **proof obligation** that the compiler discharges at every assignment
site, for every possible execution.

---

## What the compiler actually does, step by step

Take the offending line:

```ts
const shippingFee: number = "12";
```

1. **Parse.** The checker builds a syntax tree. The declaration node carries a
   *type annotation node* (`number`) and an *initialiser node* (`"12"`).
2. **Resolve the declared type.** `number` resolves to the intrinsic type
   `numberType` — an object in the checker with `flags = TypeFlags.Number`.
3. **Infer the type of the initialiser.** The string literal `"12"` gets the
   *fresh literal type* `"12"`, whose base type is `string`.
4. **Check assignability**: is `"12"` assignable to `number`? The checker runs
   `isTypeAssignableTo(source, target)`, which for two primitives reduces to a
   flag comparison: `TypeFlags.StringLiteral` is not related to
   `TypeFlags.Number`.
5. **Emit a diagnostic** at the initialiser's source position:

   ```
   error TS2322: Type 'string' is not assignable to type 'number'.
   ```

Note step 5's position: the error is attached to *the expression that is
wrong*, not to the place where the wrongness eventually explodes. This is the
whole ergonomic advantage. In JavaScript the same defect surfaces at
`subtotal.toFixed(2)` — a line that is entirely correct.

---

## Why "assignable" and not "equal"

Assignability is the compiler's formalisation of *substitutability*: `S` is
assignable to `T` when every value described by `S` is acceptable wherever a
`T` is expected. Under the set-theoretic reading of types
(`00-foundations/manifesto.md` §3) this is subset inclusion:

| Relation | Set reading | Verdict |
|---|---|---|
| `"12"` → `string` | `{ "12" } ⊆ string` | allowed (widening) |
| `"12"` → `number` | `{ "12" } ∩ number = ∅` | **TS2322** |
| `number` → `string` | disjoint | **TS2322** |
| `1 \| 2` → `number` | `{1,2} ⊆ number` | allowed |
| `number` → `1 \| 2` | not a subset | **TS2322** |

---

## The four bugs, and the four mechanisms that catch them

| # | JavaScript defect | Runtime symptom | Compiler mechanism | Diagnostic |
|---|---|---|---|---|
| 1 | `100 + "12"` | `"10012"` — string concatenation | assignability check on the annotated binding | TS2322 |
| 2 | `112 * "8.25%"` | `NaN`, then infinite propagation | operand-type check for arithmetic operators | TS2363 |
| 3 | `if ("false")` | truthy — the branch inverts | assignability against `boolean` | TS2322 |
| 4 | `"10012".toFixed(2)` | `TypeError` | static member lookup on `String` | TS2551 |

> **Why TS2551 and not TS2339 for bug 4?** Both mean "this property does not
> exist", but TS2551 is emitted when the checker finds a *near-miss* member and
> can suggest it. Here it proposes `String.prototype.fixed` (a real, legacy
> HTML-wrapping method), producing:
>
> ```
> error TS2551: Property 'toFixed' does not exist on type '"10012"'. Did you mean 'fixed'?
> ```
>
> Note also that the receiver is reported as the **literal type** `"10012"`,
> not `string`. The compiler tracked the exact value, not merely its kind.

### Bug 2 deserves its own paragraph

`+` in JavaScript is two operators wearing one costume: numeric addition and
string concatenation, disambiguated *at runtime* by the operand types. Every
other arithmetic operator (`-`, `*`, `/`, `%`, `**`) has only the numeric
meaning and therefore coerces its operands with `ToNumber`.

That asymmetry produces the classic:

```js
"5" - 3   // 2      — coercion succeeds, silent
"5" + 3   // "53"   — concatenation, silent
"5" * "a" // NaN    — coercion fails, silent
```

TypeScript's rule is stated in the checker as: for `-`, `*`, `/`, `%`, `**`,
both operands must be of type `any`, `number`, `bigint`, or an enum. For `+`,
the result is `string` if either operand is `string`, `number` if both are
numeric, and an error otherwise. Demo 02 is dedicated entirely to this operator.

### Why `NaN` is uniquely dangerous

`NaN` is a `number`. It satisfies every type annotation that `42` satisfies.
The type system cannot exclude it — *types constrain the kind of a value, not
its content*. What TypeScript does instead is prevent `NaN` from being
**created** by an illegal operation. Once a `NaN` exists (from
`Number.parseFloat("abc")`, `0/0`, or JSON), only a runtime check removes it,
which is exactly what `parseCheckoutInput` does in the safe version:

```ts
if (!Number.isFinite(taxRate)) throw new RangeError(...);
```

This is the boundary discipline that levels 03 and 04 formalise: **types are
enforced inside your program; the border needs guards.**

---

## Why `@ts-expect-error` and not `@ts-ignore`

| Directive | If the line errors | If the line stops erroring |
|---|---|---|
| `@ts-ignore` | silently suppressed | silently suppressed — rot is invisible |
| `@ts-expect-error` | suppressed | **TS2578: Unused '@ts-expect-error' directive** |

`@ts-expect-error` is an assertion that an error *exists*. That makes the safe
file a live regression test of the compiler: if a future TypeScript release
started accepting `const x: number = "12"`, this project would fail to build,
loudly. A teaching project that used `@ts-ignore` would quietly become fiction.

---

## Verify it yourself

```bash
npm run evidence      # real, unsuppressed tsc output with TSxxxx codes
npm run demo:01-primitives
```

The `.tsc-error.ts` fixture is excluded from the main build precisely so that
its errors stay *unsuppressed* — the evidence lab is the only place in this
project where the compiler is allowed to fail.
