/**
 * 10-never-exhaustiveness — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `never` is the EMPTY SET: the type with no values (00-foundations §3).
 *
 * Three facts follow directly, and together they form the most elegant
 * mechanism in the whole type system:
 *
 *   1. NOTHING is assignable to `never` (except `never` itself). To hand a
 *      value to a `never` parameter you would need a value from an empty set.
 *   2. `never` is assignable to EVERYTHING (it is the subset of every set),
 *      which is why a function returning `never` composes anywhere.
 *   3. When narrowing removes every member of a union, the residual type is
 *      `never` — the compiler has *proved* the point is unreachable.
 *
 * EXHAUSTIVENESS CHECKING is fact 1 applied to fact 3:
 *
 *     default: return assertNever(state);
 *
 * If every case is handled, `state` is `never` there and the call type-checks.
 * If a case is missing, `state` is that missing member — and the compiler names
 * it, by name, in the error.
 *
 * This converts "did I handle everything?" from an unanswerable question into a
 * build failure.
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

/** The list of legal states — a compiler artefact, not a convention. */
type OrderState = "draft" | "placed" | "shipped" | "cancelled";

interface Order {
  readonly id: string;
  readonly state: OrderState;
  readonly totalCents: number;
  readonly shippingCents: number;
}

/**
 * The exhaustiveness helper.
 *
 * Its parameter type is `never`, so calling it is only legal at a program point
 * the compiler has proved unreachable. The `never` RETURN type additionally
 * tells control-flow analysis that this call does not come back, which is what
 * lets it sit in a `default:` branch without upsetting return checking.
 *
 * The runtime `throw` is the belt to the compiler's braces: it covers the case
 * where a value arrives from outside the type system (a cast, `any`, or raw
 * JSON), because that is the only way this line can ever execute.
 */
function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

