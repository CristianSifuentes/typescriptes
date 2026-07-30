# 10 — `valueOf`, `toString`, `Symbol.toPrimitive`: opting a class into coercion

**Run it:** `npm run demo:10-toprimitive-hooks`

---

## The JavaScript side: three hooks, hint-dependent priority

`ToPrimitive(object, hint)` checks, in order:

```
1. object[Symbol.toPrimitive]     -- if present: TOTAL override, receives the hint
2. hint "string"  -> try toString(), then valueOf()
   hint "number"/"default" -> try valueOf(), then toString()
```

A class that defines `valueOf()` (returning a primitive) is opting every
arithmetic operator, every relational comparison, and `==` into calling that
method silently. This is legitimate and powerful — it is how `Date` works —
but the **hint** that selects which method runs is decided entirely by which
operator surrounds the expression, and that choice is invisible at the call
site: `price + tax` and `5 + 3` are visually identical, yet one calls a
method and the other does pure arithmetic.

---

## The TypeScript side: an operator-by-operator, evidence-verified policy

This is not one rule — it is **five different policies**, one per operator
family, verified here against real `tsc` output rather than assumed:

| Operator family | Verdict for two `Money` operands | Why |
|---|---|---|
| binary `+` | **TS2365 — rejected** | ambiguous: numeric add via `valueOf`, or text concat? TypeScript refuses to guess |
| `-`, `*`, `/`, `%`, `**` | **TS2362/TS2363 — rejected** | no ambiguity to resolve; objects are simply never valid arithmetic operands |
| `<`, `>`, `<=`, `>=` | **accepted** | ordering has no add-vs-concat ambiguity, so TypeScript trusts `valueOf`/`Symbol.toPrimitive` here |
| `==`, `!=`, `===`, `!==` | **TS2367 — rejected** (against an unrelated type like `number`) | comparability is decided by DECLARED type, not by whether a hook could make it work at runtime |
| template literal `${x}` | **accepted, always** | `ToString` is total (demo 09) |
| unary `+`/`-` | **accepted** | unconditionally requests `ToNumber` |

```
error TS2365: Operator '+' cannot be applied to types 'Money' and 'Money'.
error TS2367: This comparison appears to be unintentional because the types
              'Money' and 'number' have no overlap.
```

The relational-operator exception is worth dwelling on: `price < tax`
compiles with **zero** diagnostics, because ordering (`<`) has no second
possible meaning the way `+` does — there is no "did you mean concatenation"
question to ask, so TypeScript extends real trust to the `valueOf` hook.

---

## Comparison table

| Expression | JavaScript result | TypeScript verdict |
|---|---|---|
| `price + tax` | `2164` (raw cents, not a `Money`) | **TS2365** |
| `price < tax` | `false` (correct ordering, via `valueOf`) | accepted, no error |
| `` `Total: ${price}` `` | `"Total: $19.99"` | accepted, no error |
| `price == 1999` | `true` (via `valueOf`) | **TS2367** |
| `+price` | `1999` | accepted, no error |

---

## Where this demo admits a limit

TypeScript's TS2367 comparability check has no visibility into `valueOf` or
`Symbol.toPrimitive` — it is a purely **structural** analysis of declared
types. This means it correctly rejects `Money == number` as "these types
never overlap" even in the (rare, legitimate) case where a value object is
*specifically designed* to be compared against its underlying primitive.
When that comparison is truly intended, the explicit escape hatch is a
named method (`.equals()`, `.valueOf() === 1999`), which is also strictly
better for readers — the same conclusion demos 05 and 09 reach by a
different road: **operator overloading via coercion hooks reads ambiguously
to both TypeScript and to humans; named methods read unambiguously to both.**

---

## Verify

```bash
npm run evidence                        # see TS2365/TS2367 emitted for real
npm run demo:10-toprimitive-hooks
```
