/**
 * 14-rename-safety — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * Every `.` access checked in this project is, from the compiler's point of
 * view, a NODE in a REFERENCE GRAPH rooted at the type's declaration. When
 * `interface UserV2` declares 'userId' instead of 'id', every access to
 * '.id' anywhere in the program — however many call sites, however many
 * files — is simultaneously and independently invalidated, because each one
 * was always just a lookup against the SAME property map, re-run.
 *
 * A rename is not a special operation the checker performs; it is an
 * ordinary edit to one declaration whose consequences ripple through
 * already-existing checks, all of which fire the next time the project
 * compiles.
 *
 * `satisfies` closes a related gap: it validates a literal against a shape
 * WITHOUT widening the literal's own inferred type — useful the moment a
 * rename or a typo needs to be caught in a config object whose exact literal
 * values (not just their general type) matter downstream.
 */

import { section, ts, good, note, compilerSays, table, blank, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface UserV2 {
  readonly userId: string; // renamed from 'id'
  readonly name: string;
  readonly email: string;
}

function loadUser(): UserV2 {
  return { userId: "u-77", name: "Hedy Lamarr", email: "hedy@example.com" };
}

function summarize(user: UserV2): string {
  return `${user.userId}: ${user.name}`;
}
function auditLog(user: UserV2): string {
  return `audit:${user.userId}`;
}

export function runSafe(): void {
  const user = loadUser();

  // =========================================================================
  // 1. The rename, propagated through the reference graph
  // =========================================================================
  section("Every correctly-updated call site: still one property-map lookup each");

  good(`summarize(user)  = "${summarize(user)}"`);
  good(`auditLog(user)   = "${auditLog(user)}"`);

  blank();
  section("A call site that ESCAPED the rename — caught the moment it compiles");

  ts("function legacyExport(user: UserV2) { return user.id; }");
  compileTimeOnly(() => {
    function legacyExport(u: UserV2): string {
      // @ts-expect-error TS2339: Property 'id' does not exist on type 'UserV2'.
      return u.id;
    }
    void legacyExport;
  });
  compilerSays(
    "TS2339",
    "Property 'id' does not exist on type 'UserV2'.",
    "No suggestion this time — 'id' is too short relative to 'userId' for the " +
      "spelling pass to connect them confidently. But the FAILURE itself is " +
      "unconditional: this call site, and every other one still saying " +
      "'.id', breaks the instant 'UserV2' is edited — not eventually, not " +
      "when someone happens to run that code path, but at the very next " +
      "compile.",
  );

  note(
    "This is rename SAFETY, not rename magic: the compiler does not know you " +
      "intended a rename. It knows that 'id' is not a key of 'UserV2', which " +
      "is exactly as true for a leftover old call site as it is for a typo — " +
      "the same mechanism (member resolution, demo 01) produces both " +
      "'protections' for free.",
  );

  // =========================================================================
  // 2. `satisfies` — shape-checked, without widening the literal
  // =========================================================================
  blank();
  section("satisfies: validate the shape, keep the literal type");

  type Theme = "light" | "dark" | "system";
  interface AppConfig {
    readonly theme: Theme;
    readonly retries: number;
  }

  const viaAnnotation: AppConfig = { theme: "dark", retries: 3 };
  proveType<Theme>()(viaAnnotation.theme, "Theme", "widened to the full union — 'dark' specifically is lost");

  const viaSatisfies = { theme: "dark", retries: 3 } satisfies AppConfig;
  proveType<"dark">()(
    viaSatisfies.theme,
    '"dark"',
    "the LITERAL type is preserved — satisfies checks the shape without widening",
  );

  good(
    "Same shape check, same excess/missing-property protection as ': AppConfig' " +
      "— but 'viaSatisfies.theme' stays exactly '\"dark\"', which matters when " +
      "downstream code (e.g. a discriminated union, demo 08's cousin) needs " +
      "the specific literal, not just 'some Theme'.",
  );

  blank();
  ts('{ theme: "dark", reties: 3 } satisfies AppConfig  — "retries" misspelled');
  compileTimeOnly(() => {
    // @ts-expect-error TS2561: Object literal may only specify known
    // properties, but 'reties' does not exist in type 'AppConfig'. Did you
    // mean to write 'retries'?
    const badConfig = { theme: "dark", reties: 3 } satisfies AppConfig;
    void badConfig;
  });
  compilerSays(
    "TS2561",
    "Object literal may only specify known properties, but 'reties' does not exist in type 'AppConfig'. Did you mean to write 'retries'?",
    "`satisfies` still runs excess-property checking on the fresh literal — " +
      "it changes what TYPE the expression ends up with, never whether its " +
      "shape gets validated.",
  );

  blank();
  table(
    ["mechanism", "checks the shape?", "keeps the literal type?"],
    [
      [": AppConfig (annotation)", "yes", "no — widened to the declared field types"],
      ["satisfies AppConfig", "yes — identically", "yes"],
      ["no check at all", "no", "yes, but unprotected"],
    ],
  );
}
