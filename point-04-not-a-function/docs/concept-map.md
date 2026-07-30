# Concept map — Concept #4: compile-time verification of callable invocation

> **Root claim.** `f(...)` type-checks iff `f`'s static type carries a call
> signature and the arguments are assignable to it — checked entirely from
> declared types, before any code runs. Every branch below is one
> consequence of that single rule, isolated in its own demo.
>
> Read `src/00-foundations/manifesto.md` first — it derives the root claim.
> This document indexes what follows from it.

---

## Mermaid overview

```mermaid
flowchart TD
    ROOT["Compile-time verification of callable invocation<br/>(a call signature is a type; assignability is checked, not hoped for)"]

    ROOT --> CALLABLE["Callable-type checking<br/>does the target's type have a call signature at all?"]
    ROOT --> EXISTENCE["Member existence, checked first<br/>a call signature can't be asked about a member that isn't there"]
    ROOT --> SHAPE["Call-signature shape checking<br/>right member, wrong signature"]
    ROOT --> NULL["Nullable / absent callables<br/>strictNullChecks over a union with a non-callable member"]
    ROOT --> OVERLOAD["Overload resolution<br/>multiple call signatures, matched in order"]
    ROOT --> THIS["this-context checking<br/>this as a checkable, erasable parameter"]
    ROOT --> NARROW["Narrowing to callable<br/>typeof x === \"function\" as a type guard"]
    ROOT --> VARIANCE["Function assignability variance<br/>contravariant parameters, covariant returns"]
    ROOT --> DISPATCH["Closed dynamic dispatch<br/>a verified key set instead of an open string"]
    ROOT --> LIMITS["Soundness limits<br/>where the guarantee stops applying"]

    CALLABLE --> C1["demo 01 — a non-callable primitive (TS2349)"]

    EXISTENCE --> E1["demo 02 — misspelled method (TS2551)"]
    EXISTENCE --> E2["demo 03 — real method, wrong type (TS2339/TS2345)"]

    SHAPE --> S1["demo 04 — function-typed variable assignability (TS2322)"]
    SHAPE --> S2["demo 05 — a data field called as a method (TS2349)"]
    SHAPE --> S3["demo 07 — non-callable argument as a callback (TS2345)"]
    SHAPE --> S4["demo 09 — hybrid callable + property types (TS2322)"]

    NULL --> N1["demo 06 — optional method, ?.() (TS18048)"]
    NULL --> N2["demo 08 — mutable Fn | undefined field, if-narrowed (TS18048)"]

    OVERLOAD --> O1["demo 10 — overload resolution, no match (TS2769)"]

    THIS --> T1["demo 11 — detached method, explicit this parameter (TS2684)"]

    NARROW --> W1["demo 12 — typeof-narrowing a number | function union (TS2349)"]

    VARIANCE --> V1["demo 16 — contravariant handler parameters (TS2345)"]

    DISPATCH --> D1["demo 13 — generic keyof-driven resolution, narrated (TS2345)"]
    DISPATCH --> D2["demo 15 — closed union + total Record + never exhaustiveness (TS2345/TS2741)"]

    LIMITS --> L1["demo 14 — any, as, and unchecked lookups reopening the hole"]
    LIMITS --> L2["demo 17 — Function (wide) vs a precise call signature (TS2322)"]

    style ROOT fill:#4c1d95,color:#fff
    style LIMITS fill:#7c2d12,color:#fff
```

---

## Navigable index

