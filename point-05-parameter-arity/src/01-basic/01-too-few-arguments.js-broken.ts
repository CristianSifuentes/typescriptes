// @ts-nocheck
/**
 * 01-too-few-arguments — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A greeting helper that needs a name. JavaScript never verifies that a call
 * supplies every declared parameter — a missing argument just becomes
 * `undefined` inside the function body, and the function runs to completion
 * anyway, producing a wrong-but-not-crashing result.
 *
 * DOMAIN: a welcome-message generator used across a signup flow.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function greet(name) {
  return `Hello, ${name.toUpperCase()}!`;
}

export function runBroken(): void {
  section("Calling with the argument it needs");

  js('greet("Ada")');
  detonate('greet("Ada")', () => greet("Ada"));

  blank();
  section("Calling with NO arguments at all");

  // A refactor removed the caller's access to a user's name (maybe the
  // signup step was reordered) and nobody updated this call site.
  js("greet()");
  detonate("greet()", () => greet());
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'toUpperCase')",
    "'name' was never bound to anything — JavaScript filled the missing " +
      "argument slot with 'undefined' and let the call proceed. The " +
      "function ran, right up until it tried to use the missing value.",
  );

  blank();
  table(
    ["call", "name inside greet()", "outcome"],
    [
      ['greet("Ada")', '"Ada"', "returns 'Hello, ADA!'"],
      ["greet()", "undefined", "TypeError, three lines into the function body"],
    ],
  );
  note(
    "Nothing about CALLING 'greet()' failed — the crash is deferred to " +
      "whatever the function body happens to do with the missing argument, " +
      "which might not even be the first line that touches it.",
  );
}
