# 12 — Soundness holes: `as`, `any`, and where TypeScript protects the source, not the runtime

**Run it:** `npm run demo:12-soundness-holes`

---

## The claim this project has made twelve times, made precise

Every earlier demo showed a diagnostic — a red squiggle, a `TS####` code,
something the compiler actively rejected. This demo shows the two
mechanisms by which every one of those protections can be switched off
**with no diagnostic at all**, in a file with `strict: true` and every flag
from `tsconfig.json` fully enabled.

### 1. `as` — an assertion, not a proof

```ts
const parsed = JSON.parse(responseBody) as OrderResponse;
```

`JSON.parse` returns `any` — the parser has no way to know what shape the
bytes will produce, so TypeScript makes no claim about it. `as` then
converts that `any` into `OrderResponse` by **compiler decree**: no
`typeof`, no property check, no runtime code is emitted for the assertion.
If the real JSON has `totalCents` as a string, `parsed.totalCents` is now a
`string` value wearing a `number` type tag that nothing will ever verify.

### 2. `any` — contagious, uniform exemption

```ts
function readConfigValue(key: string): any { /* ... */ }
const discount = readConfigValue("discountPercent"); // type: any
```

`any` is not "the widest type" — manifesto §3 is precise about this: it is
**not a set of values at all**, it is an instruction to stop checking. Every
arithmetic rule from demos 01, 02, and 08, and the comparability rule from
demo 04, are all defined in terms of the checker having *some* type
information to reason about. `any` supplies none, so none of those rules can
fire — and the exemption spreads: anything computed from an `any` is `any`
too, silently, until a later annotation stops the spread.

---

## Why neither line needs `@ts-expect-error`

Every other demo in this project marks its broken line with
`@ts-expect-error`, because the entire teaching device is "here is the
diagnostic; here is what it means." This demo's `as`/`any` lines have
**nothing to suppress** — that absence of red is the lesson. `strict: true`
is a proof about the *source text*: given the *types you wrote*, no
operation is ever handed a value it cannot accept. `as` and `any` are the
two places where the types you wrote stop corresponding to a claim the
compiler is willing to verify.

---

## Comparison table

| Value's journey | Type the checker believes | Runtime reality | Diagnostic |
|---|---|---|---|
| `JSON.parse(text)` | `any` | whatever the JSON actually contains | none — correct: nothing is known yet |
| `... as OrderResponse` | `OrderResponse` (`totalCents: number`) | `totalCents` is really a `string` | **none** — the hole |
| `readConfigValue(k): any` | `any` | a string that may or may not parse | **none** — the hole, and it spreads |
| `parseOrderResponse(unknown)` with `typeof` checks | `OrderResponse`, but only after verification | matches, or the function throws first | none needed — the value was actually checked |

---

## Where this demo admits a limit — and where the limit stops

This is not a flaw to route around with a stricter `tsconfig.json` flag:
**there is no flag that makes `as` perform a runtime check**, because doing
so would contradict what `as` is for (asserting something the compiler
cannot otherwise infer, in the rare cases that assertion is actually
justified — e.g. after a `typeof`/`in` check the checker's control-flow
analysis cannot follow through a helper function). The fix is procedural:
push every `as` behind an explicit, visible runtime check
(`typeof`, `in`, `Array.isArray`, or a schema validator), so the one
remaining `as` in `parseOrderResponse` is *justified* by the code
immediately above it, rather than standing alone as an unverified claim.
Demo 13 builds this pattern into a reusable boundary layer.

---

## Verify

```bash
npm run demo:12-soundness-holes
```

There is nothing to `npm run evidence` here — the entire point is that
these lines produce **no diagnostics to collect**.
