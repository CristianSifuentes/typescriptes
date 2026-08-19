// @ts-nocheck
/**
 * 13-soundness-holes — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * This demo's subject is the BOUNDARY: the line where a call stops being
 * something the compiler can see.
 *
 * In JavaScript there is no such line, because there is nothing on either side
 * of it. Every call is dynamic, every value is untyped, and the four
 * "dangerous" constructs the TypeScript twin worries about — `apply`, dynamic
 * dispatch, spread of an unknown array, and data-driven invocation — are simply
 * how the language works.
 *
 * This file establishes the baseline so the twin can be precise about which of
 * these TypeScript recovers, and which it does not.
 */

import { section, js, note, detonate, table, blank, warn } from "../99-runner/trace.js";

function transfer(fromAccountId, toAccountId, amountCents) {
  return `${amountCents} from ${fromAccountId} to ${toAccountId}`;
}

const HANDLERS = { transfer };

export function runBroken(): void {
  section("1. apply / call with an argument array");

  detonate("transfer.apply(null, ['payer', 'payee', 100])", () =>
    transfer.apply(null, ["payer", "payee", 100]),
  );
  detonate("transfer.apply(null, ['payee', 'payer', 100])", () =>
    transfer.apply(null, ["payee", "payer", 100]),
  );
  note(
    "The array's order becomes the argument order, and the array can be built " +
      "anywhere — including from a JSON payload that arrived over the network.",
  );

  blank();
  section("2. Dynamic dispatch by name");

  detonate("HANDLERS[name](...args) from a config", () => {
    const request = { handler: "transfer", args: ["payee", "payer", 100] };
    return HANDLERS[request.handler](...request.args);
  });
  warn(
    "The function to call AND its argument order both came from data. Nothing " +
      "in the program text mentions either — this is the shape of an RPC " +
      "dispatcher, a job queue, or a plugin system.",
  );

  blank();
  section("3. Spread of an array whose order nobody checked");

  detonate("args from JSON.parse", () => {
    const args = JSON.parse('["payee","payer",100]');
    return transfer(...args);
  });
  note(
    "The ordering decision was made by whoever wrote the JSON, possibly a " +
      "different system, possibly an attacker.",
  );

  blank();
  section("4. Reordering by accident, in a helper");

  detonate("a 'convenience' wrapper that reverses its own parameters", () => {
    // Written by someone who thought "to, from" read better.
    const send = (to, from, amount) => transfer(from, to, amount);
    // Called by someone who read the original signature.
    return send("payer", "payee", 100);
  });
  warn(
    "The wrapper is internally consistent and the call is internally " +
      "consistent, and together they reverse the transfer. Every individual " +
      "file passes review.",
  );

  blank();
  table(
    ["construct", "what decides the argument order", "visible in the source?"],
    [
      ["direct call", "the call site", "yes"],
      ["apply / call", "an array, built elsewhere", "partly"],
      ["bind", "the leading positions, fixed elsewhere", "partly"],
      ["dynamic dispatch", "data", "**no**"],
      ["spread of parsed JSON", "an external system", "**no**"],
      ["a wrapper that reorders", "two files that each look right", "**no**"],
    ],
  );
  note(
    "The TypeScript twin recovers rows 1-3 and part of row 6, and is explicit " +
      "about rows 4 and 5 — which it cannot recover, because by then the " +
      "program is being written by its input.",
  );
}
