/**
 * 16-function-variance — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * A handler's PARAMETER type describes what it needs to receive. Assigning
 * one function to a slot of another function type is only sound if the
 * assigned function can survive everything the slot promises to hand it —
 * which means parameter types are checked CONTRAVARIANTLY: the assigned
 * handler's parameter must be THE SAME OR WIDER than the slot's, never
 * narrower. `strictFunctionTypes` (enabled in this project) enforces this
 * direction precisely; without it, TypeScript would unsoundly allow a
 * narrower handler through (the exact bug the JavaScript version has).
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface BaseEvent {
  readonly type: string;
}
interface ClickEvent extends BaseEvent {
  readonly type: "click";
  readonly onConfirm: () => string;
}
interface HoverEvent extends BaseEvent {
  readonly type: "hover";
}
type AnyEvent = ClickEvent | HoverEvent;

interface Bus<E> {
  subscribe(handler: (event: E) => void): void;
  fire(event: E): void;
}

function createBus<E>(): Bus<E> {
  let handler: ((event: E) => void) | undefined;
  return {
    subscribe(fn) {
      handler = fn;
    },
    fire(event) {
      handler?.(event);
    },
  };
}

// Written ONLY for click events — its PARAMETER type says so, explicitly.
function handleClick(event: ClickEvent): void {
  event.onConfirm();
}

// Written for ANY event — its parameter type is the wider union.
function handleAnyEvent(event: AnyEvent): void {
  if (event.type === "click") event.onConfirm();
}

export function runSafe(): void {
  section("The two handlers' real parameter types");
  callableTrace([
    ["handleClick", "(event: ClickEvent) => void", "(event: ClickEvent): void", "requires the NARROW type — needs .onConfirm"],
    ["handleAnyEvent", "(event: AnyEvent) => void", "(event: AnyEvent): void", "accepts the WIDE type — checks .type first"],
    ["generalBus.subscribe", "(handler: (event: AnyEvent) => void) => void", "expects a handler for the WIDE type", "the bus promises to deliver ANY AnyEvent"],
  ]);

  blank();
  section("Registering the narrow (click-only) handler on the general bus");

  const generalBus = createBus<AnyEvent>();
  ts("generalBus.subscribe(handleClick)  — handleClick only understands ClickEvent");
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type '(event: ClickEvent) => void'
    // is not assignable to parameter of type '(event: AnyEvent) => void'.
    //   Types of parameters 'event' and 'event' are incompatible.
    //   Type 'AnyEvent' is not assignable to type 'ClickEvent'.
    generalBus.subscribe(handleClick);
  });
  compilerSays(
    "TS2345",
    "Type 'AnyEvent' is not assignable to type 'ClickEvent'. Type " +
      "'HoverEvent' is not assignable to type 'ClickEvent'.",
    "CONTRAVARIANCE: to be usable wherever '(event: AnyEvent) => void' is " +
      "expected, a handler must accept AT LEAST 'AnyEvent' — same or WIDER " +
      "than what the slot promises to deliver. 'handleClick' only accepts " +
      "the NARROWER 'ClickEvent', so a 'HoverEvent' — a legal 'AnyEvent' — " +
      "could reach it and fail on the missing '.onConfirm'. The compiler " +
      "rejects the assignment for exactly the reason the JavaScript version " +
      "crashed.",
  );

  blank();
  section("Registering the wide (any-event) handler where a narrow one is expected");

  const clickOnlyBus = createBus<ClickEvent>();
  ts("clickOnlyBus.subscribe(handleAnyEvent)  — the OPPOSITE direction");
  clickOnlyBus.subscribe(handleAnyEvent); // compiles: handleAnyEvent can survive ClickEvent too
  good("clickOnlyBus.subscribe(handleAnyEvent) — accepted: a WIDER handler safely substitutes for a narrower one.");

  const log: string[] = [];
  clickOnlyBus.subscribe((event) => log.push(event.onConfirm()));
  clickOnlyBus.fire({ type: "click", onConfirm: () => "confirmed" });
  proveType<string[]>()(log, "string[]", "clickOnlyBus only ever fires ClickEvent, matching what the handler needs");
  good(`clickOnlyBus.fire(...) → log = [${log.join(", ")}]`);

  blank();
  table(
    ["assign handler with parameter", "into slot expecting parameter", "sound?", "diagnostic"],
    [
      ["ClickEvent (narrow)", "AnyEvent (wide)", "no — might receive a HoverEvent", "TS2345"],
      ["AnyEvent (wide)", "ClickEvent (narrow)", "yes — can handle anything a ClickEvent throws at it", "none"],
    ],
  );
  note(
    "This is the SAME rule callback registration always follows in this " +
      "project (demo 07's argument check, demo 09's hybrid-type check) — " +
      "just visible here because two DIFFERENT parameter types are being " +
      "compared against each other instead of one parameter type against " +
      "one concrete value.",
  );
}
