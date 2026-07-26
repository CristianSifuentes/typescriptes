# 02 — `-`, `*`, `/`: unconditional `ToNumber`, and the silence of `NaN`

**Run it:** `npm run demo:02-arithmetic-coercion`

---

## The JavaScript side: one algorithm, no exceptions raised

Every arithmetic operator other than `+` is defined by the spec to convert
**both** operands with `ToNumeric` (which is `ToNumber`, widened to also
accept `bigint`) and then compute — unconditionally, regardless of the
original types:

```
"5" - 3    → ToNumber("5")=5, ToNumber(3)=3   → 5 - 3   = 2
"abc" * 2  → ToNumber("abc")=NaN, ToNumber(2)=2 → NaN * 2 = NaN
```

The critical fact is in `ToNumber`'s own definition: **it never throws**. A
string that cannot be parsed as a numeric literal becomes `NaN` — a valid
`number` value, not an error. `NaN` is then absorbing:
`NaN op x` is `NaN` for every arithmetic operator and every `x`, so one bad
input silently poisons every computation downstream of it, at any distance,
through any number of additions, multiplications, or `.reduce()` calls.

`ToNumber` on other primitives, for reference:

| input | `ToNumber` | note |
|---|---|---|
| `null` | `0` | deliberate, specific rule |
| `undefined` | `NaN` | deliberate, specific rule |
| `true` / `false` | `1` / `0` | |
| `""` | `0` | empty string parses as the empty numeric literal |
| `"  12  "` | `12` | whitespace trimmed |
| `"12abc"` | `NaN` | partial parses are rejected — all or nothing |
| `[]` | `0` | `ToPrimitive([])` is `""`, then `ToNumber("")` is `0` |
| `[5]` | `5` | `ToPrimitive([5])` is `"5"` |
| `[5, 6]` | `NaN` | `ToPrimitive([5,6])` is `"5,6"`, unparseable |

---

## The TypeScript side: reject the operand type, not the operand value

```
error TS2362: The left-hand side of an arithmetic operation must be of type
              'any', 'number', 'bigint' or an enum type.
error TS2363: The right-hand side of an arithmetic operation must be of type
              'any', 'number', 'bigint' or an enum type.
```

This is a **coarser** rule than `+`'s (demo 01), deliberately: `+` had a
genuine second meaning (concatenation) worth preserving. `-`/`*`/`/`/`%`/`**`
do not — subtracting a string is never a real, intended operation in typed
code, so the compiler can refuse the entire type category with no loss of
expressiveness. Two strings with different runtime content
(`"15"` vs `"SUMMER"`) carry the *same static type*, so the checker correctly
treats them identically: it cannot know, and does not try to know, which
strings would have parsed.

```ts
basePrice * csv.discountPercent;  // TS2362 — even though "15" WOULD have parsed
basePrice * csv.tag;              // TS2363 — "SUMMER" would NOT have parsed
```

Both rejected, uniformly. This is a **conservative over-approximation**: a
few operations that would have worked at runtime are rejected alongside the
ones that would have silently produced `NaN` — the correct trade when the
alternative is letting `NaN` travel unannounced through a codebase.

---

## Comparison table

| Expression | JavaScript result | Exception? | TypeScript verdict |
|---|---|---|---|
| `"5" - 3` | `2` | no | **TS2362** |
| `"abc" * 2` | `NaN` | no | **TS2363** |
| `"" - 1` | `-1` | no | **TS2362** |
| `null * 2` | `0` | no | **TS18050** (`strictNullChecks`) |
| `undefined - 1` | `NaN` | no | **TS18049** (`strictNullChecks`) |
| `[5, 6] * 2` | `NaN` | no | **TS2362** |
| `{} - 1` | `NaN` | no | **TS2362** |

Every JavaScript row above shares one property: **no exception, ever.** That
row is the entire argument for why this class of bug is dangerous — nothing
about the runtime behavior tells you anything went wrong.

---

## Where this demo admits a limit

`Number("15")` and `Number("SUMMER")` have the identical static type
(`number`, since `Number()` always returns `number` — never `NaN` as a
distinguishable type). Once past an explicit, validated boundary
(`parseDiscountRow`, which checks `Number.isFinite`), TypeScript cannot
re-derive at the type level whether a given `number` is finite or NaN;
`Number.isFinite` is a **runtime** check, not a type refinement recognized as
narrowing `number` into a `NotNaN` subtype (no such subtype exists in
TypeScript's numeric type). The type system's job ends at "this is
definitely some `number`"; keeping it finite is the validator's job, done
once, at the boundary — not the type checker's job, done everywhere.

---

## Verify

```bash
npm run evidence                     # see TS2362/TS2363 emitted for real
npm run demo:02-arithmetic-coercion
```
