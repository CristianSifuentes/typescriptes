# 09 — Tuple parameters and labeled tuples: dissected

**Run it:** `npm run demo:09-tuple-parameters`

---

## A tuple type is an array type with its length baked in

`number[]` describes "an array of any length, every element a number."
`[x: number, y: number]` — a **tuple type**, here additionally **labeled**
with `x`/`y` for readability — describes something categorically more
precise: an array of **exactly** two elements, position 0 typed `number`
and position 1 typed `number`. The labels (`x:`, `y:`) are erased at
runtime and carry no meaning beyond documentation and editor hints; the
**length being fixed** is what does the actual work, because it is what
lets the compiler know, statically, how many elements `...point` will
contribute to a call.

---

## Why a malformed tuple is rejected before it ever reaches a call

`const badPoint: Point = [30]` fails immediately, at the point of
construction — `TS2322`, reported with an explicit element count ("Source
has 1 element(s) but target requires 2"). This is deliberate: catching the
malformed value **here** means `drawLine(...badPoint)` never has the chance
to be checked at all with a bad value in hand, the same "prove once, verify
everywhere downstream" principle every demo in this project relies on. The
JavaScript version has no equivalent checkpoint — `[30]` is a perfectly
valid array, and the mistake only becomes visible once it's spread into a
call expecting more elements than it has.

---

## Why spread arguments need tuple types specifically, not just "some type"

`...point` where `point: number[]` type-checks against **any** function
signature that accepts a rest parameter of `number`, because the compiler
has no idea how many elements a plain array contributes — it could be zero,
one, or a thousand. `...point` where `point: Point` is different: the
compiler can see the exact count (2) baked into the type, so it can perform
the **same** arity check (manifesto §3, step 2) it performs for arguments
written individually. This is the precise reason demo 10 needs its own
demo: spreading a *typed* value only fully closes the arity hole when that
type is a tuple; spreading a plain array leaves arity effectively
unchecked, no matter how precisely its element type is declared.
