// @ts-nocheck
/**
 * 06-optional-chaining-call — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A plugin hook that most plugins never bother to implement: `onError` is
 * OPTIONAL. Calling it unconditionally works fine for the plugins that DO
 * implement it, and crashes for every one that doesn't — a bug that is
 * invisible in testing unless every code path (every plugin) is exercised.
 *
 * DOMAIN: a plugin system where each plugin may optionally hook into error
 * reporting.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function runPlugin(plugin, error) {
  plugin.onError(error); // assumes onError always exists
}

export function runBroken(): void {
  section("A plugin that DOES implement the optional hook");

  const loggingPlugin = { name: "logging", onError: (e) => console.log(`logged: ${e.message}`) };
  js("runPlugin(loggingPlugin, new Error('timeout'))");
  detonate("runPlugin(loggingPlugin, ...)", () => {
    runPlugin(loggingPlugin, new Error("timeout"));
    return "ran without error";
  });

  blank();
  section("A plugin that does NOT implement it — perfectly valid, per the domain rules");

  const analyticsPlugin = { name: "analytics" }; // no onError — and that's fine
  js("runPlugin(analyticsPlugin, new Error('timeout'))");
  detonate("runPlugin(analyticsPlugin, ...)", () => {
    runPlugin(analyticsPlugin, new Error("timeout"));
    return "ran without error";
  });
  runtimeSays(
    "TypeError: plugin.onError is not a function",
    "'analyticsPlugin' never promised to implement 'onError' — omitting an " +
      "OPTIONAL hook is completely valid plugin authoring. The crash punishes " +
      "correct plugin code for a bug in the code that CALLS plugins.",
  );

  blank();
  table(
    ["plugin", "implements onError?", "runPlugin() outcome"],
    [
      ["loggingPlugin", "yes", "works"],
      ["analyticsPlugin", "no (valid, optional)", "TypeError"],
    ],
  );
}
