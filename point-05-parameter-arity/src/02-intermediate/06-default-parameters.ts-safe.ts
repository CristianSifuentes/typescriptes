/**
 * 06-default-parameters — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `pageSize = 20` does two things at the type level: it lowers minimum
 * arity by one (like `?:`, manifesto §1), AND it infers `pageSize`'s type
 * from the default value's type (`number`) unless annotated otherwise. That
 * inferred type does NOT include `null` — `strictNullChecks` treats `null`
 * as a distinct, real type, so passing it where `number` is required fails
 * exactly like passing any other wrong type (demo 03), regardless of the
 * caller's intent to "opt into the default."
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

function fetchPage(pageNumber: number, pageSize = 20): string {
  return `fetching ${pageSize} items starting at page ${pageNumber}`;
}

export function runSafe(): void {
  section("What a default parameter's type is inferred to be");
  callableTrace([
    ["fetchPage", "(pageNumber: number, pageSize?: number) => string", "minimum arity 1, maximum arity 2", "pageSize inferred as `number` from `= 20` — NOT `number | null`"],
  ]);

  blank();
  section("Passing `null`, hoping it means 'use the default'");

  ts("fetchPage(1, null)");
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'null' is not assignable to
    // parameter of type 'number | undefined'.
    fetchPage(1, null);
  });
  compilerSays(
    "TS2345",
    "Argument of type 'null' is not assignable to parameter of type " +
      "'number | undefined'.",
    "`= 20` only ever substitutes for `undefined` — it never expanded " +
      "'pageSize's TYPE to accept `null` too. TypeScript rejects this call " +
      "for the same reason as demo 03 (a wrong type at a position); the " +
      "caller's belief that 'null means default' is simply not true of " +
      "JavaScript's own default-parameter semantics, and the compiler " +
      "surfaces that misunderstanding immediately instead of letting a " +
      "nonsensical page size through.",
  );

  blank();
  section("The two ways to correctly opt into the default");

  const omitted = fetchPage(1);
  proveType<string>()(omitted, "string", "arity 1 — pageSize omitted, default substituted");
  good(`fetchPage(1) → ${JSON.stringify(omitted)}`);

  const explicitUndefined = fetchPage(1, undefined);
  proveType<string>()(explicitUndefined, "string", "arity 2, but the argument IS undefined — the default still substitutes");
  good(`fetchPage(1, undefined) → ${JSON.stringify(explicitUndefined)}`);

  const explicitValue = fetchPage(1, 50);
  proveType<string>()(explicitValue, "string", "arity 2, a real number — no default involved");
  good(`fetchPage(1, 50) → ${JSON.stringify(explicitValue)}`);

  blank();
  table(
    ["pageSize argument", "assignable to number | undefined?", "default applied?", "outcome"],
    [
      ["(omitted)", "n/a — arity relaxed to 1", "yes", "compiles"],
      ["undefined (explicit)", "yes", "yes", "compiles"],
      ["null", "no", "n/a — rejected first", "TS2345"],
      ["50", "yes", "no — real value supplied", "compiles"],
    ],
  );
  note(
    "If a codebase genuinely needs `null` to mean 'use the default', the " +
      "FIX is declaring that on purpose: `pageSize: number | null = 20` — " +
      "which then requires the function BODY to treat `null` the same as " +
      "`undefined` explicitly, rather than relying on an accident of " +
      "JavaScript's default-substitution rule that TypeScript refuses to " +
      "silently assume.",
  );
}
