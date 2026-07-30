// @ts-nocheck
/**
 * 09-call-signatures-hybrid — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A middleware registry where each entry is expected to be BOTH callable
 * (invoked per request) AND carry metadata (a `.name`, used for logging).
 * JavaScript has no notion of "this value must be both" — it happily stores
 * a plain metadata object with no call behaviour at all in the same slot a
 * real middleware function would occupy.
 *
 * DOMAIN: a minimal HTTP middleware pipeline, keyed by name for diagnostics.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function runPipeline(middlewares, request) {
  const trace = [];
  for (const mw of middlewares) {
    trace.push(`running "${mw.name}"`);
    mw(request); // assumes every entry is callable
  }
  return trace;
}

function withLogging(fn) {
  fn.middlewareName = fn.name; // attach metadata onto the function itself
  return fn;
}

export function runBroken(): void {
  section("A pipeline of real middleware functions");

  const authMiddleware = function auth(req) {
    req.authenticated = true;
  };
  const pipeline = [authMiddleware];
  js("runPipeline([authMiddleware], request)");
  detonate("runPipeline([authMiddleware], request)", () =>
    runPipeline(pipeline, { path: "/orders" }),
  );

  blank();
  section("A metadata object accidentally registered instead of a function");

  // Meant to register a middleware, but registered its DESCRIPTOR instead —
  // an easy mistake when middleware and their metadata live side by side.
  const rateLimitDescriptor = { name: "rateLimit", maxPerMinute: 100 };
  const brokenPipeline = [authMiddleware, rateLimitDescriptor];

  js("runPipeline([authMiddleware, rateLimitDescriptor], request)");
  detonate("runPipeline(brokenPipeline, request)", () =>
    runPipeline(brokenPipeline, { path: "/orders" }),
  );
  runtimeSays(
    "TypeError: mw is not a function",
    "'rateLimitDescriptor' has a '.name' — it even LOOKS like a valid " +
      "pipeline entry when you log its metadata — but it has no [[Call]] " +
      "slot. The mistake is only visible once the pipeline actually runs.",
  );

  blank();
  table(
    ["pipeline entry", "has .name?", "callable?", "outcome"],
    [
      ["authMiddleware", "yes", "yes", "runs"],
      ["rateLimitDescriptor", "yes", "no", "TypeError"],
    ],
  );
  note(
    "'.name' being present proves nothing about callability — both entries " +
      "'look like' middleware from the outside.",
  );
}
