# 02 — Positional binding: the mechanism, dissected

**Run it:** `npm run demo:02-positional-binding`

---

## The runtime rule

ECMAScript's `FunctionDeclarationInstantiation` walks the parameter list in
order and binds the argument at the same index. Three rules follow, and every
argument-order bug in this project is a consequence of one of them:

1. **Position is the only binding key.** Parameter names are local variables
   inside the body; they do not exist at the call site.
2. **Missing positions become `undefined`.** Not an error — a *value*.
3. **Surplus arguments are collected and ignored**, reachable only through
   `arguments`.

The `arguments` object is the proof of rule 1: what the callee actually receives
is an **indexed list**. Parameter names, JSDoc, and editor hints are commentary
the runtime never sees.

---

## Four places people expect the rules to bend

### Arity

```ts
scheduleJob("sync")
// error TS2555: Expected at least 2 arguments, but got 1.
```

Note the code. Because `tags` is a **rest parameter** the signature has no upper
bound, so the compiler emits **TS2555** ("at least N") rather than the more
familiar **TS2554** ("expected N"). A fixed-arity signature gives TS2554.

Same defect, two codes, decided by whether the parameter list is bounded — the
kind of detail worth checking against the compiler rather than assuming. (This
project's evidence lab caught exactly that assumption being wrong.)

### Optional parameters

```ts
function scheduleJob(name: string, runAt: Date, retries = 3, ...tags: string[])

scheduleJob("sync", new Date(), "urgent")
// error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
```

A reasonable expectation: *"I don't need `retries`, so my tag should slide into
the rest parameter."* It does not. **Position 2 is `retries` whether you wanted
it or not.** Optionality means the *argument* may be omitted, never that the
*position* may be reused.

To skip it you must pass it — `scheduleJob("sync", d, 3, "urgent")` — or move to
an options object (demo 08), where omitting a field is what optionality actually
means.

### Rest parameters

A rest parameter relaxes nothing before it. Positions 0…k−1 are checked exactly
as before; only position k onward is variadic.

### Spreads

| spread of | verdict |
|---|---|
| `(string \| Date)[]` | **TS2556** — *A spread argument must either have a tuple type or be passed to a rest parameter* |
| `[string, Date]` (tuple) | checked element-wise against the parameters |
| `[Date, string]` (wrong tuple) | **TS2345** at the first mismatching element |

An array's *length* is only known as `number` and its element type is the union
of everything in it, so the compiler cannot map array indices onto parameter
positions — and refuses rather than guessing.

This closes a genuinely nasty JavaScript bug shape: the array is built in one
file and spread in another, so the two halves of an ordering mistake live apart.
A tuple type carries the ordering across that boundary.

---

## The position table for `scheduleJob`

| # | parameter | type demanded | kind | checked? |
|---|---|---|---|---|
| 0 | `name` | `string` | required | yes |
| 1 | `runAt` | `Date` | required | yes |
| 2 | `retries` | `number` | has a default ⇒ optional | if present |
| 3+ | `...tags` | `string[]` | rest | each surplus argument |

---

## Summary

| situation | JavaScript | TypeScript | code |
|---|---|---|---|
| missing argument | binds `undefined` | rejected | TS2555 / TS2554 |
| surplus argument | collected, ignored | rejected | TS2554 |
| optional "skipped" by sliding | silently misbinds | rejected | TS2345 |
| spread of an array | whatever order it had | rejected | TS2556 |
| spread of a wrong tuple | whatever order it had | rejected per element | TS2345 |

Every row is the **same rule** — argument *i* against parameter *i* — reached by
a different syntactic route.

And every row still depends on the two types **disagreeing**. `scheduleJob`
survives scrutiny here only because `string` and `Date` are different types.
Demo 04 removes that luxury.
