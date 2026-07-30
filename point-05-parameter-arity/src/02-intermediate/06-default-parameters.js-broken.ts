// @ts-nocheck
/**
 * 06-default-parameters — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A paginator whose page size SHOULD default to 20 when not specified.
 * JavaScript defaults (`pageSize = 20`) only substitute when the argument is
 * `undefined` — they say nothing about arity, and a caller who explicitly
 * passes a WRONG kind of "empty" value (e.g. `0`, or `null`) gets no default
 * at all, silently.
 *
 * DOMAIN: a paginated API client fetching a page of results.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function fetchPage(pageNumber, pageSize = 20) {
  return `fetching ${pageSize} items starting at page ${pageNumber}`;
}

export function runBroken(): void {
  section("Omitting pageSize — the default kicks in");

  js("fetchPage(1)");
  detonate("fetchPage(1)", () => fetchPage(1));

  blank();
  section("Passing `null` intending 'use the default' — a common but wrong assumption");

  // A caller assumes 'null' means "no preference, use whatever's default" —
  // true for SOME APIs, but JS defaults only trigger on `undefined`, never
  // on `null`.
  js("fetchPage(1, null)");
  detonate("fetchPage(1, null)", () => fetchPage(1, null));
  runtimeSays(
    "'fetching null items starting at page 1' (not a crash — silently wrong)",
    "Default parameters ONLY substitute for 'undefined', never for 'null'. " +
      "'pageSize' is bound to 'null' exactly as written, and 'null' flows " +
      "straight into the result — no default, no error, just a nonsensical " +
      "page size nobody asked for.",
  );

  blank();
  table(
    ["pageSize argument", "value used", "default applied?"],
    [
      ["(omitted)", "20", "yes"],
      ["undefined (explicit)", "20", "yes"],
      ["null", "null", "no — defaults do not trigger on null"],
    ],
  );
}
