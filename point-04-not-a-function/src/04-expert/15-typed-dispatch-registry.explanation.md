# 15 — A closed, typed dispatch registry: dissected

**Run it:** `npm run demo:15-typed-dispatch-registry`

---

## The defect is an *open* key set pretending to be closed

`commands[commandId]` in the JavaScript version accepts any `string`
whatsoever — the JavaScript object has exactly two real keys, but its type
(if it had one) would be "indexed by `string`," an infinite set the
implementation only partially covers. Every command id that is not one of
the two real keys is a silent `undefined`, waiting for `()`. The fix is not
"be more careful with strings" — it's making the key set **closed**:

```ts
type CommandId = "editor.save" | "editor.undo" | "editor.redoLastChange";
```

`CommandId` denotes exactly three values, not "any string." Every place
this type is used, the compiler can now decide **completely** whether an
identifier belongs to it.

---

## Two independent totality checks, closing the bug from both directions

A `Record<CommandId, Handler>` is a **total function type at the value
level**: TypeScript requires the object literal to supply an entry for
*every* member of `CommandId`, no more, no fewer. This closes the bug from
the **registry's** side — forgetting to implement a command is caught the
moment the registry object is written (TS2741), before `dispatch` is ever
called with that id.

`dispatch(commandId: CommandId)` closes the bug from the **caller's**
side — a renamed or invented id is rejected as an argument-assignability
failure (TS2345), the same mechanism demo 13's generic dispatcher uses,
here specialised to a plain closed union instead of `keyof`.

Both checks are required, because they guard against opposite mistakes: the
registry drifting out of sync with the type (TS2741), or a caller drifting
out of sync with the registry (TS2345). Either mistake alone would still
leave a gap; together, `commands[commandId]` inside `dispatch`'s body is
**provably** always a real `Handler` — not "usually," not "as long as
nobody forgets," but structurally guaranteed by the two totality checks
surrounding it.

---

## Why `never` is the type of "this code cannot be reached"

`assertNever(id: never)` only compiles at its call site if `id`'s narrowed
type, after every `case` branch of the `switch`, has been reduced to
nothing — the empty set, `never`. This happens automatically as long as
every member of `CommandId` was matched by some `case`; if `CommandId`
later grows a member no `case` handles, that member remains in the
`default` branch's narrowed type, `id` is no longer assignable to `never`,
and the `assertNever(commandId)` call itself fails to compile — turning
"someone added a command and forgot the switch" into a build failure at
exactly the switch that needs a new case, rather than a runtime path nobody
ever exercises in tests.
