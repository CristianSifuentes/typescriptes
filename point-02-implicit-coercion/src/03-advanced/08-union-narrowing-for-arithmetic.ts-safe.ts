/**
 * 08-union-narrowing-for-arithmetic — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `string | number` is a UNION type — the compiler must assume EITHER member
 * could show up at runtime, so an operation is only legal if it is legal for
 * every member (the same rule `point-01-type-errors` demo 08 applies to
 * method calls). Arithmetic operators require both operands to be `any`,
 * `number`, `bigint`, or an enum — `string | number` fails that requirement
 * because one of its members, `string`, does not qualify. TypeScript rejects
 * the operation BEFORE either branch of "sometimes a string" gets a chance
 * to reach production.
 *
 * The fix is control-flow narrowing (`point-01-type-errors` demo 07):
 * `typeof weight === "number"` removes `string` from the union inside the
 * `if`, leaving a bare `number` the operator accepts.
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

interface SupplierItem {
  readonly sku: string;
  readonly weightGrams: string | number; // the API's documented inconsistency, typed honestly
}

export function runSafe(): void {
  // =========================================================================
  // 1. THE REDUCE, REJECTED AT THE OPERATOR
  // =========================================================================
  section("Summing a union-typed field: rejected before any coercion runs");

  function totalShippingWeightBroken(items: readonly SupplierItem[]): number {
    ts("items.reduce((sum, item) => sum + item.weightGrams, 0)");
    return items.reduce((sum, item) => {
      // @ts-expect-error TS2365: Operator '+' cannot be applied to types 'number' and
      // 'string | number'.
      return sum + item.weightGrams;
    }, 0);
  }
  void totalShippingWeightBroken;
  compilerSays(
    "TS2365",
    "Operator '+' cannot be applied to types 'number' and 'string | number'.",
    "The union has a `string` member, and an operation on a union is only " +
      "legal if it is legal for EVERY member. `number + string` is not a " +
      "legal `+` in numeric position, so the union as a whole is rejected — " +
      "regardless of which member a given item actually holds at runtime.",
  );

  // =========================================================================
  // 2. THE FIX: NARROW BEFORE COMPUTING
  // =========================================================================
  blank();
  section("Narrowing collapses the union to exactly `number`");

  function toGrams(weightGrams: string | number): number {
    ts('typeof weightGrams === "number" ? weightGrams : Number(weightGrams)');
    if (typeof weightGrams === "number") {
      proofBlock("inside the true branch");
      proveType<number>()(weightGrams, "number", "the typeof guard removed `string` from the union");
      return weightGrams;
    }
    proofBlock("inside the false branch");
    proveType<string>()(weightGrams, "string", "the ONLY member left once `number` is excluded");
    const parsed = Number(weightGrams);
    if (!Number.isFinite(parsed)) {
      throw new TypeError(`weightGrams is not numeric: ${JSON.stringify(weightGrams)}`);
    }
    return parsed;
  }

  function totalShippingWeightSafe(items: readonly SupplierItem[]): number {
    return items.reduce((sum, item) => sum + toGrams(item.weightGrams), 0);
  }

  const todaysItem: SupplierItem = { sku: "SKU-9", weightGrams: 450 };
  const nextWeeksItem: SupplierItem = { sku: "SKU-9", weightGrams: "450" };

  detonate("total (today)", () => totalShippingWeightSafe([todaysItem]));
  detonate("total (next week)", () => totalShippingWeightSafe([nextWeeksItem]));
  detonate("total (mixed batch)", () => totalShippingWeightSafe([todaysItem, nextWeeksItem]));
  good("450, 450, and 900 — every shape of the union converges on the same correct arithmetic.");

  // =========================================================================
  // 3. THE GENERAL RULE
  // =========================================================================
  blank();
  section("The rule, stated generally");
  table(
    ["union type", "arithmetic operator", "verdict", "why"],
    [
      ["number", "+ - * /", "accepted", "the only member is numeric"],
      ["string | number", "+ - * /", "rejected", "the `string` member disqualifies the whole union"],
      ["number | number (redundant)", "+ - * /", "accepted", "reduces to `number`"],
      ["string | number, narrowed to number", "+ - * /", "accepted", "narrowing physically removed the `string` member"],
    ],
  );
  note(
    "This is not a special rule for arithmetic — it is the SAME 'valid for " +
      "every union member' principle that governs method calls on unions " +
      "(point-01-type-errors, demo 08). Arithmetic operators are simply one " +
      "more operation subject to it.",
  );
}
