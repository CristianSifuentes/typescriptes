# 03 — The four corruption modes

**Run it:** `npm run demo:03-corruption-modes`

---

## A swap has four failure modes, not one

Which one you get is decided by the **types that happen to be involved** — not
by how serious the mistake is.

| mode | produced by | example | visible symptom |
|---|---|---|---|
| **1 — NaN** | the swapped value enters arithmetic | `priceIn("EUR", 4500)` → `"NaN 4500"` | visible garbage |
| **2 — `"[object Object]"`** | the swapped value enters a string context | `renderBadge(config, "SALE")` | visible garbage, or a crash |
| **3 — the wrong branch** | the swapped value enters a truthiness test | `auditLog(true, "disk full")` → `VERBOSE: true` | wrong behaviour, no output clue |
| **4 — a plausible answer** | same-typed operands | `applyDiscount(500, 12950)` → `-12450` | **none** |

---

## Ranked by how likely you are to notice

| mode | chance of being noticed |
|---|---|
| a crash (member access on the wrong type) | high |
| 1 — NaN | medium |
| 2 — `[object Object]` | medium |
| 3 — wrong branch | low |
| **4 — plausible value** | **effectively zero** |

Sorted this way the lesson is uncomfortable: **the modes that crash are the
friendly ones**. They leave evidence. Mode 4 returns a number that will be
formatted as currency, stored, summed, and reported, and nothing about the
output identifies it as wrong.

Mode 3 deserves a second look too, because it is *intermittent*: which branch
you get depends on the **content** of the misplaced value.

```js
auditLog(true, "disk full")  // "VERBOSE: true"  — non-empty string is truthy
auditLog(true, "")           // "true"           — empty string is falsy
```

Same defect, two behaviours, depending on data.

---

## What TypeScript eliminates

Modes 1, 2 and 3 all involve swapping values of **different** types, so
positional checking catches every one of them:

```
error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
error TS2345: Argument of type '{ colour: string; outlined: boolean; }' is not assignable to parameter of type 'string'.
error TS2345: Argument of type 'boolean' is not assignable to parameter of type 'string'.
```

Three of four modes deleted by a rule that fits in one sentence. That is a large
win and it is worth stating before the caveat.

## What it does not

Mode 4 involves two `number`s. It compiles under `strict: true`, and the
`.ts-safe` file for this demo has **no `@ts-expect-error`** on that line —
because there is no error to expect.

| mode | swapped types | JavaScript result | TypeScript | code |
|---|---|---|---|---|
| 1 — NaN | `string ↔ number` | `"NaN 4500"` | rejected | TS2345 |
| 2 — `[object Object]` | `object ↔ string` | garbage or TypeError | rejected | TS2345 |
| 3 — wrong branch | `boolean ↔ string` | inverted logic | rejected | TS2345 |
| **4 — plausible value** | `number ↔ number` | `-12450` | **ACCEPTED** | — |

Note *which* mode survived: the one with no visible symptom, the one review
cannot see, the one no monitoring system will ever page you about. That is the
subject of level 02, and closing it is the subject of levels 03 and 04.
