/**
 * 12-soundness-holes — WHERE TYPESCRIPT CANNOT PROTECT YOU
 * ---------------------------------------------------------------------------
 * Every previous demo showed the compiler winning. This one shows it losing,
 * on purpose, and explains why each loss was a deliberate design decision
 * rather than a bug.
 *
 * DEFINITIONS, stated once and used precisely:
 *
 *   SOUND      — if the checker accepts a program, the property it claims
 *                actually holds at runtime. No false negatives.
 *   COMPLETE   — the checker accepts every program that would in fact have run
 *                correctly. No false positives.
 *   DECIDABLE  — the check always terminates with an answer.
 *
 * Rice's theorem says you cannot have all three for a non-trivial semantic
 * property of a Turing-complete language. Every real type system therefore
 * gives something up. TypeScript's choice is explicit and, for its purpose,
 * defensible:
 *
 *   > TypeScript deliberately sacrifices SOUNDNESS for pragmatism, so that
 *   > idiomatic JavaScript remains typeable.
 *
 * It is not "mostly sound by accident". The holes below are documented,
 * intentional, and each one buys a specific ergonomic benefit. Knowing exactly
 * where they are is what separates using a type system from trusting one.
 *
 * Everything in this file compiles under `strict: true` with zero errors, and
 * several parts of it still explode at runtime. That is the lesson.
 */

