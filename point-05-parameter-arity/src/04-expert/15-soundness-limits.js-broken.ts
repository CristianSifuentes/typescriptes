// @ts-nocheck
/**
 * 15-soundness-limits — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A command-line tool builds a function's arguments dynamically from parsed
 * CLI flags. The resulting array's length depends entirely on what the user
 * typed — JavaScript has no way to verify, ahead of time, that the assembled
 * array has the right number of elements for the function it's about to be
 * spread into.
 *
 * DOMAIN: a CLI tool invoking a "move" command with coordinates parsed from
 * flags.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function move(dx, dy) {
  return `moved by (${dx}, ${dy})`;
}

function parseCoordinateFlags(rawFlags) {
  // Splits something like "--dx=5 --dy=-3" into numbers — but a malformed
  // or incomplete flag string produces a shorter array, silently.
  return rawFlags
    .split(" ")
    .filter((f) => f.includes("="))
    .map((f) => Number(f.split("=")[1]));
}

export function runBroken(): void {
  section("A well-formed flag string");

  const goodArgs = parseCoordinateFlags("--dx=5 --dy=-3");
  js('move(...parseCoordinateFlags("--dx=5 --dy=-3"))');
  detonate("move(...goodArgs)", () => move(...goodArgs));

  blank();
  section("A malformed flag string — one flag missing entirely");

  const badArgs = parseCoordinateFlags("--dx=5"); // --dy was never typed
  js('move(...parseCoordinateFlags("--dx=5"))');
  detonate("move(...badArgs)", () => move(...badArgs));
  runtimeSays(
    "'moved by (5, undefined)' (silently wrong, not a crash)",
    "'parseCoordinateFlags' returned an array with ONE element, not two. " +
      "Nothing about spreading it into 'move' checked that length against " +
      "what 'move' actually requires — the array's length is a RUNTIME " +
      "fact, discovered only by counting, never a property the call site " +
      "could have verified in advance.",
  );

  blank();
  table(
    ["raw flags", "parsed array length", "move(...args) outcome"],
    [
      ['"--dx=5 --dy=-3"', "2", "correct"],
      ['"--dx=5"', "1", "dy silently undefined"],
    ],
  );
}
