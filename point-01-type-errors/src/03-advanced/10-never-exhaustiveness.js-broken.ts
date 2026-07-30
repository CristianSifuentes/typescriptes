// @ts-nocheck
/**
 * 10-never-exhaustiveness — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * THE QUESTION THIS DEMO IS ABOUT:
 *
 *     "Have I handled every case?"
 *
 * In JavaScript that question is UNANSWERABLE, because there is no artefact
 * that lists the cases. A `switch` over a string is a switch over the set of
 * all strings — an infinite set — so "all cases" has no meaning, and adding a
 * new case is invisible to every existing `switch`.
 *
 * The result is the most expensive bug shape in maintenance: code that was
 * correct when written and became silently incorrect when someone, somewhere
 * else, added a state.
 *
 * DOMAIN: order lifecycle. Today: draft → placed → shipped → cancelled.
 * Next sprint someone adds `refunded`, and every switch in the codebase quietly
 * starts returning `undefined`.
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

/** Written when there were four states. Correct on the day it was written. */
function labelFor(state) {
  switch (state) {
    case "draft":
      return "Draft";
    case "placed":
      return "Placed";
    case "shipped":
      return "Shipped";
    case "cancelled":
      return "Cancelled";
  }
  // No default. In JavaScript, falling off the end returns `undefined`.
}

/** Same shape, expressed as an if-chain. Same disease. */
function badgeColour(state) {
  if (state === "draft") return "grey";
  if (state === "placed") return "blue";
  if (state === "shipped") return "green";
  if (state === "cancelled") return "red";
}

/** Money. This is where it stops being funny. */
function refundableAmount(order) {
  if (order.state === "placed") return order.totalCents;
  if (order.state === "shipped") return order.totalCents - order.shippingCents;
  if (order.state === "cancelled") return 0;
  return 0;
}

export function runBroken(): void {
  section("Today: four states, everything works");

  for (const state of ["draft", "placed", "shipped", "cancelled"]) {
    detonate(`labelFor("${state}")`, () => labelFor(state));
  }
  note("Four for four. The code is correct, the tests pass, the PR is approved.");

  blank();
  section('Next sprint: someone adds "refunded" in a different file');

  detonate('labelFor("refunded")', () => labelFor("refunded"));
  detonate('badgeColour("refunded")', () => badgeColour("refunded"));
  note(
    "`undefined` from both. No exception, no warning, no failing test — there " +
      "is no test for a state that did not exist when the tests were written.",
  );

  blank();
  js("what the user sees");
  detonate("rendered label", () => `<span class="${badgeColour("refunded")}">${labelFor("refunded")}</span>`);
  note('`<span class="undefined">undefined</span>`. Shipped to production.');

  blank();
  section("And the expensive one");

  const refunded = { state: "refunded", totalCents: 12_950, shippingCents: 499 };
  detonate("refundableAmount(refunded order)", () => refundableAmount(refunded));
  note(
    "0. The customer is owed 129.50 and the system says zero — because the " +
      "author wrote a defensive `return 0` fallback, which is exactly the kind " +
      "of 'safe default' that converts a crash into a wrong answer.",
  );

  blank();
  section("Why a typo is the same bug");

  detonate('labelFor("Placed")  — capital P', () => labelFor("Placed"));
  detonate('labelFor("palced")  — transposed', () => labelFor("palced"));
  note(
    "Identical outcome. To JavaScript, an unhandled valid state and a typo are " +
      "the same event: a string that matched no case.",
  );

  blank();
  table(
    ["change", "effect on existing switches", "signal"],
    [
      ["add a new state", "silently return undefined", "none"],
      ["rename a state", "silently return undefined", "none"],
      ["typo in a case label", "silently return undefined", "none"],
      ["defensive `return 0`", "silently return a WRONG value", "none"],
      ["remove a state", "dead branch left behind", "none"],
    ],
  );
  note(
    "Every row has the same signal column. The information needed to do better " +
      "— the list of legal states — exists only in the developers' heads.",
  );
}
