# Concept map — Point 06: compile-time prevention of argument-order mistakes

A navigable decomposition of Concept #6, from the root claim down to each
concrete mechanism. Every leaf names the demo that demonstrates it.

> **Concept #6.** In JavaScript, passing arguments in the wrong order runs
> silently and corrupts logic downstream. TypeScript checks each argument's type
> against the parameter in that exact position, catching swaps at compile time —
> and, when parameters share a primitive type, branded/nominal types make even
> same-typed swaps impossible.

---

## The tree, in one picture

```mermaid
graph TD
    R["<b>Compile-time prevention of argument-order mistakes</b><br/>a swapped call rejected before it can run"]

    R --> F["<b>1. Foundations</b><br/>what binding is, and what checks it"]
    R --> C["<b>2. What positional checking catches</b><br/>the free half"]
    R --> B["<b>3. THE BLIND SPOT</b><br/>same type, different meaning"]
    R --> D["<b>4. Remedies</b><br/>making the types differ, or removing order"]
    R --> L["<b>5. Limits</b><br/>where the protection stops"]

    F --> F1["positional binding<br/><i>argument i binds to parameter i; names are local</i>"]
    F --> F2["the call rule<br/><i>Sᵢ &lt;: Tᵢ for every i, plus arity</i>"]
    F --> F3["structural typing<br/><i>identity is shape, not declared name</i>"]
    F --> F4["nominal typing<br/><i>identity is the name — what brands simulate</i>"]
    F --> F5["type erasure<br/><i>brands cost nothing at runtime</i>"]

    C --> C1["differently-typed swap<br/><i>TS2345 at the first bad position</i>"]
    C --> C2["arity<br/><i>TS2554 fixed · TS2555 with a rest parameter</i>"]
    C --> C3["optionals stay positional<br/><i>you cannot slide past a position</i>"]
    C --> C4["spreads<br/><i>array ⇒ TS2556 · tuple ⇒ checked per element</i>"]
    C --> C5["corruption modes<br/><i>NaN · [object Object] · wrong branch</i>"]

    B --> B1["two numbers<br/><i>aspectRatio(width, height) — n! orderings accepted</i>"]
    B --> B2["two strings<br/><i>transfer(from, to) — the money moves backwards</i>"]
    B --> B3["two booleans<br/><i>the boolean trap: 1 bit, unreadable, high stakes</i>"]
    B --> B4["the fourth corruption mode<br/><i>a plausible answer — no symptom at all</i>"]

    D --> D1["branded types<br/><i>phantom member ⇒ two types over one representation</i>"]
    D --> D2["smart constructors<br/><i>the only place an `as` is allowed</i>"]
    D --> D3["literal unions<br/><i>the cheapest remedy — stop encoding meaning as a bit</i>"]
    D --> D4["options objects<br/><i>order stops being a concept</i>"]
    D --> D5["labeled tuples<br/><i>positions as a type; labels do no checking</i>"]
    D --> D6["type-state builders<br/><i>method names replace positions entirely</i>"]
    D --> D7["reorder / split the function<br/><i>the free fixes, tried first</i>"]

    L --> L1["`as`, `x!`, `any`<br/><i>unchecked assertions launder a brand</i>"]
    L --> L2["`Function` and dynamic dispatch<br/><i>no signature to check against</i>"]
    L --> L3["coarse brands<br/><i>kinds are cheap; ROLES re-open the blind spot</i>"]
    L --> L4["the I/O boundary<br/><i>format is checkable; intent is not</i>"]
```

---

## The tree, as a navigable index

### 0. Root

- **Compile-time prevention of argument-order mistakes** — a call whose
  arguments are in the wrong order is rejected before the program runs, either
  because the types disagree or because you made them disagree.
  → `src/00-foundations/manifesto.md`

### 1. Foundations

- **Positional binding** — a call binds arguments to parameters by position and
  by nothing else; parameter names are local variables inside the body.
  → demo 02, manifesto §1
- **The call rule** — `Sᵢ <: Tᵢ` for every `i`, plus an arity check. The
  parameter's *name* plays no part. → demo 11, manifesto §1
  - **One diagnostic per call** — the checker reports the first mismatching
    position and stops; a two-argument swap surfaces as a single error.
    → demo 01
- **Structural typing** — two types are compatible when their shapes are; a
  type's identity is its structure, not its declared name. → manifesto §2
