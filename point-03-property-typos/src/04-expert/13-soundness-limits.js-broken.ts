// @ts-nocheck
/**
 * 13-soundness-limits — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * Every failure mode this demo will contrast against TypeScript is,
 * naturally, unconditionally present in plain JavaScript: there was never
 * any property checking to begin with. This file exists to establish the
 * DOMAIN — a value arriving from outside the program, whose real shape is
 * whatever the network actually sent, not whatever the code hopes for.
 *
 * DOMAIN: a "get current user" API call, and code that trusts its response.
 */

import { section, js, note, detonate, runtimeSays, table, blank } from "../99-runner/trace.js";

// Simulates `fetch(...).then(r => r.json())`: whatever bytes came back.
function fakeApiResponse() {
  // The server actually sent 'usre' as a legacy field name from an older
  // API version that a proxy forgot to migrate — 'email' is simply absent.
  return JSON.parse('{"id":"u-1","name":"Ada Lovelace","usre":"legacy-field"}');
}

export function runBroken(): void {
  section("Trusting a value that crossed the network");

  const response = fakeApiResponse();
  js('response.email  — the field the client code expects');
  detonate("response.email", () => response.email);
  note("undefined — 'email' was never in the response at all.");

  blank();
  js('`Contact: ${response.email}`  — building UI from it');
  detonate("contact line", () => `Contact: ${response.email}`);
  runtimeSays(
    "no error at all",
    '"Contact: undefined" ships to the user. The bug is not a typo in THIS ' +
      "code — it is a mismatch between what the server actually sent and what " +
      "the client assumed, and nothing about JSON.parse's return value ever " +
      "declared what shape to expect.",
  );

  blank();
  section("The response, as it actually is vs as the client assumed");
  table(
    ["field client expects", "present in the actual response?", "outcome"],
    [
      ["id", "yes", "correct"],
      ["name", "yes", "correct"],
      ["email", "NO (server sent 'usre' instead)", "undefined, silently"],
    ],
  );
}
