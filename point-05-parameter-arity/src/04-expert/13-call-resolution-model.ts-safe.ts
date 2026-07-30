/**
 * 13-call-resolution-model — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * This demo's purpose is not a new bug — it's a slow-motion replay of the
 * ALGORITHM the compiler runs for every call in this entire project.
 * `callApi` is generic over `keyof Endpoints`, where each endpoint's
 * argument list is modeled as a TUPLE (demo 09) — so binding the generic
 * key forces every remaining step (arity bounds, per-position types) to
 * happen explicitly, keyed off exactly which endpoint was named.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly, log } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface Endpoints {
  ping: [];
  getUser: [id: number];
  createUser: [name: string, email: string];
}

const endpointImpls: { [K in keyof Endpoints]: (...args: Endpoints[K]) => string } = {
  ping: () => "pong",
  getUser: (id) => JSON.stringify({ id, name: id === 1 ? "Ada" : "unknown" }),
  createUser: (name, email) => JSON.stringify({ id: 99, name, email }),
};

function callApi<K extends keyof Endpoints>(endpointName: K, ...args: Endpoints[K]): string {
  const impl = endpointImpls[endpointName] as (...args: Endpoints[K]) => string;
  return impl(...args);
}

/** The exact algorithm `tsc` runs for `callApi("createUser", "Grace", "g@x.io")`. */
function narrateResolution(): void {
  log('resolve(callApi("createUser", "Grace", "g@x.io"), typeof callApi):');
  log("  1. is `callApi` callable at all?");
  log("       → yes: it has a call signature (a function declaration)");
  log("  2. bind the type parameter K from the first argument's literal type");
  log('       → K = "createUser"   (keyof Endpoints narrowed to one member)');
  log("  3. compute the REST parameter's tuple type: Endpoints[K]");
  log('       → Endpoints["createUser"] = [name: string, email: string]');
  log("       → this tuple FIXES the arity for the remaining arguments at exactly 2");
  log("  4. are the supplied arguments (\"Grace\", \"g@x.io\") assignable, position by position?");
  log("       → position 0: \"Grace\" assignable to string — yes");
  log("       → position 1: \"g@x.io\" assignable to string — yes");
  log("  5. result type = string (callApi's declared return type)");
  log("  → the call type-checks; the TUPLE is what made step 3's arity concrete.");
}

export function runSafe(): void {
  section("The full resolution algorithm, narrated for a valid call");
  narrateResolution();

  blank();
  section("The same algorithm, for a call missing an argument");

  ts('callApi("createUser", "Grace")  — createUser needs [name, email], only name supplied');
  compileTimeOnly(() => {
    // @ts-expect-error TS2554: Expected 2 arguments, but got 1.
    callApi("createUser", "Grace");
  });
  compilerSays(
    "TS2554",
    "Expected 2 arguments, but got 1.",
    "Step 2 succeeds ('createUser' is a real key), step 3 computes the " +
      "tuple `[name: string, email: string]` — arity EXACTLY 2 for the " +
      "rest of the call — and step 4 (or rather, the arity check ahead of " +
      "it) finds only 1 argument where 2 were required. Unlike the " +
      "JavaScript version, 'callApi' KNOWS, per endpoint, exactly how many " +
      "arguments are required, because that fact lives in `Endpoints`, not " +
      "in the dispatcher's (ignorant) forwarding logic.",
  );

  blank();
  section("A call whose endpoint name is unknown");

  ts('callApi("deleteUser", 1)');
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type '"deleteUser"' is not
    // assignable to parameter of type 'keyof Endpoints'.
    callApi("deleteUser", 1);
  });
  compilerSays(
    "TS2345",
    "Argument of type '\"deleteUser\"' is not assignable to parameter of " +
      "type '\"ping\" | \"getUser\" | \"createUser\"'.",
    "Fails at STEP 2 — there is no valid `K` to bind, so steps 3 and 4 " +
      "(which depend on knowing `K`) are never reached at all.",
  );

  blank();
  section("A call that satisfies every step");

  const user = callApi("createUser", "Grace", "grace@example.com");
  proveType<string>()(user, "string", "every step of the algorithm above succeeded, for THIS endpoint's specific arity");
  good(`callApi("createUser", "Grace", "grace@example.com") → ${user}`);

  blank();
  table(
    ["call", "fails at step", "diagnostic"],
    [
      ['callApi("createUser", "Grace", "g@x.io")', "— (none — succeeds)", "no diagnostic"],
      ['callApi("createUser", "Grace")', "3/4 — arity fixed by the tuple, count too low", "TS2554"],
      ['callApi("deleteUser", 1)', "2 — bind K from keyof Endpoints", "TS2345"],
    ],
  );
  note(
    "Point-04's demo 13 narrated this same five-step algorithm for " +
      "CALLABILITY. This demo narrates it for ARITY — the difference is " +
      "entirely in what step 3 computes: there, a single function type; " +
      "here, a TUPLE, whose length is exactly what turns 'is this the right " +
      "number of arguments' into a question the compiler can answer per " +
      "endpoint, from the type alone.",
  );
}
