/**
 * 02-write-typo — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * A WRITE is checked against the same property map as a READ, with one extra
 * condition: the value assigned must itself be assignable to the type the
 * map promises for that key. Assigning to a key the map does not list is
 * rejected before assigning to a key with the wrong value type is even
 * considered — there is no key to check the value against.
 */

import { section, ts, good, compilerSays, table, blank, shapeTrace } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface User {
  id: string;
  name: string;
  email: string;
}

function loadUser(): User {
  return { id: "u-501", name: "Ada Lovelace", email: "ada@old-domain.com" };
}

export function runSafe(): void {
  const user = loadUser();

  section("The property map bounds writes exactly as it bounds reads");
  shapeTrace([["User", "id, name, email", "interface User (this file)"]]);

  blank();
  ts('user.emial = "ada@new-domain.com";');
  // @ts-expect-error TS2551: Property 'emial' does not exist on type 'User'.
  // Did you mean 'email'?
  user.emial = "ada@new-domain.com";
  compilerSays(
    "TS2551",
    "Property 'emial' does not exist on type 'User'. Did you mean 'email'?",
    "In JavaScript this assignment CREATES the property, forking the object " +
      "into two versions of the truth. TypeScript's shape is CLOSED to writes: " +
      "you may assign only to a key the property map already lists — and the " +
      "spelling-suggestion pass runs on write targets exactly as it does on reads.",
  );

  blank();
  ts('user.email = 42;  — right key, wrong value type');
  // @ts-expect-error TS2322: Type 'number' is not assignable to type 'string'.
  user.email = 42;
  compilerSays(
    "TS2322",
    "Type 'number' is not assignable to type 'string'.",
    "A DIFFERENT diagnostic for a DIFFERENT failure: the key exists, but the " +
      "value being assigned does not match what the map promises for it. Note " +
      "the two checks are independent — a wrong key is TS2339/TS2551 " +
      "regardless of the value's type; a wrong value is TS2322 only once the " +
      "key is valid.",
  );

  blank();
  section("The correct write, and what it proves");
  user.email = "ada@new-domain.com";
  proveType<string>()(user.email, "string", "the only key 'email' can ever hold");
  good(`user.email is now "${user.email}" — one field, one truth, no fork.`);

  blank();
  table(
    ["assignment", "JavaScript outcome", "TypeScript diagnostic"],
    [
      ["user.emial = x", "creates a second, parallel field", "TS2551 — key not in the property map (spelling suggested)"],
      ["user.email = 42", "silently coerces on later read", "TS2322 — value type mismatch"],
      ["user.email = x (string)", "updates the one true field", "no diagnostic — both checks pass"],
    ],
  );
}
