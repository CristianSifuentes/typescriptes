// @ts-nocheck
/**
 * 09-type-guards — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * JavaScript programmers write validation functions constantly:
 *
 *     function isSuccess(r) { return r && typeof r.body === "string"; }
 *
 * The function is fine. The problem is that its RESULT is a boolean and nothing
 * more. Calling it establishes no fact that the rest of the program can use,
 * because the rest of the program has no vocabulary for facts.
 *
 * Consequences:
 *   1. A validator can be called and its result ignored — no one notices.
 *   2. A validator can be called for the WRONG shape — no one notices.
 *   3. A validator can drift out of sync with the data it validates — no one
 *      notices, because the data has no declared shape to drift from.
 *   4. Validating JSON at the boundary is entirely optional, and therefore
 *      entirely skipped.
 *
 * DOMAIN: parsing a payment webhook from an external provider.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function isPaymentEvent(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.amountCents === "number"
  );
}

export function runBroken(): void {
  section("A validator whose result nothing can use");

  const goodPayload = '{"id":"evt_1","amountCents":4500,"currency":"EUR"}';
  const badPayload = '{"id":"evt_2","amount":"45.00"}';

  js("isPaymentEvent(JSON.parse(goodPayload))");
  detonate("verdict", () => isPaymentEvent(JSON.parse(goodPayload)));
  js("isPaymentEvent(JSON.parse(badPayload))");
  detonate("verdict", () => isPaymentEvent(JSON.parse(badPayload)));
  note("The validator works. Now watch how little that helps.");

  blank();
  section("1. Forgetting to call it costs nothing");

  js("processing the bad payload without validating");
  detonate("charge", () => {
    const event = JSON.parse(badPayload);
    return event.amountCents / 100;
  });
  note(
    "NaN. The validator existed, was correct, and was simply not called. " +
      "Nothing in the language links the two lines of code.",
  );

  blank();
  section("2. Calling it and ignoring the answer costs nothing");

  detonate("charge", () => {
    const event = JSON.parse(badPayload);
    isPaymentEvent(event); // called, result discarded
    return `charging ${event.amountCents / 100} ${event.currency}`;
  });
  note(
    '"charging NaN undefined". The call is a no-op statement; JavaScript ' +
      "does not care that its result was thrown away.",
  );

  blank();
  section("3. Validating the wrong thing costs nothing");

  detonate("charge", () => {
    const envelope = { event: JSON.parse(badPayload), receivedAt: 1 };
    if (isPaymentEvent(envelope)) {
      return "validated!";
    }
    return `not a payment event: ${envelope.event.amountCents}`;
  });
  note(
    "The validator was applied to the ENVELOPE instead of the event inside " +
      "it. It correctly returned false — for the wrong object — and the code " +
      "went down a path that reads the unvalidated data anyway.",
  );

  blank();
  section("4. Drift costs nothing (until it costs everything)");

  js("the provider renames amountCents → amount_cents");
  detonate("charge", () => {
    const event = JSON.parse('{"id":"evt_3","amount_cents":4500}');
    if (isPaymentEvent(event)) return "valid";
    return `rejected, falling back to ${event.amountCents}`;
  });
  runtimeSays(
    "no error — the fallback reads undefined",
    "The validator still compiles, still runs, and now rejects every event. " +
      "There is no declared shape for it to be checked against, so nothing " +
      "flags the mismatch.",
  );

  blank();
  table(
    ["failure", "cost in JavaScript", "detected?"],
    [
      ["validator never called", "NaN through the system", "no"],
      ["result ignored", '"charging NaN undefined"', "no"],
      ["applied to the wrong object", "unvalidated data used anyway", "no"],
      ["validator drifts from the data", "everything rejected, or worse", "no"],
      ["validated data used elsewhere", "no fact carried across functions", "n/a"],
    ],
  );
  note(
    "In every row the validator itself is CORRECT. What is missing is a way to " +
      "make its conclusion binding on the code that follows.",
  );
}
