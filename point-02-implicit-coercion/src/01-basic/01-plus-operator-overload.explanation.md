# 01 — The `+` operator: string concatenation vs numeric addition

**Run it:** `npm run demo:01-plus-operator`

---

## The JavaScript side: `ApplyStringOrNumericBinaryOperator`

Every arithmetic operator except `+` has one job. `+` is defined by the
ECMAScript spec through a distinct algorithm,
`ApplyStringOrNumericBinaryOperator(lval, "+", rval)`:

```
1. lprim = ToPrimitive(lval)
2. rprim = ToPrimitive(rval)
3. If lprim is a String or rprim is a String:
     return ToString(lprim) + ToString(rprim)      (concatenation)
4. Otherwise:
     lnum = ToNumeric(lprim); rnum = ToNumeric(rprim)
     return lnum + rnum                              (numeric addition)
```

The branch is decided by a single question — *"is either side a string after
`ToPrimitive`?"* — evaluated fresh, at runtime, for that specific pair of
operands. The same source line `a + b` can take either branch on different
calls if `a`/`b` change type between calls, which they can, because
JavaScript variables have no fixed type.

---

## The TypeScript side: typing the result, not banning the operator

Banning `+` between `string` and `number` would reject
`"Total: " + orderTotal`, which is correct, common code. So TypeScript keeps
both branches legal and instead makes the **result type** track which branch
was taken:

| left | right | result type |
|---|---|---|
| `number` | `number` | `number` |
| `bigint` | `bigint` | `bigint` |
| `string` | *(any)* | `string` |
| *(any)* | `string` | `string` |
| `number` | `boolean` \| `null` \| `undefined` \| `bigint` | **TS2365 / TS18050** |

```
error TS2365: Operator '+' cannot be applied to types 'number' and 'boolean'.
```

Everything not covered by "both numeric" or "at least one string" is a
combination `ApplyStringOrNumericBinaryOperator` was never designed to
receive gracefully, and TypeScript refuses it outright.

For the cases it does allow, the type carries the truth forward:

```ts
const concatenated = unitPrice + quantityField.value; // string — no error
const total: number = unitPrice + quantityField.value;
//    ^^^^^ TS2322: Type 'string' is not assignable to type 'number'.
```

The `+` is not where the bug is caught — it is where the type becomes
*honest*. The catch happens one line later, at the first point that type
meets a declared expectation.

---

## Comparison table

| Expression | JavaScript result | TypeScript static type | Where the mistake surfaces |
|---|---|---|---|
| `19.99 + "3"` | `"19.993"` | `string` | wherever `string` meets a `number` context (TS2322) |
| `19.99 + 3` | `22.99` | `number` | nowhere — it's correct |
| `"3" + "3" + "3"` | `"333"` | `string` | same as above |
| `19.99 + true` | `20.99` | rejected | **TS2365**, at the operator |
| `19.99 + null` | `19.99` | rejected | **TS18050**, at the operator (`strictNullChecks`) |

---

## Where this demo admits a limit

If a function's return type is inferred rather than annotated
(`function getTotal() { return unitPrice + quantity; }` with no `: number`),
the `string` result propagates with **no error anywhere**, because nothing
downstream declared an expectation for it to violate. **Annotate return
types at module boundaries** — the distance between the defect and its
diagnostic can never exceed the distance to the next annotated checkpoint.
This is the same lesson as `point-01-type-errors`, applied to a new bug
class.

---

## Verify

```bash
npm run evidence               # see TS2322/TS2365/TS18050 emitted for real
npm run demo:01-plus-operator
```
