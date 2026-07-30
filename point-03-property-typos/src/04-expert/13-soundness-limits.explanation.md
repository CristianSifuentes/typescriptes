# 13 — The limits of soundness: `any`, `as`, and dynamic keys, dissected

**Run it:** `npm run demo:13-soundness-limits`

---

## The one sentence that explains every case in this demo

> TypeScript verifies that your code is internally consistent with the
> types **you declared**. It has no way to verify that a declared type
> matches **reality** — the actual bytes on a wire, the actual shape of a
> parsed JSON blob, the actual runtime value behind an assertion.

Every mechanism in demos 01–12 protects the *declared* shape. This demo
enumerates the four places where "declared" and "actual" are allowed to
silently diverge.

---

## (a) `any` — there is no property map to consult

`JSON.parse`'s return type is `any` by the TypeScript standard library's own
declaration — not a design flaw, an honest admission: no compiler can know
the shape of bytes that arrive from outside the program. `any` is not a
*permissive* type in the set-theoretic sense used elsewhere in this project
(see point-01's manifesto §3) — it is an **instruction to stop checking**.
`response.email` on an `any` compiles because there is no map for `"email"`
to be absent from; the question "is this a valid property name?" is never
even asked.

## (b) `as T` — the assertion is a claim, not a proof

`raw as User` did not require a double-cast in this demo, and that is worth
dwelling on: TypeScript's `as` succeeds whenever *either* type is assignable
to the *other*. Here, `User` (four required members) is assignable to
`typeof raw` (`{ id, name }`, two members) — a `User` value genuinely would
satisfy `{ id, name }`. That is enough for the compiler to permit the
assertion in the *opposite* direction, even though `raw` itself is missing
`email` entirely. `as` never re-derives that the source value truly has
every member `T` needs; it only checks that the two types are not obviously
unrelated, then takes your word for the rest.

## (c) `as unknown as T` — even that guard, gone

When the two types share *nothing* (a bare `string` and `User`), the single
`as` is rejected: **TS2352**, "neither type sufficiently overlaps." This is
the one built-in guard against wildly wrong assertions. `unknown` sits at
the top of the type lattice — every type is assignable to it, so casting
through it first satisfies the overlap check twice, trivially, and the
guard never fires on the second hop. This pattern is idiomatic enough to
have a name ("double assertion") and is a documented escape hatch, not a
bug — which is exactly why it deserves the same suspicion as `any` in code
review.

## (d) dynamic string keys — the one case that is *not* a hole

`user[fieldName]`, where `fieldName: string` is decided at runtime, is
**rejected by default**: **TS7053**, because `User` has no index signature
and a non-literal string cannot be resolved against a finite property map
(this is resolution step 3/4 from demo 12). The checker refuses to silently
downgrade the result to `any`. Reopening it requires a *visible* cast —
`as unknown as Record<string, unknown>` or similar — which is the same
double-assertion pattern as (c), now applied deliberately and locally rather
than accidentally.

---

## Why this list is short, and exhaustive for this project's purposes

| construct | protects declared shape? | protects actual data? |
|---|---|---|
| `.` access on a declared type | yes | never — not its job |
| `any` | no map exists | no |
| `as T` | assertion unchecked | no |
| `as unknown as T` | guard bypassed | no |
| `obj[dynamicKey]`, no index signature | yes, by default (TS7053) | n/a — rejected first |

These four are not scattered exceptions — they are the **complete set of
ways to introduce a value into the program without the compiler deriving
its type from anything it actually checked.** Everywhere else in this
project, a property-name error is a *proof* that the code is wrong. At
these four boundaries, the absence of an error is not a proof of
correctness — it is the compiler declining to make a claim it has no
evidence for. The practical takeaway (repeated from the manifesto): validate
at the edge, keep `as` and `any` review-blocking, and treat every value
that crosses one of these four constructs as a claim, not a fact, until
something — a schema validator, a runtime guard — actually checks it.
