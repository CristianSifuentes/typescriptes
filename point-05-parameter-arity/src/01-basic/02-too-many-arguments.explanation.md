# 02 — Too many arguments: the mechanism, dissected

**Run it:** `npm run demo:02-too-many-arguments`

---

## The same counting check, the other direction

Demo 01 showed arity's *lower* bound rejecting a call. This demo shows the
*upper* bound doing the same job: `addSurcharge`'s parameter list has no
rest parameter, so its maximum arity is a fixed number — 2, not infinity
(manifesto §1). A call supplying 3 arguments fails the identical step 2 of
the resolution algorithm (manifesto §3): `3` is outside `[2, 2]`. TypeScript
does not need a *second* mechanism for "too many" versus "too few" — both
are the same bounds check, just which side of the interval is violated.

---

## Why "silently discarded" is a worse failure than a crash

JavaScript's binding model (manifesto §2) only ever *binds* the first `n`
arguments to the declared parameter names — arguments beyond that are never
bound to anything a normal function body reads. The call **succeeds**, the
function **returns a value**, and everything about the call *looks*
correct from the outside. Compare this to demo 01: a missing argument at
least produces an observable crash somewhere. A discarded extra argument
produces nothing observable at all — the caller's intent (apply a second
surcharge) is silently defeated, and the returned number is simply wrong,
indistinguishable in shape from a correct result.

---

## Why TypeScript's fix is "change the signature," not "loosen the check"

If a function genuinely needs to accept a variable number of arguments, the
correct move is not to relax arity checking — it's to declare that
variability **explicitly**, with a rest parameter (`...surcharges:
number[]`, demo 07). That change moves the upper bound from a fixed number
to infinity in exactly one place — the declaration — after which every call
site, including the one that used to silently misbehave, is checked against
the *new*, intentionally wider contract. The alternative — quietly
tolerating extra arguments everywhere — is precisely the JavaScript
behavior this demo shows going wrong.
