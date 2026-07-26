# 12 — The compiler's mental model for property access: dissected

**Run it:** `npm run demo:12-resolution-model`

---

## Two completely different processes share the same syntax

`invoice.totalCents` triggers two unrelated resolution processes at two
unrelated times:

| | when | mechanism | repeats? |
|---|---|---|---|
| **compile time** | once, while `tsc` runs | look up `"totalCents"` in a precomputed, FLAT property map | no — one decision, reused forever |
| **runtime** | every time the line executes | walk the actual **prototype chain**: instance → `Invoice.prototype` → `Entity.prototype` → `Object.prototype` → `null` | yes — every single access |

The runtime process is the one most developers picture when they hear
"property lookup" — it is real, it is dynamic, and it is genuinely a
multi-step search through live objects. The compile-time process is not a
simulation of that search. It is a **completely different computation**
that happens to answer a related question ahead of time.

---

## Why the compiler doesn't "walk" anything

Before checking a single access, the compiler computes, for `class Invoice
extends Entity`, ONE merged property map: `Entity`'s declared members ∪
`Invoice`'s own declared members (with `Invoice`'s versions winning any
name collision — the usual override rule). This flattening happens once, as
part of resolving what type `Invoice` even *is*. Every subsequent
`invoice.key` check is a single lookup against that already-flat map — there
is no "first check own, if not found check the base class" sequence at
check time, because that sequence already happened when the map was built.

This is why demo 05's nested-chain result holds: depth (of inheritance,
same as depth of nesting) never changes how certainly a typo is caught. The
"walking" metaphor belongs entirely to the runtime prototype chain; the
compiler's mental model is closer to "one precomputed table, one lookup."

---

## The four-step resolution order, restated as a decision procedure

```
resolve(expr.key, T):
  1. is `key` an OWN declared member of T?             → yes: done
  2. is `key` an INHERITED declared member of T?        → yes: done
     (folded into the same flat map as step 1 — not a separate pass)
  3. does T declare an INDEX SIGNATURE?                 → yes: done (demo 07)
  4. otherwise                                          → TS2339 / TS2551
```

Steps 1 and 2 are drawn together deliberately: nothing observable
distinguishes an own member from an inherited one at the type level — both
are just entries in the same map, and `invoice.id` (inherited) is exactly as
protected as `invoice.totalCents` (own). Step 3 is the escape hatch demo 07
dissected: an index signature answers for every remaining string, which is
why it must be checked *before* declaring failure. Step 4 is where every
typo in demos 01–11 eventually lands, once no earlier step could resolve
the key.

---

## The one thing this model does NOT cover

This resolution order governs **statically known** accesses — `expr.key`
where `key` is literal syntax, or a `keyof T`-constrained value (demo 10).
It says nothing about `any`, `as`, or dynamic bracket access with an
arbitrary `string` — those bypass the property map entirely, which is
precisely the subject of the next demo.
