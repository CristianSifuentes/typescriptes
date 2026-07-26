# 03 — Excess-property checking on object literals: the mechanism, dissected

**Run it:** `npm run demo:03-excess-property`

---

## Two checks that only fire at construction

Reading and writing check *one* property at a time. Constructing a value
checks the *entire* literal at once, against two separate obligations:

| obligation | violated by | code |
|---|---|---|
| every **required** member must be present | `{ id, name }` — missing `email` | **TS2741** |
| a **fresh literal** may declare no member the target doesn't | `{ id, name, emial }` | **TS2561** |

```
error TS2561: Object literal may only specify known properties, but 'emial'
does not exist in type 'User'. Did you mean to write 'email'?
```

Note the message ends with a spelling suggestion, exactly like TS2551 for
reads and writes (demos 01–02) — the same edit-distance pass runs here too.

---

## Why this needs its own rule (recap from the manifesto)

`{ id, name, emial }` is, precisely stated, wrong **twice**: it is missing
the required `email`, *and* it declares an `emial` the type has never heard
of. Ordinary structural subtyping — no excess-property checking involved —
would already reject this literal on the first violation alone, reporting
**TS2741** ("Property 'email' is missing…"). That is a correct, but
unhelpful, diagnosis: it does not tell you *why* email is missing, only that
it is.

Excess-property checking adds a second obligation that fires in parallel: a
fresh literal may declare no key the target doesn't recognize. When the
compiler's spelling-suggestion pass finds that the unrecognized key
(`emial`) is a close match for the missing one (`email`), it reports the
single, more actionable diagnosis instead of two unrelated ones: **TS2561**,
naming the exact fix. The two "violations" here were never independent —
they are the same typo, seen from two directions.

This is subtly different from the case excess-property checking was actually
designed for: a literal that has **every required member correctly**, plus
one truly extra, unrelated member. That literal fully satisfies ordinary
structural subtyping (it is a superset of what's required) — freshness is
the *only* thing that can reject it, because there is no missing-member
violation to fall back on. See `03-advanced/09-excess-property-subtlety` for
that case, and for where freshness alone, not aided by a spelling
coincidence, is doing all the work.

---

## Freshness, restated precisely

A **fresh** object literal is one written directly in an expression position
with a known target type — right of `=` in a typed declaration, as an
argument to a typed parameter, as an element of a typed array literal.
Freshness triggers the extra "no unknown members" rule. The moment the same
literal is assigned to an untyped `const` first, it is no longer fresh, and
only ordinary structural subtyping applies from then on:

```ts
const draft = { id, name, emial: "..." };   // untyped — no freshness rule yet
const user: User = draft;                    // ordinary subtyping now applies
```

This particular reassignment still fails — but now with **TS2741**
("Property 'email' is missing in type '{ id: string; name: string; emial:
string; }' but required in type 'User'"), not TS2561. Losing freshness did
not make the typo legal; it only changed *which* check catches it, because
`draft` is still missing `email` altogether — ordinary structural subtyping
rejects it on that basis alone, without needing the excess-property rule at
all. The genuinely surprising case — an object that *does* structurally
satisfy the target, extra field and all, accepted once freshness is lost —
is dissected fully in `03-advanced/09-excess-property-subtlety`, where it is
the entire point.

---

## Autocomplete is this table, offered before you finish typing

Everything printed under "The property map a fresh literal is checked
against" — `id, name, email` — is not a summary for the reader. It is,
verbatim, the completion list an editor shows inside `{ }` once it knows the
literal's target type is `User`. Excess-property checking is the same
information used reactively (after you finish the literal) that autocomplete
already used proactively (while you were typing it). A typo like `emial`
usually never happens with autocomplete in front of you — TS2561 exists for
the rest of the time: paste, rename by hand, or an editor without live
completion.
