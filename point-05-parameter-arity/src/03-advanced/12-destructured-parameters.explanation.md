# 12 — Destructured parameters: typed, and checked field by field — dissected

**Run it:** `npm run demo:12-destructured-parameters`

---

## Destructuring is a single parameter with an internally-checked shape

`{ port, host }: ServerOptions` does not change `createServer`'s arity at
all — it is still exactly one parameter (manifesto §1). What destructuring
changes is what happens **inside** that one parameter's type: `ServerOptions`
is an ordinary object type, so every field named in the destructuring
pattern is resolved against it exactly the way point-03's manifesto
describes resolving any property access — each field either exists in the
type's property map, or it doesn't.

---

## Why excess property checking exists as a SEPARATE, stricter rule

Structurally, `{ prot: 8080, host: "localhost" }` would actually be
**assignable** to a wider type that merely requires a `host: string` and
tolerates extra fields — TypeScript's general structural typing rule is
permissive about extra properties on values that already satisfy a type.
Excess property checking is a deliberate **exception** to that permissiveness,
applied only to object literals written directly at a call site (or
directly in a variable's initializer). The reasoning: a literal is
authored, by a human, right there — an unrecognised field on it is far more
likely a **typo** (`prot` for `port`) than an intentional, deliberate
extension, so TypeScript flags it immediately, complete with the same
spelling-suggestion mechanism point-04's demo 02 uses for a misspelled
method.

---

## Why a missing field and a misspelled field are two different diagnostics, on purpose

`{ prot: 8080, host: "..." }` and `{ host: "..." }` (port simply omitted)
look similar in effect — both leave `port` unbound — but they are different
mistakes, and TypeScript reports them differently. The first is **excess
property checking** flagging an unrecognised field (**TS2561**, with a
spelling hint); the second is ordinary **object-shape assignability**
noticing a required field is entirely absent (**TS2345**). Keeping these as
two distinct checks means the diagnostic a developer sees actually
describes *which* mistake they made — a typo versus a genuine omission —
rather than collapsing both into one generic "something's wrong here."
