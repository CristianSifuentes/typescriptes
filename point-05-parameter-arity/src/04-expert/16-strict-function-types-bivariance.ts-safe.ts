/**
 * 16-strict-function-types-bivariance — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * Function-type assignability has an ARITY rule independent of
 * `strictFunctionTypes`: a handler is assignable to a slot if it declares
 * NO MORE parameters than the slot guarantees to supply — declaring FEWER
 * is always safe (the extra supplied arguments are simply ignored), but
 * declaring MORE is unsound (the slot can never supply them) and is
 * rejected. `strictFunctionTypes` governs a SEPARATE axis — the variance of
 * shared parameter TYPES — and is deliberately relaxed (bivariant) for
 * method-shorthand syntax specifically.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface AnalyticsEvent {
  readonly type: string;
}
interface Meta {
  readonly x: number;
}

interface Bus {
  on(handler: (event: AnalyticsEvent, meta: Meta) => void): void;
  emit(event: AnalyticsEvent, meta: Meta): void;
}

function createBus(): Bus {
  let handler: ((event: AnalyticsEvent, meta: Meta) => void) | undefined;
  return {
    on(fn) {
      handler = fn;
    },
    emit(event, meta) {
      handler?.(event, meta);
    },
  };
}

export function runSafe(): void {
  section("The arity rule: fewer declared parameters is always safe");
  callableTrace([
    ["bus.on's parameter", "(event: AnalyticsEvent, meta: Meta) => void", "the slot GUARANTEES exactly 2 arguments, always", "a handler needing FEWER can never be caught short"],
  ]);

  const bus1 = createBus();
  ts("bus1.on((event) => `handled ${event.type}`)  — declares only 1 of the 2 available parameters");
  bus1.on((event) => `handled ${event.type}`);
  good("bus1.on((event) => ...) — accepted: ignoring a supplied argument is always sound.");

  blank();
  section("The arity rule: MORE declared parameters than the slot guarantees is rejected");

  const bus2 = createBus();
  ts("bus2.on((event, meta, extraContext) => ...)  — extraContext will NEVER be supplied");
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type '(event: AnalyticsEvent,
    // meta: Meta, extraContext: { source: string }) => string' is not
    // assignable to parameter of type '(event: AnalyticsEvent, meta: Meta)
    // => void'. Target signature provides too few arguments.
    bus2.on((event: AnalyticsEvent, meta: Meta, extraContext: { source: string }) =>
      `handled ${event.type} with ${extraContext.source}`,
    );
  });
  compilerSays(
    "TS2345",
    "Target signature provides too few arguments. Expected 3 or more, but " +
      "target provides 2.",
    "This is the ARITY half of function-type assignability, independent " +
      "of parameter TYPE variance entirely: the handler REQUIRES a 3rd " +
      "argument the slot has PROVABLY never supplied and never will " +
      "(`Bus.on`'s own signature says so). The JavaScript version's " +
      "'always-undefined, guaranteed crash' bug is caught here, at " +
      "REGISTRATION, before the bus has emitted a single event.",
  );

  blank();
  section("The SEPARATE axis: strictFunctionTypes and parameter TYPE variance");

  interface ClickEvent extends AnalyticsEvent {
    readonly type: "click";
    readonly button: number;
  }
  type PlainHandler = (event: AnalyticsEvent, meta: Meta) => void;
  const clickOnlyHandler: (event: ClickEvent, meta: Meta) => void = (event) => `button ${event.button}`;

  ts("const wide: PlainHandler = clickOnlyHandler  — a PLAIN function type, checked contravariantly");
  compileTimeOnly(() => {
    // @ts-expect-error TS2322: Type '(event: ClickEvent, meta: Meta) =>
    // string' is not assignable to type 'PlainHandler'. Types of
    // parameters 'event' and 'event' are incompatible.
    const wide: PlainHandler = clickOnlyHandler;
    void wide;
  });
  compilerSays(
    "TS2322",
    "Types of parameters 'event' and 'event' are incompatible. Type " +
      "'AnalyticsEvent' is not assignable to type 'ClickEvent'.",
    "`strictFunctionTypes` enforces CONTRAVARIANT parameter checking for " +
      "plain function types like `PlainHandler` — a handler needing the " +
      "NARROWER 'ClickEvent' cannot substitute where the WIDER " +
      "'AnalyticsEvent' is promised (point-04's demo 16, in full). This is " +
      "a TYPE check, not an arity check — both axes must pass independently.",
  );

  interface HandlerObject {
    handle(event: ClickEvent, meta: Meta): void; // method SHORTHAND syntax
  }
  const looseObject: HandlerObject = { handle: (event: AnalyticsEvent, meta: Meta) => void 0 };
  good(
    "A method-shorthand property ('handle(...)') accepts this SAME " +
      "assignment without complaint — TypeScript deliberately keeps method " +
      "parameters BIVARIANT (checked both directions) for compatibility " +
      "with common OOP patterns (e.g. Array<T>'s methods being overridden " +
      "per-element-type); only plain function-typed PROPERTIES get the " +
      "strict, contravariant-only check.",
  );
  void looseObject;

  blank();
  table(
    ["axis", "governed by", "rule"],
    [
      ["parameter COUNT (arity)", "always — not a flag", "fewer declared params: safe · more than guaranteed: rejected"],
      ["parameter TYPE, plain function property", "strictFunctionTypes: true", "contravariant only — narrower param types rejected"],
      ["parameter TYPE, method shorthand", "strictFunctionTypes (deliberately not applied)", "bivariant — both directions accepted, a known, intentional hole"],
    ],
  );
  note(
    "The JavaScript bug this demo dissects was purely about ARITY — a " +
      "handler expecting an argument the bus can never supply. That axis " +
      "is checked UNCONDITIONALLY, regardless of `strictFunctionTypes` — " +
      "the flag only changes how parameter TYPES (not counts) are compared.",
  );
}
