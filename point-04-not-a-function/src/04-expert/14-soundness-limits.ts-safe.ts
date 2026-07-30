/**
 * 14-soundness-limits — THE TYPESCRIPT VERSION (checked, and where checking ENDS)
 * ---------------------------------------------------------------------------
 * Every other demo in this project ends with a compile-time rejection. This
 * one is different on purpose: it shows THREE ways to make TypeScript
 * COMPILE a call that still throws "is not a function" at runtime — `any`,
 * `as`, and a loose index signature — and then the one disciplined fix that
 * actually closes the hole: validating at the I/O boundary.
 *
 * This is not a bug in TypeScript. `as` and `any` are ESCAPE HATCHES the
 * language deliberately provides for the cases a static type system cannot
 * decide (arbitrary JSON, `unknown` third-party data) — but every escape
 * hatch is a place where the compiler's guarantee stops applying.
 */

import { section, ts, good, warn, note, table, blank, callableTrace, detonate, runtimeSays } from "../99-runner/trace.js";

interface PluginConfig {
  readonly name: string;
  readonly onInit: () => void;
}

export function runSafe(): void {
  section("Hole #1 — `as`: asserting a shape instead of proving it");

  const rawJson = JSON.stringify({ name: "analytics-plugin", onInit: "run on startup" });
  ts("const config = JSON.parse(rawJson) as PluginConfig; config.onInit()");
  callableTrace([
    ["JSON.parse(rawJson)", "any", "any is callable with ANY arguments — nothing to check", "JSON.parse's return type is `any` by design"],
    ["... as PluginConfig", "PluginConfig", "() => void — but ONLY BECAUSE YOU SAID SO", "`as` overrides the checker; it verifies nothing"],
  ]);
  const config = JSON.parse(rawJson) as PluginConfig; // compiles cleanly — `as` is trusted
  detonate("config.onInit()", () => config.onInit());
  runtimeSays(
    "TypeError: config.onInit is not a function",
    "This line PASSED `tsc --noEmit` with zero diagnostics. `as PluginConfig` " +
      "told the compiler 'trust me, this is a PluginConfig' — the compiler " +
      "trusted it, and printed no warning, because `as` is a request to STOP " +
      "checking, not a request to check differently.",
  );

  blank();
  section("Hole #2 — `any`: no call signature to check against, ever");

  ts("let handler: any = 42; handler()");
  let handler: any = 42;
  detonate("handler()", () => handler());
  runtimeSays(
    "TypeError: handler is not a function",
    "`any` is not 'a permissive type' — it is the ABSENCE of a type. It has " +
      "no call signature to check `()` against, so `()` is legal on `any` " +
      "unconditionally, for the same reason demo 01's `TS2349` never fires " +
      "here: TS2349 requires a KNOWN type with NO call signature; `any` is " +
      "not a known type at all.",
  );

  blank();
  section("Hole #3 — a widened index lookup reopens dynamic dispatch");

  // `as any` on the LOOKUP (not the declaration) is the realistic way this
  // hole reappears: a Record<string, Handler> narrowed correctly by
  // `noUncheckedIndexedAccess` everywhere else in the file, except at one
  // call site somebody "fixed" a red squiggly line with a cast.
  const looseHandlers: Record<string, () => void> = { onSave: () => {} };
  ts('(looseHandlers as any)["onDelete"]()  — the cast throws away the guard `noUncheckedIndexedAccess` would otherwise force');
  detonate('(looseHandlers as any)["onDelete"]()', () => (looseHandlers as any)["onDelete"]());
  runtimeSays(
    "TypeError: looseHandlers[\"onDelete\"] is not a function",
    "Without the cast, this project's own tsconfig (`noUncheckedIndexedAccess: " +
      "true`) types `looseHandlers[\"onDelete\"]` as `(() => void) | " +
      "undefined`, and calling it unguarded is TS18048 — the SAME diagnostic " +
      "demo 08 dissects. That protection exists only until someone reaches " +
      "for `as any` to silence it. Demo 15 shows the CLOSED alternative — a " +
      "key set the compiler verifies membership in, rather than a check " +
      "someone can cast their way past.",
  );

  blank();
  section("The actual fix: validate AT the untyped boundary");

  function loadPlugin(raw: string): PluginConfig | undefined {
    const parsed: unknown = JSON.parse(raw); // `unknown`, not `any` — nothing is trusted yet
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "name" in parsed &&
      "onInit" in parsed &&
      typeof (parsed as { onInit: unknown }).onInit === "function"
    ) {
      return parsed as PluginConfig; // `as` here follows a REAL check, not instead of one
    }
    return undefined;
  }

  const rejected = loadPlugin(rawJson);
  if (rejected === undefined) {
    good('loadPlugin(rawJson) → undefined — the malformed config was REJECTED, not trusted.');
  }

  blank();
  table(
    ["hole", "how it compiles cleanly", "why the compiler cannot see the crash"],
    [
      ["`as PluginConfig`", "the assertion is accepted unconditionally", "`as` overrides checking; it is not a runtime check"],
      ["`any`", "`()` is legal on `any` by definition", "`any` has no call signature to violate"],
      ["loose index signature", "every string key ‘exists’", "the type promises a total function nothing enforces"],
    ],
  );
  warn(
    "TypeScript proves things about the code you wrote against the types " +
      "you declared. It cannot prove anything about a value whose type was " +
      "merely ASSERTED at a boundary it does not control — the fix is " +
      "always the same: verify with `typeof`/`in` BEFORE the first `as`, " +
      "never after.",
  );
}
