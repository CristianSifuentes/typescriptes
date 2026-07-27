# 05 — A data field, called as a method: the mechanism, dissected

**Run it:** `npm run demo:05-property-not-function`

---

## The realistic shape of demo 01's defect

Demo 01 established the bare mechanism: `number` has no call signature, so
calling it is TS2349. This demo shows where that defect actually occurs in
production code — not as a top-level variable named suggestively
`retryBudget`, but as one field among several on a configuration object that
legitimately mixes **data** (`retry`, `timeoutMs`) and **behaviour**
(`onRetry`). The two kinds of field look identical in source (`config.x`),
and only their declared types distinguish "call this" from "read this":

```ts
interface HttpClientConfig {
  readonly retry: number;                       // data
  readonly onRetry: (attempt: number) => void;   // behaviour
}
```

`config.retry()` and `config.onRetry(attempt)` are syntactically almost
identical requests. The compiler tells them apart the only way it can — by
consulting each field's declared type — and rejects exactly the one that
doesn't have a call signature.

---

## Why the stray `()` is so easy to write by accident

`attempt <= config.retry()` and `attempt <= config.retry` differ by two
characters, and both are *syntactically* valid — JavaScript never rejects
`config.retry()` for being the wrong shape of expression, because it never
asks "is this a sensible thing to call?" until the exact instant it tries.
A loop condition like this is exactly the kind of place a stray `()` slips
in: perhaps `retry` used to be a function in an earlier version of the
config format, and the type changed without every call site being updated
(a rename-safety scenario, structurally identical to point-03's demo 14,
just for a value's *callability* instead of a property's *existence*).

---

## Why TypeScript's check generalises past this one field

The mechanism here is not "check that `retry` is spelled right, and
separately check that it's a number, and separately check whether someone
tries to call it" — it is a single, uniform rule: **the type of
`config.retry` is `number`; `number` has no call signature; therefore
`config.retry()` is rejected, for any field on any object, anywhere in the
program.** Nothing about this check is specific to `HttpClientConfig` — it
is the exact same TS2349 rule from demo 01, applied automatically to every
member of every type, including ones not yet written.
