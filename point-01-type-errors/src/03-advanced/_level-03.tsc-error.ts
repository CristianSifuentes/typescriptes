/**
 * EVIDENCE FIXTURE — level 03 (advanced)
 * Compiled only by `tsconfig.evidence.json`. Every error below is real.
 * Run: `npm run evidence`
 */

// ===========================================================================
// 07/08 — UNIONS AND NARROWING
// ===========================================================================

declare const cacheKey: string | number;

/** TS2339: Property 'toUpperCase' does not exist on type 'string | number'.
 *  Property 'toUpperCase' does not exist on type 'number'.
 *  An operation is valid on a union only if it is valid for EVERY member. */
const shouted = cacheKey.toUpperCase();

/** TS2365 / TS2362: arithmetic on a union that includes a non-numeric member. */
const doubled = cacheKey * 2;

declare const maybeName: string | undefined;

/** TS18048: 'maybeName' is possibly 'undefined'. */
const nameLength = maybeName.length;

/** Narrowing is per-branch: outside the guard the union is restored. */
function outsideTheBranch(value: string | number): number {
  if (typeof value === "string") {
    // fine here
  }
  // TS2362: value is `string | number` again — the narrowing did not escape.
  return value * 2;
}

/** The `else` branch narrows to the complement, so THIS is the wrong one. */
function wrongBranch(value: string | number): string {
  if (typeof value === "string") {
    // TS2339: Property 'toFixed' does not exist on type 'string'.
    return value.toFixed(2);
  }
  return String(value);
}

/** Narrowing of a mutable binding does NOT survive into a deferred callback:
 *  the callback may run after another assignment. */
function narrowingInAClosure(): void {
  let name: string | null = "ada";
  if (name !== null) {
    // TS18047: 'name' is possibly 'null'.
    queueMicrotask(() => console.log(name.length));
  }
  name = null;
}

/** NO DIAGNOSTIC — deliberately. Truthiness narrows out more than people
 *  expect (`0` and `""` are falsy), so this function silently ignores a
 *  deliberate `retries: 0`. It is type-correct and semantically wrong: the
 *  compiler has nothing to object to. Kept here as the control specimen that
 *  marks the boundary of what a type checker can do — use
 *  `retries !== undefined` if you mean presence. */
function truthinessIsNotPresence(retries: number | undefined): number {
  if (retries) return retries;
  return 3; // reached when retries === 0, which was a deliberate setting
}

/** TS2339: reading a member that exists on only ONE union member, in the
 *  branch where the narrowing went the other way. */
function reversedGuard(value: string | number): number {
  if (typeof value !== "number") {
    return value.toFixed(2);
  }
  return value;
}

// ===========================================================================
// 09 — USER-DEFINED TYPE GUARDS
// ===========================================================================

interface HttpSuccess {
  readonly kind: "success";
  readonly status: 200;
  readonly body: string;
}
interface HttpFailure {
  readonly kind: "failure";
  readonly status: 400 | 404 | 500;
  readonly error: string;
}
type HttpResponse = HttpSuccess | HttpFailure;

/** TS2677: A type predicate's type must be assignable to its parameter's type.
 *  Type 'HttpSuccess' is not assignable to type 'number'. */
function badPredicate(value: number): value is HttpSuccess {
  return typeof value === "object";
}

declare const response: HttpResponse;

/** TS2339: Property 'body' does not exist on type 'HttpResponse'.
 *  Property 'body' does not exist on type 'HttpFailure'.
 *  — reading a member before discriminating. */
const bodyBeforeCheck = response.body;

// ===========================================================================
// 10 — `never` AND EXHAUSTIVENESS
// ===========================================================================

type OrderState = "draft" | "placed" | "shipped" | "cancelled";

function assertNever(value: never): never {
  throw new Error(`unhandled case: ${JSON.stringify(value)}`);
}

/** TS2345: Argument of type '"cancelled"' is not assignable to parameter of
 *  type 'never'. — the switch forgot a case, so the residual set is NOT empty
 *  and the compiler names the exact member that is missing. */
function label(state: OrderState): string {
  switch (state) {
    case "draft":
      return "Draft";
    case "placed":
      return "Placed";
    case "shipped":
      return "Shipped";
    default:
      return assertNever(state);
  }
}

/** TS2678: a `case` label that is not a member of the switched union — a typo
 *  in a case label is caught as a type error, not as a dead branch. */
function typoInACaseLabel(state: OrderState): string {
  switch (state) {
    case "draft":
      return "Draft";
    case "palced":
      return "Placed";
    default:
      return "?";
  }
}

/** TS2322: Type 'string' is not assignable to type 'never'.
 *  Nothing at all is assignable to the empty set. */
declare const impossible: never;
function widenNever(): never {
  return "surely this is fine" as unknown as never;
}
const assignToNever: never = "no";

/** TS2367: This comparison appears to be unintentional because the types
 *  '"draft" | "placed"' and '"shipped"' have no overlap.
 *  The compiler detects a comparison that can never be true. */
declare const narrowState: "draft" | "placed";
const impossibleComparison = narrowState === "shipped";

export const evidence = {
  shouted,
  doubled,
  nameLength,
  outsideTheBranch,
  wrongBranch,
  narrowingInAClosure,
  truthinessIsNotPresence,
  reversedGuard,
  badPredicate,
  bodyBeforeCheck,
  label,
  typoInACaseLabel,
  impossible,
  widenNever,
  assignToNever,
  impossibleComparison,
};
