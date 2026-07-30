// @ts-nocheck
/**
 * 13-invocation-resolution-model — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A tiny RPC client: `callRpc(methodName, ...args)` looks the method up by
 * NAME in a table and invokes whatever it finds. JavaScript resolves this in
 * one step — "look up the key, call whatever is there" — with no notion of
 * "is this name even one of the methods this client supports?"
 *
 * DOMAIN: a hand-rolled RPC client dispatching by method name, the way a
 * lightweight JSON-RPC wrapper often starts out.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

const rpcMethods = {
  getUser: (id) => ({ id, name: id === 1 ? "Ada" : "unknown" }),
  createUser: (input) => ({ id: 99, name: input.name }),
};

function callRpc(methodName, ...args) {
  return rpcMethods[methodName](...args); // one unchecked lookup, one unchecked call
}

export function runBroken(): void {
  section("Calling a method that really exists");

  js('callRpc("getUser", 1)');
  detonate('callRpc("getUser", 1)', () => callRpc("getUser", 1));

  blank();
  section("Calling a method name that was renamed upstream");

  // The server-side method was renamed 'getUser' -> 'fetchUser' months ago;
  // this client wasn't updated.
  js('callRpc("fetchUser", 1)');
  detonate('callRpc("fetchUser", 1)', () => callRpc("fetchUser", 1));
  runtimeSays(
    "TypeError: rpcMethods[methodName] is not a function",
    "'rpcMethods[\"fetchUser\"]' resolves to 'undefined' — there is no " +
      "key by that name — and 'undefined(...)' is the same crash as every " +
      "other demo in this project, just reached through a dynamic, " +
      "string-keyed lookup instead of a static '.' access.",
  );

  blank();
  table(
    ["methodName", "rpcMethods[methodName]", "outcome"],
    [
      ['"getUser"', "a function", "works"],
      ['"fetchUser"', "undefined — no such key", "TypeError"],
    ],
  );
}
