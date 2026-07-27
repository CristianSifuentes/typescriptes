/**
 * 03-wrong-type-method — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `.toUpperCase` genuinely exists as a member — just not in `number`'s
 * property map. This is a PURE step-1 member-existence failure (like demo
 * 02), but with an important distinction worth making explicit: the
 * member's NAME is not a typo of anything on `number` — it belongs, whole
 * and correctly spelled, to a DIFFERENT type entirely. TS2339 fires with no
 * spelling suggestion, because there is nothing on `number` to suggest.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

function shout(value: string): string {
  return value.toUpperCase();
}

export function runSafe(): void {
  section("The same method name, two different property maps");
  callableTrace([
    ["\"hello\".toUpperCase", "() => string", "(this: String) => string", "a real member of String's property map"],
    ["(5).toUpperCase", "does not exist", "n/a", "number's property map has no 'toUpperCase' — belongs to String instead"],
  ]);

  blank();
  section("Calling a method that belongs to a different type");

  ts("(5).toUpperCase()");
  compileTimeOnly(() => {
    // @ts-expect-error TS2339: Property 'toUpperCase' does not exist on
    // type '5'.
    const result = (5).toUpperCase();
    void result;
  });
  compilerSays(
    "TS2339",
    "Property 'toUpperCase' does not exist on type '5'.",
    "No spelling suggestion — unlike demo 02's typo, there is no near-miss " +
      "on 'number' for the compiler to propose. 'toUpperCase' is not almost " +
      "right; it is exactly right, for an entirely different type.",
  );

  blank();
  section("The realistic version: a value of the wrong type passed to shout()");

  const inventoryCount = 42;
  ts("shout(inventoryCount)  — shout expects a string, inventoryCount is a number");
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'number' is not assignable
    // to parameter of type 'string'.
    const label = shout(inventoryCount);
    void label;
  });
  compilerSays(
    "TS2345",
    "Argument of type 'number' is not assignable to parameter of type 'string'.",
    "Notice the diagnostic moved from INSIDE 'shout' (where JavaScript's " +
      "crash occurred) to the CALL SITE, at 'shout(inventoryCount)' — " +
      "because 'shout''s parameter type makes the contract explicit, and the " +
      "caller is the one violating it. The function's own body never had " +
      "anything wrong with it.",
  );

  blank();
  section("The correct call");
  const label = shout("clearance");
  proveType<string>()(label, "string", "a string, exactly what shout's signature requires");
  good(`shout("clearance") = "${label}"`);

  blank();
  table(
    ["call", "which check fails", "diagnostic", "where it is reported"],
    [
      ["(5).toUpperCase()", "member existence on 'number'", "TS2339, no suggestion", "at the call"],
      ["shout(inventoryCount)", "argument assignability", "TS2345", "at the CALL SITE, not inside shout()"],
      ["shout(\"clearance\")", "neither — both pass", "no diagnostic", "n/a"],
    ],
  );
}
