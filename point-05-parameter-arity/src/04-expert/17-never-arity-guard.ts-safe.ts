/**
 * 17-never-arity-guard — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `ExactTuple<T, N>` is a conditional type that resolves to `T` itself when
 * `T`'s LENGTH literally matches `N`, and to `never` otherwise. Because
 * `never` has no values, a parameter typed `ExactTuple<T, N>` can only ever
 * be satisfied by an argument whose length is exactly right — any other
 * length makes the parameter's type `never`, and NOTHING is assignable to
 * `never` except `never` itself. This turns "wrong tuple length" into a
 * compile-time error the same family of mechanism as point-04's demo 15
 * (`never` making an unhandled case unreachable), here applied to arity
 * instead of exhaustiveness.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

/** Resolves to T when its length is exactly N, or to `never` otherwise. */
type ExactTuple<T extends readonly unknown[], N extends number> = T["length"] extends N ? T : never;

function assertExactly<N extends number>(_length: N) {
  return function assert<T extends readonly unknown[]>(values: ExactTuple<T, N>): T {
    return values as T;
  };
}

const assertRGB = assertExactly(3);

function setColor(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`;
}

export function runSafe(): void {
  section("What ExactTuple resolves to, for a matching and a mismatched length");
  callableTrace([
    ["ExactTuple<[255, 87, 34], 3>", "[255, 87, 34]", "n/a (not callable)", "length literal 3 matches N=3 — resolves to T itself"],
    ["ExactTuple<[255, 87], 3>", "never", "n/a (not callable)", "length literal 2 does NOT match N=3 — resolves to never"],
  ]);

  blank();
  section("Passing a 2-element literal where assertRGB requires exactly 3");

  ts("assertRGB([255, 87] as const)");
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'readonly [255, 87]' is not
    // assignable to parameter of type 'never'.
    assertRGB([255, 87] as const);
  });
  compilerSays(
    "TS2345",
    "Argument of type 'readonly [255, 87]' is not assignable to parameter " +
      "of type 'never'.",
    "'T' is inferred from the literal FIRST — 'readonly [255, 87]', length " +
      "2 — and THEN substituted back into 'ExactTuple<T, 3>', which " +
      "collapses to 'never' because 2 does not match 3. The literal is then " +
      "checked against ITS OWN computed parameter type and, being anything " +
      "other than 'never', fails. The diagnostic mentions 'never' " +
      "explicitly — that IS the mechanism, made visible in the error text.",
  );

  blank();
  section("A correctly-sized literal");

  const brandPrimary = assertRGB([255, 87, 34] as const);
  proveType<readonly [255, 87, 34]>()(brandPrimary, "readonly [255, 87, 34]", "length 3 matches N=3 — ExactTuple resolved to T, not never");
  const css = setColor(...brandPrimary);
  proveType<string>()(css, "string", "the validated, exactly-3-length tuple spreads cleanly into setColor's 3 parameters");
  good(`setColor(...brandPrimary) → ${JSON.stringify(css)}`);

  blank();
  table(
    ["literal", "T inferred", "ExactTuple<T, 3>", "outcome"],
    [
      ["[255, 87, 34] as const", "readonly [255, 87, 34]", "T itself", "compiles"],
      ["[255, 87] as const", "readonly [255, 87]", "never", "TS2345 — nothing is assignable to never"],
    ],
  );
  note(
    "This guard only works for VALUES WHOSE LENGTH IS KNOWN AT COMPILE " +
      "TIME — a literal written with 'as const' directly in source. An " +
      "array assembled at runtime (parsed from a config file, built in a " +
      "loop) has a length that is a runtime fact, not a type-level literal " +
      "— for THAT case, demo 15's runtime length predicate ('isPair') is " +
      "the correct tool, not this one. The two demos are deliberately " +
      "complementary: this is the compile-time-only end of the same idea.",
  );
}
