# 05 — Object-to-primitive coercion: `ToPrimitive`, and a genuine gap

**Run it:** `npm run demo:05-object-to-primitive`

---

## The JavaScript side: `ToPrimitive` before anything else can happen

No operator that expects a primitive (`+`, `-`, `==`, template literals) can
act on an object directly. Every one of them calls `ToPrimitive(object, hint)`
first. Without a `Symbol.toPrimitive` method (demo 10 covers that hook), the
algorithm tries, in hint-dependent order, `valueOf()` then `toString()`:

```
ToPrimitive([], "default")
  1. [].valueOf()   -> [] itself (not a primitive — REJECTED, try next)
  2. [].toString()  -> Array.prototype.join(",") of no elements -> ""
  ⇒ ""

ToPrimitive({}, "default")
  1. {}.valueOf()   -> {} itself (not a primitive — REJECTED, try next)
  2. {}.toString()  -> Object.prototype.toString -> "[object Object]"
  ⇒ "[object Object]"
```

`Date` is the one built-in with the hint order reversed for `"default"`: it
tries `toString()` **before** `valueOf()`, which is why concatenating a
`Date` with `+` produces a human-readable string while `+date` (hint
`"number"`, which still tries `valueOf` first for `Date`) produces the epoch
timestamp.

`{} + []` at the start of a statement is not even the expression it looks
like: a leading `{` is parsed as a block statement, so `{} + []` becomes an
empty block followed by the expression statement `+[]` (unary plus,
`Number([])` = `0`). Parenthesizing — `({} + [])` — forces the object-literal
interpretation and restores `"[object Object]"`.

---

## The TypeScript side: the same `+` rule as demo 01, and its blind spot

`+`'s typing rule has two branches: *both numeric* → `number`, or
*at least one side is `string`* → `string`. Neither branch cares whether the
**other** operand is a well-behaved value:

```ts
[] + []              // TS2365 — neither side is string/number/bigint
[1, 2] + [3, 4]       // TS2365 — same reason
"[" + event + "] " + metadata   // COMPILES — the running result is already
                                 // `string` by the time it meets `metadata`
```

```
error TS2365: Operator '+' cannot be applied to types 'never[]' and 'never[]'.
```

Array-with-array is caught because arrays are never `string`/`number`/
`bigint`. **String-with-plain-object is not caught**, because the moment one
side is already `string`, the rule's second branch fires unconditionally —
it does not ask "does this object have a meaningful `toString`?", only "is
either side a string?". `"total: " + orderTotal` (where `orderTotal` might
be a well-designed `Money` class with a real `toString()`) is legitimate,
common code, and the type system cannot distinguish that from
`"[" + event + "] " + metadata` producing `"[object Object]"` — both have
exactly the same *type* shape (`string + T`).

---

## Comparison table

| Expression | JavaScript result | TypeScript verdict |
|---|---|---|
| `[] + []` | `""` | **TS2365** |
| `[1,2] + [3,4]` | `"1,23,4"` | **TS2365** |
| `"[" + event + "] " + metadata` | `"[object Object]"` | **compiles — no error** |
| `createdAt + " (created)"` | a readable date string | compiles — correct and intentional |
| `+createdAt` | the epoch timestamp | compiles — correct and intentional |

---

## Where this demo admits a limit

**This is one of the project's genuine gaps, not a design flaw to route
around with a stricter flag.** Forbidding `string + T` for every non-string
`T` would also forbid the *legitimate* pattern of concatenating a value whose
class defines a meaningful `toString()`, which TypeScript has no static way
to distinguish from `Object.prototype`'s default. The fix is a **naming and
API discipline**, not a compiler setting: prefer `JSON.stringify(metadata)`
or a named `.describe()`/`.toLogLine()` method — something that makes the
serialization decision visible in the source text — over relying on `+` to
"just work" for anything that isn't already known to be a primitive.

---

## Verify

```bash
npm run evidence                    # see TS2365 emitted for array/array cases
npm run demo:05-object-to-primitive
```
