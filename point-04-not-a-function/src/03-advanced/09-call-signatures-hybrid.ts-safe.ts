/**
 * 09-call-signatures-hybrid — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `Middleware` is a HYBRID TYPE (manifesto §1): its property map has one
 * ordinary entry (`name: string`) and one unusual entry — a CALL SIGNATURE,
 * conventionally written `(req: Request): void` with no property name. A
 * value satisfies `Middleware` only if it has BOTH: callable AND carrying
 * the metadata. An object with only the metadata half is missing the call
 * signature entry, so it fails assignability exactly like missing any other
 * required property — TS2322/TS2352, reported the moment it is registered,
 * long before any request reaches the pipeline.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface Request {
  path: string;
  authenticated?: boolean;
}

interface Middleware {
  (req: Request): void; // call signature — this value can be invoked
  readonly name: string; // ordinary property — this value also has a name
}

function runPipeline(middlewares: readonly Middleware[], request: Request): string[] {
  const trace: string[] = [];
  for (const mw of middlewares) {
    trace.push(`running "${mw.name}"`);
    mw(request); // legal: mw's type GUARANTEES a call signature
  }
  return trace;
}

// A plain named function already satisfies `Middleware` structurally: every
// JavaScript function object carries a real, readonly `.name` derived from
// its declaration — the ordinary-property half of the hybrid type is
// satisfied "for free" by the language itself.
const authMiddleware: Middleware = function auth(req) {
  req.authenticated = true;
};

export function runSafe(): void {
  section("The hybrid type's two halves");
  callableTrace([
    ["Middleware (call)", "(req: Request) => void", "(req: Request): void", "the call-signature half"],
    ["Middleware.name", "string", "not callable", "the ordinary-property half — both must be present"],
  ]);

  blank();
  section("Registering a metadata object where a Middleware is expected");

  const rateLimitDescriptor = { name: "rateLimit", maxPerMinute: 100 };
  ts("const brokenPipeline: Middleware[] = [authMiddleware, rateLimitDescriptor]");
  compileTimeOnly(() => {
    const brokenPipeline: Middleware[] = [
      authMiddleware,
      // @ts-expect-error TS2322: Type '{ name: string; maxPerMinute: number; }'
      // is missing the following properties from type 'Middleware': call
      // signature.
      rateLimitDescriptor,
    ];
    void brokenPipeline;
  });
  compilerSays(
    "TS2322",
    "Type '{ name: string; maxPerMinute: number; }' provides no match for " +
      "the signature '(req: Request): void'.",
    "'rateLimitDescriptor' has the ORDINARY-PROPERTY half of the hybrid " +
      "type ('name') but not the CALL-SIGNATURE half. Having a '.name' was " +
      "never sufficient — the compiler checks both halves of the property " +
      "map independently, and rejects a value missing either one.",
  );

  blank();
  section("A real pipeline");

  const trace = runPipeline([authMiddleware], { path: "/orders" });
  proveType<string[]>()(trace, "string[]", "every entry in the array is GUARANTEED callable by its type");
  good(`runPipeline([authMiddleware], ...) → [${trace.join(", ")}]`);

  blank();
  table(
    ["pipeline entry", "has call signature?", "has .name?", "assignable to Middleware?"],
    [
      ["authMiddleware (named function)", "yes", "yes (built-in)", "yes"],
      ["rateLimitDescriptor (plain object)", "no", "yes", "no — TS2322"],
    ],
  );
  note(
    "Notice `.name` alone was never proof of validity in EITHER world — " +
      "the difference is that TypeScript checks the OTHER half (callability) " +
      "too, and does it before `runPipeline` ever executes.",
  );
}
