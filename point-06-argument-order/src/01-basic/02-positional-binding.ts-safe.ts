/**
 * 02-positional-binding — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * TypeScript does not change the calling convention. Binding is still purely
 * positional at runtime — erasure guarantees that. What TypeScript adds is a
 * CHECK over the same positions, performed before the program runs.
 *
 * This demo walks the four places where positions interact with something else:
 * arity, optional parameters, rest parameters, and spreads. Each is a place
 * where people expect the rules to bend, and none of them do.
 */

import {
  section,
  ts,
  good,
  note,
  warn,
  compilerSays,
  positionTrace,
  table,
  blank,
  detonate,
  compileTimeOnly,
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

interface Job {
  readonly name: string;
  readonly runAt: Date;
  readonly retries: number;
  readonly tags: readonly string[];
}

function scheduleJob(name: string, runAt: Date, retries = 3, ...tags: string[]): Job {
  return { name, runAt, retries, tags };
}

export function runSafe(): void {
  // =========================================================================
  // 1. ARITY
  // =========================================================================
  section("Arity: the position must exist before it can be checked");

  ts("scheduleJob('sync')   // runAt is required");
  compileTimeOnly(() => {
    // @ts-expect-error TS2555: Expected at least 2 arguments, but got 1.
    const short = scheduleJob("sync");
    void short;
  });
  compilerSays(
    "TS2555",
    "Expected at least 2 arguments, but got 1.",
    "Note the CODE. Because `tags` is a rest parameter the signature has no " +
      "upper bound, so the compiler emits TS2555 ('at least N') rather than " +
      "the more familiar TS2554 ('expected N'). A fixed-arity signature gives " +
      "TS2554. Same defect, two codes, decided by whether the parameter list " +
      "is bounded — the kind of detail that is worth checking against the " +
      "compiler rather than assuming.",
  );

  // =========================================================================
  // 2. OPTIONAL PARAMETERS ARE STILL POSITIONAL
  // =========================================================================
  blank();
  section("Optional parameters do not let you skip a position");

  ts("scheduleJob('sync', new Date(), 'urgent')   // meaning: skip retries, pass a tag");
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'string' is not assignable to parameter
    // of type 'number'.
    const misplaced = scheduleJob("sync", new Date(), "urgent");
    void misplaced;
  });
  compilerSays(
    "TS2345",
    "Argument of type 'string' is not assignable to parameter of type 'number'.",
    "A common and reasonable expectation: 'I don't need `retries`, so my tag " +
      "should slide into the rest parameter.' It does not. Position 2 is " +
      "`retries` whether you wanted it or not. To skip it you must pass it — " +
      "`scheduleJob('sync', d, 3, 'urgent')` — or use an options object " +
      "(demo 08), where skipping a field is what optionality actually means.",
  );

  // =========================================================================
  // 3. SPREADS
  // =========================================================================
  blank();
  section("Spreads: an array is not a position list, a tuple is");

  const looseArgs = ["sync", new Date()];
  ts("scheduleJob(...looseArgs)   // looseArgs: (string | Date)[]");
  compileTimeOnly(() => {
    // @ts-expect-error TS2556: A spread argument must either have a tuple type or be
    // passed to a rest parameter.
    const spread = scheduleJob(...looseArgs);
    void spread;
  });
  compilerSays(
    "TS2556",
    "A spread argument must either have a tuple type or be passed to a rest parameter.",
    "An array's LENGTH is only known as `number` and its element type is the " +
      "union of everything in it, so the compiler cannot map array indices " +
      "onto parameter positions. It refuses rather than guessing.",
  );

  const goodTuple: [string, Date] = ["sync", new Date("2026-03-01")];
  const badTuple: [Date, string] = [new Date("2026-03-01"), "sync"];

  proofBlock("a tuple DOES carry positions");
  proveType<[string, Date]>()(goodTuple, "[string, Date]", "length and per-index types known");

  ts("scheduleJob(...badTuple)   // badTuple: [Date, string]");
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'Date' is not assignable to parameter
    // of type 'string'.
    const spread = scheduleJob(...badTuple);
    void spread;
  });
  compilerSays(
    "TS2345",
    "Argument of type 'Date' is not assignable to parameter of type 'string'.",
    "Element *i* of the tuple is checked against parameter *i* — the identical " +
      "rule, applied through the spread. This is why the JavaScript twin's " +
      "'build the array in one file, spread it in another' bug is closed here: " +
      "the tuple type carries the ordering across the file boundary.",
  );

  // =========================================================================
  // 4. THE POSITION TABLE
  // =========================================================================
  blank();
  section("What the compiler demands at each position of `scheduleJob`");
  positionTrace([
    ["0", "name", "string", "required", "checked"],
    ["1", "runAt", "Date", "required", "checked"],
    ["2", "retries", "number", "has a default ⇒ optional", "checked if present"],
    ["3+", "...tags", "string[]", "rest", "each surplus argument checked"],
  ]);
  note(
    "    Read the third row carefully: 'optional' means the ARGUMENT may be " +
      "omitted, never that the POSITION may be reused for something else.",
  );

  // =========================================================================
  // 5. THE PROGRAM THAT COMPILES
  // =========================================================================
  blank();
  section("The correct calls");

  const job = scheduleJob("sync", new Date("2026-03-01T02:00:00Z"), 5, "nightly", "critical");
  const withDefault = scheduleJob("cleanup", new Date("2026-03-01T03:00:00Z"));
  const viaTuple = scheduleJob(...goodTuple);

  proveType<Job>()(job, "Job", "all positions satisfied");
  proveType<number>()(withDefault.retries, "number", "the default filled position 2");

  blank();
  detonate("explicit", () => `${job.name} r=${job.retries} tags=${job.tags.join("/")}`);
  detonate("defaulted", () => `${withDefault.name} r=${withDefault.retries}`);
  detonate("spread from a tuple", () => viaTuple.name);

  blank();
  table(
    ["situation", "JavaScript", "TypeScript", "code"],
    [
      ["missing argument", "binds `undefined`", "rejected", "TS2555 (rest) / TS2554"],
      ["surplus argument", "collected, ignored", "rejected (no rest param)", "TS2554"],
      ["optional skipped by sliding", "silently misbinds", "rejected", "TS2345"],
      ["spread of an array", "whatever order it had", "rejected", "TS2556"],
      ["spread of a wrong tuple", "whatever order it had", "rejected per element", "TS2345"],
    ],
  );

  good(
    "Every row of that table is the SAME rule — argument *i* against parameter " +
      "*i* — reached by a different syntactic route.",
  );
  warn(
    "And every row still depends on the two types disagreeing. `scheduleJob` " +
      "survives scrutiny here only because `string` and `Date` are different. " +
      "Demo 04 removes that luxury.",
  );
}
