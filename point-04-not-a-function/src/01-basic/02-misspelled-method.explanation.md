# 02 — A misspelled method: where Concept #3 ends and Concept #4 begins

**Run it:** `npm run demo:02-misspelled-method`

---

## Two questions, asked in a fixed order

Resolving `code.toUpperCasee()` is, mechanically, two questions asked one
after the other (see the manifesto §3):

1. **Does `code`'s type declare a member named `toUpperCasee`?** (Concept
   #3's question — point-03's entire subject.)
2. **If so, is that member's type callable, and does `()` supply compatible
   arguments?** (Concept #4's question — this project's subject.)

`toUpperCasee` fails question 1. The compiler reports **TS2551** — the exact
same diagnostic point-03 produced for property typos — and question 2 is
never reached. There is no member to ask "is it callable?" *about*.

---

## Why this demo belongs in a "not a function" project at all

At runtime, `code.toUpperCasee()` produces `TypeError: code.toUpperCasee is
not a function` — textbook Concept #4 phrasing. But the ROOT CAUSE is a
Concept #3 defect: the property read (`code.toUpperCasee`) silently returns
`undefined`, and it is only the immediately-following `()` that turns that
silence into a crash. `undefined` has no `[[Call]]` slot, so:

```js
code.toUpperCasee      // undefined — Concept #3's failure, silent
code.toUpperCasee()    // TypeError — Concept #4's failure, loud
```

This demo exists specifically to draw that boundary precisely, because
conflating the two leads to the wrong mental model: "not a function" errors
are *not* always about calling a value of the wrong type — very often they
are property typos wearing a different runtime symptom, and the fix is
identical to point-03's fix (spell the member correctly), not anything
specific to callability.

---

## Why TypeScript's diagnostic correctly identifies the real cause

The compiler's error — TS2551, `"Did you mean 'toUpperCase'?"` — names the
actual defect (a typo) rather than the symptom a JavaScript stack trace
would show (a `TypeError` at the call). This is possible because the
compiler checks step 1 and step 2 as genuinely separate, ordered questions:
it never has to "guess" that a `TypeError: not a function` might really be a
typo, because it never gets far enough to consider the value callable or
not — the member simply isn't there.

---

## When a demo actually IS about Concept #4 (contrast)

Demo 01 (`retryBudget()`) is a pure Concept #4 defect: the member exists (or
there is no member access at all — `retryBudget` itself resolves fine), but
its type has no call signature. Demo 05, later in this project
(`config.retry()` where `retry: number`), is the object-property version of
that same pure case. This demo — the typo — sits at the seam between the two
concepts, and recognizing which one actually applies is itself part of
debugging invocation errors correctly in real code.
