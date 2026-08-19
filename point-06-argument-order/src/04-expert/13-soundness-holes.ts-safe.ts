/**
 * 13-soundness-holes — WHERE THE PROTECTION STOPS
 * ---------------------------------------------------------------------------
 * Every remedy in this project protects TYPED, BRANDED CALL SITES. This demo
 * enumerates the places where a call site stops being typed, and shows the
 * argument-order bug walking straight back in.
 *
 * The framing to keep: TypeScript deliberately sacrifices SOUNDNESS for
 * pragmatism, so that idiomatic JavaScript remains typeable. The holes below
 * are documented and intentional; the engineering task is to know exactly where
 * they are, and to make crossing them a visible event rather than an accident.
 *
 * Everything in this file compiles under `strict: true`, and several parts of
 * it produce the wrong answer at runtime. That is the lesson.
 */

import {
  section,
  ts,
  good,
  warn,
  bad,
  note,
  compilerSays,
  table,
  blank,
  detonate,
  compileTimeOnly,
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

declare const brand: unique symbol;
type Brand<T, K extends string> = T & { readonly [brand]: K };

type AccountId = Brand<string, "AccountId">;
type CustomerId = Brand<string, "CustomerId">;
type Cents = Brand<number, "Cents">;

const accountId = (raw: string): AccountId => raw as AccountId;
const customerId = (raw: string): CustomerId => raw as CustomerId;
const cents = (raw: number): Cents => raw as Cents;

const credit = (account: AccountId, customer: CustomerId, amount: Cents): string =>
  `credit ${amount} to ${account} for ${customer}`;

export function runSafe(): void {
  const acct = accountId("acct-a");
  const cust = customerId("cust-9");
  const money = cents(100);

  // =========================================================================
  // HOLE 1 — `as`, and the double assertion
  // =========================================================================
  section("HOLE 1 — `as` launders one brand into another");

  const laundered = credit(
    cust as unknown as AccountId,
    acct as unknown as CustomerId,
    money,
  );

  proofBlock("what the compiler believes after the assertions");
  proveType<string>()(laundered, "string", "a well-typed call built from two lies");

  blank();
  detonate("the laundered call", () => laundered);
  bad(
    "The account and customer are exchanged, in a program with zero type " +
      "errors and every strict flag on. `as` emits no runtime check and " +
      "overrides the checker's judgement; `as unknown as` defeats even the " +
      "overlap guard that would have stopped a single assertion.",
  );

  ts("credit(42 as AccountId, cust, money)   // a single, absurd assertion");
  compileTimeOnly(() => {
    // @ts-expect-error TS2352: Conversion of type 'number' to type 'AccountId' may be a
    // mistake because neither type sufficiently overlaps with the other.
    void credit(42 as AccountId, cust, money);
  });
  compilerSays(
    "TS2352",
    "Conversion of type 'number' to type 'AccountId' may be a mistake because " +
      "neither type sufficiently overlaps with the other. If this was " +
      "intentional, convert the expression to 'unknown' first.",
    "The one guard rail — and note that the message helpfully explains how to " +
      "bypass it. Treat every `as unknown as` in review as a claim requiring " +
      "justification.",
  );

  // =========================================================================
  // HOLE 2 — `any`
  // =========================================================================
  blank();
  section("HOLE 2 — `any` switches the check off entirely");

  const fromUntypedLibrary: any = { id: "cust-9" };
  const viaAny = credit(fromUntypedLibrary, fromUntypedLibrary, fromUntypedLibrary);
  detonate("credit(any, any, any)", () => viaAny);
  bad(
    "Arity, position, and brand: all unchecked. One `any` from an untyped " +
      "dependency contaminates every call it touches, and inference spreads it " +
      "silently through the values derived from it.",
  );
  note(
    "    The defence is `unknown` at the boundary plus a validated guard — the " +
      "toolkit from demo 12. `unknown` permits nothing until you prove " +
      "something, which is exactly the question `any` refuses to ask.",
  );

  // =========================================================================
  // HOLE 3 — dynamic invocation
  // =========================================================================
  blank();
  section("HOLE 3 — `Function`, `apply`, and data-driven dispatch");

  const asFunction: Function = credit;
  const viaApply = asFunction.apply(null, ["cust-9", "acct-a", 100]);
  detonate("(credit as Function).apply(null, [...])", () => String(viaApply));
  bad(
    "The `Function` type has no signature, so `apply` on it accepts anything. " +
      "Order, arity, and brands are all gone.",
  );

  ts("credit.apply(null, [cust, acct, money])   // the callee's type IS known");
  compileTimeOnly(() => {
    const typedApply = credit.apply(null, [
      // @ts-expect-error TS2322: Type 'CustomerId' is not assignable to type 'AccountId'.
      cust,
      // @ts-expect-error TS2322: Type 'AccountId' is not assignable to type 'CustomerId'.
      acct,
      money,
    ]);
    void typedApply;
  });
  compilerSays(
    "TS2322",
    "Type 'CustomerId' is not assignable to type 'AccountId'.",
    "`strictBindCallApply` DOES check `apply` when the callee's signature is " +
      "known — so the hole is the `Function` TYPE, not `apply` itself. Note " +
      "the differences from a normal bad call: TS2322 rather than TS2345 " +
      "(an array literal against a tuple, not arguments against parameters), " +
      "and BOTH bad positions reported rather than just the first.",
  );
  good(
    "Practical rule: never annotate anything `Function`. Write the signature — " +
      "`(...args: A) => R` — and `strictBindCallApply` does the rest.",
  );

  // =========================================================================
  // HOLE 4 — the reordering wrapper
  // =========================================================================
  blank();
  section("HOLE 4 — a wrapper that reorders, where each file looks correct");

  const send = (to: AccountId, from: AccountId, amount: Cents): string =>
    `${amount} from ${from} to ${to}`;

  const payer = accountId("acct-payer");
  const payee = accountId("acct-payee");

  detonate("send(payee, payer, money)  — as the wrapper intends", () =>
    send(payee, payer, money),
  );
  detonate("send(payer, payee, money)  — as the underlying API reads", () =>
    send(payer, payee, money),
  );
  bad(
    "Both compile: `to` and `from` are both `AccountId`, so this is the " +
      "level-02 blind spot RE-OPENED by a brand that is too coarse. The two " +
      "values are the same KIND (an account) playing different ROLES (payer, " +
      "payee), and a kind-level brand cannot see roles.",
  );
  note(
    "    The fix, if the distinction is worth enforcing, is role-level brands " +
      "— `PayerAccountId` and `PayeeAccountId` — or an options object with " +
      "named fields. Demo 14 decides which. The point here is that BRANDING IS " +
      "NOT AUTOMATICALLY ENOUGH: it is only as fine-grained as you made it.",
  );

  // =========================================================================
  // HOLE 5 — the I/O boundary
  // =========================================================================
  blank();
  section("HOLE 5 — values that arrive already in the wrong order");

  const payload: unknown = JSON.parse('{"from":"acct-payee","to":"acct-payer","amount":100}');
  detonate("what the compiler knows about parsed JSON", () => typeof payload);

  ts("(payload as TransferRequest)  — the usual shortcut");
  warn(
    "No compiler can know whether the sender put the payer in the `from` " +
      "field. Types describe the code you wrote, not the data the world sends " +
      "you. Validation can check FORMAT (is it an account id?) but not " +
      "INTENT (is it the right account?).",
  );
  note(
    "    This is the genuinely irreducible hole. The remedies are outside the " +
      "type system: idempotency keys, confirmation steps, reconciliation, and " +
      "designing the API so the dangerous direction requires an explicit " +
      "signal rather than a field order.",
  );

  // =========================================================================
  // THE MAP
  // =========================================================================
  blank();
  section("The complete map of the holes");
  table(
    ["hole", "recovered?", "how"],
    [
      ["`as` / `as unknown as`", "no", "ban in review; confine to smart constructors"],
      ["`x!` non-null assertion", "no", "ban in review"],
      ["`any` from a dependency", "no", "`unknown` + validated guard at the edge"],
      ["`Function`-typed callee", "no", "never annotate `Function`; write the signature"],
      ["`apply` on a typed callee", "**yes**", "`strictBindCallApply` (on with `strict`)"],
      ["spread of a tuple", "**yes**", "tuple types carry positions (demo 09)"],
      ["spread of `any[]`", "no", "type the array, or validate it"],
      ["dynamic dispatch by name", "partly", "a typed handler map + branded payloads"],
      ["a coarse brand (kind, not role)", "no", "role-level brands or an options object"],
      ["wrong order at the I/O boundary", "**no**", "outside the type system entirely"],
    ],
  );

  blank();
  good(
    "THE HONEST SUMMARY. Concept #6 reads: given that a call site is typed and " +
      "its values are branded, an argument-order mistake is a compile error. " +
      "Both conditions are yours to maintain — and the last row of that table " +
      "is not maintainable at all, only designed around.",
  );
}
