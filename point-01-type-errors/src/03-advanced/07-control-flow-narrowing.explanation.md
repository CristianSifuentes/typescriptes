# 07 — Control flow analysis and narrowing: the mechanism, dissected

**Run it:** `npm run demo:07-narrowing`

---

## The name of the thing

**Narrowing** (in the literature: *occurrence typing* or *flow-sensitive
typing*) is the compiler's ability to give the **same reference different types
at different program points**, based on the checks that dominate those points.

It is what makes union types usable. Without it, `string | number` would be a
type you could declare and never touch.

---

## The algorithm

1. **Build the control flow graph (CFG).** Nodes are statements and
   expressions; edges are possible transfers of control (branches, loops,
   `return`, `throw`, `&&`/`||` short-circuits, `?:`).
2. **Recognise type guards.** A guard is a syntactic form the checker knows how
   to interpret as a *filter* on a type:

   | guard | filter on the true edge |
   |---|---|
   | `typeof x === "string"` | keep members whose `typeof` facet is `"string"` |
   | `x === null` / `x == null` | keep `null` (and `undefined`, for `==`) |
   | `x !== undefined` | drop `undefined` |
   | `"k" in obj` | keep members declaring `k` |
   | `x instanceof C` | keep members assignable to `C`'s instance type |
   | `Array.isArray(x)` | declared in lib.d.ts as `arg is any[]` |
   | `r.kind === "a"` | keep members whose `kind` includes `"a"` |
   | `isFoo(x)` (user predicate) | keep `Foo` |
   | `if (x)` | drop the falsy members (`null`, `undefined`, `0`, `""`, `false`, `NaN`) |

3. **Apply the filter on each outgoing edge**: the surviving members on the true
   edge, the complement on the false edge.
4. **Union at merge points**, where branches rejoin.
5. **Reset on assignment**: an assignment is a flow node, so the reference's
   type becomes the type of the assigned expression.

In set terms: **narrowing is set subtraction along CFG edges; a merge is set
union**. Every trace the demo prints is a snapshot of that set.

---

## What the demo proves, point by point

For `value: string | number | readonly string[] | null`:

| point | code position | type | why |
|---|---|---|---|
| A | function entry | `string \| number \| readonly string[] \| null` | declared type |
| B | inside `value === null` | `null` | keep members ≡ `null` |
| C | after the early `return` | `string \| number \| readonly string[]` | complement |
| D | inside `typeof value === "string"` | `string` | typeof filter |
| E | inside `typeof value === "number"` | `number` | typeof filter |
| F | all guards false | `readonly string[]` | residual set |

Six program points, six types, **one binding**. Each row is verified at compile
time by `proveType<T>()` — if the compiler disagreed with the printed string,
the project would not build (TS2554).

---

## Faithfulness to JavaScript's warts

TypeScript models `typeof` **as it actually behaves**, not as it should have
behaved:

```ts
if (typeof setting === "object") {
  Object.keys(setting);   // TS18047: 'setting' is possibly 'null'
}
```

`typeof null === "object"` has been true since 1995 and cannot be fixed without
breaking the web. The checker knows this, does **not** remove `null` on that
edge, and forces you to handle it. A type system that "cleaned up" the language
here would be unsound — it would be describing a language nobody runs.

---

## Where narrowing correctly gives up

These are not bugs. They are the compiler refusing to assert what it cannot
prove.

### (a) Deferred callbacks over mutable bindings

```ts
let name: string | null = "ada";
if (name !== null) {
  queueMicrotask(() => name.length);   // TS18047: 'name' is possibly 'null'
}
name = null;
```

The callback may run **after** another assignment. Fix: copy into a `const`
inside the guard — a `const` cannot be reassigned, so the narrowing survives.

### (b) Property narrowing across a function call

`if (obj.a !== null) { mutate(); obj.a.length }` — the call could have
reassigned `obj.a`. TypeScript preserves narrowing of property accesses only
while it sees no interfering assignment; treat that as a courtesy rather than a
guarantee and destructure into a local.

### (c) Truthiness is not presence — and this the compiler *cannot* catch

```ts
const effective = retries ? retries : 3;   // retries === 0 → 3. Wrong.
const correct   = retries ?? 3;            // retries === 0 → 0. Right.
```

Both are type-correct. The first is a **semantic** bug: `0` and `""` are valid
values *and* falsy. No type system decides for you whether you meant "absent"
or "falsy"; you have to say which. `??` and `!== undefined` say it.

---

## Comparison

| check | what JavaScript guarantees afterwards | what TypeScript knows afterwards |
|---|---|---|
| `typeof x === "string"` | nothing | `x: string` on the true edge, complement on the false |
| `typeof x === "object"` | nothing | `x: object \| null` — `null` deliberately retained |
| `else` branch | nothing | the exact complement of the union |
| `if (x)` | nothing | falsy members removed (which may be too many) |
| `"k" in obj` | only that the key exists | members declaring `k` |
| after reassignment | nothing | re-narrowed at the assignment node |

The JavaScript column is empty in every row. That is the entire lesson: **in
JavaScript a check is an if-statement; in TypeScript a check is a proof.**
