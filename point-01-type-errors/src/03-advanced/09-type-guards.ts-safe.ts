/**
 * 09-type-guards — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * A USER-DEFINED TYPE GUARD is a function whose return type is a *predicate*:
 *
 *     function isPaymentEvent(value: unknown): value is PaymentEvent
 *                                              ^^^^^^^^^^^^^^^^^^^^^
 *
 * `value is PaymentEvent` says: "when this function returns true, the compiler
 * may narrow the argument to `PaymentEvent` on the true edge." It turns a
 * runtime boolean into a compile-time fact — the ONLY bridge across the erasure
 * boundary (00-foundations §2), because at runtime types no longer exist and
 * the only thing available is a value to inspect.
 *
 * Three tools, in increasing strength:
 *   `value is T`        — narrowing predicate; caller must branch.
 *   `asserts value is T` — assertion signature; narrows the rest of the scope.
 *   `asserts value`      — assertion of truthiness (like Node's `assert`).
 *
 * AND THE CATCH, stated up front: a type predicate is a CLAIM THE COMPILER DOES
 * NOT VERIFY. The body could `return true` unconditionally. Guards are where
 * you take responsibility; §5 makes that explicit, and 04-expert/12 dissects it.
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
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

interface PaymentEvent {
  readonly id: string;
  readonly amountCents: number;
  readonly currency: "EUR" | "USD" | "GBP";
}

/**
 * The guard. Note the parameter type: `unknown`, not `any`.
 * `unknown` is the honest type for "bytes from the outside world": every value
 * is a member, so NO operation is permitted until you prove something. That is
 * precisely what this function does, member by member.
 */
function isPaymentEvent(value: unknown): value is PaymentEvent {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate["id"] === "string" &&
    typeof candidate["amountCents"] === "number" &&
    (candidate["currency"] === "EUR" ||
      candidate["currency"] === "USD" ||
      candidate["currency"] === "GBP")
  );
}

/** An ASSERTION signature: narrows for the remainder of the scope, or throws. */
function assertPaymentEvent(value: unknown): asserts value is PaymentEvent {
  if (!isPaymentEvent(value)) {
    throw new TypeError(`not a PaymentEvent: ${JSON.stringify(value)}`);
  }
}

