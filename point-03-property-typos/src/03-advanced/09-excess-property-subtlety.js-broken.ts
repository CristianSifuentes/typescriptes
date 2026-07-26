// @ts-nocheck
/**
 * 09-excess-property-subtlety — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A legacy import script produces draft records that still carry an old,
 * misspelled duplicate of 'email' (`emial`) alongside the real field — a
 * leftover from a bug that was fixed in the writer but never cleaned from
 * already-stored drafts. In JavaScript, whether you build the record
 * directly or read it from a variable makes NO difference whatsoever: both
 * are just objects, and the stray key rides along either way.
 *
 * DOMAIN: importing legacy user drafts into the current user store.
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

function loadLegacyDraft() {
  // A record straight from the old system: correct 'email', PLUS the old,
  // misspelled 'emial' nobody ever deleted.
  return { id: "u-42", name: "Radia Perlman", email: "radia@example.com", emial: "radia@example.com" };
}

export function runBroken(): void {
  section("Building the record directly (inline) vs via a variable");

  js('const direct = { id, name, email, emial }  — written inline');
  const direct = { id: "u-42", name: "Radia Perlman", email: "radia@example.com", emial: "radia@example.com" };
  detonate("direct", () => direct);

  js("const viaVariable = loadLegacyDraft()  — read from elsewhere");
  const viaVariable = loadLegacyDraft();
  detonate("viaVariable", () => viaVariable);

  note("Identical objects, identical stray 'emial' key, in both cases. JavaScript makes no distinction.");

  blank();
  section("The stray key is dormant, until someone reads it by accident");

  js('someLegacyCodePath(user.emial)  — an old call site nobody deleted');
  detonate("someLegacyCodePath(user.emial)", () => `read: ${direct.emial}`);
  note(
    "That old code path still reads 'emial' and gets a real-looking value — " +
      "today it happens to match 'email', but nothing enforces that the two " +
      "stay in sync if only one of them is ever updated again.",
  );

  blank();
  table(
    ["construction style", "stray key present?", "flagged by anything?"],
    [
      ["inline literal", "yes", "no"],
      ["via intermediate variable", "yes", "no"],
    ],
  );
}
