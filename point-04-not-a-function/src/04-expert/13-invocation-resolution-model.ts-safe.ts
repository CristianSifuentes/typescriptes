/**
 * 13-invocation-resolution-model — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * This demo's purpose is not a new bug — it's a slow-motion replay of the
 * ALGORITHM the compiler runs for every single call expression in this
 * entire project. `callRpc` is generic over `keyof RpcMethods`, so the
 * example forces every one of the resolution steps below to happen
 * explicitly, at the type level, instead of implicitly.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly, log } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface RpcMethods {
  getUser(id: number): { id: number; name: string };
  createUser(input: { name: string }): { id: number };
}

const rpcMethods: RpcMethods = {
  getUser: (id) => ({ id, name: id === 1 ? "Ada" : "unknown" }),
  createUser: (input) => ({ id: 99, name: input.name }),
};

function callRpc<M extends keyof RpcMethods>(
  methodName: M,
  ...args: Parameters<RpcMethods[M]>
): ReturnType<RpcMethods[M]> {
  const method = rpcMethods[methodName] as (
    ...args: Parameters<RpcMethods[M]>
  ) => ReturnType<RpcMethods[M]>;
  return method(...args);
}

/**
 * The exact algorithm `tsc` runs for `callRpc("getUser", 1)`, spelled out.
 * Every step below is a REAL step the checker performs — this function
 * exists only to narrate it; the checking already happened when this file
 * was compiled.
 */
function narrateResolution(): void {
  log("resolve(callRpc(\"getUser\", 1), typeof callRpc):");
  log("  1. is `callRpc` callable at all?");
  log('       → yes: its type has a call signature (it is a function declaration)');
  log("  2. bind the type parameter M from the first argument's literal type");
  log('       → M = "getUser"   (keyof RpcMethods narrowed to one member)');
  log("  3. compute the REST parameter type: Parameters<RpcMethods[M]>");
  log("       → RpcMethods[\"getUser\"] = (id: number) => {...}");
  log("       → Parameters<...> = [id: number]");
  log("  4. are the supplied arguments (1) assignable to [id: number]?");
  log("       → yes: 1 is a number");
  log("  5. result type = ReturnType<RpcMethods[M]> = { id: number; name: string }");
  log("  → the call type-checks; NONE of this required rpcMethods to exist yet.");
}

export function runSafe(): void {
  section("The full resolution algorithm, narrated for a valid call");
  narrateResolution();

  blank();
  section("The same algorithm, for a call TypeScript rejects");

  ts('callRpc("fetchUser", 1)');
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type '"fetchUser"' is not
    // assignable to parameter of type '"getUser" | "createUser"'.
    callRpc("fetchUser", 1);
  });
  compilerSays(
    "TS2345",
    "Argument of type '\"fetchUser\"' is not assignable to parameter of " +
      "type '\"getUser\" | \"createUser\"'.",
    "The algorithm fails at STEP 2: `M` can only be bound to a member of " +
      "`keyof RpcMethods`, which is the literal union '\"getUser\" | " +
      "\"createUser\"'. '\"fetchUser\"' is not a member of that union, so " +
      "there is no valid `M` to continue the remaining steps with — the " +
      "call is rejected before step 3 (argument checking) is ever reached, " +
      "which is exactly why a RENAMED or MISSPELLED method name can never " +
      "reach the dynamic lookup that crashed the JavaScript version.",
  );

  blank();
  section("A valid call, argument mismatch instead");

  ts('callRpc("getUser", "1")  — string instead of number');
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'string' is not assignable
    // to parameter of type 'number'.
    callRpc("getUser", "1");
  });
  compilerSays(
    "TS2345",
    "Argument of type 'string' is not assignable to parameter of type 'number'.",
    "Here `M` resolves fine (step 2 succeeds: \"getUser\" is a real key) — " +
      "the failure is step 4: the argument list does not match " +
      "`Parameters<RpcMethods[\"getUser\"]>`. Same failing STEP as demo 07's " +
      "TS2345, reached through a fully generic, dynamically-dispatched call.",
  );

  blank();
  section("A call that satisfies every step");

  const user = callRpc("getUser", 1);
  proveType<{ id: number; name: string }>()(user, "{ id: number; name: string }", "every step of the algorithm above succeeded");
  good(`callRpc("getUser", 1) → ${JSON.stringify(user)}`);

  blank();
  table(
    ["call", "fails at step", "diagnostic"],
    [
      ['callRpc("getUser", 1)', "— (none — succeeds)", "no diagnostic"],
      ['callRpc("fetchUser", 1)', "2 — bind M from keyof RpcMethods", "TS2345"],
      ['callRpc("getUser", "1")', "4 — argument assignability", "TS2345"],
    ],
  );
  note(
    "This five-step algorithm is not specific to `callRpc` — it is the SAME " +
      "algorithm run, invisibly, for `\"hello\".toUpperCase()` (demo 01), " +
      "`config.retry()` (demo 05), and every other call expression in this " +
      "project. Making it generic just makes every step land on a visibly " +
      "different piece of the type system instead of being resolved in one " +
      "invisible instant.",
  );
}
