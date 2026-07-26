/**
 * 13-discriminated-unions — MAKING ILLEGAL STATES UNREPRESENTABLE
 * ---------------------------------------------------------------------------
 * This is the highest-leverage idea in the whole project, and it inverts the
 * usual framing of Concept #1.
 *
 * The previous demos asked: "how does the compiler catch my mistake?"
 * This one asks: "how do I design types so that the mistake CANNOT BE WRITTEN?"
 *
 * A DISCRIMINATED UNION (also: tagged union, sum type, variant) is a union
 * whose members all declare a common member with a LITERAL type:
 *
 *     type RequestState =
 *       | { status: "idle" }
 *       | { status: "loading"; startedAt: number }
 *       | { status: "success"; order: Order }
 *       | { status: "failure"; error: string };
 *
 * Three properties make it powerful, and they compound:
 *
 *   1. EXCLUSIVITY. `order` exists only in the success member. There is no
 *      value of this type that is both loading and holding an order — the
 *      impossible states are not "checked for", they are UNREPRESENTABLE.
 *   2. NARROWING. Comparing the discriminant identifies exactly one member, so
 *      the compiler unlocks that member's fields and hides the others.
 *   3. EXHAUSTIVENESS. The member list is finite and known, so `assertNever`
 *      can prove that every case is handled (demos 10 and 14).
 *
 * Counting states: the boolean-soup model had 2×2×2 = 8 representable states
 * for 4 meaningful ones. This model has exactly 4. The illegal half of the
 * state space is deleted rather than defended.
 */

