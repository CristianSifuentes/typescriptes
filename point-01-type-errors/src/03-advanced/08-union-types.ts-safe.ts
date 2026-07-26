/**
 * 08-unions — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * A union type `A | B` is the SET UNION of the values of `A` and the values of
 * `B`. From that single definition, the governing rule follows by arithmetic:
 *
 *     An operation is valid on `A | B` only if it is valid on A AND on B.
 *
 * Or, in terms of members: the *apparent members* of a union are the
 * INTERSECTION of its members' members. `string | number` has `toString` and
 * `valueOf` (both have those) but not `toUpperCase` (only one does).
 *
 * This is why unions feel restrictive at first: you are being asked to prove
 * which member you hold before you use member-specific operations. That proof
 * is narrowing (demo 07), and the payoff is that the compiler then knows the
 * COMPLETE list of possibilities — which makes exhaustiveness checkable
 * (demo 10).
 */

import {
  section,
  ts,
  good,
  note,
  compilerSays,
  table,
  blank,
  detonate,
  compileTimeOnly,
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

/** The search API's real contract, written down. */
type Query = string | readonly string[];

/** The HTTP client's real contract: three shapes, exhaustively enumerated. */
interface Success {
  readonly status: 200;
  readonly body: string;
}
interface Failure {
  readonly status: 400 | 404 | 500;
  readonly error: string;
}
interface TimedOut {
  readonly status: 0;
  readonly timedOut: true;
}
type HttpResult = Success | Failure | TimedOut;

export function runSafe(): void {
  // =========================================================================
  // 1. THE RULE
  // =========================================================================
  section("An operation must be valid for EVERY member");

  const cacheKey: string | number = Math.random() > 2 ? "k" : 7;

  ts("cacheKey.toUpperCase()   // cacheKey: string | number");
  compileTimeOnly(() => {
    // @ts-expect-error TS2339: Property 'toUpperCase' does not exist on type 'string | number'.
    const shouted = cacheKey.toUpperCase();
    void shouted;
  });
  compilerSays(
    "TS2339",
    "Property 'toUpperCase' does not exist on type 'string | number'.\n" +
      "    Property 'toUpperCase' does not exist on type 'number'.",
    "Read the elaboration line: the compiler names the OFFENDING MEMBER. It " +
      "did not reject the union, it rejected the one member that cannot do this.",
  );

  ts("cacheKey * 2");
  // @ts-expect-error TS2362: The left-hand side of an arithmetic operation must be of
  // type 'any', 'number', 'bigint' or an enum type.
  const doubled = cacheKey * 2;
  void doubled;

  blank();
  proofBlock("what IS available on `string | number` without narrowing");
  proveType<string>()(cacheKey.toString(), "string", "`toString` exists on both members");
  proveType<string>()(String(cacheKey), "string", "conversion accepts the whole union");
  note(
    "    The apparent members of a union are the INTERSECTION of its members' " +
      "members. That is not a restriction invented by TypeScript; it is what " +
      "'this value is one of these' means.",
  );

  // =========================================================================
  // 2. NARROWING UNLOCKS THE MEMBER-SPECIFIC OPERATIONS
  // =========================================================================
  blank();
  section("Prove which member you hold, then use it");

  const normaliseQuery = (query: Query): readonly string[] => {
    if (typeof query === "string") {
      proveType<string>()(query, "string", "typeof filter");
      return [query.trim().toLowerCase()];
    }
    proveType<readonly string[]>()(query, "readonly string[]", "residual member");
    return query.map((term) => term.trim().toLowerCase());
  };

  detonate('normaliseQuery("  Shoes ")', () => normaliseQuery("  Shoes "));
  detonate('normaliseQuery(["Shoes ", " Boots"])', () => normaliseQuery(["Shoes ", " Boots"]));

  ts("normaliseQuery(42)");
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'number' is not assignable to parameter
    // of type 'Query'.
    const bad = normaliseQuery(42);
    void bad;
  });
  compilerSays(
    "TS2345",
    "Argument of type 'number' is not assignable to parameter of type 'Query'.",
    "The union is also a WHITELIST. Undocumented inputs stop being possible.",
  );
  good("Both documented inputs work; the undocumented one is a build error.");

  // =========================================================================
  // 3. UNIONS OF OBJECT TYPES
  // =========================================================================
  blank();
  section("Unions of object shapes: fields that only some members have");

  const call = (scenario: "ok" | "error" | "timeout"): HttpResult => {
    if (scenario === "ok") return { status: 200, body: '{"id":1}' };
    if (scenario === "error") return { status: 500, error: "internal error" };
    return { status: 0, timedOut: true };
  };

  const result = call("ok");

  ts("result.body   // result: HttpResult");
  // @ts-expect-error TS2339: Property 'body' does not exist on type 'HttpResult'.
  const bodyBeforeCheck = result.body;
  void bodyBeforeCheck;
  compilerSays(
    "TS2339",
    "Property 'body' does not exist on type 'HttpResult'.\n" +
      "    Property 'body' does not exist on type 'Failure'.",
    "Exactly the read that produced `undefined` and then a TypeError in the " +
      "JavaScript version — rejected at the read.",
  );

  blank();
  note("`status` IS readable without narrowing, because every member declares it:");
  proveType<200 | 400 | 404 | 500 | 0>()(
    result.status,
    "200 | 400 | 404 | 500 | 0",
    "common member ⇒ the union of its types in each member",
  );
  good(
    "Note what the type of a common member is: the UNION of that member's type " +
      "across all cases. Sets, all the way down.",
  );

  // =========================================================================
  // 4. THE READ THAT COMPILES
  // =========================================================================
  blank();
  section("Reading safely, three ways");

  note("(a) `in` — narrow by the presence of a declared key:");
  if ("body" in result) {
    proveType<Success>()(result, "Success", '`in` keeps members declaring "body"');
    detonate("body length", () => result.body.length);
  }

  note("(b) the discriminant — narrow by a literal-typed common member:");
  const described = (r: HttpResult): string => {
    if (r.status === 200) {
      proveType<Success>()(r, "Success", "status === 200 identifies exactly one member");
      return `ok: ${r.body.length} bytes`;
    }
    if (r.status === 0) {
      proveType<TimedOut>()(r, "TimedOut", "status === 0 identifies exactly one member");
      return "timed out";
    }
    proveType<Failure>()(r, "Failure", "residual member");
    return `failed: ${r.error}`;
  };

  blank();
  detonate('describe(ok)', () => described(call("ok")));
  detonate("describe(error)", () => described(call("error")));
  detonate("describe(timeout)", () => described(call("timeout")));

  blank();
  note("(c) a user-defined type guard — see demo 09.");

  // =========================================================================
  // 5. THE PAYOFF: THE LIST OF POSSIBILITIES IS NOW A COMPILER ARTEFACT
  // =========================================================================
  blank();
  section("Why writing the union down is the whole point");

  good(
    "Adding a fourth member (`RateLimited`) to `HttpResult` makes every " +
      "function that pattern-matches on it fail to compile — see demo 10. In " +
      "JavaScript the same change produces a silent `undefined` return.",
  );

  blank();
  table(
    ["question", "JavaScript", "TypeScript"],
    [
      ["what shapes can this be?", "read every producer and hope", "the union declaration"],
      ["is this operation valid?", "find out at runtime", "TS2339 / TS2362 at the operator"],
      ["which fields are common?", "unknowable", "the apparent members"],
      ["have I handled every case?", "unanswerable", "`never` + assertNever (demo 10)"],
      ["did a new case appear?", "silent `undefined`", "build failure at every site"],
    ],
  );

  blank();
  note(
    "Vocabulary: `A | B` is set union (a value is one of them); `A & B` is set " +
      "intersection (a value is both at once, so it has ALL members of both). " +
      "The apparent members of `A | B` are the intersection of the two member " +
      "sets — union of values, intersection of capabilities.",
  );
}
