// @ts-nocheck
/**
 * 15-exhaustive-keyof — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A validators object is supposed to have exactly one entry per form field.
 * JavaScript has no notion of "this object must have one key per field of
 * that OTHER object" — a forgotten field, or a typo'd one, is just a smaller
 * (or differently-shaped) object, silently.
 *
 * DOMAIN: client-side validation for a signup form.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

const validators = {
  username: (v) => (v.length < 3 ? "too short" : null),
  password: (v) => (v.length < 8 ? "too short" : null),
  // 'confirmPassword' was never added here — nothing pointed that out.
};

function validateForm(form) {
  const errors = {};
  for (const field of Object.keys(form)) {
    const validate = validators[field];
    errors[field] = validate ? validate(form[field]) : null;
  }
  return errors;
}

export function runBroken(): void {
  section("Validating a form with a field that has no validator");

  const form = { username: "ab", password: "short", confirmPassword: "mismatch" };
  js("validateForm(form)");
  detonate("validateForm(form)", () => validateForm(form));
  runtimeSays(
    "no error at all",
    "'confirmPassword' silently validates as `null` (no error) no matter " +
      "what is typed into it, because 'validators.confirmPassword' is " +
      "undefined and the code treats a missing validator as 'valid'.",
  );

  blank();
  section("The validators object vs the form it is supposed to cover");
  table(
    ["form field", "has a validator?", "consequence"],
    [
      ["username", "yes", "validated correctly"],
      ["password", "yes", "validated correctly"],
      ["confirmPassword", "NO", "always reports 'no error', regardless of input"],
    ],
  );
  note(
    "This is an exhaustiveness bug, not a single-value bug: the whole FIELD " +
      "is unprotected, silently, for every user, forever, until someone adds " +
      "the missing validator by hand.",
  );
}
