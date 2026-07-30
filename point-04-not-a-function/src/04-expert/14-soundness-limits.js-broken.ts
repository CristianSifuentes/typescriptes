// @ts-nocheck
/**
 * 14-soundness-limits — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A plugin's configuration arrives as JSON — over the network, from a config
 * file, from environment variables. `onInit` is DOCUMENTED as an optional
 * lifecycle callback, but JSON has no function type: whoever wrote the
 * config file can put a string there instead, and nothing before runtime
 * will ever notice.
 *
 * DOMAIN: a plugin loader reading its configuration from a JSON file.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function loadPlugin(rawJson) {
  const config = JSON.parse(rawJson);
  config.onInit(); // trusts the JSON blindly
  return config;
}

export function runBroken(): void {
  section("A correctly authored config file");

  js('loadPlugin(\'{"onInit": ...}\')  — onInit omitted from JSON, so this uses a real function assembled in code');
  const goodConfig = { onInit: () => "initialized" };
  detonate("goodConfig.onInit()", () => goodConfig.onInit());

  blank();
  section("A config file with a typo'd field TYPE — still valid JSON");

  // Perfectly valid JSON — a human just put the WRONG KIND of value in a
  // field whose name suggests a callback.
  const rawJson = JSON.stringify({ name: "analytics-plugin", onInit: "run on startup" });

  js(`loadPlugin('${rawJson}')`);
  detonate(`loadPlugin(rawJson)`, () => loadPlugin(rawJson));
  runtimeSays(
    "TypeError: config.onInit is not a function",
    "JSON.parse happily produced { name: '...', onInit: 'run on startup' } " +
      "— a STRING where a callback was documented. Nothing in the JSON " +
      "format itself, or in 'JSON.parse', can express or check 'onInit " +
      "must be callable' — that information exists only in a comment.",
  );

  blank();
  table(
    ["onInit field in JSON", "JSON.parse result", "config.onInit()"],
    [
      ["(assembled in code, a real function)", "function", "works"],
      ['"run on startup" (string)', "string", "TypeError"],
    ],
  );
}
