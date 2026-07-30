# 09 — Call signatures as types, and hybrid callable objects: dissected

**Run it:** `npm run demo:09-call-signatures-hybrid`

---

## A call signature is an entry in the property map, not a special case

Manifesto §1 states the formal model: a type's property map can contain an
entry keyed by an ordinary name (`name: string`) or by the special,
unnamed **call signature** key, written `(req: Request): void`. `Middleware`
in this demo has both:

```ts
interface Middleware {
  (req: Request): void; // key: "()" — the call signature
  readonly name: string; // key: "name" — an ordinary property
}
```

Checking `mw satisfies Middleware` is **one** structural check over **two**
map entries, not two different kinds of check bolted together. That is why
the compiler's rejection of `rateLimitDescriptor` reads exactly like a
missing-property error (`"provides no match for the signature..."`) —
because, mechanically, it *is* one: the call-signature entry is simply the
one property `rateLimitDescriptor` happens to be missing.

---

## Why a plain named function satisfies the hybrid type "for free"

Every JavaScript function object carries an own, read-only `.name` property
derived from how it was declared (`function auth(req) {...}` → `.name ===
"auth"`). TypeScript models this: the type of any function DECLARATION
already includes a `name: string` member alongside its call signature. This
is why `authMiddleware` — an ordinary named function — needs no extra
annotation to satisfy `Middleware`: both halves of the hybrid type are
already present on any real function value.

---

## Why the JavaScript bug is specifically about "looks right from outside"

`rateLimitDescriptor` is not a random wrong value — it has a `.name`, the
exact property `runPipeline`'s trace-logging line reads (`` `running
"${mw.name}"` ``). Logging its name never reveals the defect; only the
*next* line, `mw(request)`, does. This is a common failure shape in registry
/ plugin-style code: an object that partially resembles the expected shape
(same metadata fields) but is missing the one thing — callability — that a
runtime `console.log` of its "identifying" fields would never surface.
TypeScript's structural check inspects the *entire* required shape, call
signature included, so a partial resemblance is never mistaken for a match.
