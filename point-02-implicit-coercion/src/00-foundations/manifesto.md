# Foundations — the physics of Concept #2

> **Concept #2.** JavaScript silently coerces values between types
> (`"5" + 3 === "53"`, `0 == ""`, `null - 1 === -1`), producing results the
> programmer never intended. TypeScript blocks these invalid mixed-type
> operations at compile time and forces every conversion to be explicit.

Before any demo, four questions must be answered precisely. Everything else in
this project is a consequence of these four answers.

---

## 1. What is "coercion", formally — and how does *implicit* differ from *explicit*?

**Type coercion** is the automatic conversion of a value from one ECMAScript
type to another, performed by the language itself as a side effect of
evaluating an operator or calling a built-in. ECMAScript defines exactly four
primitive **abstract operations** that perform it (§2 below).

The distinction that matters is not "conversion happens" — conversion always
happens somewhere, in every language with more than one type. It is **who
authored the decision to convert, and where it is visible**:

| | Explicit conversion | Implicit coercion |
|---|---|---|
| **Who decides** | The programmer, in the source text | The language specification, silently |
| **Where it is visible** | At the call site: `Number(x)`, `String(x)`, `Boolean(x)` | Nowhere — it is a side effect of `-`, `==`, `if (x)`, template literals, `+` |
| **Can it fail loudly** | Yes — a validation layer can throw | No — arithmetic coercion bottoms out in `NaN`, never an exception |
| **Reviewable in a diff** | Yes, it is a token in the code | No, the same source character (`+`) means two different algorithms depending on runtime values the reviewer cannot see |

`Number("5")` and `"5" - 0` perform the *identical* underlying algorithm
(`ToNumber`). The difference is entirely pragmatic: one names itself, the
other hides inside an operator that also has a purely numeric meaning. This
project's thesis is not "coercion is a bug" — it is **"undeclared coercion is
a bug, and TypeScript's job is to make every coercion declared."**

---

## 2. What are `ToPrimitive`, `ToNumber`, `ToString`, and `ToBoolean`?

These are the four **abstract operations** the ECMAScript specification
defines to convert a value of any type into a value of a target type. They are
not library functions you call — they are the *algorithms the engine runs
internally* every time an operator needs an operand of a type it doesn't have.

### `ToPrimitive(input, preferredType?)`

Converts an object to a primitive. This is the operation every other
coercion of an object *starts with*, because `ToNumber`, `ToString`, and the
arithmetic/comparison operators cannot act on an object directly.

```
ToPrimitive({ valueOf() { return 42 } })
  1. Does input have Symbol.toPrimitive?  → no (in this example)
  2. hint = "default"
  3. Try methods in order: [valueOf, toString]   (hint "number" reverses this
     to [valueOf, toString] too; hint "string" tries [toString, valueOf] first)
  4. valueOf() returns 42 — a primitive — done.
  ⇒ 42
```

For `+`, arrays, and plain objects the hint is `"default"`; for `Date`,
`toString` is tried first. `Symbol.toPrimitive`, when present, overrides this
algorithm entirely and receives the hint directly (demo 10).

### `ToNumber(input)`

Converts a value to the `number` type.

| input | `ToNumber` result | rule |
|---|---|---|
| `undefined` | `NaN` | defined to be unrepresentable as a number |
| `null` | `0` | defined, deliberately, as zero |
| `true` / `false` | `1` / `0` | boolean-to-number mapping |
| `""` (empty string) | `0` | an empty numeric literal is treated as `0` |
| `"  42  "` | `42` | leading/trailing whitespace trimmed, then parsed as a `StrNumericLiteral` |
| `"42abc"` | `NaN` | the *entire* trimmed string must be a valid numeric literal — no partial parse |
| object | `ToNumber(ToPrimitive(input, "number"))` | objects go through `ToPrimitive` first |

### `ToString(input)`

Converts a value to the `string` type: `undefined → "undefined"`,
`null → "null"`, numbers via their canonical decimal representation
(`NaN → "NaN"`, `-0 → "0"`), and objects via `ToString(ToPrimitive(input, "string"))`
— which is why `[1,2] + ""` is `"1,2"` (arrays join with commas) and
`{} + ""` is `"[object Object]"` (the default `Object.prototype.toString`).

### `ToBoolean(input)`

Converts a value to `boolean` by checking membership in a **fixed, finite
list of falsy values** — everything else is truthy:

```
false, 0, -0, 0n, NaN, "", null, undefined
```

That list has exactly eight members and objects are never on it — `ToBoolean`
never inspects the *contents* of an object, so `Boolean([])` and
`Boolean({})` are both `true`, which is the single most common falsy-coercion
surprise in JavaScript.

---

