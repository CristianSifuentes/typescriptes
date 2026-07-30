// @ts-nocheck
/**
 * 12-destructured-parameters — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A server-startup helper taking a single options OBJECT, destructured in
 * the parameter list. JavaScript destructuring is exactly as permissive as
 * plain property access: a typo'd field name binds to `undefined` instead
 * of failing, and there's no way to tell "field omitted on purpose" apart
 * from "field name misspelled."
 *
 * DOMAIN: an HTTP server's startup configuration.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function createServer({ port, host }) {
  return `listening on ${host}:${port}`;
}

export function runBroken(): void {
  section("Calling with a correctly-shaped options object");

  js('createServer({ port: 8080, host: "localhost" })');
  detonate('createServer({ port: 8080, host: "localhost" })', () =>
    createServer({ port: 8080, host: "localhost" }),
  );

  blank();
  section("A typo'd field name — 'prot' instead of 'port'");

  // A one-character typo. JavaScript destructuring never flags it: 'prot'
  // is simply an extra, unused property, and 'port' is simply absent.
  js('createServer({ prot: 8080, host: "localhost" })');
  detonate('createServer({ prot: 8080, host: "localhost" })', () =>
    createServer({ prot: 8080, host: "localhost" }),
  );
  runtimeSays(
    "'listening on localhost:undefined' (silently wrong, not a crash)",
    "'{ prot, host }' has no 'port' field, so destructuring binds 'port' " +
      "to 'undefined'. The typo'd 'prot: 8080' is simply ignored — an " +
      "unused property nobody reads. Nothing about the CALL looked wrong.",
  );

  blank();
  table(
    ["options object", "port bound to", "outcome"],
    [
      ['{ port: 8080, host: "..." }', "8080", "correct"],
      ['{ prot: 8080, host: "..." }', "undefined", "server 'listens' on port undefined"],
    ],
  );
}
