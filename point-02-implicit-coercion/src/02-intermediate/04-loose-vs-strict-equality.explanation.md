# 04 — `==` vs `===`: the Abstract Equality Comparison Algorithm, and TS2367

**Run it:** `npm run demo:04-loose-vs-strict-equality`

---

## The JavaScript side: a non-transitive relation

`==` runs the **Abstract Equality Comparison Algorithm**
(`IsLooselyEqual`). Two of its eleven case branches produce the entire class
of surprises:

```
Number == String   → compare Number == ToNumber(String)
String == Number    → compare ToNumber(String) == Number
null   == undefined → true   (and ONLY for each other)
```

`===` (`IsStrictlyEqual`) has one rule: if `Type(x) !== Type(y)`, return
`false`, immediately, with no coercion attempted. It is not "a stricter
version" of `==` — it is a simpler, independent relation that happens to
agree with `==` exactly when the types already match.

The break in transitivity:

```
"" == 0     → true    (ToNumber("") = 0)
0  == "0"   → true    (ToNumber("0") = 0)
"" == "0"   → false   (both strings — no coercion — "" ≠ "0")
```

Any relation `R` where `R(a,b)` and `R(b,c)` are both true but `R(a,c)` is
false is not an equivalence relation — it fails the one property every
programmer implicitly assumes "equals" has.

---

## The TypeScript side: TS2367, and how much of the matrix it actually covers

This is the demo where the common belief — *"TypeScript can't help with
`==`, only ESLint's `eqeqeq` rule can"* — turns out to be wrong. TypeScript
performs its own analysis: **if the two operand types have no overlapping
value, the comparison is rejected**, because the answer would then be a
`boolean` constant, always the same, for reasons that are almost never
intentional.

```
error TS2367: This comparison appears to be unintentional because the types
              'string' and 'number' have no overlap.
```

This single rule catches 8 of the 9 classic surprises:

| Expression | Caught? | Reason |
|---|---|---|
| `"" == 0` | **TS2367** | disjoint literal types |
| `0 == "0"` | **TS2367** | disjoint literal types, swapped |
| `"" == "0"` | **TS2367** | disjoint string *literal* types (`""` ≠ `"0"`) |
| `false == 0` | **TS2367** | `boolean` and `number` are disjoint types |
| `[] == 0` | **TS2367** | an object type and `number` are disjoint |
| `null == undefined` | not caught | **exempted, deliberately** |
| `null == 0` | not caught | exempted (operand is `null`) |
| `undefined == 0` | not caught | exempted (operand is `undefined`) |
| `NaN == NaN` | not caught | same type (`number`) — legal, if always `false` |

### The one deliberate exemption

Comparisons where either operand is `null` or `undefined` are **never**
flagged, regardless of the other operand's type. This is not a gap in the
analysis — `value == null` is the standard, one-line JavaScript idiom for
"value is null or undefined", and forbidding it would break enormous
quantities of correct, intentional code. The trade-off is explicit: you keep
the idiom, and in exchange the checker stays silent about the (still
correct!) fact that `null == 0` evaluates to `false`.

---

## Comparison table

| Pattern | JavaScript behavior | TypeScript verdict |
|---|---|---|
| disjoint primitive types (`string` vs `number`, `boolean` vs `number`, …) | coerces, often surprisingly | **TS2367** |
| disjoint literal types of the *same* primitive (`""` vs `"0"`) | no coercion, compares directly, still surprising if assumed equal | **TS2367** |
| either operand `null`/`undefined` | spec-defined, narrow rule | **exempt — no error** |
| both operands the same wide type (`string` vs `string`) | direct comparison | **no error — genuinely ambiguous to the type checker** |

---

## Where this demo admits a limit

Once both operands are widened to the same general type (`string`, not the
literal `"0"`), TypeScript has no way to know their *runtime values* differ —
`first == second` where both are `string` is exactly as type-correct as
`first === second`, and the checker cannot tell you which one you meant. This
is not a coercion problem at all anymore; it is the general
`==`-vs-`===` style question, which style tooling (ESLint's `eqeqeq`)
addresses by banning `==` outright regardless of type. TypeScript's own
check is narrower and more surgical: it only intervenes when the types
*prove* the comparison is pointless.

---

## Verify

```bash
npm run evidence                          # see TS2367 emitted for real, five times
npm run demo:04-loose-vs-strict-equality
```
