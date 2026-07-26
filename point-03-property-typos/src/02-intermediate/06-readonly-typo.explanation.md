# 06 — `readonly` and typos in assignment targets: the mechanism, dissected

**Run it:** `npm run demo:06-readonly-typo`

---

## Two rules, checked in a fixed order

`target.key = value` is validated by two separate rules, applied in
sequence:

1. **Existence.** Is `key` in `target`'s property map? If not: **TS2339**
   (or **TS2551** with a spelling suggestion). This check does not know or
   care whether `key`, if it existed, would be mutable.
2. **Mutability.** Only reached if (1) passed. Is `key` declared `readonly`
   in the map? If so: **TS2540**.

```ts
invoice.id = "x";           // key exists, IS readonly  → TS2540
invoice.totlaCents = 0;     // key does not exist at all → TS2551, readonly never checked
```

The practical consequence: **a misspelled readonly field is never reported
as a readonly violation.** It is reported as a missing member, because
"mutable or not?" is not a well-formed question about a key the type does
not have.

---

## Why this ordering, and not the reverse

Readonly-ness is a property *of a declared member* — `readonly totalCents:
number` attaches the modifier to a specific entry in the property map. A
string that is not a key of the map has no such entry to inspect, so there
is nothing to ask "is this readonly?" *about*. Existence is logically prior
to every other fact the compiler could report about a member, which is why
it is always checked first — this is the same ordering demo 02 showed for
plain (non-readonly) writes: key-existence, then everything else.

---

## What JavaScript has instead, and why it is not comparable

`Object.freeze(invoice)` is the closest JavaScript analogue, and it differs
in every dimension that matters here:

| | TypeScript `readonly` | `Object.freeze` |
|---|---|---|
| when enforced | compile time, every assignment site | runtime, only if actually called |
| cost of forgetting | build fails | silent no-op in non-strict mode; throws only in strict mode |
| covers | exactly the members you mark | the whole object, all-or-nothing |
| interacts with typos | key-check runs first (TS2551) | irrelevant — a typo'd write just creates a new, unfrozen property |

`Object.freeze` is also shallow and must be *remembered* at every
construction site; `readonly` is part of the type and is checked at every
use site, forever, with no runtime cost (it is erased — see point-01's
manifesto on type erasure).
