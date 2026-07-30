# 14 — The limits of soundness: where `is not a function` comes back

**Run it:** `npm run demo:14-soundness-limits`

---

## TypeScript checks *declared* types, not *actual* values

Manifesto §3 is precise about what gets checked: a call type-checks when
the target's *static* type has a matching call signature. Everything this
project has demonstrated up to this demo relies on that static type being
**derived** — inferred from a literal, propagated from a declaration,
computed from a generic — so that it is guaranteed to describe the value
correctly. `as` and `any` are the two places that guarantee breaks: both let
a human **assert** a type instead of the compiler **deriving** one, and an
assertion can be wrong.

---

## `as`: proof by assertion is not proof

```ts
const config = JSON.parse(rawJson) as PluginConfig;
```

`JSON.parse` returns `any` — TypeScript has no way to know, from the return
type alone, what shape a parsed JSON blob has. `as PluginConfig` does not
*check* that the parsed value matches `PluginConfig`; it tells the compiler
to stop asking. Every later use of `config`, including `config.onInit()`,
is checked against `PluginConfig` **as if** the assertion were correct —
which is exactly why this line passes `tsc --noEmit` with zero output and
still throws at runtime when the assertion is wrong.

---

## `any`: not a permissive type, but the absence of one

`5()` fails with **TS2349** because `number` is a *known* type with *no*
call signature (manifesto §1). `(x: any)(); ` never fails, for a completely
different reason: `any` disables type checking for that value entirely — it
is not "a type that happens to be callable," it is TypeScript declining to
have an opinion. `noImplicitAny` (enabled in this project) prevents `any`
from appearing **by accident** (an unannotated parameter, a forgotten
return type); it cannot prevent someone from writing `: any` **on
purpose**, because that annotation is a deliberate, explicit request to opt
out.

---

## An index signature is a promise nothing enforces

`Record<string, () => void>` types every conceivable string key as
`() => void`. This project's own `noUncheckedIndexedAccess` flag weakens
that promise to `(() => void) | undefined`, forcing a guard before use
(exactly demo 08's mechanism) — but a stray `as any` at the lookup site
throws that guard away just as effectively as it throws away `PluginConfig`
in the first hole. The type system's promises are only as strong as the
weakest cast standing between a value and its use.

---

## The actual fix: verify *before* asserting, not instead of it

```ts
if (typeof parsed === "object" && parsed !== null &&
    "onInit" in parsed && typeof (parsed as { onInit: unknown }).onInit === "function") {
  return parsed as PluginConfig; // NOW the assertion follows a real check
}
```

The fix is not "avoid `as`" — narrowing an `unknown` value still ends in an
assertion, because TypeScript's control-flow narrowing cannot invent brand
new interface names on its own. The fix is *where* the assertion sits:
after a `typeof`/`in` check has done real runtime work, an `as` merely
labels a fact already established; before one, it is a hope. Every demo in
this project up through this one showed the compiler catching an invalid
call from *inside* the type system. This demo is the reminder that the type
system's boundary is not the edge of the program — it is the edge of what
was ever given a derived, rather than asserted, type.