import {
  section,
  ts,
  good,
  warn,
  bad,
  note,
  compilerSays,
  table,
  blank,
  detonate,
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

interface Customer {
  readonly id: string;
  readonly email: string;
  readonly balanceCents: number;
}

const PAYLOADS = {
  good: '{"id":"c-1","email":"ada@example.com","balanceCents":4500}',
  incomplete: '{"id":"c-2"}',
} as const;

const greet = (customer: Customer): string =>
  `Hello ${customer.email.split("@")[0] ?? "?"}, balance ${(customer.balanceCents / 100).toFixed(2)}`;

export function runSafe(): void {
  // =========================================================================
  // HOLE 1 — `as` (type assertion): a claim the compiler will not check
  // =========================================================================
  section("HOLE 1 — `as` is an assertion, not a conversion");

  const raw: unknown = JSON.parse(PAYLOADS.incomplete);
  const trusted = raw as Customer; // compiles. checks nothing. emits nothing.

  proofBlock("what the compiler now believes");
  proveType<Customer>()(trusted, "Customer", "because you said so — no evidence required");

  blank();
  detonate("greet(trusted)", () => greet(trusted));
  bad(
    "A TypeError, inside a program with zero type errors and every strict flag " +
      "on. `as` does not convert, validate, or emit a check: it OVERRIDES the " +
      "checker's judgement and erases to nothing.",
  );

  blank();
  note("The one guard rail `as` still has, and how to defeat it:");
  ts("count as Customer   // count: number");
  compilerSays(
    "TS2352",
    "Conversion of type 'number' to type 'Customer' may be a mistake because " +
      "neither type sufficiently overlaps with the other. If this was " +
      "intentional, convert the expression to 'unknown' first.",
    "The overlap check catches only absurd assertions between unrelated types.",
  );
  warn(
    "`count as unknown as Customer` defeats even that — and the error message " +
      "helpfully tells you how. A double assertion through `unknown` is the " +
      "universal escape hatch; treat every one in a code review as a claim " +
      "requiring justification.",
  );

  // =========================================================================
  // HOLE 2 — `any`, and the boundary that produces it
  // =========================================================================
  blank();
  section("HOLE 2 — `any` and the I/O boundary");

  const parsed = JSON.parse(PAYLOADS.incomplete); // declared: (text: string) => any
  const customerFromJson: Customer = parsed; // accepted: `any` is assignable to everything

  proofBlock("the type the compiler assigns to parsed JSON");
  note("    JSON.parse is declared `(text: string, reviver?) => any` in lib.es5.d.ts.");
  note("    `any` is not a type in the set-theoretic sense — it is an instruction");
  note("    to stop checking. Assignability in BOTH directions is unrestricted.");

  blank();
  detonate("customerFromJson.email.split('@')", () => customerFromJson.email.split("@"));
  bad("Same crash, no `as` in sight. The hole is in the declaration of `JSON.parse`.");
  note(
    "    And it is the right declaration: no compiler can know the shape of " +
      "bytes arriving from a network. The type system's guarantee is about the " +
      "code you wrote, not about the data the world sends you.",
  );

  blank();
  good("THE FIX, and it is the single most valuable habit in TypeScript:");
  note("    parse to `unknown`, then narrow with a validated type guard (demo 09).");

  const parseCustomer = (text: string): Customer => {
    const value: unknown = JSON.parse(text);
    if (
      typeof value !== "object" ||
      value === null ||
      typeof (value as Record<string, unknown>)["id"] !== "string" ||
      typeof (value as Record<string, unknown>)["email"] !== "string" ||
      typeof (value as Record<string, unknown>)["balanceCents"] !== "number"
    ) {
      throw new TypeError("payload is not a Customer");
    }
    return value as Customer;
  };

  detonate("parseCustomer(good)", () => greet(parseCustomer(PAYLOADS.good)));
  detonate("parseCustomer(incomplete)", () => greet(parseCustomer(PAYLOADS.incomplete)));
  good(
    "The failure moved from deep inside the application to the boundary, where " +
      "it can be logged, rejected with a 400, and attributed to the partner.",
  );

  // =========================================================================
  // HOLE 3 — method parameter bivariance
  // =========================================================================
  blank();
  section("HOLE 3 — method parameters are bivariant");

  interface Handler {
    handle(event: { kind: string }): void; // METHOD syntax
  }

  const overSpecific: Handler = {
    // Accepts a MORE specific parameter than the interface promises.
    handle(event: { kind: string; detail: string }) {
      void event.detail.toUpperCase(); // `detail` may not exist at runtime
    },
  };

  detonate("calling it with only the promised shape", () => {
    overSpecific.handle({ kind: "click" });
    return "no crash?";
  });
  bad(
    "TypeError. The implementation demanded `detail`; the interface promised " +
      "only `kind`. Both compiled.",
  );

  note(
    "    Parameter positions are CONTRAVARIANT under sound subtyping: a " +
      "function may accept MORE than promised, never less. `strictFunctionTypes` " +
      "enforces exactly that — but ONLY for members declared with function-" +
      "property syntax. Members declared with METHOD syntax stay bivariant.",
  );
  ts("interface H { handle: (e: { kind: string }) => void }   // property syntax");
  compilerSays(
    "TS2322",
    "Type '(event: { kind: string; detail: string; }) => undefined' is not " +
      "assignable to type '(event: { kind: string; }) => void'.\n" +
      "    Types of parameters 'event' and 'event' are incompatible.",
    "Same relation, checked properly. The difference is one character of " +
      "syntax — `handle(e)` versus `handle: (e) =>` — and it changes whether " +
      "the compiler enforces variance.",
  );
  warn(
    "Why keep the hole? Because `Array<Dog>` would not be assignable to " +
      "`Array<Animal>` without it, and neither would any DOM event handler. " +
      "The alternative is sound and unusable.",
  );

  // =========================================================================
  // HOLE 4 — `readonly` is shallow and alias-blind
  // =========================================================================
  blank();
  section("HOLE 4 — `readonly` is a compile-time courtesy, not a lock");

  interface Config {
    readonly retries: number;
  }
  const mutable = { retries: 3 };
  const frozen: Config = mutable; // accepted: readonly is not part of assignability here
  mutable.retries = 99;

  detonate("frozen.retries after mutating the alias", () => frozen.retries);
  bad(
    "99, through a `readonly` member. `readonly` prevents writes THROUGH THAT " +
      "REFERENCE; it says nothing about other references to the same object, " +
      "and it is erased at runtime. `Object.freeze` is the runtime tool.",
  );

  ts("const mutableList: number[] = readonlyList;");
  compilerSays(
    "TS4104",
    "The type 'readonly number[]' is 'readonly' and cannot be assigned to the " +
      "mutable type 'number[]'.",
    "The ARRAY case IS checked — an interesting asymmetry with the property " +
      "case above, and one worth knowing before you rely on either.",
  );

  // =========================================================================
  // HOLE 5 — index access without `noUncheckedIndexedAccess`
  // =========================================================================
  blank();
  section("HOLE 5 — array indexing (closed in this project, open by default)");

  note(
    "    `arr[i]` is typed `T`, not `T | undefined`, unless " +
      "`noUncheckedIndexedAccess` is on — which it is here, which is why demo " +
      "06 had to handle it. In the overwhelming majority of TypeScript " +
      "projects this hole is wide open, and it is the most common source of " +
      "'undefined is not an object' in supposedly type-safe code.",
  );

  // =========================================================================
  // THE SUMMARY
  // =========================================================================
  blank();
  section("The complete map of the holes");
  table(
    ["hole", "why it exists", "how to close it"],
    [
      ["`as`", "you sometimes know more than the compiler", "ban it in review; use guards"],
      ["`any`", "gradual typing / untyped libraries", "`unknown` + validation at the boundary"],
      ["I/O (`JSON.parse`, `fetch`, env)", "the world is not typed", "schema validation (zod, valibot, typia)"],
      ["method bivariance", "arrays and event handlers need it", "use property syntax + strictFunctionTypes"],
      ["`readonly` aliasing", "erasure — no runtime enforcement", "`Object.freeze`, or don't share references"],
      ["index access", "bounds are undecidable", "`noUncheckedIndexedAccess: true`"],
      ["`!` non-null assertion", "same as `as`, shorter", "ban it in review"],
      ["untyped / wrongly-typed `.d.ts`", "declarations are claims too", "pin, audit, test"],
    ],
  );

  blank();
  good(
    "THE HONEST CONCLUSION. TypeScript's guarantee is: *given that the values " +
      "entering your program have the types you claimed, no type error occurs " +
      "inside it.* Concept #1 is true, powerful, and conditional — and the " +
      "condition is the boundary.",
  );
  note(
    "Which reframes the engineering job precisely: the type system handles the " +
      "interior for free, so ALL of your validation effort belongs at the edge. " +
      "That is a far better place to spend it than sprinkled through every " +
      "function, which is where JavaScript forces you to spend it.",
  );
}
