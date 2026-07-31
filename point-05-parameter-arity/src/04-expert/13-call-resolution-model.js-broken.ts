// @ts-nocheck
/**
 * 13-call-resolution-model — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A tiny API dispatcher: `callApi(endpointName, ...args)` looks the
 * endpoint up by name and forwards whatever arguments it received. Each
 * endpoint actually expects a DIFFERENT number of arguments — JavaScript
 * has no way to express that per-endpoint arity, so a caller supplying the
 * wrong count for a given endpoint is silently tolerated.
 *
 * DOMAIN: a hand-rolled API client dispatching by endpoint name, each
 * endpoint with its own expected argument list.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

const endpoints = {
  ping: () => "pong",
  getUser: (id) => ({ id, name: id === 1 ? "Ada" : "unknown" }),
  createUser: (name, email) => ({ id: 99, name, email }),
};

function callApi(endpointName, ...args) {
  return endpoints[endpointName](...args);
}

export function runBroken(): void {
  section("Calling each endpoint with the arity it actually expects");

  js('callApi("ping")');
  detonate('callApi("ping")', () => callApi("ping"));

  js('callApi("getUser", 1)');
  detonate('callApi("getUser", 1)', () => callApi("getUser", 1));

  blank();
  section("Calling 'createUser' with only ONE of its two expected arguments");

  // createUser needs (name, email) — a caller forgot the email, perhaps
  // copy-pasting from a single-argument endpoint like getUser.
  js('callApi("createUser", "Grace")');
  detonate('callApi("createUser", "Grace")', () => callApi("createUser", "Grace"));
  runtimeSays(
    "{ id: 99, name: 'Grace', email: undefined } (silently wrong, not a crash)",
    "'createUser' bound its second parameter, 'email', to 'undefined' — " +
      "exactly point-04/point-05's usual story. What makes THIS demo " +
      "different is that 'callApi' itself has NO IDEA how many arguments " +
      "any given endpoint expects; it just forwards whatever it received.",
  );

  blank();
  table(
    ["endpoint", "expected arity", "callApi call", "outcome"],
    [
      ["ping", "0", 'callApi("ping")', "correct"],
      ["getUser", "1", 'callApi("getUser", 1)', "correct"],
      ["createUser", "2", 'callApi("createUser", "Grace")', "email silently undefined"],
    ],
  );
}
