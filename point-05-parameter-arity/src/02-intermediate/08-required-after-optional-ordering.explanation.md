# 08 — Why a required parameter can't follow an optional one: dissected

**Run it:** `npm run demo:08-required-after-optional-ordering`

---

## Arity resolution is positional — ordering is what keeps it unambiguous

Manifesto §3 models arity checking as comparing a supplied argument
**count** against an interval, `[minRequired, maxAllowed]`, and manifesto §1
notes that a parameter list's positions are filled **in order**. Put those
together: if a genuinely optional (`?:`) parameter could sit *before* a
required one, a call supplying fewer than the maximum arguments would be
ambiguous about **which position was skipped** — the count alone would no
longer determine the binding. `TS1016` exists to make that ambiguity
impossible to construct in the first place, by refusing the declaration
that would create it.

---

## Why `?:` and `= value` are NOT the same rule, and both close the same footgun differently

It would be reasonable to expect `delayMs = 1000, priority: number` (a
*defaulted* parameter followed by a required one) to trigger the identical
`TS1016`. It does not — TypeScript **accepts** that declaration. What it
does instead is compute the signature's real minimum arity correctly:
because `priority` has no default and cannot be skipped, `delayMs`'s
default becomes reachable only by passing `undefined` explicitly for it,
never by omitting it entirely. The signature's minimum arity is silently
**3**, not 2, and a two-argument call like `scheduleTaskDefaulted("cleanup",
5)` fails ordinary arity checking (`TS2554`, demo 01's mechanism) rather
than being refused at declaration. Both `?:` and `= value` close the exact
same JavaScript footgun — a middle argument silently absorbing what was
meant for the last position — but `?:` closes it by refusing to let the
ambiguous shape exist at all, while `= value` closes it by computing an
arity bound a naive reading of the signature would not predict.

---

## Why this is (mostly) a DECLARATION-time story, unlike every other demo so far

Every earlier demo in this project rejects a **call** against an
already-valid signature. The `?:` case here is different: `TS1016` fires on
the **signature itself**, before any call is considered, because the defect
isn't in how the function is used — it's in a parameter list shape that
makes correct usage structurally impossible to express positionally. No
call-site fix exists for `scheduleTask(name, delayMs?: number, priority)`;
the signature itself has to change. The `= value` case shows the other side
of the same coin: the declaration is allowed to stand, but every call site
inherits an arity requirement stricter than the syntax alone suggests.

---

## Why the JavaScript version's bug is invisible until someone tries to "skip the middle"

`scheduleTask("cleanup", 1000, 5)` — every argument supplied — works
identically well whether or not the parameter order is a footgun. The bug
only manifests when a caller tries to omit the *middle* argument, assuming
(reasonably, from languages with named arguments) that "the one with a
default" can simply be left out. JavaScript's positional binding has no
concept of a named, skippable slot — omitting an argument always removes it
from the **end** of the actual supplied list, never from wherever the
caller had it in mind. Reordering the parameters so required ones come
first (this demo's fix) doesn't just satisfy the compiler — it makes the
caller's mistaken mental model **structurally correct**: with required
parameters first, "supply fewer arguments" can only ever mean "omit
trailing, genuinely-optional ones," which is exactly what actually happens.
