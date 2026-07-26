/**
 * 07-narrowing — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * NARROWING (formally: *occurrence typing* / flow-sensitive typing) is the
 * mechanism that makes union types usable.
 *
 * HOW IT WORKS, mechanically:
 *   1. The checker builds a CONTROL FLOW GRAPH (CFG) of the function: nodes are
 *      statements and expressions, edges are the possible transfers of control.
 *   2. Certain expressions are recognised as TYPE GUARDS: `typeof x === "s"`,
 *      `x === null`, `"k" in obj`, `x instanceof C`, `Array.isArray(x)`,
 *      discriminant comparisons, and user-defined `x is T` predicates.
 *   3. At each outgoing edge of a guard, the checker applies a FILTER to the
 *      declared type of the guarded reference: keep the union members
 *      consistent with the guard on the true edge, keep the complement on the
 *      false edge.
 *   4. At a merge point (where branches rejoin) the resulting types are UNIONED
 *      back together.
 *   5. An ASSIGNMENT to the reference resets its narrowed type to the type of
 *      the assigned expression.
 *
 * In set terms (00-foundations §3): narrowing is set subtraction along the
 * edges of the control flow graph, and a merge is set union. Every trace this
 * demo prints is a snapshot of that set.
 *
 * Every type printed below is verified by `proveType<T>()`, which fails to
 * compile if the compiler's belief differs from the printed string.
 */

