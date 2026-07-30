/**
 * 07-index-signatures — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * An INDEX SIGNATURE (`[key: string]: T`) widens a type's property map to
 * include EVERY string as a valid key. This is the one place typo
 * protection is deliberately traded away — on purpose, because the whole
 * point of an index signature is "I cannot list the keys in advance."
 *
 * The trade-off has a sharp edge: a typo of a DECLARED member (`betaMod` for
 * `betaMode`) does not fail as "unknown member" — it silently resolves
 * through the index signature instead, because the index signature makes
 * every string, including near-misses of real keys, syntactically valid.
 */

import { section, ts, good, warn, note, compilerSays, table, blank, shapeTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface FeatureFlags {
  /** The one flag every part of the app is expected to check. */
  readonly betaMode: boolean;
  /** Everything else: flags pushed by a remote config service, keys unknown
   *  until runtime. This is what actually requires the index signature. */
  readonly [key: string]: boolean;
}

function loadFlags(): FeatureFlags {
  return { betaMode: true, darkTheme: false, newCheckout: true };
}

export function runSafe(): void {
  const flags = loadFlags();

  section("The property map, once an index signature is present");
  shapeTrace([
    ["FeatureFlags", "betaMode  +  [key: string]: boolean", "interface FeatureFlags (this file)"],
  ]);
  warn(
    "Read that second row literally: EVERY string is now a valid key. " +
      "'betaMode' is not special to the type checker — it is just the one key " +
      "the index signature happens to also promise a `boolean` for.",
  );

  blank();
  section("A typo of a KNOWN member — the sharp edge of this trade-off");

  ts("flags.betaMod  — 'betaMode', misspelled");
  compileTimeOnly(() => {
    // @ts-expect-error TS4111: Property 'betaMod' comes from an index
    // signature, so it must be accessed with ['betaMod'].
    const beta = flags.betaMod;
    void beta;
  });
  compilerSays(
    "TS4111",
    "Property 'betaMod' comes from an index signature, so it must be accessed with ['betaMod'].",
    "This is NOT a typo diagnosis. The compiler is not telling you 'betaMod' " +
      "is wrong — it is telling you dot-notation is reserved for DECLARED " +
      "members, and 'betaMod' resolved through the index signature instead " +
      "(noPropertyAccessFromIndexSignature). Switch to bracket notation and " +
      "the typo compiles CLEANLY.",
  );

  ts('flags["betaMod"]  — same typo, bracket notation: NO ERROR');
  const stillWrong = flags["betaMod"];
  proveType<boolean | undefined>()(
    stillWrong,
    "boolean | undefined",
    "noUncheckedIndexedAccess adds '| undefined' — but the KEY typo itself is still unchecked",
  );
  warn(
    "The VALUE type is honest (`boolean | undefined`, thanks to " +
      "noUncheckedIndexedAccess) — but that honesty is about 'this key might " +
      "be absent', not about 'this key might be misspelled'. At runtime " +
      "`stillWrong` really is `undefined`, and nothing distinguishes that from " +
      "a legitimately-unset dynamic flag.",
  );

  blank();
  section("A typo of a purely dynamic key: never caught, by design");

  ts('flags["darkTheem"]');
  const dynamic = flags["darkTheem"];
  proveType<boolean | undefined>()(
    dynamic,
    "boolean | undefined",
    "any string key type-checks against an index signature",
  );
  note(
    "There was never a closed list of dynamic keys to check 'darkTheem' " +
      "against — that is the entire premise of using an index signature here. " +
      "This is not a checker failure; it is the feature working as specified.",
  );

  blank();
  section("The correct, protected access");
  good(`betaMode = ${flags.betaMode} — dot notation, a DECLARED member, fully checked.`);

  blank();
  table(
    ["access", "protected by the property map?", "TypeScript behaviour"],
    [
      ["flags.betaMode", "yes — declared member", "fully checked, dot notation allowed"],
      ["flags.betaMod", "no — falls through to the index signature", "TS4111 (forces bracket notation, does NOT catch the typo)"],
      ['flags["betaMod"]', "no", "compiles; wrong at runtime"],
      ['flags["darkTheem"]', "no — was never protectable", "compiles by design"],
    ],
  );
  note(
    "Index signatures are the correct tool for genuinely open-ended keys, and " +
      "the wrong tool the moment a real, finite set of members exists — use " +
      "one member per key (demo 01-03) or, if the set is large but still " +
      "closed, `Record<SpecificUnion, T>` (see 03-advanced/10-keyof).",
  );
}
