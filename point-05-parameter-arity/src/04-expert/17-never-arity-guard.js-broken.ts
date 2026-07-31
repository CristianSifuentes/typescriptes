// @ts-nocheck
/**
 * 17-never-arity-guard — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A color-setting helper needing exactly three channel values (red, green,
 * blue). Colors are authored directly in source as plain arrays — nothing
 * about writing `[255, 0]` instead of `[255, 0, 0]` looks any different
 * from a correct color literal; JavaScript arrays don't carry a length in
 * their "type" at all, because they don't have one.
 *
 * DOMAIN: a design-system color constant, spread into a CSS-generating
 * helper.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function setColor(r, g, b) {
  return `rgb(${r}, ${g}, ${b})`;
}

const brandPrimary = [255, 87, 34]; // a correct, 3-element color

export function runBroken(): void {
  section("A correctly-authored 3-value color constant");

  js("setColor(...brandPrimary)");
  detonate("setColor(...brandPrimary)", () => setColor(...brandPrimary));

  blank();
  section("A color constant authored with only TWO values — a typo, a missed channel");

  // Someone editing this file forgot the blue channel. Nothing about the
  // array literal itself looks wrong.
  const brandAccentBroken = [255, 87];

  js("setColor(...brandAccentBroken)");
  detonate("setColor(...brandAccentBroken)", () => setColor(...brandAccentBroken));
  runtimeSays(
    "'rgb(255, 87, undefined)' (silently wrong CSS, not a crash)",
    "'brandAccentBroken' has two elements, not three — the spread " +
      "contributes two arguments, and 'b' is left 'undefined'. The " +
      "resulting CSS is syntactically invalid, and nothing in the pipeline " +
      "— writing the constant, spreading it, generating the CSS — ever " +
      "flagged it.",
  );

  blank();
  table(
    ["color constant", "length", "setColor(...) outcome"],
    [
      ["[255, 87, 34]", "3", "correct: 'rgb(255, 87, 34)'"],
      ["[255, 87]", "2", "'rgb(255, 87, undefined)' — invalid CSS, silently"],
    ],
  );
}
