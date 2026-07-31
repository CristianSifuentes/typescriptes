/**
 * 12-destructured-parameters — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `{ port, host }: ServerOptions` is still a SINGLE parameter — arity is
 * unaffected — but its type is a real object type, so every FIELD inside
 * the destructuring pattern is checked exactly like a property access
 * (point-03's mechanism). An object literal passed directly at the call
 * site is additionally checked for EXCESS properties: a field the target
 * type doesn't recognise is flagged immediately, catching the typo instead
 * of silently accepting it as unused.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface ServerOptions {
  readonly port: number;
  readonly host: string;
}

function createServer({ port, host }: ServerOptions): string {
  return `listening on ${host}:${port}`;
}

export function runSafe(): void {
  section("A destructured parameter's real type — one parameter, a shaped object");
  callableTrace([
    ["createServer", "(options: ServerOptions) => string", "minimum/maximum arity 1", "ServerOptions = { port: number; host: string }"],
  ]);

  blank();
  section("A typo'd field name in an object literal argument");

  ts('createServer({ prot: 8080, host: "localhost" })');
  compileTimeOnly(() => {
    createServer({
      // @ts-expect-error TS2561: Object literal may only specify known
      // properties, but 'prot' does not exist in type 'ServerOptions'. Did
      // you mean to write 'port'?
      prot: 8080,
      host: "localhost",
    });
  });
  compilerSays(
    "TS2561",
    "Object literal may only specify known properties, but 'prot' does " +
      "not exist in type 'ServerOptions'. Did you mean to write 'port'?",
    "EXCESS PROPERTY CHECKING — a stricter check than ordinary structural " +
      "assignability, applied specifically to object literals written " +
      "DIRECTLY at the call site. It exists precisely to catch typos like " +
      "this one: structurally, '{ prot, host }' would actually be " +
      "ASSIGNABLE to a wider type, but the compiler knows a literal with an " +
      "unrecognised field is far more likely a mistake than an intentional " +
      "extra property, so it flags it — with a spelling suggestion, just " +
      "like point-04's demo 02.",
  );

  blank();
  section("Omitting a required field entirely");

  ts('createServer({ host: "localhost" })  — missing port');
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type '{ host: string; }' is not
    // assignable to parameter of type 'ServerOptions'. Property 'port' is
    // missing.
    createServer({ host: "localhost" });
  });
  compilerSays(
    "TS2345",
    "Argument of type '{ host: string; }' is not assignable to parameter " +
      "of type 'ServerOptions'. Property 'port' is missing in type " +
      "'{ host: string; }' but required in type 'ServerOptions'.",
    "Arity is still satisfied — ONE argument, ONE parameter — but that " +
      "single argument's SHAPE is incomplete. This is point-04's demo 15 " +
      "totality check ('Record' requiring every key) applied to a single " +
      "destructured parameter instead of a whole registry.",
  );

  blank();
  section("The correct call");

  const result = createServer({ port: 8080, host: "localhost" });
  proveType<string>()(result, "string", "every field present, correctly named, correctly typed");
  good(`createServer({ port: 8080, host: "localhost" }) → ${JSON.stringify(result)}`);

  blank();
  table(
    ["options object", "problem", "diagnostic"],
    [
      ['{ prot: 8080, host: "..." }', "unrecognised field, likely a typo", "TS2561 (spelling suggested)"],
      ['{ host: "..." }', "missing required field", "TS2345"],
      ['{ port: 8080, host: "..." }', "none", "compiles"],
    ],
  );
  note(
    "Destructuring doesn't change arity checking at all here — it's still " +
      "one parameter. What it changes is that the single parameter's " +
      "INTERNAL shape becomes just as strictly checked as any other object " +
      "type, field by field, the moment it's written as a literal at the " +
      "call site.",
  );
}
