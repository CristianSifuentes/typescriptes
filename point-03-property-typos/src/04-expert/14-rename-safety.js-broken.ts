// @ts-nocheck
/**
 * 14-rename-safety — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A field gets renamed in ONE place (the object literal that produces it),
 * but JavaScript has no REFERENCE GRAPH connecting that literal to every
 * place that reads one of its keys. Each call site is an independent,
 * unconnected guess about what the object contains — renaming breaks all of
 * them simultaneously, and JavaScript surfaces that fact nowhere.
 *
 * DOMAIN: a user record whose 'id' field was renamed to 'userId' in a schema
 * migration — but only in the place that PRODUCES the object, not (yet) in
 * the several places that CONSUME it.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

// The field was renamed HERE...
function loadUser() {
  return { userId: "u-77", name: "Hedy Lamarr", email: "hedy@example.com" };
}

// ...but these three call sites were written against the OLD name and were
// never updated. Nothing connects them to the rename.
function summarize(user) {
  return `${user.id}: ${user.name}`;
}
function auditLog(user) {
  return `audit:${user.id}`;
}
function greet(user) {
  return `Hi, ${user.name}`; // does not use 'id' — unaffected, coincidentally
}

export function runBroken(): void {
  const user = loadUser();

  section("Three call sites, one of them silently broken by a rename");

  js("summarize(user)");
  detonate("summarize(user)", () => summarize(user));

  blank();
  js("auditLog(user)");
  detonate("auditLog(user)", () => auditLog(user));

  blank();
  js("greet(user)  — happens not to touch the renamed field");
  detonate("greet(user)", () => greet(user));

  blank();
  runtimeSays(
    "no error anywhere",
    "'summarize' and 'auditLog' both silently produce 'undefined: Hedy " +
      "Lamarr' and 'audit:undefined'. Nothing links the rename in loadUser() " +
      "to the two call sites that still say '.id' — each one has to be found " +
      "by a human, one at a time, usually by noticing broken output.",
  );

  blank();
  table(
    ["call site", "uses the renamed field?", "still correct after the rename?"],
    [
      ["summarize", "yes ('.id')", "no — silently wrong"],
      ["auditLog", "yes ('.id')", "no — silently wrong"],
      ["greet", "no", "yes, by luck"],
    ],
  );
}
