# 04 — The same-type blind spot: the mechanism, dissected

**Run it:** `npm run demo:04-same-type-numbers`

This is the hinge of the project. Levels 01 and 03 exist to frame this one page.

---

## The claim, stated exactly

> TypeScript **cannot** catch a swap between two parameters of the same type,
> and this is not a defect that a future release will fix.

Not "usually cannot", not "cannot without extra configuration". The reason is
structural, in both senses of the word.

---

## Why

Assignability compares **types**. For

```ts
function aspectRatio(width: number, height: number): number
```

the check at each position is `number → number`, which succeeds in **both**
orderings. The types agree; only the *meaning* differs — and meaning is not part
of a type in a **structurally typed** system.

> **Structural typing**: two types are compatible when their *shapes* are
> compatible. A type's identity is its structure, not its declared name.

`width: number` and `height: number` have identical structure. To TypeScript
they are not "confusingly similar" — they are **the same type**. That is what
`number` means: the set of all IEEE-754 doubles, with no further distinction.

### The proof, rather than the assertion

The demo does not merely claim this. It asks the compiler:

```ts
type WidthParam  = Parameters<typeof aspectRatio>[0];
type HeightParam = Parameters<typeof aspectRatio>[1];
type _TheBlindSpot = Expect<Equals<WidthParam, HeightParam>>;   // compiles
```

`Equals<A, B>` is `true` only when the compiler considers A and B the same type.
That alias type-checks, so the compiler is confirming, on the record, that the
two parameter types are identical. The blind spot is not an observation about
behaviour — it is a fact the type system will state on request.

---

## The commutativity trap

Most same-typed swaps a developer meets are harmless:

```ts
areaOfRectangle(3, 10) === areaOfRectangle(10, 3)   // multiplication commutes
```

This teaches exactly the wrong lesson — *"width and height are interchangeable,
they're just numbers"* — and the lesson holds right up until the same two values
reach `/`, `>`, or a crop rectangle:

| operation | `f(3, 10)` | `f(10, 3)` | swap matters? |
|---|---|---|---|
| `width * height` | 30 | 30 | no |
| `width / height` | 0.3 | 3.33 | **yes** |
| `width > height` | `false` | `true` | **yes** |
| `cropTo(x, y, w, h)` | valid crop | crop outside the image | **yes** |

The trap is not the dangerous case. It is the long run of safe cases that
precede it.

---

## How large is the accepted space?

For *n* parameters of one type, the compiler accepts **all n! orderings**:

| same-typed parameters | orderings accepted | correct | silently wrong |
|---|---|---|---|
| 2 | 2 | 1 | 1 |
| 3 | 6 | 1 | 5 |
| 4 | 24 | 1 | **23** |
| 5 | 120 | 1 | **119** |

`cropTo(x, y, width, height)` is the four-parameter row. This is the strongest
practical argument for **options objects** (demo 08): past three parameters,
position is a liability regardless of types.

---

## The bug profile, compared

| property | swap of **different** types (level 01) | swap of **same** types (here) |
|---|---|---|
| caught by TypeScript | yes — TS2345 | **no** |
| visible symptom | `NaN`, `"[object Object]"`, a crash | **none — a plausible number** |
| visible in review | no | no |
| caught by a test | if one exists | only if it asserts the *direction* |
| discovered by | the compiler, immediately | an auditor, a customer, or nobody |

Read the columns against each other. The left column is what TypeScript already
fixed. The right column is what remains — and it is the column with no symptoms.

---

## Where the blind spot ends

It is exactly and only *"same type, different meaning"*. As soon as **one** of
the swapped parameters differs in type, positional checking bites again. In the
evidence lab, `_level-02.tsc-error.ts` contains a dozen silently-accepted swaps
and exactly one error:

```
error TS2345: Argument of type 'boolean' is not assignable to parameter of type 'string'.
```

That single diagnostic in an otherwise silent file *is* the shape of the gap.

---

## Which suggests the remedy

If the check only works when the types differ — **make the types differ**.

Two numbers that mean different things should be two different types. There is
no way to say that with `number`, so we need a way to manufacture distinct types
over the same runtime representation. That is a **branded type**, and it is
demo 07.
