// @ts-nocheck
/**
 * 02-write-typo — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * Writing to an absent key is just as legal as reading one — and worse: it
 * SUCCEEDS. The assignment does not fail, does not warn, and does not touch
 * the field you meant. It silently forks the object into two parallel
 * versions of the truth: the field you intended to update (untouched) and a
 * brand-new field nothing else in the program will ever read.
 *
 * DOMAIN: a "change my email" form handler.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function loadUser() {
  return {
    id: "u-501",
    name: "Ada Lovelace",
    email: "ada@old-domain.com",
  };
}

export function runBroken(): void {
  const user = loadUser();

  section("Writing to a misspelled property");

  js('user.emial = "ada@new-domain.com"  — the field is called "email"');
  detonate("assignment", () => {
    user.emial = "ada@new-domain.com";
    return `email=${user.email}, emial=${user.emial}`;
  });
  note(
    "The object now carries BOTH 'email' (still the OLD address) and a brand " +
      "new 'emial' (the NEW address). Neither is wrong on its own — the object " +
      "is just quietly lying about which one is current.",
  );

  blank();
  js("sendConfirmation(user.email)  — every reader still uses the real field");
  detonate("sendConfirmation(user.email)", () => `confirmation sent to ${user.email}`);
  runtimeSays(
    "no error at all",
    "The confirmation goes to the OLD address. The update the user requested " +
      "never took effect, and nothing in the program can tell — 'emial' just " +
      "sits there, an orphaned field no code path reads.",
  );

  blank();
  section("The two versions of the truth this typo created");
  table(
    ["field", "value", "who reads it"],
    [
      ["email", "ada@old-domain.com", "every existing call site"],
      ["emial", "ada@new-domain.com", "nobody — the typo'd field has no readers"],
    ],
  );
  note(
    "This is strictly worse than the read-typo case: there, at least the bug " +
      "is discoverable the moment something touches the undefined value. Here, " +
      "the write SUCCEEDS, so nothing ever throws. The only symptom is a user " +
      "asking why their email change did not take effect.",
  );
}
