// @ts-nocheck
/**
 * 07-branded-types — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * JavaScript developers are not unaware of the same-typed swap problem. They
 * have four standard defences, and this file runs all four to show what each
 * one actually buys.
 *
 *   DEFENCE 1  a naming convention          → helps humans, checks nothing
 *   DEFENCE 2  a runtime range check        → catches SOME swaps, by luck
 *   DEFENCE 3  a wrapper object             → works, and costs an allocation
 *                                              plus an unwrap at every use
 *   DEFENCE 4  a JSDoc comment              → documentation, not enforcement
 *
 * Defence 3 is the interesting one: it is genuinely correct, and it is what
 * branded types achieve for free. Watch what it costs here, then compare with
 * the TypeScript twin where the same guarantee costs nothing at runtime.
 *
 * DOMAIN: image geometry.
 */

import { section, js, note, detonate, table, blank, warn } from "../99-runner/trace.js";

// --- DEFENCE 1: naming ------------------------------------------------------
function aspectRatioNamed(widthPx, heightPx) {
  return widthPx / heightPx;
}

// --- DEFENCE 2: a runtime range check --------------------------------------
function aspectRatioChecked(width, height) {
  if (width < 1 || height < 1) throw new RangeError("dimensions must be >= 1");
  if (width > 10_000 || height > 10_000) throw new RangeError("dimensions too large");
  return width / height;
}

// --- DEFENCE 3: wrapper objects --------------------------------------------
function makeWidth(value) {
  return { kind: "width", value };
}
function makeHeight(value) {
  return { kind: "height", value };
}
function aspectRatioWrapped(width, height) {
  if (width.kind !== "width") throw new TypeError(`expected a width, got ${width.kind}`);
  if (height.kind !== "height") throw new TypeError(`expected a height, got ${height.kind}`);
  return width.value / height.value;
}

export function runBroken(): void {
  section("DEFENCE 1 — a naming convention");

  js("aspectRatioNamed(10, 3)   — the parameters are called widthPx and heightPx");
  detonate("result", () => aspectRatioNamed(10, 3));
  note(
    "3.333. The names are inside the function; the call site never sees them. " +
      "A convention improves the odds that a careful reader notices — it " +
      "changes nothing about what the program accepts.",
  );

  blank();
  section("DEFENCE 2 — a runtime range check");

  js("aspectRatioChecked(10, 3)   — both values are in range, so the check passes");
  detonate("result", () => aspectRatioChecked(10, 3));
  js("aspectRatioChecked(0, 3)    — this one the check DOES catch");
  detonate("result", () => aspectRatioChecked(0, 3));
  warn(
    "The range check catches a swap only when the two values happen to fall on " +
      "opposite sides of a boundary. For 10 and 3 — two perfectly ordinary " +
      "dimensions — it is useless. It is a check on VALUES, and the bug is in " +
      "MEANING.",
  );

  blank();
  section("DEFENCE 3 — wrapper objects (this one actually works)");

  js("aspectRatioWrapped(makeWidth(10), makeHeight(3))");
  detonate("result", () => aspectRatioWrapped(makeWidth(10), makeHeight(3)));
  js("aspectRatioWrapped(makeHeight(3), makeWidth(10))   — swapped");
  detonate("result", () => aspectRatioWrapped(makeHeight(3), makeWidth(10)));
  note(
    "Caught! A TypeError, with a useful message. This is the right idea — give " +
      "the two quantities different identities — and it is exactly what a " +
      "branded type does.",
  );

  blank();
  js("but count the cost");
  detonate("what a wrapped width actually is", () => JSON.stringify(makeWidth(10)));
  detonate("arithmetic on it", () => {
    const w = makeWidth(10);
    return `w * 2 = ${w * 2}  (NaN — you must unwrap: w.value * 2 = ${w.value * 2})`;
  });
  detonate("serialising it", () => JSON.stringify({ width: makeWidth(10) }));
  warn(
    "Every wrapped value is an OBJECT ALLOCATION. Every use needs `.value`. " +
      "Every JSON payload changes shape. Every existing API that expected a " +
      "number now needs an adapter. And the check is at RUNTIME, so it fires " +
      "in production rather than in your editor.",
  );

  blank();
  section("DEFENCE 4 — a JSDoc comment");
  detonate("/** @param {number} width - THE WIDTH, NOT THE HEIGHT */", () =>
    aspectRatioNamed(10, 3),
  );
  note("3.333. Documentation is not enforcement.");

  blank();
  table(
    ["defence", "catches the swap?", "when", "runtime cost"],
    [
      ["naming convention", "no", "—", "none"],
      ["range check", "sometimes, by luck", "runtime", "a comparison"],
      ["wrapper objects", "**yes**", "runtime", "**an allocation + unwrap everywhere**"],
      ["JSDoc", "no", "—", "none"],
      ["branded types (TS)", "**yes**", "**compile time**", "**none**"],
    ],
  );
  note(
    "The last row is the TypeScript twin. It is the wrapper-object guarantee, " +
      "moved from runtime to compile time, with the allocation removed.",
  );
}
