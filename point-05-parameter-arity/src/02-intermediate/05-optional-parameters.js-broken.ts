// @ts-nocheck
/**
 * 05-optional-parameters — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A logger whose second argument — structured metadata — is genuinely
 * optional: most log lines don't need it. JavaScript expresses "optional"
 * the same way it expresses "forgotten": both are just `undefined`. Code
 * that reads the metadata without checking for that case breaks exactly
 * when the (valid) no-metadata call happens.
 *
 * DOMAIN: an application logger, metadata attached only for some events.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function logEvent(message, metadata) {
  return `${message} ${JSON.stringify(Object.keys(metadata))}`;
}

export function runBroken(): void {
  section("Calling WITH metadata");

  js('logEvent("user.login", { userId: 42 })');
  detonate('logEvent("user.login", { userId: 42 })', () =>
    logEvent("user.login", { userId: 42 }),
  );

  blank();
  section("Calling WITHOUT metadata — a perfectly normal log line");

  js('logEvent("server.started")');
  detonate('logEvent("server.started")', () => logEvent("server.started"));
  runtimeSays(
    "TypeError: Cannot convert undefined or null to object",
    "'metadata' is 'undefined' because the call legitimately omitted it — " +
      "there's nothing wrong with logging an event with no metadata. But " +
      "'logEvent' never checked for that case before calling " +
      "'Object.keys(undefined)', which is where the crash actually comes " +
      "from.",
  );

  blank();
  table(
    ["call", "metadata", "outcome"],
    [
      ['logEvent("user.login", { userId: 42 })', "{ userId: 42 }", "works"],
      ['logEvent("server.started")', "undefined", "TypeError"],
    ],
  );
  note(
    "Nothing distinguishes 'metadata is optional and was omitted, as " +
      "designed' from 'metadata was forgotten by mistake' — both look " +
      "identical to 'logEvent', and only one of them is actually a bug.",
  );
}
