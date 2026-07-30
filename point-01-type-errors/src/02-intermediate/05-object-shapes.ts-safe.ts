/**
 * 05-object-shapes — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * An `interface` (or `type`) turns "the shape I have in mind" into a checkable
 * artefact. Five distinct mechanisms are on display here, each with its own
 * diagnostic:
 *
 *   READ of an undeclared member          → TS2339 / TS2551
 *   WRITE of an undeclared member         → TS2339
 *   MISSING required member               → TS2741
 *   EXCESS member on a fresh literal      → TS2561 (the "freshness" check)
 *   USE of an optional member unguarded   → TS18048
 *
 * The fourth is the subtlest and the most interesting; it gets its own section.
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
import { proveType, proofBlock } from "../99-runner/type-assert.js";

interface ShippingAddress {
  readonly country: string;
  readonly postalCode: string;
}

interface Order {
  readonly id: string;
  readonly customerEmail: string;
  readonly totalCents: number;
  /** Optional: `note` may be ABSENT. Under `exactOptionalPropertyTypes` that
   *  is a different state from "present and holding undefined". */
  readonly note?: string;
  readonly shipping: ShippingAddress;
}

function loadOrder(): Order {
  return {
    id: "o-1024",
    customerEmail: "ada@example.com",
    totalCents: 12_950,
    shipping: { country: "DE", postalCode: "10115" },
  };
}

