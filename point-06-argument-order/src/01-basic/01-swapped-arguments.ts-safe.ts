/**
 * 01-swapped-arguments — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * THE MECHANISM: for a call `f(a₀, …, aₙ₋₁)` against a signature
 * `(p₀: T₀, …, pₘ₋₁: Tₘ₋₁) => R`, the type of `aᵢ` must be assignable to `Tᵢ`
 * for every `i`. Argument *i* against parameter *i*. That is the entire rule.
 *
 * The parameter's NAME plays no part in the check. It supplies the label in the
 * error message and the editor hint — nothing more. This matters, and it is the
 * seed of the blind spot that level 02 is about: if names do not participate in
 * checking, then two parameters with the same type are indistinguishable.
 *
 * Every defect from the `.js-broken` twin is written below and marked
 * `// @ts-expect-error` — an INVERTED ASSERTION: "this line must produce an
 * error; if it ever stops, fail the build" (TS2578). The file is therefore both
 * a demonstration and a regression test of compiler behaviour.
 */

import {
  section,
  ts,
  good,
  warn,
  note,
  compilerSays,
  positionTrace,
  table,
  blank,
  detonate,
  compileTimeOnly,
} from "../99-runner/trace.js";
import { proveType, proofBlock } from "../99-runner/type-assert.js";

interface User {
  readonly id: string;
  readonly name: string;
  readonly age: number;
}

function createUser(name: string, age: number): User {
  return { id: "u-1", name, age };
}

const eligibilityFor = (user: User): "adult" | "minor" => (user.age >= 18 ? "adult" : "minor");
const renderProfile = (user: User): string => `${user.name.trim()} (${user.age})`;

export function runSafe(): void {
  // =========================================================================
  // 1. THE SWAP, REJECTED
  // =========================================================================
  section("The swapped call, rejected before the program runs");

  ts('createUser(25, "Ana")');
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'number' is not assignable to parameter
    // of type 'string'.
    const swapped = createUser(25, "Ana");
    void swapped;
  });
  compilerSays(
    "TS2345",
    "Argument of type 'number' is not assignable to parameter of type 'string'.",
    "Reported at the ARGUMENT that is wrong, not at the function, not at the " +
      "downstream code that would have crashed. The `renderProfile` TypeError " +
      "from the JavaScript twin no longer has a cause.",
  );

  // =========================================================================
  // 2. THE DETAIL NOBODY EXPECTS: ONE ERROR, NOT TWO
  // =========================================================================
  blank();
  section("A two-argument swap produces ONE diagnostic");

  warn(
    "The call above has TWO wrong arguments and produces exactly ONE error. " +
      "For a call with a single (non-overloaded) signature the checker reports " +
      "the FIRST mismatching position and stops checking that call; fixing it " +
      "reveals the next.",
  );
  note(
    "    Consequence for how you read messages: the compiler never says " +
      '"these arguments look swapped". It says "position 0 is wrong". The ' +
      "word SWAP is an inference you make from the message — a swap is not a " +
      "category the compiler knows about, it is two position errors that " +
      "happen to be symmetric.",
  );
  note(
    "    Verified in the evidence lab: `createUser(25, \"Ana\")` and " +
      "`createUser(25, 25)` produce the same single diagnostic at the same " +
      "position, and are indistinguishable from the message alone.",
  );

  // =========================================================================
  // 3. WHAT THE COMPILER DEMANDS AT EACH POSITION
  // =========================================================================
  blank();
  section("Positional binding, made visible");

  positionTrace([
    ["0", "name", "string", '25 (number)', "✘ TS2345 — reported here"],
    ["1", "age", "number", '"Ana" (string)', "✘ wrong too, but not reported yet"],
  ]);
  note("    …and for the correct call:");
  positionTrace([
    ["0", "name", "string", '"Ana" (string)', "✔ assignable"],
    ["1", "age", "number", "25 (number)", "✔ assignable"],
  ]);

  // =========================================================================
  // 4. THE PROGRAM THAT COMPILES
  // =========================================================================
  blank();
  section("The correct call, with every type machine-verified");

  const user = createUser("Ana", 25);

  proofBlock("what the compiler proved about the record");
  proveType<string>()(user.name, "string", "parameter 0 flowed into the field");
  proveType<number>()(user.age, "number", "parameter 1 flowed into the field");
  proveType<"adult" | "minor">()(eligibilityFor(user), '"adult" | "minor"', "downstream is safe");

  blank();
  detonate("age + 1", () => user.age + 1);
  detonate("eligibility", () => eligibilityFor(user));
  detonate("persisted", () => JSON.stringify(user));
  detonate("rendered", () => renderProfile(user));
  good(
    "26, \"adult\", a correct record, and a rendered profile. None of these " +
      "needed a defensive check, because the corrupt input could not be " +
      "constructed.",
  );

  // =========================================================================
  // 5. THE COMPARISON
  // =========================================================================
  blank();
  section("Where each defect surfaces");
  table(
    ["step", "JavaScript (swapped)", "when found", "TypeScript"],
    [
      ["the call", "succeeds silently", "never", "TS2345 at argument 0"],
      ["age + 1", '"Ana1"', "never", "unreachable — the call was rejected"],
      ["age >= 18", '"minor" for an adult', "never", "unreachable"],
      ["JSON.stringify", "corrupt record persisted", "never", "unreachable"],
      ["name.trim()", "TypeError in the display layer", "runtime, elsewhere", "unreachable"],
    ],
  );

  blank();
  warn(
    "AND THE LIMIT, stated now rather than at the end: this worked because " +
      "`string` and `number` DISAGREE. Change the signature to " +
      "`aspectRatio(width: number, height: number)` and every guarantee on " +
      "this page evaporates. That is demo 04.",
  );
}
