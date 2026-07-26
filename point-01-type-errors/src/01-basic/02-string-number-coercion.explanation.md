# 02 — `"5" - 3` vs `"5" + 3`: coercion, dissected

**Run it:** `npm run demo:02-coercion`

---

## The JavaScript side: two algorithms, one symbol

The ECMAScript specification defines `+` (`ApplyStringOrNumericBinaryOperator`)
differently from every other arithmetic operator:

```
"5" + 3
  → ToPrimitive("5") = "5", ToPrimitive(3) = 3
  → is either a String?  YES
  → ToString both, concatenate            ⇒ "53"

"5" - 3
  → ToNumeric("5") = 5, ToNumeric(3) = 3
  → numeric subtraction                   ⇒ 2
```

So `+` asks *"is either operand a string?"* and, if so, abandons arithmetic
entirely. `-`, `*`, `/`, `%`, `**` never ask; they coerce unconditionally with
`ToNumber`, and when coercion fails they produce `NaN` rather than an error.

Three properties make this a first-class source of production bugs:

1. **It is silent.** No warning, no exception, no log line.
2. **It is plausible.** `"1005"` looks like a number in a dashboard.
3. **It usually works.** Because three of the four operators coerce
   successfully, developers conclude their string values are "basically
   numbers". The single overloaded operator then breaks that belief exactly
   once, in the one place that matters.

`NaN` deserves separate mention: it is the only value in JavaScript not equal
to itself, it is absorbing (`NaN + x === NaN` for all `x`), and it is a
`number`, so it satisfies every `number` annotation. TypeScript cannot exclude
`NaN` from `number`; what it does is prevent the *illegal operation that
creates it*.

---

## The TypeScript side: what is actually forbidden

This is where most tutorials overclaim. The precise rules the checker applies:

### Rule A — non-`+` arithmetic operators

> Both operands must be of type `any`, `number`, `bigint`, or an enum type.

Violation on the left ⇒ **TS2362**, on the right ⇒ **TS2363**:

```
error TS2362: The left-hand side of an arithmetic operation must be of type
              'any', 'number', 'bigint' or an enum type.
```

### Rule B — the `+` operator

| left | right | result | verdict |
|---|---|---|---|
| `number` | `number` | `number` | ok |
| `string` | anything | `string` | ok |
| anything | `string` | `string` | ok |
| `bigint` | `bigint` | `bigint` | ok |
| `number` | `boolean` | — | **TS2365** |
| `number` | `null`/`undefined` | — | **TS18050** / **TS18049** |
| `never[]` | `{}` | — | **TS2365** |

```
error TS2365: Operator '+' cannot be applied to types 'number' and 'boolean'.
error TS18050: The value 'null' cannot be used here.
```

### The honest conclusion

**TypeScript does not forbid `"5" + 3`.** It types it as `string`. Forbidding
it would outlaw `"page " + pageNumber`, which is ordinary, intentional code.

So how is the bug caught? **One step downstream.**

```ts
const total: number = onHand + csvRow.incoming;
//    ^^^^^ TS2322: Type 'string' is not assignable to type 'number'.
```

The `+` was permitted; its *result* had nowhere to go. This is the general
shape of static typing: it is not a blacklist of suspicious expressions, it is
a proof that types agree **end to end**. Anywhere the chain of agreement
breaks, the compiler stops.

The corollary is a practical style rule: **annotate your boundaries** —
function parameters, return types, exported constants. Each annotation is a
checkpoint, and the distance between a defect and its diagnostic can never
exceed the distance to the next checkpoint.

---

## Comparison table

| Expression | JavaScript result | Silent? | TypeScript | Where caught |
|---|---|---|---|---|
| `"5" + 3` | `"53"` | yes | typed `string` | at the first `number` consumer (TS2322) |
| `"5" - 3` | `2` | yes | **TS2362** | at the operator |
| `"5" * 3` | `15` | yes | **TS2362** | at the operator |
| `5 * "3"` | `15` | yes | **TS2363** | at the operator |
| `"five" - 3` | `NaN` | yes | **TS2362** | at the operator |
| `5 + true` | `6` | yes | **TS2365** | at the operator |
| `[] + {}` | `"[object Object]"` | yes | **TS2365** | at the operator |
| `1 + null` | `1` | yes | **TS18050** | at the operator |
| `[10,9,100].sort()` | `[10,100,9]` | yes | *accepted* | **nowhere** — see below |

---

## Where this demo admits a limit

`[10, 9, 100].sort()` returns `[10, 100, 9]` because `Array.prototype.sort`
coerces elements to strings by default. TypeScript accepts it: the call is
type-correct — `sort()` on `number[]` returns `number[]`, and it does. The bug
is in the *semantics of the default comparator*, not in the types.

This is an important boundary of Concept #1: **a type checker catches
type errors, not logic errors.** `sort((a, b) => a - b)` is correct and
`sort()` is wrong, and both have identical types. Levels 03 and 04 show how far
you can push a type system toward encoding intent (discriminated unions,
`never`, exhaustiveness) — and level 04 shows where that pushing stops.

---

## Verify

```bash
npm run evidence            # see TS2362/TS2363/TS2365/TS18050 emitted for real
npm run demo:02-coercion
```
