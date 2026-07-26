# 13 — The boundary validation layer: closing demo 12's gap for good

**Run it:** `npm run demo:13-boundary-validation`

---

## The JavaScript side: every caller re-derives its own trust

Without a single, shared validation point, each function that receives
external data (a webhook payload, a CSV row, a `fetch` response) makes its
own ad hoc decision about what to check — usually "whatever broke in
production last time." `checkout.js` might check `totalCents`;
`refunds.js` might not; neither necessarily agrees with the other, and none
of them is verified against the others. A thousands-separator string like
`"1,999"` — a realistic value from a poorly-integrated upstream system —
fails `Number()`'s `StringNumericLiteral` grammar entirely, producing `NaN`
with no exception anywhere in the call stack.

---

## The TypeScript side: one schema, one type, no drift

Demo 12 established that `as` lets a hand-written `interface` and the
actual runtime shape drift apart silently. The fix is to stop writing the
type by hand at all: define a small `Schema<T>` function that **both**
performs the runtime check **and** determines the type, so there is
exactly one source of truth:

```ts
type Schema<T> = (input: unknown, path: string) => T;

const orderPayloadSchema: Schema<OrderPayload> = object<OrderPayload>({
  orderId: string(),
  totalCents: numeric(),
  discountPercent: numericWithDefault(0),
});
```

`orderPayloadSchema` is a real function — it inspects `input` field by
field, throws a `TypeError` naming the exact failing field, and only
returns a value once every field has been checked. This is the pattern the
Zod library generalizes into a full DSL; the demo reproduces its shape
by hand so the mechanism is visible rather than imported as a black box.

The type-level payoff: `computeFinalTotal(order: OrderPayload)` can **only**
be called with something `parseOrderPayload` produced (or a value
structurally identical to it) — but crucially, the actual defense is not the
parameter type (which `any` bypasses trivially, as demo 12 showed), it is
that `parseOrderPayload` is the **only place in the codebase** that
performs the check, so every caller inherits the same guarantee instead of
re-deriving it.

---

## Comparison table

| Property | `as OrderPayload` (demo 12) | `parseOrderPayload` (this demo) |
|---|---|---|
| Inspects the runtime value | no | yes, field by field |
| Silent mistyped field possible | yes | no |
| Type and check can drift apart | yes — two independent sources | no — one function is both |
| Failure mode on `"1,999"` | `NaN`, three functions downstream | `TypeError` naming the field, at the boundary |
| `discountPercent: null` behavior | undefined — depends on incidental `ToNumber` rules (demo 06) | a declared, explicit default (`numericWithDefault(0)`) |

---

## Where this demo admits a limit

A schema is only as correct as the person who wrote it — `numeric()` here
chooses to accept numeric *strings* as well as real numbers, which is a
deliberate leniency decision (some upstream APIs are known to send numbers
as strings), not a universal rule. Nothing prevents a schema from being
written incorrectly (too permissive, or checking the wrong field name), and
TypeScript cannot verify that a hand-rolled validator's *logic* matches its
declared `Schema<T>` return type — it can only verify that the **code
compiles**, which is a much weaker guarantee than "the validator is
correct." Testing the validator itself against real API payloads remains
the human's job.

---

## Verify

```bash
npm run demo:13-boundary-validation
```

This demo has no dedicated evidence-lab entry: its point is a validated
runtime boundary, not a new `TSxxxx` diagnostic — the diagnostics it
depends on (TS2345 for structurally wrong shapes passed directly) were
already verified in earlier levels.
