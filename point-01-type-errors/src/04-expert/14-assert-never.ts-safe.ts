/**
 * 14-assert-never — THE EXHAUSTIVENESS TOOLKIT
 * ---------------------------------------------------------------------------
 * Demo 10 introduced `assertNever`. This demo builds the whole family of
 * exhaustiveness tools around it and, more importantly, explains WHEN each one
 * fires:
 *
 *   TOOL                     GUARANTEE           WHEN IT FIRES
 *   ─────────────────────────────────────────────────────────────────────────
 *   assertNever(x)           full                compile time (TS2345)
 *   Record<Union, T>         full                compile time (TS2741)
 *   `satisfies Record<…>`    full, no widening   compile time (TS2741)
 *   Expect<Equals<…>>        full, type-only     compile time (TS2344)
 *   a `match` helper         full                compile time (TS2345/TS2739)
 *   `default: throw`         none                runtime, in production
 *
 * The last row is the JavaScript defence. Everything above it is a compile-time
 * proof obtained from the same four-line function.
 *
 * DOMAIN: a notification service dispatching over several channels.
 */

import {
  section,
  ts,
  good,
  warn,
  note,
  compilerSays,
  table,
  blank,
  detonate,
} from "../99-runner/trace.js";
import { proveType, proofBlock, type Equals, type Expect } from "../99-runner/type-assert.js";

type Channel = "email" | "sms" | "push";

// ===========================================================================
// THE HELPER ITSELF, in its three useful shapes
// ===========================================================================

/**
 * SHAPE 1 — the classic. Throws at runtime, errors at compile time.
 *
 * `value: never`  → the call is legal only where the compiler proved ∅.
 * `: never` return → tells control-flow analysis this call does not return, so
 *                    it can occupy a `default:` branch without breaking return
 *                    checking.
 */
function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

/**
 * SHAPE 2 — the non-throwing variant, for code that must degrade rather than
 * crash (a UI renderer, a log formatter). The compile-time guarantee is
 * identical; only the runtime behaviour differs.
 */
function exhaustiveFallback<T>(value: never, fallback: T): T {
  void value;
  return fallback;
}

/**
 * SHAPE 3 — compile-time only, zero runtime footprint. Useful when there is no
 * `default:` branch to put a call in, e.g. inside a mapped type or when
 * asserting that two unions stayed in sync.
 */
type _ChannelsCovered = Expect<Equals<Channel, "email" | "sms" | "push">>;

