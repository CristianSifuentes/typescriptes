# 13 — The compiler's arity-resolution algorithm, in slow motion

**Run it:** `npm run demo:13-call-resolution-model`

---

## Every call expression in this project runs the same steps — arity included

Manifesto §3 gives the algorithm in outline: bind any generics, compute the
applicable parameter types (and, implicitly, their arity bounds), then
check each supplied argument. This demo makes that algorithm's steps
individually observable by forcing each one onto a different piece of
syntax, via a generic API dispatcher whose per-endpoint argument list is a
**tuple** (demo 09):

```
resolve(callApi(name, ...args), typeof callApi):
  1. is callApi callable at all?
  2. bind the generic K from name's literal type       (keyof Endpoints narrowed)
  3. compute Endpoints[K] — a TUPLE, fixing arity exactly for this K
  4. check each supplied argument against the tuple, position by position
  5. result type = callApi's declared return type
```

For an ordinary, non-generic call like `charge(amount)`, steps 1–3 are
trivial (one signature, no generics to bind), and the whole algorithm
collapses to "does the count match, does the type match" — demos 01 and
03's mechanisms. `callApi` makes every step land on distinct, independently
inspectable code, specifically so that step 3 — where a *tuple* becomes the
source of an *arity bound* — is visible as its own, separate moment in the
resolution process.

---

## Why a missing argument is caught at step 3/4, not step 2

`callApi("createUser", "Grace")` fails after `K` is already bound
successfully to `"createUser"` — the failure is entirely in computing and
checking against `Endpoints["createUser"]`, the tuple `[name: string,
email: string]`. This distinguishes it clearly from `callApi("deleteUser",
1)`, which fails at step 2 because there is no valid `K` at all. Two
different call-site mistakes, corresponding to two distinct steps of the
same algorithm, produce two genuinely different diagnostics — `TS2554` for
the first, `TS2345` for the second — each pointing precisely at which step
broke down.

---

## Why this collapses an entire class of "the dispatcher doesn't know arity" bugs

The JavaScript version's `callApi` forwards `...args` blindly — it has
**zero information** about how many arguments any given endpoint actually
needs, because JavaScript has nowhere to record that fact per key.
`callApi<K extends keyof Endpoints>` fixes this by making the *type
system* — not the dispatcher's runtime logic — the source of truth for each
endpoint's arity, via `Endpoints[K]`. The dispatcher's ignorance
(`endpoints[endpointName](...args)`, no awareness of what `args` should
contain) is exactly preserved in both versions; what changes is that one of
them has a compiler checking every call against a per-key contract the
dispatcher itself never has to know about, and the other has nothing
checking anything at all.
