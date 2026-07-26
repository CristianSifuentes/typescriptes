# Foundations — the physics of Concept #3

> **Concept #3.** In JavaScript, misspelling a property name (`user.nam`
> instead of `user.name`) silently returns `undefined`, and the bug
> propagates until it detonates somewhere far away. TypeScript verifies,
> against the declared shape of every object, that each property you read or
> write actually exists — flagging the typo the instant you type it, and
> offering autocomplete so it never happens.

Four questions must be answered precisely before any demo. Everything else in
this project is a consequence of these four answers.

---

## 1. What exactly *is* an object's "shape", formally?

An object's **shape** is its **property map**: a finite function from
property names to types.

```ts
interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly age?: number;
}
```

Formally, `User` denotes the set

```
{ p : id ↦ string, name ↦ string, email ↦ string, age ↦ number | undefined, ... }
```

i.e. the set of every record that has (at least) an `id` mapped to a
`string`, a `name` mapped to a `string`, an `email` mapped to a `string`, and
optionally an `age` mapped to a `number`. `interface` and `type` are two
different pieces of *syntax* for writing this function down; the compiler
treats the resulting property map identically either way (with one narrow
exception: only `interface` supports declaration merging).

The property map is a **contract**, not a description, because the compiler
uses it in both directions:

- **On read**, `user.name` is legal only if `"name"` is a key of the map —
  the map bounds what you are *allowed to ask for*.
- **On write**, `user.name = "Ada"` is legal only if `"name"` is a key of the
  map *and* `string` is assignable to the value the map promises — the map
  bounds what you are *allowed to promise back*.
- **On construction**, a value claiming to be a `User` must supply every
  non-optional key the map lists — the map bounds what counts as *complete*.

None of this exists in JavaScript. A JavaScript object is a mutable hash map
with no declared domain: any string is a legal key to read (yielding
`undefined` if absent) and any string is a legal key to write (creating it if
absent). "Shape" in JavaScript is a belief held by the programmer, checked by
nothing. TypeScript's contribution is to make that belief inspectable,
enforceable, and — crucially — the same artefact the editor uses to offer
autocomplete. The property map is not a lint rule bolted on top of
JavaScript; it *is* the type.

---

## 2. What is structural typing, and why does TypeScript use it?

Two ways to decide whether a value of type `A` may be used where a type `B`
is expected:

- **Nominal typing** (Java, C#, Rust's traits by default): `A` is compatible
  with `B` only if `A` was *declared* to be a `B` — by `extends`,
  `implements`, or explicit conversion. Compatibility is a fact about
  *names* in the source.
- **Structural typing** (TypeScript, OCaml's row polymorphism, Go's
  interfaces): `A` is compatible with `B` if `A`'s property map is a
  **superset** of `B`'s — every member `B` requires, `A` has, with a
  compatible type. Compatibility is a fact about *shape*, independent of
  declaration.

TypeScript chose structural typing — colloquially "duck typing, statically
checked" — for a reason inseparable from its purpose: **it is layered on top
of JavaScript, whose values have never carried a declared type.** A JSON
response, the return value of a third-party function, an object built by
spreading two others: none of these come with a nominal tag. If TypeScript
required an explicit `implements`, it would reject enormous amounts of
completely correct, already-working JavaScript. Structural typing lets the
compiler ask the only question that is actually decidable from the value
itself: *does this thing have the members I need?*

The compiler answers that question by comparing **property maps**, not
names:

```ts
interface Point2D { x: number; y: number }
interface Coordinate { x: number; y: number }

const p: Point2D = { x: 1, y: 2 };
const c: Coordinate = p; // OK — same property map, different declared names
```

`Point2D` and `Coordinate` were declared independently, never mention each
other, and are nonetheless mutually assignable, because assignability is
defined as *"every member the target requires is present, with a compatible
type in the source"* — a check over the two property maps, not over an
inheritance graph. See `03-advanced/08-structural-typing` for the full
demonstration, including where structural typing and typo-catching appear,
at first glance, to be in tension.

---

## 3. What is excess-property checking, and why only for fresh literals?

Structural typing, taken alone, has a hole: a value with *more* members than
required is still assignable (its property map is a superset). That is
correct and necessary for subtyping — it is what lets a `PremiumUser` stand
in for a `User`. But applied without qualification to object *literals*, it
would make **every typo invisible**, because a typo is indistinguishable from
an extra member:

```ts
const u: User = { id, name, emial: "a@b.c" }; // "emial" — a typo of "email"
```

That object genuinely satisfies every requirement `User` states (it has
`id`, `name`, and something extra); pure structural subtyping would accept
it, and the true `email` field would simply be missing, silently.

TypeScript closes this hole with **excess-property checking**, sometimes
called "freshness". An object literal written directly in a position with a
known target type is marked **fresh**, and a fresh literal is held to a
*stricter* rule than ordinary assignability: it may declare **no members
beyond those the target type allows**. This is why the literal above is
rejected with **TS2561**.

Freshness is a property of the *expression*, not the *type*, and it is lost
the instant the literal is bound to a variable:

```ts
const loose = { id, name, emial: "a@b.c" };
const u: User = loose; // ACCEPTED — `loose` is no longer a fresh literal
```

This is not an inconsistency; it is the deliberate boundary between two
different jobs:

| mechanism | question it answers | applies to |
|---|---|---|
| structural subtyping | "does this value have everything the target needs?" | every value, always |
| excess-property checking | "did you just typo a member while constructing this?" | fresh object literals only |

Excess-property checking exists **only** at the literal because that is the
one syntactic position where a typo is (a) likely — you are typing member
names by hand — and (b) otherwise invisible to subtyping. See
`03-advanced/09-excess-property-subtlety` for the mechanism in full, and
`01-basic/03-excess-property` for the first, simplest encounter with it.

---

## 4. Why does catching a typo at compile time delete a whole *class* of bugs?

Because the check is not "does this one call site look right today?" but "is
it possible, for *any* value the type describes, for this property access to
be wrong?" — a claim quantified over every future call site, not just the
one you are looking at.

Concretely: once `interface Order { totalCents: number }` compiles cleanly
against every read and write of `order.totalCents` in the codebase, the
compiler has established that **no expression anywhere — not the one you
wrote today, not the one a colleague writes next quarter — reads or writes a
member `Order` does not declare.** The category *"a property name on `Order`
was mistyped"* has been deleted, not patched at one location.

Contrast with the JavaScript alternative: a typo like `order.totlaCents = x`
does not fail at the call site. It fails — or worse, does *not* fail — at
some unrelated point downstream, once the missing update is finally noticed:
a discount that silently never applied, a total that renders as `$NaN`, a
customer who emails support. The distance between **cause** (the typo) and
**symptom** (the wrong behaviour) can be arbitrarily large, which is exactly
why these bugs are expensive: the debugging effort is spent re-discovering a
fact — "this property does not exist" — that a compiler can establish in
milliseconds, once, for every possible execution.

This is the same universal-vs-existential distinction that underlies type
checking generally (see point-01's manifesto): a passing test says "for this
one input, nothing broke"; a compiler accepting `order.totalCents` says "for
every input the type `Order` can describe, this access is valid." Property
checking is that same guarantee, specialised to the single most common shape
of JavaScript bug: the small, silent, catastrophic misspelling.

---

### The one-sentence version

> TypeScript does not check that *this* property access happens to be
> correct today; it checks that the *entire class* of accesses this
> expression could ever perform, against the shape the type declares, cannot
> be wrong — and it tells you before the program runs, in the same breath
> that offers you the correct spelling as you type.