export function runSafe(): void {
  // =========================================================================
  // 1. NARROWING TO `never` — watch the set empty out
  // =========================================================================
  section("A union, narrowed member by member, until nothing is left");

  const trace = (state: OrderState): string => {
    if (state === "draft") {
      proveType<"draft">()(state, '"draft"', "1 member left");
      return "Draft";
    }
    proveType<"placed" | "shipped" | "cancelled">()(
      state,
      '"placed" | "shipped" | "cancelled"',
      "draft subtracted",
    );

    if (state === "placed") {
      proveType<"placed">()(state, '"placed"', "");
      return "Placed";
    }
    proveType<"shipped" | "cancelled">()(state, '"shipped" | "cancelled"', "placed subtracted");

    if (state === "shipped") {
      proveType<"shipped">()(state, '"shipped"', "");
      return "Shipped";
    }
    proveType<"cancelled">()(state, '"cancelled"', "shipped subtracted");

    if (state === "cancelled") {
      return "Cancelled";
    }

    // Every member has been removed. The set is empty.
    proveType<never>()(state, "never", "∅ — the compiler proved this is unreachable");
    return assertNever(state);
  };

  blank();
  proofBlock("narrowing trace for state = 'cancelled'");
  detonate('trace("cancelled")', () => trace("cancelled"));

  blank();
  detonate('trace("draft")', () => trace("draft"));

  // =========================================================================
  // 2. THE SWITCH FORM
  // =========================================================================
  blank();
  section("The idiomatic form: switch + assertNever");

  const labelFor = (state: OrderState): string => {
    switch (state) {
      case "draft":
        return "Draft";
      case "placed":
        return "Placed";
      case "shipped":
        return "Shipped";
      case "cancelled":
        return "Cancelled";
      default:
        return assertNever(state);
    }
  };

  for (const state of ["draft", "placed", "shipped", "cancelled"] as const) {
    detonate(`labelFor("${state}")`, () => labelFor(state));
  }
  good("Four cases, all handled — and the compiler has verified that claim.");

  // =========================================================================
  // 3. WHAT HAPPENS WHEN A CASE IS MISSING
  // =========================================================================
  blank();
  section("Removing one case: the compiler names the exact member");

  ts("a switch over OrderState with the `cancelled` case deleted");
  compilerSays(
    "TS2345",
    "Argument of type '\"cancelled\"' is not assignable to parameter of type 'never'.",
    "Read it as set arithmetic: after handling draft/placed/shipped the " +
      "residual set is { \"cancelled\" }, which is not empty, so it is not " +
      "assignable to ∅. The diagnostic contains the name of the case you " +
      "forgot — the compiler is not saying 'something is wrong', it is saying " +
      "WHICH THING.",
  );

  blank();
  ts('adding "refunded" to OrderState');
  note(
    "Adding a member to the union makes EVERY exhaustive switch in the entire " +
      "program fail to compile, each naming '\"refunded\"'. You get a complete, " +
      "instantaneous work list. In JavaScript the same change produced " +
      "`undefined` in a `class` attribute and a wrong refund amount.",
  );

  // =========================================================================
  // 4. WHY NOTHING IS ASSIGNABLE TO `never`
  // =========================================================================
  blank();
  section("`never` from first principles");

  ts("const x: never = \"anything\";");
  compilerSays(
    "TS2322",
    "Type '\"no\"' is not assignable to type 'never'.",
    "To produce a value of type `never` you would need a value belonging to " +
      "the empty set. There is none. That impossibility is the enforcement " +
      "mechanism.",
  );

  ts('narrowState === "shipped"   // narrowState: "draft" | "placed"');
  compilerSays(
    "TS2367",
    "This comparison appears to be unintentional because the types " +
      "'\"draft\" | \"placed\"' and '\"shipped\"' have no overlap.",
    "A separate, related check: a comparison whose result is provably always " +
      "false. Empty-intersection reasoning, applied to `===`.",
  );

  blank();
  note("Where `never` shows up in practice, all from the same definition:");
  table(
    ["appearance", "meaning"],
    [
      ["residual type after full narrowing", "this point is unreachable"],
      ["return type of a throwing function", "this call never returns"],
      ["`[].map(...)` on `never[]`", "an empty array has no element type"],
      ["a filtered-out conditional type branch", "no member satisfied the condition"],
      ["an impossible intersection (`string & number`)", "no value is both"],
      ["a variable of type `never`", "this binding can never hold anything"],
    ],
  );

  // =========================================================================
  // 5. THE STRONGER FORM: EXHAUSTIVE OVER OBJECT SHAPES
  // =========================================================================
  blank();
  section("The same mechanism over a union of shapes, computing money");

  const refundableAmount = (order: Order): number => {
    switch (order.state) {
      case "draft":
        return 0;
      case "placed":
        return order.totalCents;
      case "shipped":
        return order.totalCents - order.shippingCents;
      case "cancelled":
        return 0;
      default:
        return assertNever(order.state);
    }
  };

  const order: Order = {
    id: "o-1",
    state: "shipped",
    totalCents: 12_950,
    shippingCents: 499,
  };
  detonate("refundableAmount(shipped order)", () => refundableAmount(order));
  good(
    "When `refunded` is added to OrderState, this function fails to compile " +
      "and someone has to decide what a refunded order refunds. That decision " +
      "is forced BEFORE the code ships, not discovered afterwards by a " +
      "customer who was paid zero.",
  );

  blank();
  note(
    "ANTI-PATTERN: a `default: return 0` fallback silences the compiler and " +
      "reintroduces the JavaScript failure exactly — a wrong answer instead of " +
      "a caught error. `assertNever` is the difference between a default that " +
      "*handles* the unknown and one that *hides* it.",
  );

  blank();
  table(
    ["change to the union", "JavaScript", "TypeScript + assertNever"],
    [
      ["add a state", "undefined everywhere, silently", "TS2345 at every switch, named"],
      ["rename a state", "undefined everywhere, silently", "TS2345 at every switch"],
      ["typo in a case label", "silent fall-through", "TS2678 / unreachable case"],
      ["remove a state", "dead branch survives", "TS2678 on the stale case"],
      ["defensive fallback", "wrong value returned", "assertNever forbids the shortcut"],
    ],
  );
}
