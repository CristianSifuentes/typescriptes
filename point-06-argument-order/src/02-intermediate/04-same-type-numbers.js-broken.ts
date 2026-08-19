// @ts-nocheck
/**
 * 04-same-type-numbers — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * This demo and its TypeScript twin are the hinge of the whole project.
 *
 * Everything in level 01 worked because the swapped arguments had DIFFERENT
 * types. Here they do not. `aspectRatio(width: number, height: number)` takes
 * two numbers, and swapping them is:
 *
 *   • silent in JavaScript, exactly as before, AND
 *   • silent in TypeScript too.
 *
 * The JavaScript half is therefore not the interesting half — you already know
 * it misbehaves. What matters is that the TypeScript half misbehaves
 * identically, which is why this file exists: to establish the damage precisely
 * so that the remedy in level 03 can be measured against it.
 *
 * DOMAIN: an image-processing pipeline.
 */

import { section, js, note, detonate, table, blank, warn } from "../99-runner/trace.js";

function aspectRatio(width, height) {
  return width / height;
}

function areaOfRectangle(width, height) {
  return width * height;
}

function cropTo(x, y, width, height) {
  return `${width}x${height}+${x}+${y}`;
}

function orientationOf(width, height) {
  if (width > height) return "landscape";
  if (width < height) return "portrait";
  return "square";
}

export function runBroken(): void {
  section("Some same-typed swaps are harmless — and that is part of the trap");

  js("areaOfRectangle(3, 10) vs areaOfRectangle(10, 3)");
  detonate("intended", () => areaOfRectangle(3, 10));
  detonate("swapped", () => areaOfRectangle(10, 3));
  note(
    "Identical. Multiplication is commutative, so this swap genuinely does not " +
      "matter. Developers generalise from cases like this — 'width and height " +
      "are interchangeable, they're just numbers' — and that generalisation is " +
      "what makes the next section possible.",
  );

  blank();
  section("…and then the same swap on a non-commutative operation");

  js("aspectRatio(3, 10) vs aspectRatio(10, 3)");
  detonate("intended (portrait: 3 wide, 10 tall)", () => aspectRatio(3, 10));
  detonate("swapped", () => aspectRatio(10, 3));
  warn(
    "0.3 versus 3.333. A layout engine handed the second value renders a " +
      "portrait photograph in a landscape frame — every image on the page is " +
      "stretched, and the number that caused it is a perfectly ordinary float.",
  );

  blank();
  js("orientationOf(3, 10) vs orientationOf(10, 3)");
  detonate("intended", () => orientationOf(3, 10));
  detonate("swapped", () => orientationOf(10, 3));
  note(
    'The classification INVERTS. "portrait" becomes "landscape" — a wrong ' +
      "string, not a NaN, not a crash. It will be stored, indexed, and used to " +
      "pick a template.",
  );

  blank();
  section("Four same-typed parameters: 24 orderings, 23 of them wrong");

  js("cropTo(x, y, width, height) — the intended call");
  detonate("cropTo(10, 20, 640, 480)", () => cropTo(10, 20, 640, 480));
  js("the same four numbers, grouped the other way round");
  detonate("cropTo(640, 480, 10, 20)", () => cropTo(640, 480, 10, 20));
  note(
    "Both produce a valid-looking crop descriptor. One crops a 640x480 region " +
      "at offset (10,20); the other crops a 10x20 region at offset (640,480) — " +
      "very likely outside the image entirely, which downstream code will " +
      "handle by returning an empty buffer. Silently.",
  );

  blank();
  detonate("how many orderings does the compiler accept?", () => {
    const permutations = (n) => (n <= 1 ? 1 : n * permutations(n - 1));
    return `${permutations(4)} orderings of 4 same-typed parameters, ${permutations(4) - 1} of them wrong`;
  });

  blank();
  section("Why this is the worst bug shape in the project");
  table(
    ["property", "swap of DIFFERENT types (level 01)", "swap of SAME types (here)"],
    [
      ["caught by TypeScript", "yes — TS2345", "**no**"],
      ["visible symptom", "NaN, [object Object], a crash", "**none — a plausible number**"],
      ["visible in review", "no", "no"],
      ["caught by a test", "if one exists", "only if it asserts the DIRECTION"],
      ["discovered by", "the compiler, immediately", "an auditor, a customer, or nobody"],
    ],
  );
  note(
    "Read the first column against the second. Level 01's bugs were the ones " +
      "TypeScript already fixed. This column is what remains — and it is the " +
      "column with no symptoms.",
  );
}