import {
  section,
  ts,
  good,
  warn,
  note,
  compilerSays,
  typeState,
  blank,
  detonate,
  compileTimeOnly,
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

/** A configuration value as it comes out of a heterogeneous store. */
type SettingValue = string | number | readonly string[] | null;

export function runSafe(): void {
  // =========================================================================
  // 1. THE CANONICAL WALK: one union, five program points
  // =========================================================================
  section("typeof narrowing, traced point by point");

  const describe = (value: SettingValue): string => {
    // ---- POINT A: entry. Nothing has been checked yet. ---------------------
    proofBlock("point A — function entry");
    proveType<SettingValue>()(
      value,
      "string | number | readonly string[] | null",
      "declared type, nothing excluded yet",
    );

    if (value === null) {
      // ---- POINT B: the equality guard's true edge. ------------------------
      proofBlock("point B — inside `value === null`");
      proveType<null>()(value, "null", "everything except null was filtered out");
      return "(unset)";
    }

    // ---- POINT C: the false edge. `null` has been SUBTRACTED. --------------
    proofBlock("point C — after the early return");
    proveType<string | number | readonly string[]>()(
      value,
      "string | number | readonly string[]",
      "null removed on the false edge of the guard",
    );

    if (typeof value === "string") {
      // ---- POINT D ---------------------------------------------------------
      proofBlock("point D — inside `typeof value === \"string\"`");
      proveType<string>()(value, "string", "typeof filter keeps only string");
      return value.toUpperCase();
    }

    if (typeof value === "number") {
      // ---- POINT E ---------------------------------------------------------
      proofBlock("point E — inside `typeof value === \"number\"`");
      proveType<number>()(value, "number", "typeof filter keeps only number");
      return value.toFixed(2);
    }

    // ---- POINT F: two members subtracted; one remains. ---------------------
    proofBlock("point F — everything else eliminated");
    proveType<readonly string[]>()(
      value,
      "readonly string[]",
      "the only member left after removing null, string, number",
    );
    return value.join(", ");
  };

  blank();
  detonate("describe(null)", () => describe(null));
  blank();
  detonate('describe("hello")', () => describe("hello"));
  blank();
  detonate("describe(42)", () => describe(42));
  blank();
  detonate('describe(["a", "b"])', () => describe(["a", "b"]));

  blank();
  typeState([
    ["A", "value (entry)", "string | number | readonly string[] | null", "declared type"],
    ["B", "value === null → true", "null", "filter: keep members ≡ null"],
    ["C", "value === null → false", "string | number | readonly string[]", "filter: complement"],
    ["D", 'typeof === "string" → true', "string", "filter on the typeof facet"],
    ["E", 'typeof === "number" → true', "number", "filter on the typeof facet"],
    ["F", "all guards false", "readonly string[]", "residual set"],
  ]);
  good(
    "Six program points, six different types for the SAME binding. That is " +
      "flow-sensitivity: a type is a property of a reference AT A POINT, not " +
      "of a variable as a whole.",
  );

  // =========================================================================
  // 2. THE GUARDS TYPESCRIPT UNDERSTANDS
  // =========================================================================
  blank();
  section("The guard vocabulary");

  interface CachedResponse {
    readonly source: "cache";
    readonly body: string;
    readonly ageSeconds: number;
  }
  interface LiveResponse {
    readonly source: "network";
    readonly body: string;
    readonly latencyMs: number;
  }
  type Response = CachedResponse | LiveResponse;

  const cached: Response = { source: "cache", body: "{}", ageSeconds: 30 };

  // --- `in` narrowing -------------------------------------------------------
  if ("ageSeconds" in cached) {
    proofBlock('point — `"ageSeconds" in cached`');
    proveType<CachedResponse>()(
      cached,
      "CachedResponse",
      "`in` keeps members that declare the key",
    );
  }

  // --- discriminant narrowing ----------------------------------------------
  if (cached.source === "cache") {
    proofBlock("point — `cached.source === \"cache\"`");
    proveType<CachedResponse>()(
      cached,
      "CachedResponse",
      "literal-type discriminant filter",
    );
  }

  // --- instanceof narrowing -------------------------------------------------
  const thrown: unknown = new RangeError("out of range");
  if (thrown instanceof RangeError) {
    proofBlock("point — `thrown instanceof RangeError`");
    proveType<RangeError>()(thrown, "RangeError", "prototype-chain guard, `unknown` → RangeError");
  }

  // --- Array.isArray narrowing ---------------------------------------------
  // Note: `const x: string | string[] = ["a"]` would be narrowed to `string[]`
  // at the declaration itself — declaration is a flow node too. Reading through
  // a function keeps the full union alive so the guard has something to do.
  const readList = (many: boolean): string | string[] => (many ? ["a", "b"] : "a");
  const maybeList = readList(true);
  if (Array.isArray(maybeList)) {
    proofBlock("point — `Array.isArray(maybeList)`");
    proveType<string[]>()(maybeList, "string[]", "`isArray` is declared `arg is any[]`");
  } else {
    proveType<string>()(maybeList, "string", "the complement of the isArray guard");
  }
  note(
    "    CAVEAT: `Array.isArray` is typed `arg is any[]`, and `readonly " +
      "string[]` is not assignable to `any[]`. Narrowing a `string | readonly " +
      "string[]` with it therefore does NOT clean up the false branch. The " +
      "guard vocabulary is only as precise as the declarations in lib.d.ts.",
  );

  // --- truthiness narrowing -------------------------------------------------
  const maybeName: string | undefined = "ada";
  if (maybeName !== undefined) {
    proveType<string>()(maybeName, "string", "explicit `!== undefined`");
  }

  // =========================================================================
  // 3. THE FIVE JAVASCRIPT FAILURES, EACH REJECTED
  // =========================================================================
  blank();
  section("The failures from the .js-broken twin");

  const setting: SettingValue = null;

  ts("if (typeof setting === \"object\") Object.keys(setting)");
  compileTimeOnly(() => {
    // @ts-expect-error TS18047: 'setting' is possibly 'null'.
    const keys = typeof setting === "object" ? Object.keys(setting) : [];
    void keys;
  });
  compilerSays(
    "TS18047",
    "'setting' is possibly 'null'.",
    'TypeScript knows `typeof null === "object"` and does NOT remove `null` ' +
      "on that edge. The 25-year-old JavaScript wart is modelled faithfully " +
      "and then defended against.",
  );

  ts("else-branch assumed `number` when `null` was still in the union");
  compilerSays(
    "TS18047",
    "'value' is possibly 'null'.",
    "Complementation is only safe when the full set of possibilities is " +
      "known. The union IS that set, written down.",
  );

  blank();
  let payload: string | number = "hello";
  proveType<string>()(payload, "string", "narrowed by the initialiser");
  payload = 42;
  proveType<number>()(payload, "number", "narrowing RESET by the assignment");
  ts("payload = 42; payload.toUpperCase()");
  compileTimeOnly(() => {
    // @ts-expect-error TS2339: Property 'toUpperCase' does not exist on type 'number'.
    payload.toUpperCase();
  });
  compilerSays(
    "TS2339",
    "Property 'toUpperCase' does not exist on type 'number'.",
    "Assignment is a node in the control flow graph. The checker re-narrows " +
      "at that node, so a stale check cannot survive a reassignment.",
  );

  // =========================================================================
  // 4. WHERE NARROWING STOPS — the honest edges
  // =========================================================================
  blank();
  section("Three places narrowing legitimately gives up");

  note("(a) A deferred callback over a MUTABLE binding.");
  ts("let name: string | null; if (name !== null) queueMicrotask(() => name.length)");
  compilerSays(
    "TS18047",
    "'name' is possibly 'null'.",
    "The callback runs later, and `name` may have been reassigned by then. " +
      "The compiler is right and the programmer's intuition is wrong. Fix: " +
      "copy into a `const` inside the guard.",
  );
  const nameOrNull: string | null = "ada";
  if (nameOrNull !== null) {
    const pinned = nameOrNull; // a const cannot be reassigned, so the narrowing holds
    queueMicrotask(() => void pinned.length);
    proveType<string>()(pinned, "string", "const capture keeps the proof alive");
  }

  blank();
  note("(b) Property narrowing does not survive an intervening function call.");
  warn(
    "`if (obj.a !== null) { mutate(); obj.a.length }` — the call could have " +
      "reassigned `obj.a`. TypeScript keeps the narrowing for property " +
      "accesses only while no assignment to the object is visible; treat it as " +
      "a courtesy, not a guarantee, and destructure into a local instead.",
  );

  blank();
  note("(c) Truthiness is not presence — and this one the compiler CANNOT catch.");
  const retries: number | undefined = 0;
  const effective = retries ? retries : 3;
  detonate("`retries ? retries : 3` with retries === 0", () => effective);
  warn(
    "Type-correct and semantically wrong: `0` is a valid setting and a falsy " +
      "value. Use `retries ?? 3` (nullish) or `retries !== undefined`. No type " +
      "system distinguishes 'absent' from 'falsy' for you — you must say which " +
      "one you meant.",
  );
  const correct = retries ?? 3;
  detonate("`retries ?? 3` with retries === 0", () => correct);
}
