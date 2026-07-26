# 07 — Index signatures loosen typo protection: the mechanism, dissected

**Run it:** `npm run demo:07-index-signatures`

---

## What an index signature actually does to the property map

`[key: string]: T` is not "one more entry" in the property map — it changes
the **domain** of the map itself, from a finite set of literal keys to
*every string*. Formally, the property map stops being a finite function and
becomes total over `string`:

```
without index signature: dom(map) = { "betaMode" }
with index signature:    dom(map) = string   (all of it)
```

Every consequence in this demo follows from that one fact.

---

## The sharp edge: a typo of a real member "resolves" through the signature

`FeatureFlags` declares one real member, `betaMode`, *and* an index
signature. When the compiler resolves `flags.betaMod`, it looks up
`"betaMod"` in the (now-total) property map — and finds it, because the
index signature answers for every string. The lookup **succeeds**. What
fires instead is `noPropertyAccessFromIndexSignature`'s separate rule: a
member that resolved through the index signature (rather than a literal
declared key) may not be accessed with dot notation:

```
error TS4111: Property 'betaMod' comes from an index signature, so it must
be accessed with ['betaMod'].
```

This is easy to misread as a typo diagnosis. **It is not.** Switch to
`flags["betaMod"]` and the expression compiles with zero complaints — still
wrong, now silently. The index signature did not merely fail to catch the
typo; it actively provided a technically-valid resolution for it.

---

## Why the index signature exists despite this cost

`FeatureFlags` mixes two genuinely different kinds of key:

| key | known ahead of time? | protectable by a finite property map? |
|---|---|---|
| `betaMode` | yes | yes |
| flags pushed by remote config | no — the set is decided by another system at runtime | no |

An index signature is not a mistake here; it is the only honest way to type
a value whose full key set is unknowable at compile time. The trade-off is
real and worth stating precisely: **an index signature protects you from
nothing except the wrong VALUE type** (`flags["x"] = "yes"` would still be
rejected, `boolean` required) — it protects nothing about the KEY, because
protecting the key is definitionally impossible for a genuinely open set.

---

## The fix: shrink the index signature to the smallest set that needs one

The `betaMode` typo is preventable, and the fix is structural, not a
checker limitation: **do not let a genuinely finite key share a type with an
index signature.** Two disciplined options:

1. Declare `betaMode` on its own interface, and keep the index-signature bag
   as a separate, explicitly "dynamic" value:
   ```ts
   interface KnownFlags { betaMode: boolean }
   type DynamicFlags = Record<string, boolean>;
   ```
2. If the *dynamic* set is actually finite and known — just large — use
   `Record<SpecificKeyUnion, T>` instead of `[key: string]: T`, trading the
   index signature for `keyof`-checked literal keys (see
   `03-advanced/10-keyof`).

Either way, the rule is: an index signature should describe the smallest
possible set of *actually* unpredictable keys, never a type that also
contains members you could have listed by hand.
