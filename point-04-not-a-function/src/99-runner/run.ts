/**
 * run.ts — the CLI: run a single demo by id.
 *
 * Usage (via npm, which builds first):
 *     npm run demo:09-call-signatures-hybrid
 *
 * Usage (directly, after `npm run build`):
 *     node dist/99-runner/run.js 09-call-signatures-hybrid
 *     node dist/99-runner/run.js --list
 */

import { banner, note, bad, table } from "./trace.js";
import { demos, findDemo } from "./registry.js";
import { runDemo } from "./run-demo.js";

function main(): void {
  const requested = process.argv[2];

  if (requested === undefined || requested === "--list") {
    banner("point-04-not-a-function", "Concept #4 — compile-time verification of callable invocation");
    table(
      ["id", "level", "granular feature"],
      demos.map((demo) => [demo.id, demo.level, demo.feature]),
    );
    note("Run one with:  npm run demo:<id>        e.g. npm run demo:10-overloads");
    note("Run them all:  npm run demo:all");
    note("See real tsc diagnostics:  npm run evidence");
    return;
  }

  const demo = findDemo(requested);
  if (!demo) {
    bad(`Unknown demo: ${requested}`);
    note(`Known ids: ${demos.map((d) => d.id).join(", ")}`);
    process.exitCode = 1;
    return;
  }

  runDemo(demo);
}

main();
