# 03 — Calling a method that does not exist: the mechanism, dissected

**Run it:** `npm run demo:03-nonexistent-method`

---

## Two lookups, two phases

`x.foo` asks the same question in both languages — *does this thing have a
member named `foo`?* — but asks it of different objects, in different phases.

| | JavaScript | TypeScript |
|---|---|---|
| Question asked of | the **value**, at runtime | the **type**, at compile time |
| Algorithm | walk the prototype chain | look up in the declared members of the type (and its bases / apparent type) |
| On failure | evaluates to `undefined` | **TS2339** / **TS2551** |
| Failure is | a *value* | an *error* |

The last row is the whole lesson.

### The JavaScript two-step

```js
(5).toUpperCase()
```

1. **Lookup.** `5` is boxed to a `Number` object. The engine searches
   `Number.prototype`, then `Object.prototype`. Nothing found. The expression
   `(5).toUpperCase` evaluates to `undefined`. **This step does not fail.**
2. **Call.** `undefined()` is not callable ⇒
   `TypeError: (intermediate value).toUpperCase is not a function`.

Only step 2 throws. Everything dangerous about JavaScript's object model lives
in the space between the two steps, because step 1 hands you a perfectly valid
value (`undefined`) that can be stored, returned, passed, interpolated, and
written to a database before anyone calls it.

```js
user.emailAdress            // undefined — no error, ever
user.emailAdress.trim()     // TypeError, one line later
`Hi ${user.emailAdress}`    // "Hi undefined" — mailed to a customer, no error at all
```

The third line is the worst case: **it never throws**, so no monitoring system
will ever tell you about it.

### The TypeScript one-step

TypeScript makes **the read itself** an error:

```
error TS2339: Property 'emailAdress' does not exist on type 'UserRecord'.
```

The `undefined` is never created, so it can never travel. The gap between
defect and diagnostic collapses from "somewhere else, later, maybe never" to
zero characters.

---

## Diagnostics you will see

| Code | Emitted when | Example |
|---|---|---|
| **TS2339** | member absent, no near match | `Property 'toUpperCase' does not exist on type '5'.` |
| **TS2551** | member absent, near match found | `Property 'trimm' does not exist on type 'string'. Did you mean 'trim'?` |
| **TS2571** | member access on `unknown` | `Object is of type 'unknown'.` |
| **TS18048** | member access through a possibly-`undefined` value | `'user.profile' is possibly 'undefined'.` |

Two details from the real output (`npm run evidence`) worth pausing on:

1. **The receiver is reported as a literal type.** `does not exist on type '5'`,
   not `on type 'number'`. The checker tracked the exact value, not merely its
   kind. Literal types are the foundation of discriminated unions in level 04.
2. **`'emailAdress'` gets TS2339 while `'trimm'` gets TS2551.** The spelling
   suggestion fires only when the edit distance is small relative to the
   identifier's length. Same defect class, two codes — a good example of why
   "the compiler said X" should always be checked against the compiler.

---

## Why this generalises beyond typos

The same static-resolution mechanism eliminates a family of bugs that look
unrelated at first:

- **Renamed API.** A library renames `execute` to `run`. Every call site is an
  error at build time instead of a `TypeError` in whichever code path ships to
  a user first.
- **Wrong receiver.** `user.id.toUpperCase()` where `id` became numeric last
  sprint. The property name is spelled perfectly; the type is wrong.
- **Readonly violation.** `readonly number[]` has no `push`, so mutation of a
  frozen array is TS2339 rather than a silent success on a non-frozen copy.
- **Platform mismatch.** With `"lib": ["ES2023"]` and no `"DOM"`, `document` is
  simply not in scope. Node code cannot accidentally reference browser globals.

Each of these is *the same compiler operation* — resolve a name against a type
— applied at a different site. That is what it means for a type system to
delete a **class** of bugs rather than an instance of one.

---

## The limit, stated plainly

This protection covers values whose type the compiler actually knows:

```ts
const user = JSON.parse(body);   // `any`
user.emailAdress.trim();         // accepted. No error. Back to JavaScript.
```

`any` disables member resolution entirely, and `JSON.parse` returns `any` by
design, because no compiler can know the shape of bytes arriving from a
network. The defence is to validate at the boundary and type the *validated*
result — the discipline built up in levels 03 and 04, and the failure mode
dissected in `04-expert/12-soundness-holes`.
