/**
 * 17-function-vs-precise-signatures — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * TypeScript's built-in `Function` type describes "any callable value" with
 * the signature `(...args: any[]) => any` — callable, but with EVERY
 * argument and the return value typed `any`. It closes demo 01–04's holes
 * (something with no call signature at all) but reopens demo 07's (an
 * argument, or here a whole callback, of the wrong SHAPE) because `any`
 * checks nothing. A precise call-signature type — `Hook = (doc: Document)
 * => string` — closes both at once.
 */

import { section, ts, good, warn, note, compilerSays, table, blank, callableTrace, compileTimeOnly, detonate, runtimeSays } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface Doc {
  readonly text: string;
}

export function runSafe(): void {
  section("Hole: the wide `Function` type compiles a wrong-shaped hook");

  function runHookWide(hook: Function, doc: Doc): unknown {
    return hook(doc);
  }

  const startupStyleHook = (): number => 42; // wrong shape: ignores its argument entirely
  ts("runHookWide(startupStyleHook, doc)  — `hook: Function` accepts ANY callable, unchecked");
  callableTrace([
    ["hook", "Function", "(...args: any[]) => any", "callable, but EVERY argument and the return type are `any`"],
  ]);
  detonate("runHookWide(startupStyleHook, { text: 'hello world' })", () =>
    runHookWide(startupStyleHook, { text: "hello world" }),
  );
  runtimeSays(
    "(no crash here, worse: silently wrong)",
    "`Function` let 'startupStyleHook' register even though it takes NO " +
      "parameters and returns a `number`, not the `string` summary every " +
      "other hook returns. Nothing in `runHookWide`'s type stops the wrong " +
      "shape from compiling — the mistake propagates as a bad VALUE instead " +
      "of failing loudly, which is frequently worse than a crash.",
  );

  blank();
  section("The fix: a precise call signature instead of `Function`");

  type Hook = (doc: Doc) => string;

  function runHook(hook: Hook, doc: Doc): string {
    return hook(doc);
  }

  const wordCountHook: Hook = (doc) => `word count: ${doc.text.split(" ").length}`;

  ts("const brokenHook: Hook = startupStyleHook  — () => number, not (doc: Doc) => string");
  compileTimeOnly(() => {
    // @ts-expect-error TS2322: Type '() => number' is not assignable to
    // type 'Hook'. Type 'number' is not assignable to type 'string'.
    const brokenHook: Hook = startupStyleHook;
    void brokenHook;
  });
  compilerSays(
    "TS2322",
    "Type '() => number' is not assignable to type 'Hook'. Type 'number' " +
      "is not assignable to type 'string'.",
    "'Hook' is a REAL call signature: `(doc: Doc) => string`. A function " +
      "with the wrong RETURN type is rejected by ordinary assignability, " +
      "exactly like assigning a number to a string variable — no special " +
      "casing, because `Function` has been replaced with a real, checkable " +
      "signature.",
  );

  blank();
  section("The correctly-shaped hook");

  const result = runHook(wordCountHook, { text: "hello world" });
  proveType<string>()(result, "string", "wordCountHook really is (doc: Doc) => string");
  good(`runHook(wordCountHook, { text: "hello world" }) → ${JSON.stringify(result)}`);

  blank();
  table(
    ["hook parameter type", "wrong-shaped hook compiles?", "wrong-shaped hook's effect"],
    [
      ["Function", "yes — (...args: any[]) => any accepts anything", "wrong value propagates silently, or crashes later"],
      ["Hook = (doc: Doc) => string", "no — TS2322 at registration", "impossible to register a mismatched hook"],
    ],
  );
  warn(
    "`Function` is not a safer `any` — it is `any`, scoped to callables. " +
      "`noImplicitAny` stops it from appearing BY ACCIDENT (an unannotated " +
      "parameter defaults to a real inferred type, not `Function`), but " +
      "cannot stop a `: Function` annotation written on purpose — the same " +
      "boundary demo 14 draws around `any` and `as` applies here.",
  );
}
