/**
 * 08-required-after-optional-ordering — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * TypeScript refuses to even DECLARE a required parameter after a truly
 * OPTIONAL one (`?:`) — TS1016, a syntax-level error, not a call-site one.
 * This is not an arbitrary style rule: manifesto §1 models a parameter
 * list's arity as an interval, `[minRequired, maxAllowed]`, filled
 * positionally. If an optional parameter could precede a required one,
 * "supply fewer arguments than the max" would be AMBIGUOUS about which
 * position was skipped — exactly the footgun the JavaScript version falls
 * into. The ordering rule keeps positional arity resolution well-defined by
 * construction.
 *
 * A DEFAULTED parameter (`= value`) is not the same thing, and this is
 * worth being precise about: TypeScript DOES allow a required parameter
 * after a defaulted one — it simply makes the defaulted parameter
 * EFFECTIVELY REQUIRED for arity purposes (its default can then only be
 * reached by passing `undefined` explicitly, never by omission). Only `?:`
 * — genuine optionality — triggers the declaration-time error.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

export function runSafe(): void {
  section("The declaration JavaScript allows, that TypeScript refuses to parse this way");
  ts("function scheduleTask(name: string, delayMs?: number, priority: number) { ... }");
  compileTimeOnly(() => {
    // @ts-expect-error TS1016: A required parameter cannot follow an
    // optional parameter.
    function scheduleTaskBad(name: string, delayMs?: number, priority: number): string {
      return `scheduling "${name}" in ${delayMs ?? 0}ms at priority ${priority}`;
    }
    void scheduleTaskBad;
  });
  compilerSays(
    "TS1016",
    "A required parameter cannot follow an optional parameter.",
    "This fires on the DECLARATION itself, before any call is even " +
      "considered — TypeScript will not let a parameter list exist in a " +
      "shape where 'how many arguments were supplied' could be ambiguous " +
      "about WHICH position was omitted. `priority` being required, after " +
      "`delayMs` being genuinely optional (`?:`), is exactly that " +
      "ambiguous shape.",
  );

  blank();
  section("A defaulted (not optional) parameter followed by a required one: legal, but not a loophole");

  // TypeScript ACCEPTS this declaration — `= 1000` is not `?:` — but the
  // arity it computes for calls is NOT what a naive reading suggests.
  function scheduleTaskDefaulted(name: string, delayMs = 1000, priority: number): string {
    return `scheduling "${name}" in ${delayMs}ms at priority ${priority}`;
  }
  callableTrace([
    ["scheduleTaskDefaulted", "(name: string, delayMs?: number, priority: number) => string", "minimum arity 3, NOT 2", "priority being required forces delayMs to be effectively required too"],
  ]);

  ts('scheduleTaskDefaulted("cleanup", 5)  — the SAME 2-argument attempt as the JS footgun');
  compileTimeOnly(() => {
    // @ts-expect-error TS2554: Expected 3 arguments, but got 2.
    scheduleTaskDefaulted("cleanup", 5);
  });
  compilerSays(
    "TS2554",
    "Expected 3 arguments, but got 2.",
    "Because `priority` has no default and follows `delayMs`, TypeScript " +
      "computes this signature's MINIMUM arity as 3, not 2 — `delayMs`'s " +
      "default can still be reached, but only by passing `undefined` " +
      "explicitly for it, never by omitting it. The exact JavaScript " +
      "footgun ('skip the middle argument positionally') is closed here " +
      "not by refusing the declaration, but by ordinary arity checking " +
      "(demo 01) computed correctly around it.",
  );

  blank();
  section("The clean fix: required parameters first, optional/defaulted ones last");

  callableTrace([
    ["scheduleTask", "(name: string, priority: number, delayMs?: number) => string", "minimum arity 2, maximum arity 3", "required parameters occupy the FIRST positions, unambiguously"],
  ]);

  function scheduleTask(name: string, priority: number, delayMs = 1000): string {
    return `scheduling "${name}" in ${delayMs}ms at priority ${priority}`;
  }

  ts('scheduleTask("cleanup", 5)  — the SAME two-argument intent as the JS version');
  const result = scheduleTask("cleanup", 5);
  proveType<string>()(result, "string", "with the reordered signature, 2 arguments UNAMBIGUOUSLY mean name + priority");
  good(`scheduleTask("cleanup", 5) → ${JSON.stringify(result)}`);

  blank();
  table(
    ["parameter order", "declares?", "scheduleTask(\"cleanup\", 5) means"],
    [
      ["name, delayMs?: number, priority (required after OPTIONAL)", "TS1016 — refuses to declare", "n/a"],
      ["name, delayMs = 1000, priority (required after DEFAULTED)", "compiles, min arity becomes 3", "TS2554 on a 2-argument call — no silent mis-binding"],
      ["name, priority, delayMs = 1000 (required first)", "compiles, min arity 2", "name + priority, delayMs defaulted — exactly as intended"],
    ],
  );
  note(
    "Every ordering that could reproduce the JavaScript footgun is closed " +
      "by TypeScript, just via two DIFFERENT mechanisms depending on " +
      "whether the middle parameter is `?:` (refused at the declaration) " +
      "or `= value` (accepted, but with its true, non-obvious arity " +
      "enforced at every call). Reordering so required parameters come " +
      "first is still the clean fix — it makes the 'skip the middle " +
      "argument' request impossible to even attempt, rather than merely " +
      "rejected.",
  );
}
