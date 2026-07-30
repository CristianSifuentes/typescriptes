# 04 — Function-typed variables: the mechanism, dissected

**Run it:** `npm run demo:04-function-typed-variable`

---

## A function type is a type, full stop

`onClose: () => void` declares a member whose value type happens to be a
**function type** — a call signature (manifesto §1). Nothing about checking
an assignment into that slot is special-cased for "this member happens to be
a function": the compiler asks the same assignability question it would for
`onClose: number` — *"is the right-hand side's type assignable to the
declared type?"* — and answers it the same way, via **TS2322**:

```
error TS2322: Type 'string' is not assignable to type '() => void'.
```

Read that message exactly as you would `Type 'string' is not assignable to
type 'number'`. `() => void` is simply the *name* of the required type in
this particular case; the mechanism producing the error is identical to
point-01's most basic demo (primitive annotations), not a new, function-
specific rule.

---

## Why the crash and the diagnosis land on different lines in JavaScript

```js
const brokenModal = openModal({ onClose: "goodbye" }); // no complaint here
brokenModal.close();                                    // TypeError HERE
```

Constructing `brokenModal` is unremarkable in JavaScript — object literals
accept any value for any key. The mistake becomes visible only when
`.close()` is eventually called, which triggers `options.onClose()`. If the
modal is opened at page load and closed only when a user clicks away, the
two lines can be separated by an entire user session, and by the time the
crash happens, the configuration object that caused it may no longer be
anywhere near the top of anyone's mind.

TypeScript's TS2322 is reported at `openModal({ onClose: "goodbye" })` —
the exact point where the wrong value was written — because the check being
performed (*"is this value assignable to the slot's declared type?"*)
requires nothing about how or when the slot will later be used. Assignment
and (eventual) invocation are two separate operations, checked at two
separate times, but TypeScript is able to reject the assignment immediately
because a function type is, structurally, no different from any other type
it already knows how to check.

---

## The pattern this generalises to

Every "typed slot for a callback" in a realistic codebase — event handler
props, plugin hook registrations, middleware arrays, command-map entries
(demo 15 dissects the last of these in depth) — reduces to this same
mechanism: declare the slot's type as a call signature, and every
assignment into it is checked the moment it is written, with zero special
casing beyond "function types are types too."
