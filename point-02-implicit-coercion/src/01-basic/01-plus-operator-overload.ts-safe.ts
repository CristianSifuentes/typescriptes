/**
 * 01-plus-operator-overload — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * TypeScript does NOT forbid `+` on a `string` and a `number`. Forbidding it
 * would outlaw `"Page " + pageNumber`, an ordinary and intentional program.
 * What it does is type the RESULT precisely:
 *
 *   number + number  → number
 *   string + anything → string
 *   anything + string → string
 *
 * So the checkout bug is not caught at the `+` — it is caught the moment the
 * (correctly-typed) `string` result tries to flow into something that
 * expects a `number`. That is `+`'s entire safety story: it is honest about
 * what it produced, and the checker takes it from there.
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
import { proveType, proofBlock } from "../99-runner/type-assert.js";

/** The DOM's own type: every form field value is `string`. TypeScript does
 *  not lie about this — `HTMLInputElement.value` really is typed `string`. */
interface QuantityField {
  readonly value: string;
}

function readQuantityInput(): QuantityField {
  return { value: "3" };
}

export function runSafe(): void {
  const unitPrice = 19.99;
  const quantityField = readQuantityInput();

  // =========================================================================
  // 1. THE BUG, AS TYPESCRIPT SEES IT
  // =========================================================================
  section("`+` is accepted — its result is typed `string`");

  const concatenated = unitPrice + quantityField.value;
  proofBlock('the type of `unitPrice + quantityField.value`');
  proveType<string>()(concatenated, "string", "string operand ⇒ concatenation, not addition");
  warn(
    "No error on this line, and there should be none: this IS valid string " +
      'concatenation. The bug is not the `+` — it is calling the result "total".',
  );

  blank();
  ts("const total: number = unitPrice + quantityField.value;");
  // @ts-expect-error TS2322: Type 'string' is not assignable to type 'number'.
  const total: number = unitPrice + quantityField.value;
  void total;
  compilerSays(
    "TS2322",
    "Type 'string' is not assignable to type 'number'.",
    "The `+` produced a value one step downstream from where it is consumed. " +
      "Because `total` is annotated `number`, the string has nowhere to go. " +
      "The gap between defect and diagnostic is exactly one line.",
  );

  // =========================================================================
  // 2. THE RULE, PRECISELY — every combination `+` accepts or rejects
  // =========================================================================
  blank();
  section("The typing rule for `+`, exhaustively");
  table(
    ["left", "right", "TypeScript result type", "verdict"],
    [
      ["number", "number", "number", "accepted"],
      ["string", "anything", "string", "accepted"],
      ["anything", "string", "string", "accepted"],
      ["bigint", "bigint", "bigint", "accepted"],
      ["number", "boolean", "—", "ERROR TS2365"],
      ["number", "null / undefined", "—", "ERROR TS18050/TS18049 (strictNullChecks)"],
      ["number", "bigint", "—", "ERROR TS2365 (mixing numeric kinds is also rejected)"],
    ],
  );
  note(
    "Every other arithmetic operator has ONE rule: both operands numeric, or " +
      "TS2362/TS2363 (demo 02). `+` has this two-branch rule instead, because " +
      "unlike `-`/`*`/`/`, string concatenation via `+` is not a mistake to " +
      "eliminate — it is half of the operator's job.",
  );

  // =========================================================================
  // 3. THE PROGRAM THAT COMPILES
  // =========================================================================
  blank();
  section("Doing it properly: parse once, at the boundary");

  /** The one function allowed to look at `quantityField.value` as text. */
  function parseQuantity(field: QuantityField): number {
    const parsed = Number(field.value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new RangeError(`invalid quantity: "${field.value}"`);
    }
    return parsed;
  }

  const quantity = parseQuantity(quantityField);
  proofBlock("after parsing at the boundary");
  proveType<number>()(quantity, "number", "Number() + a finiteness/range check");

  const checkoutTotal: number = unitPrice * quantity;
  proveType<number>()(checkoutTotal, "number", "number * number is multiplication, unambiguously");

  blank();
  detonate("checkout total", () => checkoutTotal);
  good("59.97 for 3 units at $19.99 — the number the customer will actually be charged.");

  blank();
  note(
    "The lesson is not 'never use +'. It is: `+` tells the truth about its " +
      "result type, and truthful types are what let the compiler catch the " +
      "mistake one line later instead of never.",
  );
}
