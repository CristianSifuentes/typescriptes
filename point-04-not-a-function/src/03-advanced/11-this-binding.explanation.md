# 11 — `this` binding: the mechanism, dissected

**Run it:** `npm run demo:11-this-binding`

---

## `this` is a parameter, and TypeScript lets you say so

In JavaScript, `this` is decided **per call**, not per function: it is
whatever the call syntax happens to bind it to (`obj.method()` binds it to
`obj`; a bare `fn()` binds it to `undefined` in strict-mode module code).
This makes `this` uniquely dangerous among a function's inputs, because it
is the one input the ordinary parameter list never mentions.

TypeScript lets a function declare `this` as an explicit, typed, **first
parameter**:

```ts
scale(this: Calculator, n: number): number { ... }
```

This parameter is erased before emit — it produces no runtime parameter,
`this` still works exactly as JavaScript defines it — but it gives the
checker something new to verify: at every call site, *what value will `this`
actually be, and is it assignable to the declared `this` type?*

---

## Why the diagnostic appears exactly where detachment happens

```ts
const scale = calculator.scale; // fine — `scale`'s TYPE still requires a Calculator `this`
scale(21);                      // TS2684 — but THIS call provides none
```

Extracting `calculator.scale` into a variable is not itself illegal —
nothing about assignability requires an available `this` yet. The error
appears at the **call**, because that is the operation that actually
requires `this` to be supplied, and a bare `scale(21)` supplies none. This
mirrors demo 06's `?.()` distinction between "a value existing" and
"invoking" it: `this` binding is checked at invocation time, against the
concrete call shape used.

---

## Why this bug is easy to introduce and hard to spot by reading

Every one of these looks completely ordinary:

```ts
[21, 42].map(calculator.scale);        // detaches implicitly
button.onclick = calculator.scale;     // detaches implicitly
const handlers = { onScale: calculator.scale }; // detaches implicitly
```

None of them contain an explicit `const x = obj.method` line that a
reviewer might flag as "suspicious." All three pass a method REFERENCE
somewhere that will eventually invoke it as a plain function — the exact
shape `Array.prototype.map`, DOM event handlers, and callback registries all
use. Without a `this` parameter, every one of these compiles silently and
fails only when the callback actually fires. With one, `map`, event
assignment, and object literal construction are each checked at the point
the reference is taken or the callback is invoked, against the same
`this: Calculator` requirement.
