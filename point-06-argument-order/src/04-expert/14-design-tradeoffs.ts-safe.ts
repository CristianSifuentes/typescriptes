/**
 * 14-design-tradeoffs — CHOOSING A REMEDY
 * ---------------------------------------------------------------------------
 * The last demo is about judgement. Five remedies have been built; each costs
 * something; none is right everywhere. This file turns the choice into a
 * procedure, and then shows the one type-level tool that can enforce the
 * decision: a guard that makes an AMBIGUOUS SIGNATURE fail to compile, pushing
 * the author towards a remedy instead of hoping they choose one.
 *
 * THE DECISION PROCEDURE, in two questions per parameter pair:
 *
 *   Q1  Would a swap here be SILENT? (No crash, no NaN, no visible garbage.)
 *   Q2  Would it be EXPENSIVE? (Money, permissions, data loss, wrong output.)
 *
 *   both no    → do nothing. `max(a, b)` needs no ceremony.
 *   Q1 only    → rename, or reorder so the types differ. Cheap fixes first.
 *   both yes   → brand, or restructure. This is where the cost is justified.
 */

import {
  section,
  ts,
  good,
  warn,
  note,
  compilerSays,
  table,
  blank,
  detonate,
  compileTimeOnly,
} from "../99-runner/trace.js";
import { proveType, proofBlock, type Equals } from "../99-runner/type-assert.js";

declare const brand: unique symbol;
type Brand<T, K extends string> = T & { readonly [brand]: K };
type OrderId = Brand<string, "OrderId">;
type CustomerId = Brand<string, "CustomerId">;
type Cents = Brand<number, "Cents">;

const orderId = (raw: string): OrderId => raw as OrderId;
const customerId = (raw: string): CustomerId => raw as CustomerId;
const cents = (raw: number): Cents => raw as Cents;

// ===========================================================================
// THE `never`-BASED GUARD
// ===========================================================================

/**
 * Makes a call whose two type arguments are IDENTICAL fail to compile.
 *
 * The mechanism: when `A` and `B` are the same type, the rest parameter's type
 * becomes a one-element tuple, so the call is short by one argument and the
 * compiler reports TS2554. When they differ, the tuple is empty and the call is
 * fine.
 *
 * Be honest about the ergonomics — this is the interesting limitation. The
 * MESSAGE is the generic arity error, "Expected 3 arguments, but got 2". The
 * explanation lives in the required parameter's NAME, which editors show in
 * their signature hint and hover, and which never appears in terminal output.
 * TypeScript has no custom-diagnostic mechanism, so a parameter name and a type
 * name are the only channels available for advice.
 */
type RejectAmbiguousPair<A, B> = Equals<A, B> extends true
  ? [ambiguous_parameters_share_a_type_brand_them_or_use_an_options_object: never]
  : [];

function measure<A, B>(
  first: A,
  second: B,
  ...guard: RejectAmbiguousPair<A, B>
): readonly [A, B] {
  void guard; // erased at runtime; it exists only to make the call fail to compile
  return [first, second] as const;
}

