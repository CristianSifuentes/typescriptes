# 03 — Truthy/falsy coercion: `ToBoolean` and the limit of what typing can fix

**Run it:** `npm run demo:03-truthy-falsy`

---

## The JavaScript side: `ToBoolean`, a fixed list of eight

Every `if`, `while`, ternary, and `&&`/`||` short-circuit runs
`ToBoolean(argument)`. Its definition is not a heuristic — it is a literal
enumeration:

```
ToBoolean(argument):
  if argument is one of: false, 0, -0, 0n, NaN, "", null, undefined
    return false
  return true       -- includes EVERY object: [], {}, new Boolean(false), ...
```

Eight values are falsy. Every object — including an empty array, an empty
plain object, and a boxed `new Boolean(false)` — is truthy, because
`ToBoolean` inspects the *value's membership in the list*, never an object's
contents.

The bug this produces is structural: three of the eight falsy values
(`0`, `""`, `NaN`) are **ordinary, legitimate data**, not "absence" markers.
`itemsInStock || fallback` cannot distinguish *"itemsInStock is 0, a
real empty shelf"* from *"itemsInStock was never set"* — both take the same
branch, because both are falsy.

---

## The TypeScript side: a genuinely partial fix, stated honestly

This is the first demo in the series where the honest answer is **"TypeScript
does not fully solve this."** What it does:

1. **`strictNullChecks`** turns "this value might be absent" from a silent
   runtime fact into a mandatory, visible union member
   (`number | undefined`). You cannot forget the possibility exists — the
   compiler will not let a bare `number` stand in for it.
2. **`??` is a distinct operator** from `||`, defined only in terms of
   `null`/`undefined` (`IsNullOrUndefined`, not `ToBoolean`). Choosing `??`
   over `||` is how you tell the compiler — and future readers — "only
   absence should trigger the fallback, not falsiness in general."
3. **Comparisons with no possible overlap are rejected** (TS2367), because
   *that* is a genuine type fact: a `string` can never equal `false`, so a
   condition claiming otherwise is provably dead code or a typo.

What it does **not** do: reject `itemsInStock || fallback` outright, because
`||` between `number | undefined` and `string` is completely legal
TypeScript — every operand is well-typed. The mistake is in *which fallback
operator the author reached for*, and that is a decision about business
meaning a type system has no access to. This is the same category boundary
`point-01-type-errors` draws with `[10, 9, 100].sort()`: **a type checker
catches type errors, not logic errors**, and truthiness-driven control flow
sits mostly on the logic side of that line.

```
error TS2367: This comparison appears to be unintentional because the types
              'string' and 'boolean' have no overlap.
```

---

## Comparison table

| Case | `\|\|` | `??` | TypeScript verdict |
|---|---|---|---|
| `0 \|\| "unset"` | `"unset"` (bug) | n/a | no error either way — same static type |
| `0 ?? "unset"` | n/a | `0` (correct) | no error — `??` only checks null/undefined |
| `"" \|\| "empty note"` | `"empty note"` (bug) | n/a | no error |
| `orderNote === false` (orderNote: `string`) | — | — | **TS2367** |
| `discountPercent > 0` where value is `NaN` | `false` (accidental correctness) | — | no error — `NaN` has type `number` |

---

## Where this demo admits a limit — the central lesson

TypeScript's truthiness-related guarantee is **entirely about
`null`/`undefined`**. The other six falsy values (`0`, `-0`, `0n`, `NaN`,
`""`, `false`) remain exactly as ambiguous as they are in plain JavaScript,
because none of them has a corresponding literal-exclusion type
(`number & NotZero` does not exist; neither does `string & NotEmpty`). The
fix is not a compiler flag — it is a naming and operator discipline: prefer
`??` to `||` for "value or default", and prefer an explicit, named condition
(`items.length === 0`, `Number.isFinite(x)`) to bare truthiness whenever zero,
empty string, or `NaN` are valid data in your domain.

---

## Verify

```bash
npm run evidence            # see TS2367 emitted for real
npm run demo:03-truthy-falsy
```