export function runSafe(): void {
  const order = loadOrder();

  // =========================================================================
  // 1. READS
  // =========================================================================
  section("Reading a member the type does not declare");

  ts("order.total");
  // @ts-expect-error TS2339: Property 'total' does not exist on type 'Order'.
  const misread = order.total;
  void misread;
  compilerSays(
    "TS2339",
    "Property 'total' does not exist on type 'Order'.",
    "The `undefined` → NaN → \"$NaN\" chain from the JavaScript version has no " +
      "first link.",
  );

  ts("order.totalCent");
  // @ts-expect-error TS2551: Property 'totalCent' does not exist on type 'Order'.
  // Did you mean 'totalCents'?
  const nearMiss = order.totalCent;
  void nearMiss;
  compilerSays(
    "TS2551",
    "Property 'totalCent' does not exist on type 'Order'. Did you mean 'totalCents'?",
    "Close enough for the suggestion engine to fire, so the fix is in the " +
      "message.",
  );

  // =========================================================================
  // 2. WRITES
  // =========================================================================
  blank();
  section("Writing a member the type does not declare");

  const draft: { id: string; totalCents: number } = { id: "o-2", totalCents: 100 };
  ts("draft.totlaCents = 9_900;");
  // @ts-expect-error TS2339: Property 'totlaCents' does not exist on type
  // '{ id: string; totalCents: number; }'.
  draft.totlaCents = 9_900;
  compilerSays(
    "TS2339",
    "Property 'totlaCents' does not exist on type '{ id: string; totalCents: number; }'.",
    "In JavaScript this assignment CREATES the property, silently forking the " +
      "data model. Here the object's shape is closed: you may only write what " +
      "the type declares.",
  );

  // =========================================================================
  // 3. CONSTRUCTION: missing and excess members
  // =========================================================================
  blank();
  section("Constructing a value of the wrong shape");

  ts('const incomplete: Order = { id: "o-1", customerEmail: "a@b.c" };');
  compilerSays(
    "TS2741",
    "Property 'totalCents' is missing in type '{ id: string; customerEmail: " +
      "string; }' but required in type 'Order'.",
    "Required means required. The `undefined` that would have sat in " +
      "`totalCents` never exists.",
  );

  ts("an object literal with `totlaCents` alongside the real `totalCents`");
  compilerSays(
    "TS2561",
    "Object literal may only specify known properties, but 'totlaCents' does " +
      "not exist in type 'Order'. Did you mean to write 'totalCents'?",
    "This is the EXCESS PROPERTY CHECK, and it is special — see the next " +
      "section. Without it, the literal would be accepted: it does, after all, " +
      "contain everything `Order` requires.",
  );

  // =========================================================================
  // 4. FRESHNESS — why the excess property check exists at all
  // =========================================================================
  blank();
  section("Freshness: the one place TypeScript is stricter than subtyping");

  note(
    "Structural subtyping says: a value with MORE members is assignable to a " +
      "type with fewer. That rule is correct and necessary — it is what makes " +
      "`interface` composition work. But applied to object literals it would " +
      "make every typo legal, since a typo is just an extra member.",
  );
  note(
    "So TypeScript marks object literals as FRESH and applies an extra rule to " +
      "them only: a fresh literal may not carry members the target does not " +
      "declare. Freshness is lost the moment the literal is stored in a " +
      "variable — which is why the two lines below behave differently.",
  );

  blank();
  const looseObject = {
    id: "o-3",
    customerEmail: "a@b.c",
    totalCents: 500,
    shipping: { country: "DE", postalCode: "10115" },
    internalAuditFlag: true, // an extra member
  };
  const widened: Order = looseObject; // ACCEPTED — freshness was lost
  proofBlock("freshness in action");
  proveType<Order>()(widened, "Order", "extra member allowed: not a fresh literal");
  warn(
    "`widened` is accepted with its extra `internalAuditFlag`, while the same " +
      "object written inline would be TS2561. This is not an inconsistency, it " +
      "is the deliberate boundary between subtyping (permissive, and correct) " +
      "and typo-catching (strict, and pragmatic).",
  );

  // =========================================================================
  // 5. OPTIONALITY
  // =========================================================================
  blank();
  section("Optional members must be proved present before use");

  ts("order.note.length");
  compileTimeOnly(() => {
    // @ts-expect-error TS18048: 'order.note' is possibly 'undefined'.
    const noteLength = order.note.length;
    void noteLength;
  });
  compilerSays(
    "TS18048",
    "'order.note' is possibly 'undefined'.",
    "`note?: string` means the type is `string | undefined`. `.length` is not " +
      "a member of `undefined`, so the access is rejected until you narrow. " +
      "This is the compile-time form of \"Cannot read properties of undefined\".",
  );

  ts('const explicit: Order = { ..., note: undefined };');
  compilerSays(
    "TS2375",
    "Type '{ ...; note: undefined; }' is not assignable to type 'Order' with " +
      "'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the " +
      "types of the target's properties.",
    "With `exactOptionalPropertyTypes`, ABSENT and PRESENT-BUT-UNDEFINED are " +
      "different states — a distinction JavaScript cannot make and JSON " +
      "actively destroys. If you want both, declare `note?: string | undefined`.",
  );

  blank();
  note("The three legal ways to use an optional member:");

  if (order.note !== undefined) {
    proveType<string>()(order.note, "string", "narrowed by `!== undefined`");
  }
  const viaFallback = order.note ?? "(no note)";
  proveType<string>()(viaFallback, "string", "?? removes undefined from the union");
  const viaOptionalChain = order.note?.length;
  proveType<number | undefined>()(
    viaOptionalChain,
    "number | undefined",
    "?. propagates the undefined honestly",
  );

  // =========================================================================
  // 6. NESTING
  // =========================================================================
  blank();
  section("Nested shapes are checked all the way down");

  ts("order.shipping.postcode");
  // @ts-expect-error TS2551: Property 'postcode' does not exist on type
  // 'ShippingAddress'. Did you mean 'postalCode'?
  const postcode = order.shipping.postcode;
  void postcode;

  ts("order.billing.postalCode");
  compileTimeOnly(() => {
    // @ts-expect-error TS2339: Property 'billing' does not exist on type 'Order'.
    const billingPostcode = order.billing.postalCode;
    void billingPostcode;
  });
  compilerSays(
    "TS2339",
    "Property 'billing' does not exist on type 'Order'.",
    "The error lands on `billing`, the member that is actually wrong — not on " +
      "`.postalCode`, where JavaScript's TypeError would have appeared.",
  );

  // =========================================================================
  // 7. THE PROGRAM THAT COMPILES
  // =========================================================================
  blank();
  section("The correct program");

  const receiptLine = `Total: $${(order.totalCents / 100).toFixed(2)}`;
  const noteLine = order.note ?? "(no note)";
  const shipTo = `${order.shipping.postalCode} ${order.shipping.country}`;

  detonate("receipt", () => receiptLine);
  detonate("note", () => noteLine);
  detonate("ship to", () => shipTo);
  good("No $NaN, no undefined, no parallel field, no 3 a.m. TypeError.");

  blank();
  table(
    ["defect", "JavaScript outcome", "TypeScript diagnostic"],
    [
      ["read of absent member", "undefined → NaN → \"$NaN\"", "TS2339 / TS2551"],
      ["write of absent member", "a second parallel field", "TS2339"],
      ["missing required member", "undefined at read time", "TS2741"],
      ["typo alongside a real member", "silently ignored", "TS2561 (freshness)"],
      ["optional used unguarded", "TypeError, later", "TS18048"],
      ["explicit undefined for optional", "indistinguishable from absent", "TS2375"],
      ["nested typo", "TypeError one level down", "TS2339 at the right member"],
    ],
  );
}
