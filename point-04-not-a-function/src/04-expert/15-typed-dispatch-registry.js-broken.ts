// @ts-nocheck
/**
 * 15-typed-dispatch-registry — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A command dispatcher for a text editor: each command name maps to a
 * handler function. New commands get added to the map over time; nothing
 * stops a caller (or a keybinding config, or a menu item) from referencing a
 * command name that was never registered — or that was renamed/removed in a
 * later refactor.
 *
 * DOMAIN: an editor's command palette, dispatching by command id.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

const commands = {
  "editor.save": () => "saved",
  "editor.undo": () => "undid last change",
};

function dispatch(commandId) {
  return commands[commandId](); // no check that commandId is a known key
}

export function runBroken(): void {
  section("Dispatching a command that is registered");

  js('dispatch("editor.save")');
  detonate('dispatch("editor.save")', () => dispatch("editor.save"));

  blank();
  section("A keybinding referencing a command that was renamed");

  // 'editor.redo' was renamed to 'editor.redoLastChange' in a refactor; this
  // keybinding config (loaded from a JSON file, or hardcoded elsewhere) was
  // never updated.
  js('dispatch("editor.redo")');
  detonate('dispatch("editor.redo")', () => dispatch("editor.redo"));
  runtimeSays(
    "TypeError: commands[commandId] is not a function",
    "'commands' has no \"editor.redo\" key — it was renamed. The lookup " +
      "returns 'undefined', and 'undefined()' crashes wherever the user's " +
      "keybinding happens to fire, far from the refactor that caused it.",
  );

  blank();
  table(
    ["commandId", "commands[commandId]", "outcome"],
    [
      ['"editor.save"', "a function", "works"],
      ['"editor.redo"', "undefined — key was renamed away", "TypeError"],
    ],
  );
}