export function runSafe(): void {
  const goodPayload = '{"id":"evt_1","amountCents":4500,"currency":"EUR"}';
  const badPayload = '{"id":"evt_2","amount":"45.00"}';

  // =========================================================================
  // 1. `unknown` FORCES THE QUESTION TO BE ASKED
  // =========================================================================
  section("`unknown`: the type that permits nothing until you prove something");

  const parsed: unknown = JSON.parse(goodPayload);
  proofBlock("what the compiler knows about parsed JSON");
  proveType<unknown>()(parsed, "unknown", "JSON.parse annotated as unknown");

  ts("parsed.amountCents   // parsed: unknown");
  // @ts-expect-error TS18046: 'parsed' is of type 'unknown'.
  const amount = parsed.amountCents;
  void amount;
  compilerSays(
    "TS18046",
    "'parsed' is of type 'unknown'.",
    "`unknown` is the universal set: every value is a member, so no operation " +
      "is valid for ALL members, so no operation is permitted. Compare `any`, " +
      "which permits everything and proves nothing.",
  );

  // =========================================================================
  // 2. THE GUARD TURNS A BOOLEAN INTO A FACT
  // =========================================================================
  blank();
  section("`value is PaymentEvent` — a boolean the compiler believes");

  if (isPaymentEvent(parsed)) {
    proofBlock("point — inside `if (isPaymentEvent(parsed))`");
    proveType<PaymentEvent>()(parsed, "PaymentEvent", "narrowed by the predicate");
    proveType<number>()(parsed.amountCents, "number", "member of the proved type");
    detonate("charge", () => `${(parsed.amountCents / 100).toFixed(2)} ${parsed.currency}`);
  } else {
    proofBlock("point — the false edge");
    proveType<unknown>()(parsed, "unknown", "the guard proves nothing on failure");
  }
  good(
    "The fact crossed the branch boundary. In JavaScript the same call " +
      "returned a boolean that established nothing.",
  );

  // =========================================================================
  // 3. THE FOUR JAVASCRIPT FAILURES, ELIMINATED
  // =========================================================================
  blank();
  section("The failures from the .js-broken twin");

  const unvalidated: unknown = JSON.parse(badPayload);

  ts("skipping the validator entirely");
  // @ts-expect-error TS18046: 'unvalidated' is of type 'unknown'.
  const skipped = unvalidated.amountCents / 100;
  void skipped;
  compilerSays(
    "TS18046",
    "'unvalidated' is of type 'unknown'.",
    "Failure 1 (forgot to call the validator) is now impossible: you cannot " +
      "touch the value at all without proving something first.",
  );

  ts("calling the validator and discarding the answer");
  isPaymentEvent(unvalidated); // legal, but useless — and the next line proves it
  // @ts-expect-error TS18046: 'unvalidated' is of type 'unknown'.
  const ignored = unvalidated.amountCents;
  void ignored;
  compilerSays(
    "TS18046",
    "'unvalidated' is of type 'unknown'.",
    "Failure 2: narrowing happens on the TRUE EDGE of a branch. No branch, no " +
      "narrowing. The discarded result is still discarded.",
  );

  ts("validating the envelope instead of the event inside it");
  const envelope = { event: unvalidated, receivedAt: Date.now() };
  if (isPaymentEvent(envelope)) {
    // Even here the compiler is precise: `envelope` was narrowed, so it is now
    // `{ event: unknown; receivedAt: number } & PaymentEvent`, and reading
    // `envelope.event.amountCents` is STILL an error.
    // @ts-expect-error TS18046: 'envelope.event' is of type 'unknown'.
    void envelope.event.amountCents;
  }
  good(
    "Failure 3: narrowing the wrong object does not narrow the right one. The " +
      "inner value stays `unknown`.",
  );

  ts("the provider renames amountCents → amount_cents");
  compilerSays(
    "TS2339",
    "Property 'amountCents' does not exist on type '{ amount_cents: number; }'.",
    "Failure 4: the shape is declared in ONE place (`PaymentEvent`), so drift " +
      "between the guard, the type, and the consumers is a compile error " +
      "rather than a silent rejection of every event.",
  );

  // =========================================================================
  // 4. ASSERTION SIGNATURES
  // =========================================================================
  blank();
  section("`asserts value is T` — narrowing without a branch");

  const second: unknown = JSON.parse(goodPayload);
  assertPaymentEvent(second);
  proofBlock("point — after `assertPaymentEvent(second)`");
  proveType<PaymentEvent>()(second, "PaymentEvent", "narrowed for the REST OF THE SCOPE");
  detonate("id", () => second.id);
  note(
    "An assertion signature narrows everything after the call, because the " +
      "only way execution continues is if the assertion held. Requirement: the " +
      "call must be a statement on a variable with an explicit type, and the " +
      "asserting function must have an explicit type annotation — the compiler " +
      "will not infer an `asserts` signature.",
  );

  ts("assertPaymentEvent(JSON.parse(badPayload)) — at runtime");
  detonate("assertion on a bad payload", () => {
    assertPaymentEvent(JSON.parse(badPayload));
    return "never reached";
  });
  good("Throws — deliberately, at the boundary, with a useful message.");

  // =========================================================================
  // 5. THE CATCH: A PREDICATE IS AN UNVERIFIED CLAIM
  // =========================================================================
  blank();
  section("What the compiler does NOT check about a guard");

  /** A guard that lies. The compiler accepts the body without complaint. */
  const isPaymentEventLying = (value: unknown): value is PaymentEvent => {
    void value;
    return true; // "trust me"
  };

  warn(
    "The body above is accepted. A type predicate is a CLAIM about the " +
      "relationship between the function's runtime behaviour and its return " +
      "type, and TypeScript verifies only that the claimed type is assignable " +
      "to the parameter's type (TS2677) — never that the body actually " +
      "establishes it.",
  );

  const lied: unknown = JSON.parse(badPayload);
  if (isPaymentEventLying(lied)) {
    proveType<PaymentEvent>()(lied, "PaymentEvent", "the compiler believed the lie");
    detonate("charge, computed from a lie", () => (lied.amountCents / 100).toFixed(2));
  }
  warn(
    "NaN — at runtime, in a strictly-typed program. This is the honest edge of " +
      "Concept #1: guards are where YOU take responsibility for the bridge " +
      "between runtime values and compile-time types. Keep them tiny, keep " +
      "them next to the type they prove, or generate them from a schema " +
      "validator (zod, valibot, typia) so the guard and the type cannot drift.",
  );

  ts("a predicate whose type is unrelated to its parameter");
  compilerSays(
    "TS2677",
    "A type predicate's type must be assignable to its parameter's type.\n" +
      "    Type 'PaymentEvent' is not assignable to type 'number'.",
    "The ONE thing the compiler does check: you cannot claim a value is " +
      "something it could not possibly be.",
  );

  // =========================================================================
  // 6. SUMMARY
  // =========================================================================
  blank();
  table(
    ["tool", "signature", "narrows", "when to use"],
    [
      ["type guard", "(v: unknown) => v is T", "the true edge of a branch", "you want to handle both outcomes"],
      ["assertion", "(v: unknown) => asserts v is T", "the rest of the scope", "invalid input is a bug: throw"],
      ["truthiness assertion", "(v: unknown) => asserts v", "the rest of the scope", "non-null / non-empty checks"],
      ["`in` / `typeof` / `instanceof`", "built in", "the true and false edges", "primitives and classes"],
      ["discriminant", "r.kind === 'x'", "both edges, precisely", "unions you designed yourself"],
    ],
  );
  note(
    "Rule of thumb: use built-in guards where they suffice; write predicates " +
      "only at the boundary; and treat every hand-written predicate as " +
      "security-critical code, because that is exactly what it is.",
  );
}