- **Nominal typing** — identity comes from the name. What brands simulate.
  → manifesto §3
- **Type erasure** — brands have no runtime representation, so nominal safety
  costs nothing. → `npm run erasure`, manifesto §3

### 2. What positional checking catches (the free half)

- **A differently-typed swap** → demo 01 · **TS2345**
- **Arity** — **TS2554** for a fixed parameter list, **TS2555** when a rest
  parameter makes it unbounded. → demo 02
- **Optionals are still positional** — "optional" means the argument may be
  omitted, never that the position may be reused. → demo 02 · TS2345
- **Spreads** — an array cannot satisfy fixed positions (**TS2556**); a tuple
  can, and a wrongly-ordered tuple is caught per element. → demo 02
- **Overloads** — the same rule, noisier output: **TS2769** plus an elaboration
  per candidate. → evidence lab
- **The corruption modes** — `NaN`, `"[object Object]"`, and the inverted branch
  are all differently-typed swaps, so all three are caught. → demo 03

### 3. The blind spot

- **Same type, different meaning** — assignability compares types; two
  parameters of one type produce no disagreement to find. Not a defect, and not
  fixable in a future release. → demo 04, manifesto §2
  - **Two numbers** — `aspectRatio(width, height)`; for *n* same-typed
    parameters the compiler accepts all *n!* orderings. → demo 04
  - **Two strings** — `transfer(from, to, amount)`: the right action performed
    on the wrong entity, with the ledger still balancing. → demo 05
  - **Two booleans** — the boolean trap: least information per value, least
    readable call site, highest stakes. → demo 06
  - **The commutativity trap** — most same-typed swaps are harmless, which
    teaches exactly the wrong lesson. → demo 04
  - **The fourth corruption mode** — a plausible answer, with no symptom for
    review, monitoring, or a test to catch. → demo 03

### 4. Remedies

- **Branded (nominal) types** — a phantom member gives two types one runtime
  representation; the swap becomes **TS2345**. → demo 07
  - **`unique symbol` keys** — so a branded value cannot be forged by an object
    literal. → demo 07
  - **Smart constructors** — the only place an `as` is permitted; validates,
    then tags, so the brand also claims the check ran. → demo 12
  - **`Brand<T, K>` / `Unbrand<B>`** — the reusable toolkit; note that `infer`
    cannot decompose an intersection, so the base type must be recorded in the
    phantom member. → demo 12
- **Literal unions** — the cheapest remedy: stop encoding a domain distinction
  as a bit. Fixes the swap *and* the readability. → demo 06
- **Options objects** — order stops being a concept; diagnostics arrive by name
  (**TS2739**, **TS2741**, **TS2561**) rather than by index. → demo 08
- **Labeled tuples** — positions as a type. The labels are documentation and do
  **no** checking; brand the elements to get safety. → demo 09
- **Type-state builders** — method names replace positions, so two same-typed
  values need no brand; `build` is typed `never` until complete (**TS2349**).
  → demo 10
- **Reorder, or split the function** — the free fixes, worth trying first.
  → demo 14

### 5. Limits

- **`as`, `x!`, `any`** — unchecked assertions; `as unknown as` launders one
  brand into another and defeats even **TS2352**. → demo 13
- **`Function` and dynamic dispatch** — no signature to check against. Note that
  `apply` on a *typed* callee **is** checked (`strictBindCallApply`), so the
  hole is the `Function` type. → demo 13
- **Coarse brands** — kinds are cheap to brand; **roles** re-open the blind spot
  with brands already in place (`send(to: AccountId, from: AccountId)`).
  → demo 13
- **The I/O boundary** — validation checks format, never intent. Outside the
  type system entirely. → demo 13
- **The decision procedure** — is a swap here silent, and is it expensive?
  → demo 14

---

## Reading order

| if you want… | read / run |
|---|---|
| the theory first | `src/00-foundations/manifesto.md` |
| to see brands cost nothing | `npm run erasure` |
| the shortest convincing demo | `npm run demo:01-swapped-arguments` |
| **the point of the whole project** | `npm run demo:04-same-type-numbers` |
| the remedy | demo 07, then 12 |
| the alternatives to branding | demos 08 → 09 → 10 |
| the honest limits | demo 13, then 14 |
| proof rather than prose | `npm run evidence` |
| everything, in order | `npm run demo:all` |
