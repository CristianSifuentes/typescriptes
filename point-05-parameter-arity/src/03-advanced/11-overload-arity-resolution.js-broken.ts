// @ts-nocheck
/**
 * 11-overload-arity-resolution — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A task scheduler meant to be called in exactly THREE valid shapes: just a
 * task, a task plus a delay, or a task plus a delay plus a repeat flag.
 * JavaScript has no way to say "these three arities are valid and nothing
 * else" — a single function body just reads however many arguments happen
 * to show up.
 *
 * DOMAIN: a task scheduler, callable with 1, 2, or 3 arguments depending on
 * how much control the caller needs.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function schedule(task, delayMs, repeat) {
  const effectiveDelay = delayMs === undefined ? 0 : delayMs;
  const effectiveRepeat = repeat === undefined ? false : repeat;
  return `scheduled (delay=${effectiveDelay}, repeat=${effectiveRepeat}): ${task()}`;
}

export function runBroken(): void {
  section("Calling in each of the three INTENDED shapes");

  js("schedule(() => 'ran')");
  detonate("schedule(() => 'ran')", () => schedule(() => "ran"));

  js("schedule(() => 'ran', 500)");
  detonate("schedule(() => 'ran', 500)", () => schedule(() => "ran", 500));

  js("schedule(() => 'ran', 500, true)");
  detonate("schedule(() => 'ran', 500, true)", () => schedule(() => "ran", 500, true));

  blank();
  section("Calling with a FOURTH argument nobody designed for");

  // A caller assumes a 4th argument (e.g. a priority) is also supported —
  // nothing in JavaScript stops them from trying.
  js("schedule(() => 'ran', 500, true, 'high')");
  detonate("schedule(() => 'ran', 500, true, 'high')", () =>
    schedule(() => "ran", 500, true, "high"),
  );
  runtimeSays(
    "'scheduled (delay=500, repeat=true): ran' (silently wrong, not what the caller intended)",
    "The 4th argument, 'high', is silently discarded — 'schedule' only " +
      "reads its first three parameters. The caller believes a priority " +
      "was set; nothing was.",
  );

  blank();
  table(
    ["arguments supplied", "intended shape?", "outcome"],
    [
      ["1 (task)", "yes", "works"],
      ["2 (task, delayMs)", "yes", "works"],
      ["3 (task, delayMs, repeat)", "yes", "works"],
      ["4 (task, delayMs, repeat, priority)", "no — not a designed shape", "'priority' silently discarded"],
    ],
  );
}
