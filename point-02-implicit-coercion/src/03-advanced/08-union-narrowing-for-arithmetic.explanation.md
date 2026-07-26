# 08 — Union types and arithmetic: valid only if valid for every member

**Run it:** `npm run demo:08-union-narrowing`

---

## The JavaScript side: a field that changes shape between deploys

A supplier API serializing `weightGrams` as a JSON number on one day and a
JSON string the next is not a contrived example — schema drift in
third-party APIs is common, and JSON has no way to declare "this field is
always numeric." `+` inside a `.reduce()` coerces whichever shape shows up:
numeric input sums correctly, string input concatenates into an
obviously-wrong giant string, and — worst of all — a **mixed** batch starts
numeric and flips to string concatenation the moment a string-shaped item is
encountered, producing a plausible-looking but silently wrong total.

---

## The TypeScript side: the union-member rule, applied to arithmetic

A union type `A | B` models "the runtime value is an `A` **or** a `B`, and
the type system must assume either." The rule that follows is universal
across every operation TypeScript checks:

> **An operation on a union is legal only if it is legal for every member.**

`point-01-type-errors` (demo 08) applies this rule to method calls
(`.toUpperCase()` on `string | number` fails because `number` lacks the
method). This demo applies the identical rule to arithmetic: `+`/`-`/`*`/`/`
require every operand to be `any`, `number`, `bigint`, or an enum — and
`string | number` fails that requirement because its `string` member does
not qualify, even though its `number` member would pass on its own.

```
error TS2365: Operator '+' cannot be applied to types 'number' and 'string | number'.
```

The fix is the same tool used everywhere else in this series:
**narrowing**. A `typeof` guard performs *set subtraction* on the union —
inside `typeof weightGrams === "number"`, the compiler removes every
non-`number` member, leaving a bare `number` the operator accepts; in the
`else` branch, the removed member is the *only one left*
(`string`), which is then converted explicitly and validated.

```ts
if (typeof weightGrams === "number") {
  return weightGrams;              // union narrowed to `number` — legal operand
}
return Number(weightGrams);        // union narrowed to `string` — converted explicitly
```

---

## Comparison table

| Type of `weightGrams` | JavaScript arithmetic | TypeScript verdict |
|---|---|---|
| `number` (always) | correct | accepted |
| `string \| number`, unnarrowed | correct today, silently wrong on schema drift | **TS2365** |
| `string \| number`, narrowed by `typeof` | n/a — resolved before arithmetic runs | accepted in both branches |

---

## Where this demo admits a limit

Narrowing operates on the **static type**, not on a promise about future API
behavior. If the supplier later starts returning `weightGrams` as `null` or
a nested object, the union in this file's `SupplierItem` interface does not
know about that on its own — a human has to update the type to match the
new reality, at which point every `toGrams`-style narrowing call site is
re-checked automatically. The type system prevents *silent* drift; it does
not prevent drift from happening, and it cannot update itself when the
external contract changes without the type declaration changing too.

---

## Verify

```bash
npm run evidence                    # see TS2365 emitted for the union case
npm run demo:08-union-narrowing
```
