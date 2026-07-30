/**
 * run-demo.ts — render one demo: the JavaScript half, then the TypeScript half.
 *
 * Kept separate from `run.ts` (the CLI) so that `run-all.ts` can reuse it
 * without triggering the CLI's argument parsing on import.
 */

import { banner, section, note, bad, colors, blank } from "./trace.js";
import type { Demo } from "./registry.js";

export function runDemo(demo: Demo): void {
  banner(
    `DEMO ${demo.id} — ${demo.title}`,
    `${demo.level}  ·  ${demo.feature}`,
  );

  blank();
  console.log(
    `  ${colors.yellow}${colors.bold}PART 1 — JAVASCRIPT${colors.reset}` +
      `${colors.grey}  (@ts-nocheck: the type checker is switched off)${colors.reset}`,
  );
  console.log(`  ${colors.grey}${"═".repeat(76)}${colors.reset}`);
  try {
    demo.broken();
  } catch (error: unknown) {
    // A .js-broken demo is allowed to escape with an exception; that is the
    // point. Report it rather than aborting the run.
    bad(
      `the JavaScript half terminated with an uncaught error: ` +
        `${error instanceof Error ? error.message : String(error)}`,
    );
  }

  blank();
  blank();
  console.log(
    `  ${colors.blue}${colors.bold}PART 2 — TYPESCRIPT${colors.reset}` +
      `${colors.grey}  (strict: true; every error below was caught before this program ran)${colors.reset}`,
  );
  console.log(`  ${colors.grey}${"═".repeat(76)}${colors.reset}`);
  demo.safe();

  blank();
  section("Diagnostics demonstrated by this demo");
  note(demo.codes.join("  ·  "));
  note("Run `npm run evidence` to see them emitted by tsc, unsuppressed.");
  blank();
}
