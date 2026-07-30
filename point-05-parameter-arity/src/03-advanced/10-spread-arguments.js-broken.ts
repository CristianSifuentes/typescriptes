// @ts-nocheck
/**
 * 10-spread-arguments — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A move helper taking exactly two numbers. JavaScript lets you spread ANY
 * array into ANY call, regardless of the array's actual length — the spread
 * operator itself performs no arity reasoning whatsoever, it just unpacks
 * whatever is there.
 *
 * DOMAIN: a sprite-movement helper computing a new position from a raw
 * offset array (perhaps parsed from user input, one number per axis... or
 * not).
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function move(dx, dy) {
  return `moved by (${dx}, ${dy})`;
}

export function runBroken(): void {
  section("Spreading a well-formed, 2-element offset array");

  const goodOffset = [5, -3];
  js("move(...goodOffset)");
  detonate("move(...goodOffset)", () => move(...goodOffset));

  blank();
  section("Spreading an offset array with the WRONG number of elements");

  // Parsed from a comma-separated string that happened to have three
  // numbers this time, e.g. "5,-3,0" — a z-axis value nobody asked for.
  const threeAxisOffset = [5, -3, 0];
  js("move(...threeAxisOffset)");
  detonate("move(...threeAxisOffset)", () => move(...threeAxisOffset));
  runtimeSays(
    "'moved by (5, -3)' — looks fine, but the '0' silently vanished",
    "The spread operator just unpacks every element of the array as an " +
      "argument — three arguments reach 'move', which only has two named " +
      "parameters, so the third is discarded exactly like demo 02's extra " +
      "argument. If the array had had ONE element instead, 'dy' would have " +
      "silently become 'undefined' instead.",
  );

  blank();
  table(
    ["offset array", "length", "move(...offset) outcome"],
    [
      ["[5, -3]", "2", "correct"],
      ["[5, -3, 0]", "3", "the extra '0' silently discarded"],
      ["[5]", "1", "dy = undefined, NaN-producing arithmetic downstream"],
    ],
  );
}
