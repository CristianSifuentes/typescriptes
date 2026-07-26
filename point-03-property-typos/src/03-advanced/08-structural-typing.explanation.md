# 08 — Structural typing vs nominal typing: the mechanism, dissected

**Run it:** `npm run demo:08-structural-typing`

---

## The experiment

Two interfaces, declared in total isolation, never importing or referencing
each other:

```ts
interface GeoCoordinate { lat: number; lng: number; }  // the mapping library
interface MapPin        { lat: number; lng: number; }  // the store locator
```

A `GeoCoordinate` is accepted anywhere a `MapPin` is expected, and vice
versa — with zero configuration, zero `implements`, zero shared ancestor.

---

## What the compiler actually compares

In a **nominal** type system, `S` is assignable to `T` only if the source
code somewhere declares that relationship (`class S implements T`, `S
extends T`). Assignability is a fact about *declarations*.

In TypeScript's **structural** system, `S` is assignable to `T` iff `S`'s
property map is a superset of `T`'s: every member `T` requires is present in
`S`, with a compatible type. Assignability is a fact about **property
maps** — the same object this entire project has been about since demo 01.
`GeoCoordinate` and `MapPin` are simply two different *names* for property
maps that happen to be identical, and the compiler never looks at the names
at all when deciding assignability.

This is not a special case bolted onto property checking — it is the *same*
mechanism, viewed from the assignability angle instead of the member-access
angle. Every demo before this one asked "does this expression's type have
key `K`?" This demo asks "does this VALUE's type have every key `T`
requires?" — both questions are answered by consulting a property map.

---

## Why a typo cannot exploit structural typing as a loophole

A tempting but wrong intuition: "if *any* shape with the right fields is
accepted, maybe a typo could accidentally match some OTHER, unintended
type." It cannot, for a simple reason: assignability requires the value to
actually **have** the required key. `{ lat: 40.73, lgn: -73.99 }` does not
have `lng` under any name — a typo does not create a phantom key that
happens to satisfy a different type; it just means the key `lng` is absent,
which fails *every* type that requires it, structural or not.

---

## TS2561 vs TS2353 — the same check, a suggestion-dependent code

Both diagnostics are the excess-property check (see demo 03 and the
manifesto §3) firing on a fresh literal. The code differs only by whether
the spelling-suggestion pass found a close-enough candidate:

| literal | closest real key | edit distance | code |
|---|---|---|---|
| `{ totalCents, totlaCents }` | `totalCents` | small, relative to a 10-char key | **TS2561** (`Did you mean...?`) |
| `{ lat, lng, lgn }` | `lng` | 2 substitutions on a 3-char key | **TS2353** (no suggestion) |

Short field names leave little room for "close enough" — the same absolute
edit distance is a larger fraction of a 3-letter key than a 10-letter one.
Both codes report the identical underlying fact (`"lgn" ∉ dom(propertyMap)`
on a fresh literal); TS2353 is simply TS2561 without a confident guess to
offer.

---

## Structural typing's actual payoff

Two teams, two unrelated modules, never coordinate a shared `Point` type —
and their code still composes correctly, because "does the shape match?" is
decidable from the property maps alone. This is precisely why TypeScript
*can* layer onto an ecosystem of already-existing JavaScript: nominal typing
would require every library to opt in to a shared type hierarchy before any
of this worked. Structural typing lets the type checker discover
compatibility that was never explicitly declared — while never once
weakening its ability to catch a typo, because a typo simply removes a key
from the map, and no amount of structural flexibility can put it back.
