// @ts-nocheck
/**
 * 17-function-vs-precise-signatures — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A plugin hook registry that stores "some callback" per plugin, without
 * distinguishing WHICH arguments each callback actually expects. JavaScript
 * calls whatever is stored with whatever arguments happen to be at hand —
 * argument count and type are never verified against what the function was
 * actually written to accept.
 *
 * DOMAIN: a plugin system's `onSave` hook, called with the document being
 * saved.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function runHook(hook, doc) {
  return hook(doc);
}

export function runBroken(): void {
  section("A hook written for the actual call shape");

  const wordCountHook = (doc) => `word count: ${doc.text.split(" ").length}`;
  js('runHook(wordCountHook, { text: "hello world" })');
  detonate("runHook(wordCountHook, doc)", () =>
    runHook(wordCountHook, { text: "hello world" }),
  );

  blank();
  section("A hook copy-pasted from a DIFFERENT registry, with a different call shape");

  // This hook was written for a registry that calls hooks with NO
  // arguments (e.g. an 'onStartup' hook) and copy-pasted into the 'onSave'
  // registry, which always calls hooks with the document.
  const startupStyleHook = () => {
    const doc = getCurrentDocument(); // reads global state instead of a parameter
    return doc.text.length;
  };

  function getCurrentDocument() {
    return undefined; // simulates "no current document" during a save hook
  }

  js("runHook(startupStyleHook, currentDoc)");
  detonate("runHook(startupStyleHook, doc)", () =>
    runHook(startupStyleHook, { text: "hello world" }),
  );
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'text')",
    "'startupStyleHook' ignores the argument 'runHook' passes it and reads " +
      "global state instead — state that isn't set up the way this hook " +
      "assumes during a save. Nothing about REGISTERING this hook checked " +
      "that it was written for the right call shape.",
  );

  blank();
  table(
    ["hook", "expects an argument?", "runHook(hook, doc) outcome"],
    [
      ["wordCountHook", "yes — reads doc.text", "works"],
      ["startupStyleHook", "no — reads global state", "TypeError"],
    ],
  );
}
