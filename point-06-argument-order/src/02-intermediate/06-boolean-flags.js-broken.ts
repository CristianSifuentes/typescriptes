// @ts-nocheck
/**
 * 06-boolean-flags — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * THE BOOLEAN TRAP.
 *
 * Two `boolean` parameters are the worst instance of the same-type blind spot,
 * for three compounding reasons:
 *
 *   1. Booleans carry the LEAST information per value. `true` at a call site
 *      says nothing about which flag it is.
 *   2. Boolean parameters are the ones most often written positionally, because
 *      each one feels too small to deserve an options object.
 *   3. Their effects are usually PERMISSIONS or DESTRUCTIVE ACTIONS — exactly
 *      the decisions where being wrong is expensive.
 *
 * A call like `createAccount(email, false, true)` is unreadable at the call
 * site AND unverifiable by the compiler. That combination is why "boolean trap"
 * has a name.
 *
 * DOMAIN: account provisioning and a file-sync tool.
 */

import { section, js, note, detonate, table, blank, warn } from "../99-runner/trace.js";

function createAccount(email, isActive, isAdmin) {
  return {
    email,
    status: isActive ? "active" : "disabled",
    role: isAdmin ? "administrator" : "member",
  };
}

function syncDirectory(path, deleteExtraneous, dryRun) {
  const action = deleteExtraneous ? "DELETE extraneous files" : "keep extraneous files";
  const mode = dryRun ? "(dry run — nothing written)" : "(LIVE — changes applied)";
  return `${path}: ${action} ${mode}`;
}

export function runBroken(): void {
  section("Two booleans, swapped");

  js("createAccount(email, true, false)   — an active regular member");
  detonate("account", () => JSON.stringify(createAccount("ada@example.com", true, false)));

  js("createAccount(email, false, true)   — the same two flags, exchanged");
  detonate("account", () => JSON.stringify(createAccount("ada@example.com", false, true)));
  warn(
    "A DISABLED ADMINISTRATOR. The intended account was an active member. " +
      "This is a privilege-boundary bug with no type error, no exception, and " +
      "no visible difference at the call site.",
  );

  blank();
  section("Now the destructive version");

  js("syncDirectory('/data', false, true)   — dry run, keep extraneous files");
  detonate("plan", () => syncDirectory("/data", false, true));

  js("syncDirectory('/data', true, false)   — the same two flags, exchanged");
  detonate("plan", () => syncDirectory("/data", true, false));
  warn(
    "The safe rehearsal became a live deletion. One transposition, no " +
      "diagnostic, and the failure mode is data loss rather than a wrong " +
      "number.",
  );

  blank();
  section("Why the call site cannot be read");

  js("what does this call do?");
  detonate("syncDirectory('/data', true, false)", () => "…you have to open the function to find out");
  note(
    "This is the readability half of the boolean trap, and it is independent " +
      "of the type system. A reviewer cannot verify the call without leaving " +
      "the file — so in practice they do not verify it.",
  );

  blank();
  section("It gets worse with more flags");

  detonate("a five-flag signature", () => {
    const permutations = (n) => (n <= 1 ? 1 : n * permutations(n - 1));
    return `syncDirectory(path, a, b, c, d, e) → ${permutations(5)} orderings, ${permutations(5) - 1} wrong`;
  });
  note(
    "And unlike numbers, booleans give no clue from their VALUES either: " +
      "`(true, false, true, true, false)` is unreadable in a way that " +
      "`(640, 480, 10, 20)` at least partially is not.",
  );

  blank();
  table(
    ["property", "boolean flags vs other same-typed swaps"],
    [
      ["information per value", "the least of any type — 1 bit"],
      ["readability at the call site", "zero without an IDE hint"],
      ["likelihood of positional style", "highest — each flag feels too small to name"],
      ["typical consequence", "permissions, deletions, live-vs-dry-run"],
      ["caught by the type checker", "no — both are `boolean`"],
    ],
  );
  note(
    "Booleans are the strongest case in the whole project for an OPTIONS " +
      "OBJECT (demo 08) rather than branding: `{ isActive: true, isAdmin: " +
      "false }` fixes the readability problem and the ordering problem in one " +
      "move, and a literal-union type fixes it even better.",
  );
}
