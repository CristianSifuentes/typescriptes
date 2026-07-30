/**
 * 01-read-typo — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `interface User` turns "the fields I have in mind" into a checkable
 * PROPERTY MAP (see 00-foundations/manifesto.md §1). `user.nam` is a READ
 * against that map: the compiler looks up `"nam"` as a key, does not find
 * it, and rejects the expression before a single line of JavaScript is
 * emitted.
 */

import { section, ts, good, compilerSays, table, blank, shapeTrace } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

function loadUser(): User {
  return { id: "u-501", name: "Ada Lovelace", email: "ada@example.com" };
}

export function runSafe(): void {
  const user = loadUser();

  section("The property map the compiler checks every access against");
  shapeTrace([["User", "id, name, email", "interface User (this file)"]]);
  good(
    "This is also, verbatim, the list the editor's autocomplete pop-up shows " +
      "after `user.` — completion and error-checking are two views of the same " +
      "table.",
  );

  blank();
  section("Reading a misspelled property");

  ts("user.nam");
  // @ts-expect-error TS2551: Property 'nam' does not exist on type 'User'.
  // Did you mean 'name'?
  const misread = user.nam;
  void misread;
  compilerSays(
    "TS2551",
    "Property 'nam' does not exist on type 'User'. Did you mean 'name'?",
    "The suggestion is not decoration: the compiler computed the edit distance " +
      "between 'nam' and every key in the property map, and 'name' was closest. " +
      "The fix is delivered inside the error.",
  );

  blank();
  ts("user.username  — not close to any real key");
  // @ts-expect-error TS2339: Property 'username' does not exist on type 'User'.
  const nonExistent = user.username;
  void nonExistent;
  compilerSays(
    "TS2339",
    "Property 'username' does not exist on type 'User'.",
    "No suggestion this time — 'username' is not close enough to any member of " +
      "the property map for the compiler to guess what you meant.",
  );

  blank();
  section("The program that compiles");
  const greeting = `Welcome, ${user.name}!`;
  proveType<string>()(greeting, "string", "user.name is a declared, non-optional member");
  good(`"${greeting}" — no undefined, no TypeError, ever.`);

  blank();
  table(
    ["expression", "JavaScript outcome", "TypeScript diagnostic"],
    [
      ["user.nam", 'undefined → "Welcome, undefined!"', "TS2551 (spelling suggested)"],
      ["user.username", "undefined → silent", "TS2339 (no suggestion)"],
      ["user.nam.toUpperCase()", "TypeError, downstream", "never reached — rejected at user.nam"],
    ],
  );
}