import {
  section,
  ts,
  good,
  note,
  compilerSays,
  table,
  blank,
  detonate,
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

interface Order {
  readonly id: string;
  readonly totalCents: number;
}

/** The whole state machine, as a type. Four states. Not eight. */
type RequestState =
  | { readonly status: "idle" }
  | { readonly status: "loading"; readonly startedAt: number }
  | { readonly status: "success"; readonly order: Order; readonly fetchedAt: number }
  | { readonly status: "failure"; readonly error: string; readonly retryable: boolean };

function assertNever(value: never): never {
  throw new Error(`Unhandled state: ${JSON.stringify(value)}`);
}

/** The renderer. Note: no defensive checks anywhere. There is nothing to defend. */
const render = (state: RequestState): string => {
  switch (state.status) {
    case "idle":
      return "Nothing requested yet.";
    case "loading":
      return `Loading… (started ${state.startedAt}ms)`;
    case "success":
      return `Order ${state.order.id}: ${(state.order.totalCents / 100).toFixed(2)}`;
    case "failure":
      return `Error: ${state.error}${state.retryable ? " (retryable)" : ""}`;
    default:
      return assertNever(state);
  }
};

export function runSafe(): void {
  // =========================================================================
  // 1. THE FOUR LEGAL STATES, AND ONLY THOSE
  // =========================================================================
  section("Every representable state is a meaningful state");

  const states: readonly RequestState[] = [
    { status: "idle" },
    { status: "loading", startedAt: 120 },
    { status: "success", order: { id: "o-1", totalCents: 12_950 }, fetchedAt: 480 },
    { status: "failure", error: "gateway timeout", retryable: true },
  ];

  for (const state of states) {
    detonate(`render({ status: "${state.status}" })`, () => render(state));
  }
  good("Four states. Four renders. Zero defensive checks in the renderer.");

  // =========================================================================
  // 2. THE IMPOSSIBLE STATES ARE NOW UNWRITEABLE
  // =========================================================================
  blank();
  section("The four impossible states from the JavaScript twin");

  ts('{ status: "loading", order: {...} }   // loading AND holding data');
  // @ts-expect-error TS2353/TS2561: Object literal may only specify known properties,
  // and 'order' does not exist in type '{ readonly status: "loading"; readonly startedAt: number; }'.
  const loadingWithData: RequestState = { status: "loading", startedAt: 1, order: { id: "x", totalCents: 1 } };
  void loadingWithData;
  compilerSays(
    "TS2353",
    "Object literal may only specify known properties, and 'order' does not " +
      "exist in type '{ readonly status: \"loading\"; readonly startedAt: number; }'.",
    "The discriminant selected a member, and that member has no `order`. The " +
      "impossible combination has no type to inhabit.",
  );

  ts('{ status: "success", error: "..." }   // success AND error');
  const successWithError: RequestState = {
    status: "success",
    order: { id: "x", totalCents: 1 },
    fetchedAt: 1,
    // Note where the directive has to go: `@ts-expect-error` suppresses errors
    // on the FOLLOWING LINE, and the excess-property diagnostic is reported on
    // the offending member, not on the declaration.
    // @ts-expect-error TS2353: 'error' does not exist in the success member.
    error: "boom",
  };
  void successWithError;

  ts("{}   // the state right after useState({}) — neither loading nor idle");
  // @ts-expect-error TS2739: Type '{}' is missing the following properties.
  const nothing: RequestState = {};
  void nothing;
  compilerSays(
    "TS2739",
    "Type '{}' is missing the following properties from type " +
      "'{ readonly status: \"idle\"; }': status",
    "The 'first state the component is ever in' is now a build error rather " +
      "than a TypeError in production.",
  );

  ts('{ status: "success", order: {...} }   // partial update: forgot fetchedAt');
  // @ts-expect-error TS2741: Property 'fetchedAt' is missing.
  const partial: RequestState = { status: "success", order: { id: "x", totalCents: 1 } };
  void partial;
  compilerSays(
    "TS2741",
    "Property 'fetchedAt' is missing in type '{ status: \"success\"; order: " +
      "Order; }' but required in type '{ readonly status: \"success\"; " +
      "readonly order: Order; readonly fetchedAt: number; }'.",
    "The spread-based partial update — the most common React state bug — " +
      "becomes a missing-property error, because each state carries exactly " +
      "the data it needs and nothing else.",
  );

  // =========================================================================
  // 3. NARROWING BY DISCRIMINANT, TRACED
  // =========================================================================
  blank();
  section("What the compiler unlocks in each branch");

  const trace = (state: RequestState): void => {
    proofBlock(`narrowing on state.status === "${state.status}"`);
    if (state.status === "success") {
      proveType<{ readonly status: "success"; readonly order: Order; readonly fetchedAt: number }>()(
        state,
        "the success member",
        "`order` and `fetchedAt` are now readable; `error` is not",
      );
      proveType<Order>()(state.order, "Order", "exclusive to this member");
    } else if (state.status === "failure") {
      proveType<{ readonly status: "failure"; readonly error: string; readonly retryable: boolean }>()(
        state,
        "the failure member",
        "`error` readable; `order` is not",
      );
    }
  };

  trace({ status: "success", order: { id: "o-9", totalCents: 100 }, fetchedAt: 2 });
  trace({ status: "failure", error: "nope", retryable: false });

  blank();
  ts("state.order   // without discriminating first");
  compilerSays(
    "TS2339",
    "Property 'order' does not exist on type 'RequestState'.",
    "Reading a member-specific field before proving which member you hold. " +
      "The apparent members of a union are the intersection (demo 08); only " +
      "`status` qualifies.",
  );

  // =========================================================================
  // 4. TRANSITIONS AS A TYPED FUNCTION
  // =========================================================================
  blank();
  section("The state machine's transitions, also typed");

  type RequestEvent =
    | { readonly type: "fetch"; readonly at: number }
    | { readonly type: "resolved"; readonly order: Order; readonly at: number }
    | { readonly type: "rejected"; readonly error: string; readonly retryable: boolean };

  const reduce = (state: RequestState, event: RequestEvent): RequestState => {
    switch (event.type) {
      case "fetch":
        return { status: "loading", startedAt: event.at };
      case "resolved":
        // A transition RETURNS a whole new state, so there is no field left
        // over from the previous one. The class of "forgot to clear isLoading"
        // bugs is structurally absent.
        return { status: "success", order: event.order, fetchedAt: event.at };
      case "rejected":
        return { status: "failure", error: event.error, retryable: event.retryable };
      default:
        return assertNever(event);
    }
  };

  let state: RequestState = { status: "idle" };
  detonate("initial", () => render(state));
  state = reduce(state, { type: "fetch", at: 120 });
  detonate("after fetch", () => render(state));
  state = reduce(state, { type: "resolved", order: { id: "o-1", totalCents: 12_950 }, at: 480 });
  detonate("after resolved", () => render(state));
  state = reduce(state, { type: "rejected", error: "gateway timeout", retryable: true });
  detonate("after rejected", () => render(state));

  good(
    "Returning a whole new state — rather than spreading the old one — is what " +
      "makes stale fields impossible. The type forces that discipline: you " +
      "cannot spread a `loading` state into a `success` state, because their " +
      "members do not overlap.",
  );

  // =========================================================================
  // 5. THE ACCOUNTING
  // =========================================================================
  blank();
  section("State-space accounting");
  table(
    ["model", "representable states", "meaningful states", "illegal states"],
    [
      ["{ isLoading, data, error }", "8", "4", "4 (defended by hand)"],
      ["+ isStale, + retryCount(0-3)", "64", "~8", "~56"],
      ["discriminated union", "4", "4", "**0**"],
    ],
  );
  note(
    "This is the deepest form of Concept #1. The earlier levels caught " +
      "mistakes AFTER you wrote them. A discriminated union removes the region " +
      "of the state space where the mistake lives, so there is nothing left to " +
      "catch. Design first, diagnostics second.",
  );

  blank();
  note(
    "PRACTICAL NOTES. (a) Use a string-literal discriminant, not a boolean: " +
      "booleans do not scale past two states. (b) Name the discriminant " +
      "consistently across your codebase (`kind`, `type`, or `status` — pick " +
      "one). (c) Give each member ONLY the data that state actually has; " +
      "shared data goes in a wrapper, not in every member. (d) Always pair the " +
      "union with `assertNever` (demo 14), or the exhaustiveness guarantee is " +
      "not being collected.",
  );
}
