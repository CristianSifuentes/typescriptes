// @ts-nocheck
/**
 * 16-strict-function-types-bivariance — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * An event bus that always calls every handler with exactly TWO arguments:
 * the event and some metadata. JavaScript never verifies that a REGISTERED
 * handler's own parameter count makes sense against what the bus actually
 * supplies — a handler declaring a THIRD parameter just gets `undefined`
 * for it, silently, forever.
 *
 * DOMAIN: an analytics event bus, handlers registered per event type.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function createBus() {
  let handler = null;
  return {
    on(fn) {
      handler = fn;
    },
    emit(event, meta) {
      handler(event, meta); // ALWAYS exactly 2 arguments, no more, ever
    },
  };
}

export function runBroken(): void {
  section("A handler declaring FEWER parameters than the bus supplies — perfectly fine");

  const bus1 = createBus();
  bus1.on((event) => `handled ${event}`); // ignores 'meta' entirely
  js('bus.on((event) => `handled ${event}`)');
  detonate("bus1.emit('click', { x: 10 })", () => bus1.emit("click", { x: 10 }));

  blank();
  section("A handler declaring a THIRD parameter the bus will NEVER supply");

  // Copy-pasted from a different bus that happens to pass three arguments —
  // this one never will.
  const bus2 = createBus();
  bus2.on((event, meta, extraContext) => `handled ${event} with ${extraContext.source}`);
  js("bus.on((event, meta, extraContext) => ...)  — extraContext will ALWAYS be undefined");
  detonate("bus2.emit('click', { x: 10 })", () => bus2.emit("click", { x: 10 }));
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'source')",
    "'emit' only ever calls handlers with 2 arguments — 'extraContext' is " +
      "ALWAYS undefined, unconditionally, for every single event this bus " +
      "will ever emit. Nothing about REGISTERING the handler complained, " +
      "even though the mistake is structural and 100% reproducible, not an " +
      "edge case.",
  );

  blank();
  table(
    ["handler's declared parameters", "bus always supplies", "outcome"],
    [
      ["(event) => ...", "2 (event, meta)", "fine — extra supplied argument simply ignored"],
      ["(event, meta, extraContext) => ...", "2 (event, meta)", "extraContext is ALWAYS undefined — guaranteed crash"],
    ],
  );
}