export function runSafe(): void {
  // =========================================================================
  // 1. THE CLASSIC, AND THE ERROR IT PRODUCES
  // =========================================================================
  section("assertNever — the guarantee JavaScript's `default: throw` cannot give");

  const subjectFor = (channel: Channel): string => {
    switch (channel) {
      case "email":
        return "Your order";
      case "sms":
        return "Order update";
      case "push":
        return "Order";
      default:
        return assertNever(channel);
    }
  };

  for (const channel of ["email", "sms", "push"] as const) {
    detonate(`subjectFor("${channel}")`, () => subjectFor(channel));
  }

  blank();
  ts("the same switch with the `push` case deleted");
  compilerSays(
    "TS2345",
    "Argument of type '\"push\"' is not assignable to parameter of type 'never'.",
    "Compare the JavaScript twin: `Error: unhandled channel: push`, thrown on " +
      "the first production request. Same information, discovered months " +
      "earlier and by the person who caused it.",
  );

  blank();
  note("The non-throwing variant, for renderers that must not crash:");
  const iconFor = (channel: Channel): string => {
    switch (channel) {
      case "email":
        return "✉";
      case "sms":
        return "☎";
      case "push":
        return "🔔";
      default:
        return exhaustiveFallback(channel, "•");
    }
  };
  detonate('iconFor("push")', () => iconFor("push"));
  good(
    "Identical compile-time guarantee, graceful runtime behaviour. The choice " +
      "between them is about failure policy, not about type safety.",
  );

  // =========================================================================
  // 2. EXHAUSTIVE MAPS — exhaustiveness without a switch
  // =========================================================================
  blank();
  section("Record<Union, T> — a lookup table the compiler completes for you");

  const TEMPLATES: Record<Channel, string> = {
    email: "order-email.html",
    sms: "order-sms.txt",
    push: "order-push.json",
  };

  proofBlock("what indexing an exhaustive Record yields");
  proveType<string>()(TEMPLATES["push"], "string", "NOT `string | undefined` — the key is proved");
  note(
    "    Contrast demo 06: `noUncheckedIndexedAccess` adds `| undefined` for " +
      "an ARRAY index because bounds are unknown, but a `Record<Channel, T>` " +
      "indexed by a `Channel` is provably in range. Precision, not pedantry.",
  );

  blank();
  ts("a Record<Channel, string> missing the `push` key");
  compilerSays(
    "TS2741",
    "Property 'push' is missing in type '{ email: string; sms: string; }' but " +
      "required in type 'Record<Channel, string>'.",
    "The JavaScript lookup object returned `undefined` for the missing key and " +
      "sent an empty notification. This is the same table with the same " +
      "ergonomics and a completeness proof attached.",
  );

  // =========================================================================
  // 3. `satisfies` — completeness WITHOUT losing precision
  // =========================================================================
  blank();
  section("`satisfies` — check against a type without widening to it");

  interface RetryPolicy {
    readonly attempts: number;
    readonly backoffMs: number;
  }

  const RETRY_POLICY = {
    email: { attempts: 5, backoffMs: 1_000 },
    sms: { attempts: 2, backoffMs: 5_000 },
    push: "disabled",
  } satisfies Record<Channel, RetryPolicy | "disabled">;

  proofBlock("`satisfies` checks conformance without widening the value");
  proveType<number>()(
    RETRY_POLICY.email.attempts,
    "number",
    "readable directly — no narrowing needed",
  );
  note(
    "    THE POINT. With the annotation form —",
  );
  note("        const RETRY_POLICY: Record<Channel, RetryPolicy | \"disabled\"> = {…}");
  note(
    "    — every member would be typed `RetryPolicy | \"disabled\"`, and " +
      "`RETRY_POLICY.email.attempts` would be TS2339 until you narrowed it. " +
      "`satisfies` verifies conformance and then gets out of the way: the " +
      "binding keeps the precise type the literal actually had.",
  );

  blank();
  ts("the same object literal missing `push`, with `satisfies`");
  compilerSays(
    "TS2741",
    "Property 'push' is missing in type '{ email: …; sms: …; }' but required " +
      "in type 'Record<Channel, RetryPolicy | \"disabled\">'.",
    "Completeness is enforced; precision is preserved. This is usually the " +
      "form you want for configuration tables.",
  );

  // =========================================================================
  // 4. A `match` HELPER — exhaustiveness as an expression
  // =========================================================================
  blank();
  section("A typed `match`: exhaustiveness with no switch and no default");

  /**
   * Pattern matching, spelled in TypeScript. The handlers object is typed with
   * a MAPPED TYPE over the union, so omitting a key is TS2739/TS2741 and the
   * return type is inferred as the union of the handlers' return types.
   */
  const match = <T extends string, R>(
    value: T,
    handlers: { readonly [K in T]: () => R },
  ): R => handlers[value]();

  const priorityOf = (channel: Channel): number =>
    match(channel, {
      email: () => 3,
      sms: () => 2,
      push: () => 1,
    });

  for (const channel of ["email", "sms", "push"] as const) {
    detonate(`priorityOf("${channel}")`, () => priorityOf(channel));
  }

  ts("the same call with the `push` handler omitted");
  compilerSays(
    "TS2345",
    "Argument of type '{ email: () => number; sms: () => number; }' is not " +
      "assignable to parameter of type '{ readonly email: () => number; " +
      "readonly sms: () => number; readonly push: () => number; }'.\n" +
      "    Property 'push' is missing.",
    "No `switch`, no `default`, no `assertNever` — the mapped type carries the " +
      "obligation. Add a channel to the union and every `match` call site " +
      "fails to compile.",
  );

  // =========================================================================
  // 5. WHY THE RUNTIME THROW STILL BELONGS THERE
  // =========================================================================
  blank();
  section("Belt and braces: why assertNever still throws");

  warn(
    "If the compiler proved the branch unreachable, why keep a runtime throw? " +
      "Because the proof is conditional on the value having come from inside " +
      "the type system (demo 12). These reach it anyway:",
  );
  note("    • a value from `JSON.parse` / `fetch` / a database, cast with `as`");
  note("    • an `any` from an untyped dependency");
  note("    • a caller compiled from JavaScript, or a `.d.ts` that lied");
  note("    • the union was widened at a boundary you do not control");

  const rogue = "fax" as Channel; // a lie, exactly as in demo 12
  detonate("subjectFor(a value that lied about its type)", () => subjectFor(rogue));
  good(
    "The throw fired, at the boundary of the lie, with the offending value in " +
      "the message. That is a far better failure than a silent `undefined`.",
  );

  // =========================================================================
  // 6. CHOOSING BETWEEN THEM
  // =========================================================================
  blank();
  section("Which tool when");
  table(
    ["situation", "tool", "diagnostic when incomplete"],
    [
      ["branching on a union", "switch + assertNever", "TS2345"],
      ["branching, must not crash", "switch + exhaustiveFallback", "TS2345"],
      ["a static lookup table", "Record<Union, T>", "TS2741"],
      ["a table whose literals matter", "`satisfies Record<Union, T>`", "TS2741"],
      ["an expression, no statement", "`match` + mapped type", "TS2345 / TS2739"],
      ["two unions must stay in sync", "Expect<Equals<A, B>>", "TS2344"],
      ["JavaScript's best effort", "`default: throw`", "**none** — runtime only"],
    ],
  );
  note(
    "Every row but the last converts 'someone will remember to update this' " +
      "into 'the build will not pass until someone does'. That substitution — " +
      "human diligence replaced by a mechanical obligation — is the practical " +
      "meaning of Concept #1 over the lifetime of a codebase.",
  );
}
