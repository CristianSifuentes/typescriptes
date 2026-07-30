# 07 — Rest parameters: variable arity, uniformly typed — dissected

**Run it:** `npm run demo:07-rest-parameters`

---

## Unbounded arity is one axis; per-element typing is a completely separate one

Manifesto §1 defines a parameter list's maximum arity as unbounded exactly
when it ends in a rest parameter. `...nums: number[]` sets that maximum to
infinity — **and, independently, declares that every element collected
into `nums` must be `number`.** These are orthogonal facts about the
signature: relaxing *how many* arguments are allowed says nothing about
*what type* each one must be. `sum(1, 2, "3", 4)` is rejected not because
there are too many arguments (there aren't — rest parameters accept any
count) but because element 2 fails the ordinary per-position type check
(demo 03's mechanism), reused without modification for every position a
rest parameter can occupy.

---

## Why the JavaScript failure's exact shape depends on where the mistake sits

`nums.reduce((total, n) => total + n, 0)` uses `+`, which behaves
differently depending on the **types already accumulated** by the time it
reaches the bad value: a string appearing early corrupts everything after
it (via string concatenation); a string appearing at the very end would
produce a different, but equally wrong, concatenated result. There is no
single, predictable JavaScript failure mode for "a rest argument has the
wrong type" — the failure's *shape* is an accident of iteration order and
which operator happens to be used to combine the elements.

---

## Why TypeScript's check does not care about position

Because a rest parameter's element type applies **identically to every
position**, TypeScript's rejection of `sum(1, 2, "3", 4)` is completely
insensitive to *where* in the argument list the bad value sits — `sum("3",
1, 2, 4)` would be rejected exactly the same way, at exactly the same kind
of diagnostic. The uniform treatment eliminates an entire dimension of
"does this bug happen to manifest today" that the JavaScript version is
fully exposed to: with rest parameters, *every* position gets the *same*
guarantee, not just the ones a particular call happened to exercise in
testing.
