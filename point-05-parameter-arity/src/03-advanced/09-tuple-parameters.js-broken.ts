// @ts-nocheck
/**
 * 09-tuple-parameters — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A line-drawing API taking four numbers: two endpoints. Points are stored
 * as plain arrays, `[x, y]` — but JavaScript arrays carry no length
 * guarantee at all. A malformed point (missing its second coordinate)
 * spreads into the call with too few elements, silently shifting every
 * argument after it.
 *
 * DOMAIN: a 2D canvas API drawing a line between two points.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function drawLine(x1, y1, x2, y2) {
  return `line from (${x1},${y1}) to (${x2},${y2})`;
}

export function runBroken(): void {
  section("Two well-formed points, spread into the call");

  const goodPoints = [
    [10, 20],
    [30, 40],
  ];
  js("drawLine(...goodPoints[0], ...goodPoints[1])");
  detonate("drawLine(...goodPoints[0], ...goodPoints[1])", () =>
    drawLine(...goodPoints[0], ...goodPoints[1]),
  );

  blank();
  section("A malformed point — missing its Y coordinate, upstream bug");

  // 'badPoints[1]' only has ONE element — maybe a push() was missed
  // somewhere the array was built.
  const badPoints = [
    [10, 20],
    [30], // missing Y!
  ];
  js("drawLine(...badPoints[0], ...badPoints[1])");
  detonate("drawLine(...badPoints[0], ...badPoints[1])", () =>
    drawLine(...badPoints[0], ...badPoints[1]),
  );
  runtimeSays(
    "'line from (10,20) to (30,undefined)' (silently wrong, not a crash)",
    "'badPoints[1]' spreads into just ONE argument ('30'), not two — " +
      "'x2' gets 30, and 'y2' is left 'undefined' because there was no " +
      "fifth spread element. Nothing about the SYNTAX of the call looked " +
      "different from the correct one.",
  );

  blank();
  table(
    ["points[1]", "elements spread", "x2, y2 bound to", "outcome"],
    [
      ["[30, 40]", "2", "30, 40", "correct"],
      ["[30]", "1", "30, undefined", "silently wrong — a malformed line drawn"],
    ],
  );
}
