// @ts-nocheck
/**
 * 08-strict-null-invocation — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A WebSocket-style client whose `onMessage` handler starts out unset and is
 * assigned later, once the caller decides it cares about incoming messages.
 * JavaScript has no concept of "this slot might legitimately be empty right
 * now" — it just holds whatever is in it, `undefined` included, and tries to
 * call that.
 *
 * DOMAIN: a socket client used before its message handler is wired up.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function createSocketClient() {
  let onMessage; // starts out unset — nobody has subscribed yet

  return {
    setHandler(handler) {
      onMessage = handler;
    },
    receive(data) {
      onMessage(data); // assumes a handler was already wired up
    },
  };
}

export function runBroken(): void {
  section("Wiring the handler up FIRST, then receiving");

  const wiredClient = createSocketClient();
  wiredClient.setHandler((data) => `handled: ${data}`);
  js('wiredClient.receive("ping")');
  detonate('wiredClient.receive("ping")', () => wiredClient.receive("ping"));

  blank();
  section("Receiving BEFORE the handler is wired up — a startup race");

  // Realistic in practice: the socket connects and starts receiving frames
  // before application code has had a chance to call setHandler().
  const earlyClient = createSocketClient();
  js('earlyClient.receive("ping") — before setHandler() ever runs');
  detonate('earlyClient.receive("ping")', () => earlyClient.receive("ping"));
  runtimeSays(
    "TypeError: onMessage is not a function",
    "'onMessage' is `undefined` until 'setHandler' is called. Nothing " +
      "about the client's construction enforces an ordering between " +
      "'setHandler' and 'receive' — whichever happens to run first, in " +
      "this particular execution, decides whether the program crashes.",
  );

  blank();
  table(
    ["call order", "onMessage at receive() time", "outcome"],
    [
      ["setHandler() then receive()", "a real function", "works"],
      ["receive() before setHandler()", "undefined", "TypeError"],
    ],
  );
  note(
    "Both orderings are 'valid JavaScript' — nothing in the language " +
      "distinguishes 'not yet wired up' from 'permanently broken'.",
  );
}
