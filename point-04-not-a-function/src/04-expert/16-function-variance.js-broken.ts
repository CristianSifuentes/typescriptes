// @ts-nocheck
/**
 * 16-function-variance — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * An event bus fires many kinds of events through ONE handler slot per
 * subscriber. A handler written for a SPECIFIC event kind — one that reads
 * fields/methods only that kind has — is registered where the bus promises
 * to deliver ANY kind of event. JavaScript never checks what a function
 * "expects" to receive versus what it will actually be given.
 *
 * DOMAIN: an analytics event bus with a click-specific handler mistakenly
 * registered as a catch-all.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function createBus() {
  let handler = null;
  return {
    subscribe(fn) {
      handler = fn;
    },
    fire(event) {
      handler(event);
    },
  };
}

// Written ONLY for click events — assumes `event.onConfirm` always exists.
function handleClick(event) {
  event.onConfirm();
}

export function runBroken(): void {
  section("Firing the event kind the handler was actually written for");

  const clickBus = createBus();
  clickBus.subscribe(handleClick);
  js('clickBus.fire({ type: "click", onConfirm: () => "confirmed" })');
  detonate("clickBus.fire(clickEvent)", () =>
    clickBus.fire({ type: "click", onConfirm: () => "confirmed" }),
  );

  blank();
  section("Registering the SAME click-only handler on a general-purpose bus");

  // This bus is documented to deliver EVERY kind of event, not just clicks.
  const generalBus = createBus();
  generalBus.subscribe(handleClick); // nothing warns that handleClick is click-only

  js('generalBus.fire({ type: "hover" })  — no onConfirm on a hover event');
  detonate("generalBus.fire(hoverEvent)", () => generalBus.fire({ type: "hover" }));
  runtimeSays(
    "TypeError: event.onConfirm is not a function",
    "'handleClick' was written assuming EVERY event it receives has " +
      "'onConfirm' — true for click events, false for hover events. " +
      "Subscribing it to a bus that promises to deliver ANY event type " +
      "was the actual mistake; the crash just surfaces later, on whichever " +
      "event happens to lack the field.",
  );

  blank();
  table(
    ["event fired", "has onConfirm?", "handleClick(event) outcome"],
    [
      ['{ type: "click", onConfirm: ... }', "yes", "works"],
      ['{ type: "hover" }', "no", "TypeError"],
    ],
  );
}
