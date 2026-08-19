# 08 — Options objects: removing order rather than checking it

**Run it:** `npm run demo:08-options-objects`

---

## The idea

Branding makes two positions *different*. An options object makes the positions
*go away*:

```ts
generateReport({ title, startDate, endDate, groupBy, currency, includeCharts });
```

The 6! = 720 orderings of the positional version collapse to **one**. There is
no ordering mistake left to make because there is no ordering.

This remedy predates TypeScript by decades and works in plain JavaScript — but
JavaScript gives it no enforcement, so it trades one silent failure for two
others:

| failure | positional | options object (plain JS) |
|---|---|---|
| wrong order | silent corruption | **impossible** |
| missing value | `undefined` bound | `undefined` read |
| misspelled name | n/a | **silently ignored — a NEW failure** |
| readable call site | no | **yes** |
| enforcement | none | none |

---

## What TypeScript adds: enforcement by name

| situation | diagnostic |
|---|---|
| one field missing | **TS2741** — `Property 'toAccountId' is missing in type '{…}' but required in type 'TransferRequest'.` |
| several fields missing | **TS2739** — `Type '{…}' is missing the following properties from type 'ReportOptions': endDate, groupBy, currency` |
| misspelled field | **TS2561** — `Object literal may only specify known properties, but 'currancy' does not exist in type 'ReportOptions'. Did you mean to write 'currency'?` |
| wrong type of field | **TS2322** — reported by name, not by index |

Compare the messages, because this is the real ergonomic argument:

```
Expected 6 arguments, but got 2.                          ← counts
Type '{…}' is missing the following properties: endDate,
  groupBy, currency                                        ← tells you what to write
```

One tells you to count; the other tells you what to write.

Note also the asymmetry with argument checking: **object checking reports every
missing field**, while argument checking stops at the first bad position. Two
different code paths in the checker, two different reporting behaviours.

### Optionality that means what people expect

Demo 02 showed that a positional optional cannot be skipped without shifting
every later argument. In an options object, `includeCharts?: boolean` means
exactly "omit this" — omission is omission.

---

## The honest limit

An options object removes **order**. It does not stop you putting the right
*value* under the wrong *name*:

```ts
transfer({ fromAccountId: "acct-payee", toAccountId: "acct-payer", amountCents: 100 });
```

Both fields are `string`, so the same-typed blind spot has simply moved from
positions to keys. This compiles, and the money still moves backwards.

**Options objects and brands solve different halves of the problem.** Combine
them:

```ts
interface BrandedTransfer {
  readonly from: AccountId;
  readonly to: AccountId;
  readonly amountCents: number;
}
```

…and note what that does *not* buy: both fields are `AccountId`, so brands do
not distinguish payer from payee here. The two really are the same **kind** of
thing playing different **roles**.

> **Kinds are cheap to brand. Roles are expensive.**

For roles the options are: distinct brands (`PayerAccountId` / `PayeeAccountId`)
if the distinction is worth enforcing, or a named field plus a test if it is
not. Demo 14 makes this a decision rather than a shrug.

---

## Summary

| failure | positional | options object | options + brands |
|---|---|---|---|
| wrong order | silent corruption | impossible | impossible |
| missing value | TS2554 (counts) | TS2739 (names them) | TS2739 |
| misspelled name | n/a | TS2561 (+ suggestion) | TS2561 |
| wrong type | TS2345 by index | TS2322 by name | TS2322 by name |
| right value, wrong field | n/a | **silent** | caught if the kinds differ |
| readable call site | no | yes | yes |

**Rule of thumb:** reach for an options object at three or more parameters, or
at two if either is a boolean. Reach for brands when two parameters share a type
and a swap would be silent.
