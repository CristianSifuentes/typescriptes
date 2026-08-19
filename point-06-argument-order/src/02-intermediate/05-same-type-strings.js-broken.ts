// @ts-nocheck
/**
 * 05-same-type-strings — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * Two `string` parameters are the same blind spot as two `number` parameters,
 * but the consequences differ in an important way: a swapped number usually
 * produces a wrong VALUE, while a swapped identifier usually produces a wrong
 * ACTION performed on the wrong ENTITY.
 *
 * DOMAIN: names, and then money.
 *
 * The money case is the one to sit with. `transfer(from, to, amount)` with the
 * first two arguments exchanged moves real funds in the wrong direction, and
 * every single type in the call is correct.
 */

import { section, js, note, detonate, table, blank, warn } from "../99-runner/trace.js";

function fullName(firstName, lastName) {
  return `${lastName}, ${firstName}`;
}

function initialsOf(firstName, lastName) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

const LEDGER = {
  "acct-payer": 500_00,
  "acct-payee": 12_00,
};

function transfer(fromAccountId, toAccountId, amountCents) {
  LEDGER[fromAccountId] -= amountCents;
  LEDGER[toAccountId] += amountCents;
  return `moved ${amountCents} from ${fromAccountId} to ${toAccountId}`;
}

function balances() {
  return Object.entries(LEDGER)
    .map(([id, cents]) => `${id}=${(cents / 100).toFixed(2)}`)
    .join("  ");
}

export function runBroken(): void {
  section("Names: wrong, but visibly wrong");

  js('fullName("Ada", "Lovelace")');
  detonate("intended", () => fullName("Ada", "Lovelace"));
  js('fullName("Lovelace", "Ada")');
  detonate("swapped", () => fullName("Lovelace", "Ada"));
  note(
    '"Lovelace, Ada" vs "Ada, Lovelace". A human reading the output spots this ' +
      "immediately — which makes it the BEST case for a string swap, and the " +
      "reason people underestimate the category.",
  );

  blank();
  js('initialsOf("Ada", "Lovelace") vs swapped');
  detonate("intended", () => initialsOf("Ada", "Lovelace"));
  detonate("swapped", () => initialsOf("Lovelace", "Ada"));
  note(
    '"AL" vs "LA". Still visible — but now imagine it in a generated avatar, ' +
      "a sort key, or an account number check-digit. Visibility depends " +
      "entirely on whether a human ever looks at the result.",
  );

  blank();
  section("Money: wrong, and invisibly wrong");

  detonate("opening balances", () => balances());

  blank();
  js('transfer("acct-payer", "acct-payee", 12_950)   — the intended direction');
  detonate("result", () => transfer("acct-payer", "acct-payee", 12_950));
  detonate("balances", () => balances());

  blank();
  js('transfer("acct-payee", "acct-payer", 12_950)   — the same call, swapped');
  detonate("result", () => transfer("acct-payee", "acct-payer", 12_950));
  detonate("balances", () => balances());
  warn(
    "The ledger has been moved in the wrong direction and then back — but only " +
      "because this demo ran both calls. In production only one of them runs, " +
      "the totals still balance, no account goes negative in a way anyone " +
      "notices, and the discrepancy is found by a reconciliation job weeks " +
      "later, if at all.",
  );

  blank();
  section("Why the money case defeats every defence");
  table(
    ["defence", "why it fails on a swapped transfer"],
    [
      ["the type checker", "both parameters are `string` — nothing to compare"],
      ["code review", "`transfer(a, b, n)` and `transfer(b, a, n)` look identical"],
      ["a unit test", "only catches it if it asserts the DIRECTION explicitly"],
      ["monitoring", "no exception, no latency spike, no error rate change"],
      ["the ledger totals", "still balance — the money went somewhere real"],
      ["the customer", "eventually. this is the actual detection mechanism."],
    ],
  );
  note(
    "The last row is not a joke. For same-typed identifier swaps, the customer " +
      "IS the error-detection system. Level 03 replaces them with the compiler.",
  );
}
