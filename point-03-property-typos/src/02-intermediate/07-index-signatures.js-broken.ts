// @ts-nocheck
/**
 * 07-index-signatures — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A "feature flags" bag: one KNOWN flag (`betaMode`) plus an open-ended set
 * of flags configured remotely, keyed by arbitrary strings. In JavaScript
 * every key — known, remote, or simply mistyped — is read and written
 * identically: there is no distinction at all.
 *
 * DOMAIN: a feature-flag bag mixing one well-known flag with dynamic ones.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function loadFlags() {
  return { betaMode: true, darkTheme: false, newCheckout: true };
}

export function runBroken(): void {
  const flags = loadFlags();

  section("The one flag everybody is supposed to know about");

  js("flags.betaMod  — 'betaMode', misspelled");
  detonate("flags.betaMod", () => flags.betaMod);
  note("undefined — indistinguishable from a flag that was never set.");

  blank();
  section("A dynamic flag, fetched by a key built elsewhere in the app");

  js('flags["darkTheem"]  — a typo in a key assembled from config');
  detonate('flags["darkTheem"]', () => flags["darkTheem"]);
  note(
    "undefined, again — but this time there was NEVER a static list of valid " +
      "keys to check against in the first place: the whole point of this bag " +
      "is that keys are open-ended.",
  );

  blank();
  js('if (flags.betaMod) enableBetaUi();  — a typo silently disables a feature');
  detonate("feature gate", () => (flags.betaMod ? "beta UI enabled" : "beta UI disabled"));
  runtimeSays(
    "no error at all",
    "The beta UI never turns on for anyone, and the bug looks EXACTLY like a " +
      "correctly-behaving feature flag that is simply set to false.",
  );

  blank();
  section("Known flags and dynamic flags, indistinguishable at the call site");
  table(
    ["access", "kind of key", "outcome"],
    [
      ["flags.betaMode", "known, correct", "true"],
      ["flags.betaMod", "known, TYPO'D", "undefined — looks like 'not set'"],
      ['flags["darkTheme"]', "dynamic, correct", "false"],
      ['flags["darkTheem"]', "dynamic, TYPO'D", "undefined — looks like 'not set'"],
    ],
  );
}
