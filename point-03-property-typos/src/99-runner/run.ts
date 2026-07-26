/**
 * run.ts — the CLI: run a single demo by id.
 *
 * Usage (via npm, which builds first):
 *     npm run demo:03-excess-property
 *
 * Usage (directly, after `npm run build`):
 *     node dist/99-runner/run.js 03-excess-property
 *     node dist/99-runner/run.js --list
 */

import { banner, note, bad, table } from "./trace.js";
import { demos, findDemo } from "./registry.js";
import { runDemo } from "./run-demo.js";

function main(): void {
  const requested = process.argv[2];

  if (requested === undefined || requested === "--list") {
    banner("point-03-property-typos", "Concept #3 — compile-time verification of property names");
    table(
      ["id", "level", "granular feature"],
      demos.map((demo) => [demo.id, demo.level, demo.feature]),
    );
    note("Run one with:  npm run demo:<id>        e.g. npm run demo:08-structural-typing");
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
