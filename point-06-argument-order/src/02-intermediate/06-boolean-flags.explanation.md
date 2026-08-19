# 06 — The boolean trap: the worst case of the blind spot

**Run it:** `npm run demo:06-boolean-flags`

---

## Why `boolean` twice is worse than `number` twice

Five properties compound:

| property | why it compounds the problem |
|---|---|
| **1 bit of information** | the *value* gives no clue which flag it is |
| **unreadable at the call site** | `sync(path, true, false)` needs the definition to decode |
| **invites positional style** | each flag feels too small to deserve a name |
| **controls permissions / deletions** | the consequences are the expensive kind |
| **only two inhabitants** | a swap is always *valid*, never out of range |

Compare: `cropTo(640, 480, 10, 20)` at least hints at its own structure from the
magnitudes of the values. `sync(path, true, false)` hints at nothing.

This combination — unreadable by humans **and** unverifiable by the compiler —
is why "the boolean trap" has a name.

The demo's two examples are chosen for their blast radius:

```ts
createAccount(email, false, true)   // a DISABLED ADMINISTRATOR, not an active member
syncDirectory("/data", true, false) // a LIVE DELETION, not a dry run
```

Neither produces a diagnostic. Neither looks wrong on the page.

---

## The remedy that fits flags best: stop using booleans

For numbers and identifiers, branding is usually right. For flags it is usually
the wrong tool. A **literal union** is better, and it fixes both halves of the
trap at once:

```ts
type AccountStatus = "active" | "disabled";
type AccountRole   = "administrator" | "member";

createAccountTyped(email, "active", "member");     // readable
createAccountTyped(email, "member", "active");     // TS2345
```

```
error TS2345: Argument of type '"member"' is not assignable to parameter of type 'AccountStatus'.
```

No `Brand<T, K>`, no smart constructor, no options object. The swap became a
type error because `"active" | "disabled"` and `"administrator" | "member"` are
**genuinely different types** — the literal values now carry the meaning that
`true` and `false` could not.

This is the cheapest remedy in the entire project, and it improves the call site
for a human reader as a side effect — the half of the boolean trap no type
system was ever going to fix for you.

---

## When a literal union is not enough

It works when the two flags have **different vocabularies**. Two genuinely
boolean-shaped flags with the same vocabulary — `(dryRun: boolean, verbose:
boolean)` — cannot be separated this way. Modelling them as `"dry" | "live"` and
`"quiet" | "verbose"` is the same trick, and if that reads as contortion, reach
for something else.

### Preference order for flags

1. **A literal union**, if the vocabularies differ naturally.
2. **An options object** (demo 08), if there are two or more flags —
   `{ deleteExtraneous: true, dryRun: false }` is self-documenting and
   order-free.
3. **Split the function** — `syncDryRun()` and `syncLive()` — if the flag
   selects fundamentally different behaviour rather than a variation of one
   behaviour.

Branding is rarely the right answer for booleans: `Brand<boolean, "DryRun">`
technically works, but it adds a smart constructor and a phantom member to
express something a two-member union expresses natively.
