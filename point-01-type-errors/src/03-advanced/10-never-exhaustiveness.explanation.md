# 10 — `never` and exhaustiveness checking: the mechanism, dissected

**Run it:** `npm run demo:10-never-exhaustiveness`

---

## `never` is the empty set

That is the entire definition. Three properties follow immediately:

1. **Nothing is assignable to `never`.** To produce a value of the empty set you
   would need a value that does not exist.
2. **`never` is assignable to everything.** The empty set is a subset of every
   set — which is why a function returning `never` composes in any position.
3. **Narrowing away every union member leaves `never`.** The compiler has
   *proved* that program point is unreachable.

---

## Exhaustiveness checking = property 1 applied to property 3

```ts
function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

switch (state) {
  case "draft":     return "Draft";
  case "placed":    return "Placed";
  case "shipped":   return "Shipped";
  case "cancelled": return "Cancelled";
  default:          return assertNever(state);   // ← state is `never` here
}
```

- **All cases handled** → the residual set is ∅ → `state: never` → the call type-checks.
- **A case missing** → the residual set is non-empty → the call fails:

```
error TS2345: Argument of type '"cancelled"' is not assignable to parameter of type 'never'.
```

Note what that message contains: **the name of the case you forgot.** The
compiler is not saying "something is wrong"; it is saying *which thing*.

### Why both `never`s matter

| position | job |
|---|---|
| parameter `value: never` | makes the call legal *only* at a proved-unreachable point |
| return type `: never` | tells control-flow analysis the call does not return, so it may sit in a `default:` branch without upsetting return checking |

And the runtime `throw` is not decoration: it is the belt to the compiler's
braces, covering the case where a value arrives from outside the type system
(a cast, `any`, or raw JSON). That is the only way the line can ever execute.

---

## The maintenance property

This is the mechanism's real value, and it is about **time**, not about today.

Adding `"refunded"` to `OrderState` makes **every exhaustive `switch` in the
entire program** fail to compile, each naming `"refunded"`. You get a complete,
instantaneous, mechanically-derived work list.

The `.js-broken` twin shows the same change in JavaScript:

- `labelFor("refunded")` → `undefined`
- `badgeColour("refunded")` → `undefined`
- rendered output: `<span class="undefined">undefined</span>`
- `refundableAmount(refundedOrder)` → **0**, on an order owed €129.50

No exception, no failing test — there is no test for a state that did not exist
when the tests were written.

---

## The anti-pattern this replaces

```ts
default: return 0;          // "safe default"
```

A defensive fallback **silences the compiler and reintroduces the JavaScript
failure exactly**: a wrong answer instead of a caught error. `assertNever` is
the difference between a default that *handles* the unknown and one that
*hides* it.

If a fallback is genuinely correct, write it and delete the `assertNever` — but
make that a decision, taken in the open, rather than a reflex.

---

## Related diagnostics, all from the same set reasoning

| code | message | reasoning |
|---|---|---|
| **TS2345** | `Argument of type '"cancelled"' is not assignable to parameter of type 'never'.` | residual set ≠ ∅ |
| **TS2322** | `Type '"no"' is not assignable to type 'never'.` | nothing inhabits ∅ |
| **TS2678** | `Type '"palced"' is not comparable to type 'OrderState'.` | a case label outside the union — a typo becomes a type error, not a dead branch |
| **TS2367** | `This comparison appears to be unintentional because the types '"draft" \| "placed"' and '"shipped"' have no overlap.` | empty intersection ⇒ the comparison is always false |

---

## Where `never` turns up elsewhere

| appearance | meaning |
|---|---|
| residual type after full narrowing | this point is unreachable |
| return type of a throwing function | this call never returns |
| element type of `[]` | an empty array has no elements |
| a conditional type with no matching branch | nothing satisfied the condition |
| `string & number` | no value is both |

Every one of these is the same fact — the empty set — wearing a different hat.

---

## The reframing

Most type-system features stop you writing something wrong **now**.
Exhaustiveness checking stops *someone else* making your correct code wrong
**later**. It converts an unanswerable question —

> "Did every place that handles this union get updated?"

— into a build failure with a complete list attached. There is no equivalent
in JavaScript, because there is no artefact that enumerates the cases.
