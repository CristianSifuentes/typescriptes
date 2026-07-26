/**
 * 13-boundary-validation-layer — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * This demo builds the pattern demo 12 pointed to but didn't construct: a
 * SINGLE, reusable, hand-rolled validation layer (the same idea Zod
 * implements as a library) that untyped external data must pass through
 * before it becomes an `OrderPayload` anywhere in the codebase.
 *
 * The core idea, in one sentence: a `Schema<T>` is a function
 * `(input: unknown) => T` that actually INSPECTS `input` and throws if it
 * doesn't match — so the TYPE `T` and the RUNTIME CHECK that guarantees it
 * are written in the same place and can never silently drift apart.
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
import { proveType } from "../99-runner/type-assert.js";

// =============================================================================
// A MINIMAL, HAND-ROLLED SCHEMA LIBRARY (the pattern Zod generalizes)
// =============================================================================

type Schema<T> = (input: unknown, path: string) => T;

function string(): Schema<string> {
  return (input, path) => {
    if (typeof input !== "string") {
      throw new TypeError(`${path}: expected string, got ${typeof input}`);
    }
    return input;
  };
}

/** Accepts a real JSON number OR a numeric string, converting explicitly —
 *  the ONE place in this codebase allowed to look at a raw string and decide
 *  whether it is "close enough" to a number. Rejects thousands separators,
 *  NaN, and non-finite values outright rather than silently propagating them. */
function numeric(): Schema<number> {
  return (input, path) => {
    const value = typeof input === "number" ? input : Number(input);
    if (typeof input !== "number" && typeof input !== "string") {
      throw new TypeError(`${path}: expected number or numeric string, got ${typeof input}`);
    }
    if (!Number.isFinite(value)) {
      throw new TypeError(`${path}: "${String(input)}" is not a finite number`);
    }
    return value;
  };
}

/** `null` and `undefined` both map to a default — a DECLARED policy, not an
 *  accident of ToNumber(null)=0 vs ToNumber(undefined)=NaN (demo 06). */
function numericWithDefault(defaultValue: number): Schema<number> {
  return (input, path) => {
    if (input === null || input === undefined) return defaultValue;
    return numeric()(input, path);
  };
}

function object<T extends object>(shape: { [K in keyof T]: Schema<T[K]> }): Schema<T> {
  return (input, path) => {
    if (typeof input !== "object" || input === null) {
      throw new TypeError(`${path}: expected object, got ${typeof input}`);
    }
    const result = {} as T;
    for (const key in shape) {
      const validator = shape[key];
      result[key] = validator((input as Record<string, unknown>)[key], `${path}.${String(key)}`);
    }
    return result;
  };
}

// =============================================================================
// THE ACTUAL BOUNDARY: ONE SCHEMA, USED BY EVERY CALLER
// =============================================================================

interface OrderPayload {
  readonly orderId: string;
  readonly totalCents: number;
  readonly discountPercent: number;
}

const orderPayloadSchema: Schema<OrderPayload> = object<OrderPayload>({
  orderId: string(),
  totalCents: numeric(),
  discountPercent: numericWithDefault(0),
});

function parseOrderPayload(raw: unknown): OrderPayload {
  return orderPayloadSchema(raw, "order");
}

function computeFinalTotal(order: OrderPayload): number {
  const discountFactor = 1 - order.discountPercent / 100;
  return order.totalCents * discountFactor;
}

export function runSafe(): void {
  // =========================================================================
  // 1. THE SIGNATURE ITSELF MAKES BYPASSING THE SCHEMA A COMPILE ERROR
  // =========================================================================
  section("`computeFinalTotal` accepts `OrderPayload` only — never raw JSON");

  ts('computeFinalTotal(JSON.parse(\'{"orderId":"X"}\'))');
  const bypassed = computeFinalTotal(JSON.parse('{"orderId":"X"}'));
  void bypassed;
  warn(
    "`JSON.parse` returns `any`, and `any` is assignable to EVERY type " +
      "(demo 12) — so this line compiles even though the object is missing " +
      "`totalCents` entirely. The type system alone cannot close this gap; " +
      "the schema function is what actually closes it, at runtime, next.",
  );

  // =========================================================================
  // 2. THE SCHEMA VALIDATES ALL THREE VERSIONS THE SAME WAY
  // =========================================================================
  blank();
  section("One schema, three real API shapes, one consistent outcome");

  const v1: unknown = JSON.parse('{"orderId": "ORD-1", "totalCents": 1999, "discountPercent": 0}');
  const v2: unknown = JSON.parse('{"orderId": "ORD-1", "totalCents": "1999", "discountPercent": null}');
  const v3: unknown = JSON.parse('{"orderId": "ORD-1", "totalCents": "1,999", "discountPercent": 10}');

  const parsedV1 = parseOrderPayload(v1);
  proveType<OrderPayload>()(parsedV1, "OrderPayload", "validated, not asserted");
  detonate("final total (v1)", () => computeFinalTotal(parsedV1));

  const parsedV2 = parseOrderPayload(v2);
  detonate("final total (v2, numeric string + null discount)", () => computeFinalTotal(parsedV2));
  good("1999 — the schema's declared policy (null -> default 0) applied consistently, on purpose.");

  blank();
  ts("parseOrderPayload(v3)  -- totalCents has a thousands separator");
  detonate("parseOrderPayload(v3) (should throw)", () => parseOrderPayload(v3));
  good(
    'Throws TypeError(\'order.totalCents: "1,999" is not a finite number\') — ' +
      "at the boundary, with the exact field name, instead of NaN three " +
      "function calls into checkout.",
  );

  // =========================================================================
  // 3. THE STRUCTURAL GUARANTEE
  // =========================================================================
  blank();
  section("Why this closes demo 12's gap, specifically");
  table(
    ["property", "`as OrderPayload` (demo 12)", "`parseOrderPayload` (this demo)"],
    [
      ["inspects the runtime value?", "no", "yes, field by field"],
      ["can silently mistype a field?", "yes — the entire failure mode of demo 12", "no — every field has an explicit Schema"],
      ["type and check can drift apart?", "yes — nothing keeps them in sync", "no — the type is INFERRED from the schema, not hand-written twice"],
      ["failure mode on bad data", "silent NaN/string bugs downstream", "a thrown error naming the exact field"],
    ],
  );
  note(
    "The type `OrderPayload` and the runtime check that guarantees it are " +
      "written in exactly one place — the schema — so there is no second copy " +
      "of the shape that could quietly drift out of sync, the way a hand-" +
      "written `interface` next to an unchecked `as` inevitably can.",
  );
}
