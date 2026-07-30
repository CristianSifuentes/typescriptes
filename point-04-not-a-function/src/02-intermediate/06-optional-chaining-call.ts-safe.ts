/**
 * 06-optional-chaining-call — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `onError?: (err: Error) => void` puts `onError` in the property map with
 * value type `((err: Error) => void) | undefined` — a UNION that includes a
 * non-callable member. Invoking it unconditionally is therefore invoking a
 * value that MIGHT be `undefined`, which `strictNullChecks` refuses until
 * proven otherwise: **TS18048**. Optional chaining (`?.`) is the disciplined
 * way to invoke "maybe callable, maybe not" — it makes the absence a
 * NON-EVENT instead of a crash.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface Plugin {
  readonly name: string;
  readonly onError?: (err: Error) => void;
}

function runPlugin(plugin: Plugin, error: Error): void {
  plugin.onError?.(error);
}

export function runSafe(): void {
  section("The optional hook's real type");
  callableTrace([
    ["plugin.onError", "((err: Error) => void) | undefined", "present: (err: Error) => void", "a UNION — one member callable, one member not"],
  ]);

  blank();
  section("Invoking the optional hook unconditionally");

  const analyticsPlugin: Plugin = { name: "analytics" };
  ts("plugin.onError(error)  — no guard, no '?.'");
  compileTimeOnly(() => {
    // @ts-expect-error TS18048: 'plugin.onError' is possibly 'undefined'.
    analyticsPlugin.onError(new Error("timeout"));
  });
  compilerSays(
    "TS18048",
    "'plugin.onError' is possibly 'undefined'.",
    "This is NOT 'onError does not exist' (TS2339) — the compiler knows " +
      "'onError' is a real, declared, OPTIONAL member. It refuses the call " +
      "because one member of its union type ('undefined') has no call " +
      "signature, and an operation is only legal on a union if it is legal " +
      "for EVERY member (the same union rule point-01's demo 08 establishes " +
      "for property access, applied here to invocation).",
  );

  blank();
  section("The disciplined fix: optional chaining");

  runPlugin(analyticsPlugin, new Error("timeout")); // compiles and runs safely
  good("runPlugin(analyticsPlugin, ...) — no crash. '?.()' short-circuits to `undefined` when the hook is absent.");

  const loggingLog: string[] = [];
  const loggingPlugin: Plugin = {
    name: "logging",
    onError: (e) => loggingLog.push(e.message),
  };
  runPlugin(loggingPlugin, new Error("timeout"));
  proveType<string[]>()(loggingLog, "string[]", "the hook ran when present, was skipped when absent — same call site, both plugins");
  good(`loggingPlugin's hook ran: [${loggingLog.join(", ")}]`);

  blank();
  table(
    ["expression", "onError present?", "outcome"],
    [
      ["plugin.onError(error) — unguarded", "either", "TS18048 — rejected before either case can run"],
      ["plugin.onError?.(error) — analyticsPlugin", "no", "no-op, returns undefined, no crash"],
      ["plugin.onError?.(error) — loggingPlugin", "yes", "calls the real handler"],
    ],
  );
  note(
    "'?.()' is not merely a null-check shortcut — its TYPE is `undefined` " +
      "when the callee is absent and the callee's RETURN TYPE otherwise, so " +
      "the compiler tracks the union all the way through the call, not just " +
      "at the invocation.",
  );
}