- **Compile-time verification of callable invocation** — the root mechanism: a call signature is a type, and invocation is checked by ordinary assignability, before execution.
  - **Callable-type checking** — does the static type of the target have a call signature at all?
    - [demo 01](../src/01-basic/01-noncallable-value.explanation.md) — calling a plain non-function value (`5()`); **TS2349**.
  - **Member existence, resolved before callability** — a member must be found in the type's property map before the compiler can ask whether it's callable.
    - [demo 02](../src/01-basic/02-misspelled-method.explanation.md) — a misspelled method name; **TS2551**.
    - [demo 03](../src/01-basic/03-wrong-type-method.explanation.md) — a real method that exists on a *different* type; **TS2339**/**TS2345**.
  - **Call-signature shape checking** — the member exists and is callable, but the *specific* signature must match, or the *value* assigned into a function-typed slot must itself be a function.
    - [demo 04](../src/01-basic/04-function-typed-variable.explanation.md) — assigning a non-function into a `() => void` slot; **TS2322**.
    - [demo 05](../src/02-intermediate/05-property-not-function.explanation.md) — a config field that holds data, called as a method; **TS2349**.
    - [demo 07](../src/02-intermediate/07-noncallable-callback.explanation.md) — a non-callable value passed where a callback parameter is declared; **TS2345**.
    - [demo 09](../src/03-advanced/09-call-signatures-hybrid.explanation.md) — a **hybrid type** (call signature + ordinary properties); missing either half fails; **TS2322**.
  - **Nullable / absent callables** — `strictNullChecks` refusing invocation of a union that includes a non-callable member (`undefined`).
    - [demo 06](../src/02-intermediate/06-optional-chaining-call.explanation.md) — an optional method (`onError?:`), fixed with `?.()`; **TS18048**.
    - [demo 08](../src/02-intermediate/08-strict-null-invocation.explanation.md) — a mutable `Handler | undefined` field, fixed with `if` narrowing; **TS18048**.
  - **Overload resolution** — a type with *multiple* call signatures; a call is checked against each in order.
    - [demo 10](../src/03-advanced/10-overloads.explanation.md) — a call matching none of the declared overloads; **TS2769**.
  - **`this`-context checking** — `this` as an explicit, typed, erasable first parameter, checked at every call site.
    - [demo 11](../src/03-advanced/11-this-binding.explanation.md) — a detached method losing its `this`; **TS2684**.
  - **Narrowing to callable** — `typeof x === "function"`, a compiler-recognised type guard for unions where "not callable" isn't just "absent."
    - [demo 12](../src/03-advanced/12-narrowing-to-callable.explanation.md) — a `number | (() => number)` config value; **TS2349** unguarded, safe once narrowed.
  - **Function assignability variance** — parameter types are checked *contravariantly*: a handler substitutes safely only if its parameters are the same or wider.
    - [demo 16](../src/04-expert/16-function-variance.explanation.md) — a click-only handler rejected where a general event handler is required; **TS2345**.
  - **Closed dynamic dispatch** — replacing an open `string` key with a closed union so a missing or renamed handler is a type error, not a runtime lookup miss.
    - [demo 13](../src/04-expert/13-invocation-resolution-model.explanation.md) — the full five-step resolution algorithm, narrated through a generic RPC dispatcher; **TS2345**.
    - [demo 15](../src/04-expert/15-typed-dispatch-registry.explanation.md) — a closed `CommandId` union, a total `Record<CommandId, Handler>`, and `never`-exhaustiveness, closing the bug from three independent directions; **TS2345**/**TS2741**.
  - **Soundness limits** — where compile-time checking necessarily stops, because the target's type was asserted rather than derived.
    - [demo 14](../src/04-expert/14-soundness-limits.explanation.md) — `any`, `as`, and an unchecked lookup each reopening the "is not a function" crash; the boundary-validation fix.
    - [demo 17](../src/04-expert/17-function-vs-precise-signatures.explanation.md) — the built-in `Function` type (`(...args: any[]) => any`) versus a precise call signature; **TS2322**.

---

## How to read this tree

1. **Trunk → CALLABLE / EXISTENCE / SHAPE** (levels 01–02) answers *"is there
   a call signature here at all, and does it match?"* — the literal content
   of Concept #4's headline claim.
2. **NULL / OVERLOAD / THIS / NARROW** (levels 02–03) extend the same
   question into the shapes real programs actually use: optional hooks,
   multiple valid call forms, implicit context, and heterogeneous unions.
3. **VARIANCE / DISPATCH** (level 04) turn the question around: instead of
   checking one call against one signature, they check whether an entire
   *function value* may safely stand in for another, and whether an entire
   *table* of handlers is provably complete.
4. **LIMITS** (level 04) is the tree's honest boundary — the two branches
   that show precisely where "compile-time verified" stops being true, and
   why that boundary is inherent to static typing rather than a defect in
   TypeScript specifically.

Every leaf names the exact `TSxxxx` diagnostic produced — none of them are
asserted without the corresponding `compilerSays(...)` call in that demo's
`*.ts-safe.ts` file being backed by the compiler's real output (verify with
`npm run demo:<id>` or `npm run demo:all`).
