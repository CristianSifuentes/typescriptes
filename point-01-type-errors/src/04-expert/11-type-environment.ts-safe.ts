/**
 * 11-type-environment — THE COMPILER'S MENTAL MODEL
 * ---------------------------------------------------------------------------
 * This demo has no "bug" to catch. Its subject is the machinery itself: what
 * the checker is holding in its hands while it reads your file.
 *
 * THE TYPE ENVIRONMENT (written Γ, "gamma", in type theory) is a mapping from
 * names to types, threaded through the program. A typing judgement is written
 *
 *     Γ ⊢ e : T
 *
 * and read: "under environment Γ, the expression e has type T."
 *
 * TypeScript maintains SEVERAL such environments at once, and confusing them is
 * the source of most 'why does it think that?' questions:
 *
 *   1. the VALUE space      — names bound to values (`const x = 1`)
 *   2. the TYPE space       — names bound to types (`type X = …`, `interface`)
 *   3. the NAMESPACE space  — names bound to containers of both
 *   4. the FLOW state       — the *narrowed* type of each reference at each
 *                             node of the control flow graph (demo 07)
 *
 * `class` and `enum` are the two declarations that inhabit the value space AND
 * the type space simultaneously; `interface` and `type` live only in the type
 * space and vanish at emit.
 *
 * Every claim below is machine-verified by `proveType<T>()`.
 */

import { section, note, good, warn, table, typeState, blank, ts } from "../99-runner/trace.js";
import { proveType, proofBlock, type Equals, type Expect } from "../99-runner/type-assert.js";

// ===========================================================================
// The two spaces, demonstrated
// ===========================================================================

/** TYPE space only. Erased entirely. */
interface Money {
  readonly cents: number;
  readonly currency: "EUR" | "USD";
}

/** TYPE space only. */
type Discount = { readonly kind: "percent"; readonly value: number };

/** VALUE space only. */
const ZERO: Money = { cents: 0, currency: "EUR" };

/**
 * BOTH spaces: `Cart` is a value (the constructor function) and a type (the
 * instance type).
 *
 * Note the explicit field + assignment rather than the shorter
 * `constructor(readonly lines: …)`. A constructor parameter property EMITS
 * JavaScript (it becomes `this.lines = lines`), so it is not pure erasure and
 * `erasableSyntaxOnly` rejects it with TS1294:
 *
 *     error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
 *
 * That flag is the machine-checked form of "compilation is erasure" — see
 * 00-foundations/manifesto.md §2.
 */
class Cart {
  readonly lines: readonly Money[];
  constructor(lines: readonly Money[]) {
    this.lines = lines;
  }
  get total(): number {
    return this.lines.reduce((sum, line) => sum + line.cents, 0);
  }
}

// A compile-time proof that `Cart` in type position means "instance of Cart":
type _CartIsInstanceType = Expect<Equals<Cart, InstanceType<typeof Cart>>>;

