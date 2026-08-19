/**
 * 06-boolean-flags — THE TYPESCRIPT VERSION
 * ---------------------------------------------------------------------------
 * The third and last `.ts-safe` file that is not safe — and the one where the
 * blind spot is most dangerous, because `boolean` has only two inhabitants and
 * boolean parameters usually control permissions or destructive actions.
 *
 * This demo also previews the remedy that fits booleans best. For numbers and
 * identifiers, branding is usually right. For flags, the better move is almost
 * always to STOP USING BOOLEANS: a literal union carries the meaning in the
 * value itself, so the call site becomes readable AND the swap becomes a type
 * error — two problems, one change.
 */

import {
  section,
  ts,
  bad,
  good,
  warn,
  note,
  compilerSays,
  positionTrace,
  table,
  blank,
  detonate,
  compileTimeOnly,
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

interface Account {
  readonly email: string;
  readonly status: "active" | "disabled";
  readonly role: "administrator" | "member";
}

const createAccount = (email: string, isActive: boolean, isAdmin: boolean): Account => ({
  email,
  status: isActive ? "active" : "disabled",
  role: isAdmin ? "administrator" : "member",
});

const syncDirectory = (path: string, deleteExtraneous: boolean, dryRun: boolean): string =>
  `${path}: ${deleteExtraneous ? "DELETE extraneous" : "keep extraneous"} ` +
  `${dryRun ? "(dry run)" : "(LIVE)"}`;

// ---------------------------------------------------------------------------
// THE REMEDY, previewed: literal unions instead of booleans
// ---------------------------------------------------------------------------

type AccountStatus = "active" | "disabled";
type AccountRole = "administrator" | "member";

const createAccountTyped = (
  email: string,
  status: AccountStatus,
  role: AccountRole,
): Account => ({ email, status, role });

export function runSafe(): void {
  // =========================================================================
  // 1. THE SWAP, ACCEPTED
  // =========================================================================
  section("Two booleans, swapped, compiled");

  const intended = createAccount("ada@example.com", true, false);
  const swapped = createAccount("ada@example.com", false, true);

  proofBlock("both well-typed");
  proveType<Account>()(intended, "Account", "createAccount(email, isActive, isAdmin)");
  proveType<Account>()(swapped, "Account", "flags exchanged — still no error");

  blank();
  detonate("createAccount(email, true, false)", () => `${intended.status}/${intended.role}`);
  detonate("createAccount(email, false, true)", () => `${swapped.status}/${swapped.role}`);
  bad(
    "An active member became a DISABLED ADMINISTRATOR. A privilege-boundary " +
      "bug, compiled under `strict: true`, with no diagnostic.",
  );

  positionTrace([
    ["0", "email", "string", '"ada@…" (string)', "✔ assignable"],
    ["1", "isActive", "boolean", "false (boolean)", "✔ assignable — nothing to object to"],
    ["2", "isAdmin", "boolean", "true (boolean)", "✔ assignable — nothing to object to"],
  ]);

  blank();
  detonate("syncDirectory('/data', false, true)  — dry run", () =>
    syncDirectory("/data", false, true),
  );
  detonate("syncDirectory('/data', true, false)  — flags exchanged", () =>
    syncDirectory("/data", true, false),
  );
  bad("A safe rehearsal became a live deletion. Same silence, worse blast radius.");

  // =========================================================================
  // 2. WHY BOOLEANS ARE THE WORST CASE
  // =========================================================================
  blank();
  section("Why `boolean` is the worst same-typed parameter to have twice");

  table(
    ["property", "why it compounds the problem"],
    [
      ["1 bit of information", "the VALUE gives no clue which flag it is"],
      ["unreadable at the call site", "`f(x, true, false)` needs the definition to decode"],
      ["invites positional style", "each flag feels too small to deserve a name"],
      ["controls permissions / deletions", "the consequences are the expensive kind"],
      ["only two inhabitants", "a swap is always *valid*, never out of range"],
    ],
  );
  note(
    "    Compare with numbers: `cropTo(640, 480, 10, 20)` at least hints at " +
      "its own structure. `sync(path, true, false)` hints at nothing.",
  );

  // =========================================================================
  // 3. THE REMEDY THAT FITS FLAGS BEST
  // =========================================================================
  blank();
  section("Stop using booleans: a literal union fixes both problems at once");

  const typed = createAccountTyped("ada@example.com", "active", "member");
  proveType<Account>()(typed, "Account", 'createAccountTyped(email, "active", "member")');
  detonate("the call site now reads as English", () => `${typed.status}/${typed.role}`);

  ts('createAccountTyped(email, "member", "active")   // the same swap');
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type '"member"' is not assignable to
    // parameter of type 'AccountStatus'.
    const bogus = createAccountTyped("ada@example.com", "member", "active");
    void bogus;
  });
  compilerSays(
    "TS2345",
    "Argument of type '\"member\"' is not assignable to parameter of type 'AccountStatus'.",
    "The swap is now a TYPE ERROR, because `\"active\" | \"disabled\"` and " +
      "`\"administrator\" | \"member\"` are genuinely different types — no " +
      "branding needed. The literal values carry the meaning that `true` and " +
      "`false` could not.",
  );

  good(
    "This is the cheapest remedy in the entire project: no `Brand<T, K>`, no " +
      "smart constructors, no options object. Just stop encoding a domain " +
      "distinction as a bit.",
  );
  note(
    "    It also improves the call site for a human reader — " +
      "`createAccountTyped(email, \"active\", \"member\")` versus " +
      "`createAccount(email, true, false)` — which is the half of the boolean " +
      "trap that no type system was ever going to fix for you.",
  );

  // =========================================================================
  // 4. WHEN A LITERAL UNION IS NOT ENOUGH
  // =========================================================================
  blank();
  section("The limit of this remedy");

  warn(
    "Literal unions work when the two flags have DIFFERENT vocabularies. Two " +
      "genuinely boolean-shaped flags with the same vocabulary — say " +
      "`(dryRun: boolean, verbose: boolean)` — cannot be separated this way; " +
      "modelling them as `\"dry\" | \"live\"` and `\"quiet\" | \"verbose\"` is " +
      "the same trick, and if that reads as contortion, use an options object " +
      "(demo 08) instead.",
  );
  note(
    "    Rule of thumb for flags, in order of preference: " +
      "(1) a literal union if the vocabularies differ naturally; " +
      "(2) an options object if there are two or more flags; " +
      "(3) split the function — `syncDryRun()` and `syncLive()` — if the flag " +
      "selects fundamentally different behaviour. Branding is rarely the right " +
      "answer for booleans.",
  );
}
