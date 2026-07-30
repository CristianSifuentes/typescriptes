// @ts-nocheck
/**
 * 03-excess-property — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A signup form handler builds a new user object literal by hand. A typo in
 * one of the field names (`emial` instead of `email`) is, again, completely
 * legal: the literal just has an extra key nobody asked for, and is missing
 * the key everybody downstream actually reads.
 *
 * DOMAIN: turning a signup form's fields into a stored user record.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function createUser(id, name, emial) {
  // Notice the typo has already leaked into the PARAMETER name — nothing
  // flags it, because nothing anywhere declares what a "user" is supposed
  // to contain.
  return { id, name, emial };
}

export function runBroken(): void {
  section("Building a new record from a typo'd literal");

  js('createUser("u-9", "Grace Hopper", "grace@example.com")');
  const user = createUser("u-9", "Grace Hopper", "grace@example.com");
  detonate("the stored record", () => user);
  note(
    "The object has 'id', 'name', and 'emial' — NOT 'email'. It looks complete " +
      "at a glance; nothing about it screams 'missing field'.",
  );

  blank();
  js("sendWelcomeEmail(user.email)  — every reader expects 'email'");
  detonate("sendWelcomeEmail(user.email)", () => `sending welcome email to: ${user.email}`);
  runtimeSays(
    "no error at all",
    'The function receives undefined and proceeds anyway: "sending welcome ' +
      'email to: undefined". No exception, no signup failure — the welcome ' +
      "email for Grace simply never goes anywhere.",
  );

  blank();
  section("What the object actually contains vs what was intended");
  table(
    ["intended field", "actually present?", "actually present instead"],
    [
      ["id", "yes", "—"],
      ["name", "yes", "—"],
      ["email", "NO", "'emial' (unused, orphaned)"],
    ],
  );
  note(
    "This is the construction-time version of the write-typo bug: the object " +
      "is wrong from the moment it is BORN, and nothing about creating it " +
      "signals that.",
  );
}
