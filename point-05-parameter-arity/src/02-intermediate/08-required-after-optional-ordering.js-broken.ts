// @ts-nocheck
/**
 * 08-required-after-optional-ordering — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * JavaScript places NO restriction on parameter order — a "required-looking"
 * parameter can freely follow one with a default value. That freedom is a
 * trap: positional binding doesn't know that a middle parameter is "meant"
 * to be skipped, so a caller trying to "use the default in the middle" ends
 * up silently shifting every later argument one slot to the left.
 *
 * DOMAIN: a task scheduler where delay has a sensible default, but priority
 * does not.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

// A default-valued parameter (delayMs) sits BEFORE a "required" one
// (priority) — legal JavaScript, and a footgun.
function scheduleTask(name, delayMs = 1000, priority) {
  return `scheduling "${name}" in ${delayMs}ms at priority ${priority}`;
}

export function runBroken(): void {
  section("Supplying every argument explicitly — works as intended");

  js('scheduleTask("cleanup", 1000, 5)');
  detonate('scheduleTask("cleanup", 1000, 5)', () =>
    scheduleTask("cleanup", 1000, 5),
  );

  blank();
  section("Trying to 'skip' the defaulted middle parameter positionally");

  // The caller wants: name = "cleanup", delayMs = DEFAULT, priority = 5.
  // They assume omitting the middle argument works the way named arguments
  // would in another language. It does not — JavaScript has no such thing.
  js('scheduleTask("cleanup", 5)  — intending to skip delayMs and set priority');
  detonate('scheduleTask("cleanup", 5)', () => scheduleTask("cleanup", 5));
  runtimeSays(
    "'scheduling \"cleanup\" in 5ms at priority undefined' (silently wrong)",
    "Positional binding doesn't know 'delayMs' was 'meant' to be skipped — " +
      "'5' fills the SECOND slot no matter what the caller intended, so " +
      "'delayMs' becomes 5 (not the default 1000) and 'priority' is left " +
      "'undefined'. There is no way to 'skip' a middle parameter " +
      "positionally in JavaScript at all.",
  );

  blank();
  table(
    ["call", "delayMs bound to", "priority bound to", "matches caller's intent?"],
    [
      ['scheduleTask("cleanup", 1000, 5)', "1000", "5", "yes"],
      ['scheduleTask("cleanup", 5)', "5", "undefined", "no — completely different meaning"],
    ],
  );
}
