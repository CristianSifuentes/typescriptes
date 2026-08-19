# 12 — A reusable brand toolkit

**Run it:** `npm run demo:12-brand-toolkit`

---

## The discipline, in one sentence

> A branded type is only as trustworthy as its smart constructor, so put every
> `as` inside one, validate there, and never brand anywhere else.

Why it matters: a brand has no runtime existence, so **nothing at runtime can
check it**. `JSON.parse(body).id as AccountId` is an `AccountId` to the compiler
and a lie to reality. The smart constructor is the single place where a raw
value becomes a trusted one — which makes it the single place worth
unit-testing, and the single place worth reviewing.

---

## The toolkit

```ts
declare const brand: unique symbol;

export type Brand<T, K extends string> = T & {
  readonly [brand]: { readonly kind: K; readonly base: T };
};

export type Unbrand<B> = B extends { readonly [brand]: { readonly base: infer T } } ? T : B;
```

### Why the phantom member carries `base`

The naive definition does not work:

```ts
type Unbrand<B> = B extends Brand<infer T, string> ? T : B;   // silently returns B
```

`infer` **cannot decompose an intersection** — there is no way to ask "what was
the left-hand side of `T & {…}`?". Recording the base type as a property makes
it recoverable by ordinary inference. It costs nothing, since the whole phantom
member is erased.

(This project's own build caught that mistake: the first version of the file
asserted an `Unbrand` that quietly returned the branded type, and
`Expect<Equals<Unbrand<AccountId>, string>>` failed with TS2344.)

### The constructor factory

```ts
function defineBrand<T, K extends string>(name: K, isValid: (value: T) => boolean) {
  const of = (value: T): Brand<T, K> => {
    if (!isValid(value)) throw new TypeError(`invalid ${name}: ${String(value)}`);
    return value as Brand<T, K>;          // ← THE ONLY `as`
  };
  const tryOf = (value: T) => (isValid(value) ? (value as Brand<T, K>) : undefined);
  const is = (value: T): value is Brand<T, K> => isValid(value);
  return { of, tryOf, is };
}
```

Three entry points for three situations:

| function | returns | use when |
|---|---|---|
| `of` | `Brand<T, K>` or throws | invalid input is a bug |
| `tryOf` | `Brand<T, K> \| undefined` | invalid input is expected |
| `is` | a type predicate | you are narrowing an existing value |

`is` is worth a caution: the compiler verifies the **signature** of a type
predicate, never its body. `is` is trustworthy because `isValid` is tested, not
because the compiler checked it.

---

## What the brand buys, beyond disambiguation

Because the only way to obtain an `AccountId` is through a constructor that
validated the format, the brand is not merely a label — it is a **claim that the
check ran**. `credit(account: AccountId, …)` therefore has two guarantees for
the price of one:

1. this is not a `CustomerId` (disambiguation), and
2. this string matched `/^acct-[a-z0-9]+$/` (validation).

That second one is why branding pays for itself in a way a naming convention
never can.

---

## The boundary, in both directions

**Inward:** parse once, at the edge, and pass branded values inward.

```ts
const parseAccountId = (value: unknown): AccountId => {
  if (typeof value !== "string") throw new TypeError("expected a string");
  return AccountIdBrand.of(value);
};
```

**Outward:** serialisation is unchanged. The brand is erased, so
`JSON.stringify({ account })` produces exactly what it did before — no `.value`,
no custom replacer, no shape change.

Compare the JavaScript twin, where every wrapper altered the payload and the
class-based version did not even survive a round trip (`JSON.parse(JSON.stringify(x))`
is a plain object, and every `instanceof` check fails afterwards).

| approach | catches swaps | when | allocation | survives JSON | API compatibility |
|---|---|---|---|---|---|
| JS tag property | yes | runtime | 1 object/value | yes | needs `.value` everywhere |
| JS class | yes | runtime | 1 object/value | **no** | needs `.value` everywhere |
| JS Symbol tag | yes | runtime | 1 object/value | partly | needs `.value` everywhere |
| **TS brand** | **yes** | **compile time** | **none** | **yes** | **unchanged** |

---

## The five rules

1. **One `as` per brand**, inside the smart constructor. Never elsewhere.
2. **Validate** in the constructor. A brand claims the check ran.
3. **`unique symbol` keys**, so brands cannot be forged by an object literal.
4. **Brand at the boundary** — parse once, pass branded values inward.
5. **Unit-test the constructors.** They are the only unchecked step.

And the standing caveat: `x as AccountId` written anywhere else reintroduces the
bug with none of the validation. That is not hypothetical — it is demo 13, and
it is why rule 1 is rule 1.