export function runSafe(): void {
  // =========================================================================
  // 1. THE DECISION PROCEDURE
  // =========================================================================
  section("Two questions per parameter pair");

  note("    Q1  Would a swap here be SILENT?     (no crash, no NaN, no garbage)");
  note("    Q2  Would it be EXPENSIVE?           (money, permissions, data loss)");
  note("");
  note("    both no  → do nothing");
  note("    Q1 only  → rename, or reorder so the types differ");
  note("    both yes → brand, or restructure");

  blank();
  table(
    ["signature", "Q1 silent?", "Q2 expensive?", "verdict"],
    [
      ["`max(a: number, b: number)`", "yes", "no — commutative", "do nothing"],
      ["`join(a: string, b: string)`", "no — output looks wrong", "no", "do nothing"],
      ["`fullName(first, last)`", "no — visibly wrong", "no", "rename at most"],
      ["`aspectRatio(width, height)`", "**yes**", "**yes** — wrong layout", "**brand**"],
      ["`transfer(from, to, amount)`", "**yes**", "**yes** — money", "**brand + options**"],
      ["`dateRange(start, end)`", "**yes**", "**yes** — negative duration", "**brand**"],
      ["`createAccount(e, isActive, isAdmin)`", "**yes**", "**yes** — privileges", "**literal unions**"],
      ["`sync(path, delete, dryRun)`", "**yes**", "**yes** — data loss", "**split the function**"],
    ],
  );
  good(
    "Note that the verdict column is not 'brand everything'. Four different " +
      "remedies appear, and two rows conclude 'do nothing' — which is a real " +
      "answer, not a failure of nerve.",
  );

  // =========================================================================
  // 2. THE COST TABLE
  // =========================================================================
  blank();
  section("What each remedy costs");

  table(
    ["remedy", "catches same-typed swap", "call-site cost", "type cost", "best for"],
    [
      ["do nothing", "no", "none", "none", "commutative / visibly-wrong pairs"],
      ["reorder so types differ", "yes", "none", "none", "when you control the signature"],
      ["literal unions", "yes", "none", "one alias", "flags and enumerable modes"],
      ["options object", "order removed", "a few keystrokes", "one interface", "3+ params, or any 2 flags"],
      ["branded types", "yes", "a constructor call", "alias + constructor", "same-typed KINDS"],
      ["builder + type-state", "yes", "a chain", "generic machinery", "wide APIs, many call sites"],
      ["split the function", "yes", "none", "none", "a flag that selects behaviour"],
    ],
  );
  note(
    "    Row 2 deserves more attention than it gets. If you own the signature, " +
      "the cheapest fix for `(width: number, height: number)` is often to make " +
      "one of them a different type for an unrelated good reason — e.g. accept " +
      "a `Dimensions` object — rather than to introduce branding machinery.",
  );

  // =========================================================================
  // 3. THE GUARD
  // =========================================================================
  blank();
  section("Enforcing the decision: a `never`-based ambiguity guard");

  const ok = measure(orderId("ord-1"), cents(2500));
  proofBlock("differently-typed pair — no guard argument required");
  proveType<readonly [OrderId, Cents]>()(ok, "readonly [OrderId, Cents]", "unambiguous");

  ts("measure(3, 10)   // two raw numbers");
  compileTimeOnly(() => {
    // @ts-expect-error TS2554: Expected 3 arguments, but got 2.
    const ambiguous = measure(3, 10);
    void ambiguous;
  });
  compilerSays(
    "TS2554",
    "Expected 3 arguments, but got 2.",
    "The guard fires — and here is its honest limitation. The MESSAGE is the " +
      "generic arity error. The explanation lives in the required parameter's " +
      "NAME (`ambiguous_parameters_share_a_type_brand_them_or_use_an_options_" +
      "object`), which editors show in the signature hint and hover, and which " +
      "never reaches terminal output. TypeScript has no custom-diagnostic " +
      "mechanism; a parameter name and a type name are the only channels for " +
      "advice.",
  );

  const branded = measure(orderId("ord-1"), customerId("cust-9"));
  proveType<readonly [OrderId, CustomerId]>()(
    branded,
    "readonly [OrderId, CustomerId]",
    "branded ⇒ unambiguous again",
  );
  good(
    "Brand the pair and the guard goes quiet. The type has become a policy: " +
      "'this API refuses to accept two indistinguishable values.'",
  );
  warn(
    "Deploy this sparingly. It is genuinely useful on a small, high-stakes core " +
      "API; on a general-purpose library it produces a confusing arity error " +
      "for users who have done nothing wrong yet.",
  );

  // =========================================================================
  // 4. THE CALL SITE, AND THE HUMAN
  // =========================================================================
  blank();
  section("The half no type system fixes: reading the call");

  note(
    "    Even a fully branded call is read by a human at some point, and " +
      "editors help in ways worth designing for:",
  );
  note(
    "    • INLAY PARAMETER HINTS render `refund(orderId: ord-1, customerId: " +
      "cust-9, …)` inline. They are off by default in most setups and are " +
      "arguably the highest-value editor setting for this bug class.",
  );
  note(
    "    • An OPTIONS OBJECT gets the same effect with no editor configuration, " +
      "because the names are in the source. That is a real argument for " +
      "objects over positions, independent of type safety.",
  );
  note(
    "    • Signature help shows parameter names and, with the guard above, the " +
      "advice encoded in them.",
  );

  const refundRequest = {
    orderId: orderId("ord-1"),
    customerId: customerId("cust-9"),
    amount: cents(2500),
    mode: "partial",
    notify: "silent",
  } as const;
  detonate("the fully-remedied call", () => JSON.stringify(refundRequest));
  good(
    "Branded ids (kinds cannot be swapped), an options object (no positions), " +
      "and literal unions for the flags (`\"partial\"`/`\"silent\"` instead of " +
      "two booleans). Every defect from the JavaScript twin is now either a " +
      "compile error or unwriteable.",
  );

  // =========================================================================
  // 5. THE CLOSING SUMMARY
  // =========================================================================
  blank();
  section("Where TypeScript cannot protect you from a wrong-order call");

  warn("(a) UNTYPED OR ASSERTED CALL SITES — `as`, `any`, `Function`, `x!`.");
  note(
    "    An assertion overrides the checker and emits nothing; `any` switches " +
      "checking off; a `Function`-typed callee has no signature to check " +
      "against. Design around it: confine `as` to smart constructors, use " +
      "`unknown` + a validated guard at the edge, and never annotate anything " +
      "`Function`.",
  );

  blank();
  warn("(b) SAME-TYPED PARAMETERS YOU CHOSE NOT TO BRAND — including ROLES.");
  note(
    "    `send(to: AccountId, from: AccountId)` is the level-02 blind spot " +
      "re-opened by a brand that is too coarse: both values are the same KIND " +
      "playing different ROLES. Design around it: role-level brands where the " +
      "stakes justify them, an options object where they do not, and a " +
      "deliberate 'do nothing' where a swap would be visible or harmless.",
  );

  blank();
  warn("(c) THE I/O BOUNDARY — data that arrives already in the wrong order.");
  note(
    "    No compiler can know whether the sender put the payer in the `from` " +
      "field. Validation checks FORMAT, never INTENT. Design around it: " +
      "idempotency keys, confirmation steps, reconciliation, and APIs where " +
      "the dangerous direction needs an explicit signal rather than a field " +
      "order.",
  );

  blank();
  good(
    "CONCEPT #6, STATED PRECISELY: given a typed call site whose same-typed " +
      "parameters have been branded, an argument-order mistake is a compile " +
      "error. Positional checking gives you the first half for free; the " +
      "second half is a design decision you make per parameter pair — and the " +
      "two questions at the top of this demo are how you make it.",
  );
}
