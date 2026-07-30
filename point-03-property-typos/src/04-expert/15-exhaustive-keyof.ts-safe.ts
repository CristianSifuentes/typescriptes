/**
 * 15-exhaustive-keyof — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `{ [K in keyof T]: X }` (a HOMOMORPHIC mapped type with no key remapping)
 * requires EXACTLY one entry per key of `T` — no more, no fewer. This turns
 * "does my validators object cover every form field?" from a question a
 * human has to keep re-answering by hand into a compile-time totality check,
 * the same role `never`-exhaustiveness plays for switch statements over a
 * union (point-01, demo 10) — except the thing being exhausted here is a
 * PROPERTY SET, not a union of tags.
 */

import { section, ts, good, note, compilerSays, table, blank, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface SignupForm {
  readonly username: string;
  readonly password: string;
  readonly confirmPassword: string;
}

type Validator = (value: string) => string | null;

/** Exactly one validator per field of SignupForm — no more, no fewer. */
type Validators = { [K in keyof SignupForm]: Validator };

/**
 * A small helper whose ENTIRE purpose is to turn "is this a real field of
 * SignupForm?" into a compile-time question: `K extends keyof T` rejects any
 * string literal that is not a member of the property map (same mechanism
 * as demo 10's getProperty, applied to WRITING a validated key instead of
 * reading a value).
 */
function fieldOf<T>(key: keyof T): keyof T {
  return key;
}

export function runSafe(): void {
  section("The exhaustiveness helper: an unknown key is rejected immediately");

  ts('fieldOf<SignupForm>("usernam")');
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type '"usernam"' is not assignable
    // to parameter of type 'keyof SignupForm'.
    const bad = fieldOf<SignupForm>("usernam");
    void bad;
  });
  compilerSays(
    "TS2345",
    "Argument of type '\"usernam\"' is not assignable to parameter of type 'keyof SignupForm'.",
    "The exact same keyof-constraint mechanism as demo 10 — restated here to " +
      "show it is a general-purpose tool: ANY function that should only " +
      "accept real field names of T can be protected this way.",
  );

  blank();
  section("Totality: a validators object missing one required key");

  ts("const validators: Validators = { username: ..., password: ... };  // no confirmPassword");
  compileTimeOnly(() => {
    // @ts-expect-error TS2741: Property 'confirmPassword' is missing in type
    // '{ username: ...; password: ...; }' but required in type 'Validators'.
    const incomplete: Validators = {
      username: (v) => (v.length < 3 ? "too short" : null),
      password: (v) => (v.length < 8 ? "too short" : null),
    };
    void incomplete;
  });
  compilerSays(
    "TS2741",
    "Property 'confirmPassword' is missing in type '{ username: (v: string) => \"too short\" | null; password: (v: string) => \"too short\" | null; }' but required in type 'Validators'.",
    "This is the exhaustiveness check in action: 'Validators' has ONE key " +
      "per key of 'SignupForm', so omitting any of them — not just a typo, an " +
      "outright OMISSION — is caught the moment the object is written, not " +
      "the moment a user leaves that field unvalidated.",
  );

  blank();
  section("A typo instead of an omission: the same excess-property check as demo 03");

  ts('confirmPasword (missing the second "s") instead of confirmPassword');
  compileTimeOnly(() => {
    const alsoIncomplete: Validators = {
      username: (v) => (v.length < 3 ? "too short" : null),
      password: (v) => (v.length < 8 ? "too short" : null),
      // @ts-expect-error TS2561: Object literal may only specify known
      // properties, but 'confirmPasword' does not exist in type 'Validators'.
      // Did you mean to write 'confirmPassword'?
      confirmPasword: (v: string) => null,
    };
    void alsoIncomplete;
  });
  compilerSays(
    "TS2561",
    "Object literal may only specify known properties, but 'confirmPasword' does not exist in type 'Validators'. Did you mean to write 'confirmPassword'?",
    "Omission (TS2741) and misspelling (TS2561) are different shapes of the " +
      "same underlying fact — 'confirmPassword' has no validator — caught by " +
      "the two complementary checks this project has dissected throughout: " +
      "required-member checking and excess-property checking.",
  );

  blank();
  section("The correct, exhaustive validators object");
  const validators: Validators = {
    username: (v) => (v.length < 3 ? "too short" : null),
    password: (v) => (v.length < 8 ? "too short" : null),
    confirmPassword: (v) => (v.length === 0 ? "required" : null),
  };
  proveType<Validators>()(validators, "Validators", "exactly one validator per SignupForm field, nothing more, nothing less");
  good("Every field of SignupForm is covered — provably, not by convention.");

  blank();
  table(
    ["defect", "TypeScript diagnostic"],
    [
      ["unknown key passed to a keyof-constrained function", "TS2345"],
      ["a required field's validator is missing entirely", "TS2741 — totality check"],
      ["a validator key is misspelled", "TS2561 — excess-property check"],
      ["every field covered, correctly spelled", "no diagnostic — proceeds"],
    ],
  );
  note(
    "Add a new field to 'SignupForm' tomorrow and 'Validators' grows a new " +
      "required key automatically — every existing validators object " +
      "anywhere in the codebase that hasn't been updated fails to compile, " +
      "exactly like adding a union member breaks an un-updated exhaustive " +
      "switch (point-01, demo 10).",
  );
}