## 3. Why is `==` considered a design mistake, and what rule makes it unpredictable?

`==` invokes the **Abstract Equality Comparison Algorithm**
(`IsLooselyEqual` in the current spec text). Its full case table has eleven
branches; the one that causes the damage is this pair:

```
If Type(x) is Number and Type(y) is String, return IsLooselyEqual(x, ToNumber(y)).
If Type(x) is String and Type(y) is Number, return IsLooselyEqual(ToNumber(x), y).
```

— and, separately —

```
If x is null and y is undefined, return true.
If x is undefined and y is null, return true.
```

The mistake is not that coercion happens — it is that **the rule is not
transitive**, which breaks the one property every programmer assumes equality
has:

```
"" == 0        → true    (ToNumber("") === 0)
0  == "0"      → true    (ToNumber("0") === 0)
""  == "0"     → false   (both strings: compared WITHOUT coercion, and "" ≠ "0")
```

`"" == 0` and `0 == "0"` are both `true`, yet `"" == "0"` is `false` —
equality that is not transitive is not a coherent relation, it is a lookup
table. `null == undefined` is `true` by an explicit special case, but
`null == 0` is `false` (`null` coerces with *no other type* except
`undefined`) — an asymmetry indistinguishable from an arbitrary choice unless
you have memorized the algorithm.

`===` (`IsStrictlyEqual`) skips all of this: if `Type(x) !== Type(y)`, the
result is `false`, full stop. No `ToPrimitive`, no `ToNumber` call is ever
made. This is why `===` is not "a stricter `==`" — it is a **different,
simpler relation** that happens to agree with `==` whenever the operand types
already match.

---

## 4. What does TypeScript actually check here — and what does it deliberately *not* change?

TypeScript's contribution is **entirely static and entirely pre-runtime**: it
inspects the declared/inferred types of the operands of `+`, `-`, `*`, `/`,
`%`, `**`, `<`, `>`, `==`, and rejects the program if the combination of types
can only be explained by an implicit coercion the type system considers
suspicious. Concretely:

- **Arithmetic operators except `+`** (`-`, `*`, `/`, `%`, `**`, and the
  bitwise/shift operators) require both operands to be `any`, `number`,
  `bigint`, or an enum member. `"5" - 3` is rejected (TS2362/TS2363) even
  though `ToNumber` would happily produce `2` at runtime.
- **`+`** keeps its dual nature — string concatenation and numeric addition
  are both legitimate programs — but every combination *not* covered by
  "both numeric" or "at least one string" is rejected (TS2365), and the
  *result type* changes (`string` vs `number`) so the mistake surfaces one
  step downstream, at the first place the result meets a declared type.
- **`==` / `!=`** are not rejected by default — banning them outright is a
  lint rule (`eslint eqeqeq`), not a type error, because `x == null` is a
  common and type-correct idiom for "null or undefined". What TypeScript
  *does* reject is comparisons between operand types that **provably cannot
  ever be equal** (TS2367 — e.g. comparing a `"pending" | "done"` union
  against `"canceled"`), regardless of which equality operator is used.
- **`strictNullChecks`** removes `null`/`undefined` from every other type,
  so `1 + maybeNull` is rejected before the question "what does `ToNumber`
  do to `null`" even becomes relevant — the coercion is prevented by making
  the *operand type* impossible to construct, not by special-casing the
  operator.

What TypeScript **does not** change:

1. **The runtime algorithms themselves.** `ToPrimitive`, `ToNumber`,
   `ToString`, `ToBoolean`, and the Abstract Equality Comparison Algorithm are
   defined by ECMAScript and executed by the engine exactly as before. There
   is no "TypeScript mode" of the runtime — `tsc` emits plain JavaScript, and
   type annotations are erased before that JavaScript ever runs (see
   `point-01-type-errors`, Concept #1).
2. **Code that reaches `any`.** An `any`-typed operand disables every rule in
   this document simultaneously — `any - any`, `any == any` — because `any`
   is not a set of values with a well-defined coercion behavior, it is an
   instruction to the checker to stop checking (demo 12).
3. **Values that cross the I/O boundary as an assertion rather than a proof.**
   `JSON.parse(text) as Order` types the result `Order` because you *said so*,
   not because anything verified it; if the JSON is malformed, every coercion
   rule above is bypassed on a value the type system was told, incorrectly,
   to trust (demo 13 builds the validation layer that closes this gap).

---

### The one-sentence version

> Coercion is not evil and TypeScript does not abolish it — it makes every
> coercion a **decision with a location**: either a named function
> (`Number`, `String`, a validator) that you can find in a diff, or a
> compile error pointing at the one line where an *undeclared* conversion
> would otherwise have run silently, forever, in production.
