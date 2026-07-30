/**
 * 05-optional-parameters — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `metadata?: Record<string, unknown>` lowers `logEvent`'s minimum arity
 * from 2 to 1 (manifesto §1) WITHOUT lowering its safety: inside the
 * function body, `metadata`'s type is `Record<string, unknown> | undefined`
 * — the `?` is sugar for a union with `undefined`, exactly like point-04's
 * optional-property mechanism (demo 06 there), now applied to a parameter.
 * Using it unguarded is refused by `strictNullChecks`, the SAME check that
 * refuses to invoke a possibly-absent callable.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

function logEvent(message: string, metadata?: Record<string, unknown>): string {
  const keys = metadata ? Object.keys(metadata) : [];
  return `${message} ${JSON.stringify(keys)}`;
}

export function runSafe(): void {
  section("The optional parameter's real type, and the arity it relaxes");
  callableTrace([
    ["logEvent", "(message: string, metadata?: Record<string, unknown>) => string", "minimum arity 1, maximum arity 2", "metadata: Record<string, unknown> | undefined INSIDE the body"],
  ]);

  blank();
  section("Calling with only the required parameter");

  const noMeta = logEvent("server.started");
  proveType<string>()(noMeta, "string", "metadata was OMITTED — arity 1 satisfies the lowered minimum, no crash");
  good(`logEvent("server.started") → ${JSON.stringify(noMeta)}`);

  blank();
  section("Using the optional parameter WITHOUT narrowing it first");

  ts("`Object.keys(metadata)` with no guard, inside a version of logEvent that skips the check");
  compileTimeOnly(() => {
    function unsafeLogEvent(message: string, metadata?: Record<string, unknown>): string {
      // @ts-expect-error TS18048: 'metadata' is possibly 'undefined'.
      return `${message} ${JSON.stringify(Object.keys(metadata))}`;
    }
    void unsafeLogEvent;
  });
  compilerSays(
    "TS18048",
    "'metadata' is possibly 'undefined'.",
    "`metadata?:` did NOT make 'metadata' simply 'weaker' or unchecked — " +
      "it made it a UNION including 'undefined', and `strictNullChecks` " +
      "refuses `Object.keys(metadata)` until that union is narrowed. This " +
      "is the exact rule point-04's demo 06 established for calling a " +
      "possibly-absent function, here applied to READING a possibly-absent " +
      "parameter.",
  );

  blank();
  section("The correct, narrowed usage — and calling with metadata too");

  const withMeta = logEvent("user.login", { userId: 42 });
  proveType<string>()(withMeta, "string", "metadata ? ... : [] narrows the union before Object.keys ever runs");
  good(`logEvent("user.login", { userId: 42 }) → ${JSON.stringify(withMeta)}`);

  blank();
  table(
    ["call", "metadata's narrowed type used", "outcome"],
    [
      ['logEvent("server.started")', "undefined branch — keys = []", "no crash, arity satisfied at 1"],
      ['logEvent("user.login", {...})', "Record<string, unknown> branch", "no crash, arity satisfied at 2"],
    ],
  );
  note(
    "Both the 1-argument and 2-argument calls are equally VALID under " +
      "`metadata?:` — the difference from demo 01's too-few-arguments crash " +
      "is that here, omission is an intended, checked possibility, not a " +
      "forgotten one.",
  );
}