export function runSafe(): void {
  // =========================================================================
  // 1. WIDENING: what the compiler infers when you do not annotate
  // =========================================================================
  section("Inference, widening, and freshness");

  const literalConst = "coupon"; // fresh literal type, immutable binding
  let literalLet = "coupon"; // fresh literal type, MUTABLE binding → widened
  const asConst = { kind: "percent", value: 10 } as const;
  const inferredObject = { kind: "percent", value: 10 };

  proofBlock("what the compiler inferred, without a single annotation");
  proveType<"coupon">()(literalConst, '"coupon"', "const + literal ⇒ literal type kept");
  proveType<string>()(literalLet, "string", "let ⇒ widened to the base type");
  proveType<{ readonly kind: "percent"; readonly value: 10 }>()(
    asConst,
    '{ readonly kind: "percent"; readonly value: 10 }',
    "`as const` freezes both mutability and literalness",
  );
  proveType<{ kind: string; value: number }>()(
    inferredObject,
    "{ kind: string; value: number }",
    "object literal members are mutable ⇒ widened",
  );
  literalLet = "other";
  void literalLet;

  note(
    "    WIDENING is the rule that turns a *fresh literal type* into its base " +
      "type when the location can change. `const x = \"a\"` cannot change, so " +
      "`\"a\"` is kept; `let x = \"a\"` can, so `string` is used. This is why " +
      "`as const` exists: it is how you tell the compiler that a mutable-looking " +
      "structure is in fact frozen.",
  );

  // =========================================================================
  // 2. CONTEXTUAL TYPING: information flows INTO expressions
  // =========================================================================
  blank();
  section("Contextual typing: inference is not only bottom-up");

  const handlers: Record<string, (amount: Money) => number> = {
    // No annotation on `m` — its type flows IN from the annotated container.
    double: (m) => {
      proveType<Money>()(m, "Money", "contextual type from the Record annotation");
      return m.cents * 2;
    },
  };
  void handlers;

  const amounts: readonly Money[] = [ZERO];
  amounts.map((line) => {
    proveType<Money>()(line, "Money", "contextual type from the array's element type");
    return line.cents;
  });

  good(
    "Inference is bidirectional. Bottom-up: the type of `1 + 1` comes from its " +
      "operands. Top-down (contextual): the parameter types of a callback come " +
      "from the position the callback is written in. `noImplicitAny` is quiet " +
      "here precisely because the context supplied the type.",
  );

  // =========================================================================
  // 3. THE FLOW STATE, WALKED LINE BY LINE
  // =========================================================================
  blank();
  section("Γ as the compiler carries it through a real function");

  const priceOf = (discount: Discount | "none" | null, base: Money): number => {
    // Γ = { discount: Discount | "none" | null, base: Money }
    proofBlock("Γ at each line of `priceOf`");
    proveType<Discount | "none" | null>()(
      discount,
      'Discount | "none" | null',
      "line 1 — parameter type, nothing narrowed",
    );

    if (discount === null) {
      // Γ = { discount: null, … }
      proveType<null>()(discount, "null", "line 2 — true edge of `=== null`");
      return base.cents;
    }
    // Γ = { discount: Discount | "none", … }   ← null subtracted
    proveType<Discount | "none">()(
      discount,
      'Discount | "none"',
      "line 3 — false edge; `null` removed",
    );

    if (discount === "none") {
      proveType<"none">()(discount, '"none"', "line 4 — literal comparison");
      return base.cents;
    }
    // Γ = { discount: Discount, … }
    proveType<Discount>()(discount, "Discount", "line 5 — only the object member remains");

    const rate = discount.value / 100;
    proveType<number>()(rate, "number", "line 6 — `/` on two numbers");

    return Math.round(base.cents * (1 - rate));
  };

  blank();
  proveType<number>()(priceOf({ kind: "percent", value: 10 }, { cents: 1000, currency: "EUR" }), "number", "call result");

  blank();
  typeState([
    ["1", "discount (entry)", 'Discount | "none" | null', "parameter annotation"],
    ["2", "discount === null → true", "null", "filter"],
    ["3", "discount === null → false", 'Discount | "none"', "complement"],
    ["4", 'discount === "none" → true', '"none"', "filter"],
    ["5", "residual", "Discount", "complement"],
    ["6", "discount.value / 100", "number", "operator rule"],
  ]);

  // =========================================================================
  // 4. THE TWO SPACES, AND WHY THE DISTINCTION MATTERS
  // =========================================================================
  blank();
  section("Declaration spaces");

  table(
    ["declaration", "value space", "type space", "survives emit?"],
    [
      ["const / let / var", "yes", "no", "yes"],
      ["function", "yes", "no", "yes"],
      ["class", "yes (constructor)", "yes (instance type)", "yes"],
      ["interface", "no", "yes", "**no**"],
      ["type alias", "no", "yes", "**no**"],
      ["enum", "yes", "yes", "yes — which is why `erasableSyntaxOnly` bans it"],
      ["namespace", "yes", "yes", "yes — likewise banned"],
    ],
  );

  ts("typeof x   — in a TYPE position, this is the type QUERY operator");
  note(
    "    `typeof cart` in a type position asks the TYPE environment for the " +
      "type of the value `cart`. It is not the runtime `typeof` operator, " +
      "which returns a string. Two different operators, one spelling, " +
      "distinguished by which space you are writing in.",
  );

  const cart = new Cart([{ cents: 500, currency: "EUR" }]);
  proveType<Cart>()(cart, "Cart", "`Cart` in type position = the instance type");
  proveType<number>()(cart.total, "number", "getter return type");
  proveType<
    "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function"
  >()(
    typeof cart,
    "the 8 typeof literals",
    "runtime `typeof` — a different operator, and its result type is itself a literal union",
  );

  // =========================================================================
  // 5. WHAT THIS BUYS
  // =========================================================================
  blank();
  section("Runtime environment vs type environment");
  table(
    ["question", "JavaScript answers by…", "TypeScript answers by…"],
    [
      ["what type is x here?", "running the program", "consulting Γ at that node"],
      ["what shapes can x have?", "reading every assignment", "the declared union"],
      ["is this member present?", "running it", "member resolution"],
      ["for WHICH inputs?", "the one you ran", "**all of them**"],
      ["how long does it take?", "as long as the program runs", "milliseconds, no execution"],
    ],
  );

  warn(
    "The fourth row is the one that matters. `console.log(typeof x)` answers " +
      "for one execution. Γ answers for the program.",
  );
}
