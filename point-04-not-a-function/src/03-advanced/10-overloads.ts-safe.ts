/**
 * 10-overloads — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `findOrder` declares two OVERLOAD SIGNATURES — the set of call shapes it
 * publicly supports — plus one wider IMPLEMENTATION signature that is never
 * itself part of the public contract. A call is checked against the overload
 * list top to bottom; if NONE of the declared overloads accept the supplied
 * argument types, the call is rejected outright with TS2769, regardless of
 * what the (wider, permissive) implementation signature might have accepted.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface Order {
  readonly id: number;
  readonly status: "shipped" | "pending";
}

const ORDERS: readonly Order[] = [
  { id: 1, status: "shipped" },
  { id: 2, status: "pending" },
];

// Overload signatures — the ONLY call shapes callers may use:
function findOrder(id: number): Order | undefined;
function findOrder(filter: { status: Order["status"] }): Order | undefined;
// Implementation signature — deliberately wider, never directly callable:
function findOrder(criteria: number | { status: Order["status"] }): Order | undefined {
  if (typeof criteria === "number") {
    return ORDERS.find((o) => o.id === criteria);
  }
  return ORDERS.find((o) => o.status === criteria.status);
}

export function runSafe(): void {
  section("The declared overload list");
  callableTrace([
    ["findOrder", "(id: number) => Order | undefined", "overload 1", "call by id"],
    ["findOrder", "(filter: {status}) => Order | undefined", "overload 2", "call by filter"],
    ["findOrder", "(criteria: number | {status}) => ...", "implementation only — not callable directly", "the wider signature the body actually uses"],
  ]);

  blank();
  section("Calling with a shape that matches NEITHER overload");

  ts("findOrder((o) => o.status === 'pending')");
  compileTimeOnly(() => {
    // @ts-expect-error TS2769: No overload matches this call.
    findOrder((o: Order) => o.status === "pending");
  });
  compilerSays(
    "TS2769",
    "No overload matches this call.",
    "The compiler tried EVERY declared overload — '(id: number)' and " +
      "'(filter: {status})' — against the supplied function argument, and " +
      "both rejected it. Crucially, the wider implementation signature " +
      "('number | {status}') is NEVER consulted for external callers — " +
      "declaring overloads means the public contract is exactly the listed " +
      "shapes, nothing wider, even though the body could technically handle " +
      "more.",
  );

  blank();
  section("Calling in each declared shape");

  const byId = findOrder(1);
  proveType<Order | undefined>()(byId, "Order | undefined", "matched overload 1 — (id: number)");
  good(`findOrder(1) → ${byId ? `order #${byId.id}` : "not found"}`);

  const byFilter = findOrder({ status: "pending" });
  proveType<Order | undefined>()(byFilter, "Order | undefined", "matched overload 2 — (filter: {status})");
  good(`findOrder({ status: "pending" }) → ${byFilter ? `order #${byFilter.id}` : "not found"}`);

  blank();
  table(
    ["argument shape", "matches a declared overload?", "outcome"],
    [
      ["number (id)", "yes — overload 1", "compiles, returns Order | undefined"],
      ["object (filter)", "yes — overload 2", "compiles, returns Order | undefined"],
      ["function (comparator)", "no", "TS2769 — rejected before it can return `undefined` silently"],
    ],
  );
  note(
    "The JavaScript version's failure mode was WORSE than a crash: it " +
      "returned `undefined` with no signal at all, deferring the eventual " +
      "'is not a function' to whatever called findOrder. Overload resolution " +
      "converts 'silently wrong shape' into 'rejected before it runs.'",
  );
}
