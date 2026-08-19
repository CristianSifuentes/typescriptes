// @ts-nocheck
/**
 * 12-brand-toolkit — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * If you want nominal-style safety in plain JavaScript, you must build it out
 * of runtime machinery. This file implements the three serious attempts and
 * measures what each one costs.
 *
 *   ATTEMPT 1  a tag property on a wrapper object
 *   ATTEMPT 2  a class per quantity
 *   ATTEMPT 3  a Symbol-keyed tag (the closest to a real brand)
 *
 * All three work. All three cost an allocation per value, an unwrap at every
 * use, and a check that fires in production. The TypeScript twin gets the same
 * guarantee for zero runtime cost — that comparison is the point of this demo.
 *
 * DOMAIN: account identifiers and money.
 */

import { section, js, note, detonate, table, blank, warn } from "../99-runner/trace.js";

// --- ATTEMPT 1: a tag property ---------------------------------------------
const accountId1 = (raw) => ({ tag: "AccountId", value: raw });
const customerId1 = (raw) => ({ tag: "CustomerId", value: raw });
function credit1(account, customer, cents) {
  if (account.tag !== "AccountId") throw new TypeError(`expected AccountId, got ${account.tag}`);
  if (customer.tag !== "CustomerId") throw new TypeError(`expected CustomerId, got ${customer.tag}`);
  return `credit ${cents} to ${account.value} for ${customer.value}`;
}

// --- ATTEMPT 2: a class per quantity ---------------------------------------
class AccountId2 {
  constructor(value) {
    this.value = value;
  }
}
class CustomerId2 {
  constructor(value) {
    this.value = value;
  }
}
function credit2(account, customer, cents) {
  if (!(account instanceof AccountId2)) throw new TypeError("expected AccountId");
  if (!(customer instanceof CustomerId2)) throw new TypeError("expected CustomerId");
  return `credit ${cents} to ${account.value} for ${customer.value}`;
}

// --- ATTEMPT 3: a Symbol-keyed tag -----------------------------------------
const BRAND = Symbol("brand");
const accountId3 = (raw) => Object.freeze({ [BRAND]: "AccountId", value: raw });
function credit3(account, cents) {
  if (account?.[BRAND] !== "AccountId") throw new TypeError("expected AccountId");
  return `credit ${cents} to ${account.value}`;
}

export function runBroken(): void {
  section("ATTEMPT 1 — a tag property");

  js("credit1(accountId1('acct-a'), customerId1('cust-9'), 100)");
  detonate("ok", () => credit1(accountId1("acct-a"), customerId1("cust-9"), 100));
  js("the same call, swapped");
  detonate("swapped", () => credit1(customerId1("cust-9"), accountId1("acct-a"), 100));
  note("Caught — at runtime, with a decent message. The idea is right.");

  blank();
  js("now count what it costs");
  detonate("what an AccountId actually is", () => JSON.stringify(accountId1("acct-a")));
  detonate("comparing two of them", () => accountId1("acct-a") === accountId1("acct-a"));
  detonate("using one as a key", () => {
    const map = {};
    map[accountId1("acct-a")] = 1;
    return JSON.stringify(map);
  });
  warn(
    "`false` for two identical ids (object identity), and `[object Object]` as " +
      "a map key. Every existing API that expected a string now needs `.value`, " +
      "and every serialised payload has changed shape.",
  );

  blank();
  section("ATTEMPT 2 — a class per quantity");

  detonate("credit2 with the right kinds", () =>
    credit2(new AccountId2("acct-a"), new CustomerId2("cust-9"), 100),
  );
  detonate("credit2 swapped", () => credit2(new CustomerId2("cust-9"), new AccountId2("acct-a"), 100));
  note(
    "Also caught, also at runtime. Classes add prototype checks, which survive " +
      "serialisation badly: `JSON.parse(JSON.stringify(x))` is a plain object " +
      "and every `instanceof` check fails after a round trip.",
  );
  detonate("after a JSON round trip", () => {
    const revived = JSON.parse(JSON.stringify(new AccountId2("acct-a")));
    try {
      return credit2(revived, new CustomerId2("cust-9"), 100);
    } catch (error) {
      return `THROWS: ${error.message}`;
    }
  });

  blank();
  section("ATTEMPT 3 — a Symbol-keyed tag");

  detonate("credit3 with a real branded value", () => credit3(accountId3("acct-a"), 100));
  detonate("credit3 with a forged object", () => {
    try {
      return credit3({ value: "acct-a" }, 100);
    } catch (error) {
      return `THROWS: ${error.message}`;
    }
  });
  note(
    "The Symbol key cannot be written by accident, so forgery is genuinely " +
      "hard. This is the closest JavaScript gets to a brand — and it still " +
      "allocates, still wraps, still checks at runtime.",
  );

  blank();
  table(
    ["approach", "catches swaps", "when", "allocation", "survives JSON", "API compatibility"],
    [
      ["tag property", "yes", "runtime", "1 object/value", "yes", "needs .value everywhere"],
      ["class", "yes", "runtime", "1 object/value", "**no**", "needs .value everywhere"],
      ["Symbol tag", "yes", "runtime", "1 object/value", "partly", "needs .value everywhere"],
      ["TS brand", "**yes**", "**compile time**", "**none**", "**yes**", "**unchanged**"],
    ],
  );
  note(
    "The bottom row is the TypeScript twin. Same guarantee, none of the " +
      "columns in between.",
  );
}
