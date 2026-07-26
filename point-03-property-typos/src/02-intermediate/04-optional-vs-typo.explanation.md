# 04 — Optional properties vs typos: the mechanism, dissected

**Run it:** `npm run demo:04-optional-vs-typo`

---

## The confusion JavaScript cannot resolve

```js
orderWithoutNote.note   // undefined — legitimately absent
orderWithNote.nots      // undefined — misspelled; the real value exists under 'note'
```

Both expressions evaluate to `undefined`. There is nothing in the runtime
value that says *why*. JavaScript conflates "this key is optional and simply
wasn't provided" with "this key does not exist because it was mistyped" —
they are the same fact at runtime: absence.

---

## Why TypeScript never confuses the two

`note?: string` does **not** remove `"note"` from the property map — it adds
it, with value type `string | undefined`. The property map after parsing
`interface Order { note?: string }` literally contains the key `"note"`.
Compare:

| declaration | is `"note"` a key of the map? | value type |
|---|---|---|
| `note?: string` | **yes** | `string \| undefined` |
| *(nothing declared)* | **no** | — |

So `order.note` and `order.nots` are checked against **completely different
facts**:

- `order.note` — the key exists; the compiler additionally knows its value
  *might* be `undefined`, and refuses `.length` on it until you prove
  otherwise. Diagnostic: **TS18048** ("possibly undefined").
- `order.nots` — the key is not in the map at all, full stop. Diagnostic:
  **TS2339** ("does not exist").

These are not two flavours of the same error. TS18048 says *"you have the
right key, now handle the case where it's empty."* TS2339 says *"that is not
a key of this type."* JavaScript's single `undefined` value collapses two
questions that TypeScript keeps permanently separate, because it is
reasoning about the *property map*, never about a runtime value.

---

## The three disciplined ways to consume an optional member

```ts
if (order.note !== undefined) order.note.length;  // narrowing → string
const text = order.note ?? "(none)";              // ??       → string
const len  = order.note?.length;                  // ?.       → number | undefined
```

Each is a genuinely different answer to "what if it's absent?" (crash-guard,
default value, propagate-the-absence), and the compiler tracks exactly which
one you chose — narrowing is covered in depth in point-01's demo 07; here the
relevant fact is only that all three routes terminate in a type with no
`undefined` left un-handled, which is what makes `.length` legal again.
