/**
 * 03-nonexistent-method — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * MECHANISM: static member resolution.
 *
 * JavaScript resolves `x.foo` by walking the prototype chain of the VALUE at
 * runtime. TypeScript resolves it by looking `foo` up in the declared members
 * of the TYPE at compile time. Same question, asked in a different phase — and
 * the phase is everything:
 *
 *   runtime lookup fails  → produces `undefined`, then maybe a TypeError later
 *   compile lookup fails  → produces a diagnostic, now, at the exact character
 *
 * Crucially, TypeScript makes the READ itself an error. That closes the gap in
 * which JavaScript's `undefined` is free to travel through the program.
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

interface UserRecord {
  readonly id: number;
  readonly email: string;
  readonly displayName: string;
  readonly loyaltyPoints: number;
}

function loadUserRecord(): UserRecord {
  return {
    id: 90210,
    email: "ada@example.com",
    displayName: "Ada Lovelace",
    loyaltyPoints: 1420,
  };
}

export function runSafe(): void {
  const user = loadUserRecord();

  // =========================================================================
  // 1. THE CANONICAL CASE
  // =========================================================================
  section("(5).toUpperCase() — resolved statically");

  ts("(5).toUpperCase()");
  compileTimeOnly(() => {
    // @ts-expect-error TS2339: Property 'toUpperCase' does not exist on type '5'.
    const shouted = (5).toUpperCase();
    void shouted;
  });
  compilerSays(
    "TS2339",
    "Property 'toUpperCase' does not exist on type '5'.",
    "The receiver is reported as the literal type '5', not 'number'. The " +
      "checker resolves members against `Number` (and `Object`) and finds no " +
      "`toUpperCase`. In JavaScript the identical lookup happens against " +
      "Number.prototype at runtime, yields `undefined`, and the call throws.",
  );
  good("The TypeError became a compile error at the exact offending character.");

  // =========================================================================
  // 2. THE READ IS AN ERROR — this is the important part
  // =========================================================================
  blank();
  section("The property READ, not just the call");

  ts("user.emailAdress   // the read alone, no call");
  // @ts-expect-error TS2339: Property 'emailAdress' does not exist on type 'UserRecord'.
  const typo = user.emailAdress;
  void typo;
  compilerSays(
    "TS2339",
    "Property 'emailAdress' does not exist on type 'UserRecord'.",
    "In JavaScript this expression is perfectly legal and evaluates to " +
      "`undefined` — objects are open, and an absent property is " +
      "indistinguishable from one holding `undefined`. TypeScript closes that " +
      "door: reading a member the type does not declare is itself the error, " +
      "so the `undefined` is never created and cannot travel.",
  );

  ts("user.displayName.trimm()");
  compileTimeOnly(() => {
    // @ts-expect-error TS2551: Property 'trimm' does not exist on type 'string'.
    // Did you mean 'trim'?
    const trimmed = user.displayName.trimm();
    void trimmed;
  });
  compilerSays(
    "TS2551",
    "Property 'trimm' does not exist on type 'string'. Did you mean 'trim'?",
    "TS2551 rather than TS2339 because the checker found a near-miss member " +
      "and can suggest it. The suggestion engine fires only below an " +
      "edit-distance threshold relative to identifier length — which is why " +
      "'trimm'→'trim' gets a hint and 'emailAdress'→'email' does not.",
  );

  ts("user.id.toUpperCase()");
  compileTimeOnly(() => {
    // @ts-expect-error TS2339: Property 'toUpperCase' does not exist on type 'number'.
    const loudId = user.id.toUpperCase();
    void loudId;
  });
  compilerSays(
    "TS2339",
    "Property 'toUpperCase' does not exist on type 'number'.",
    "Right property name, wrong receiver type. Static resolution checks both.",
  );

  // =========================================================================
  // 3. WHAT THE COMPILER KNOWS, PROVED
  // =========================================================================
  blank();
  section("The correct program, with every type machine-verified");

  proofBlock("member types of UserRecord");
  proveType<number>()(user.id, "number", "declared in the interface");
  proveType<string>()(user.email, "string", "declared in the interface");
  proveType<string>()(user.displayName.trim(), "string", "`trim` exists and returns string");
  proveType<string>()(String(user.id), "string", "explicit conversion, not coercion");

  blank();
  const greeting = `Hi ${user.displayName}, ${user.loyaltyPoints} points`;
  detonate("greeting", () => greeting);
  good('No "Hi undefined" can be constructed: every interpolated member is declared.');

  // =========================================================================
  // 4. THE GAP, MEASURED
  // =========================================================================
  blank();
  section("Distance between defect and diagnostic");
  table(
    ["expression", "JavaScript", "TypeScript", "gap"],
    [
      ["(5).toUpperCase", "undefined, silent", "TS2339", "0 characters"],
      ["(5).toUpperCase()", "TypeError at runtime", "TS2339", "0 characters"],
      ["user.emailAdress", "undefined, silent", "TS2339", "0 characters"],
      ["user.emailAdress.trim()", "TypeError, later, elsewhere", "TS2339 at the read", "0 characters"],
      ["`Hi ${user.emailAdress}`", '"Hi undefined" mailed to a human', "TS2339", "0 characters"],
      ["user.displayName.trimm()", "TypeError at runtime", "TS2551 + suggestion", "0 characters"],
    ],
  );
  note(
    "Every JavaScript row has a non-zero, sometimes unbounded gap between the " +
      "line that is wrong and the line that reports it. Every TypeScript row " +
      "has a gap of zero. That distance is what a compile-time check buys.",
  );

  blank();
  note(
    "LIMIT: this guarantee covers values whose type TypeScript actually knows. " +
      "A value from `JSON.parse` is `any` and every member access on it is " +
      "permitted — including `emailAdress`. See 04-expert/12-soundness-holes.",
  );
}
