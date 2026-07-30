/**
 * 05-nested-chain — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * Each `.` in a member-access chain is resolved independently, left to
 * right, against the property map of whatever type the PREVIOUS segment
 * produced. A typo at any depth is caught exactly where it occurs, and the
 * diagnostic names the type that was actually being checked at that point —
 * not the type at the end of the chain.
 */

import { section, ts, good, note, compilerSays, table, blank, shapeTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface Address {
  readonly street: string;
  readonly city: string;
  readonly postalCode: string;
}

interface Customer {
  readonly id: string;
  readonly fullName: string;
  readonly address: Address;
}

interface Order {
  readonly id: string;
  readonly customer: Customer;
  readonly totalCents: number;
}

function loadOrder(): Order {
  return {
    id: "o-77",
    customer: {
      id: "c-1",
      fullName: "Katherine Johnson",
      address: { street: "1 Langley Blvd", city: "Hampton", postalCode: "23666" },
    },
    totalCents: 8800,
  };
}

export function runSafe(): void {
  const order = loadOrder();

  section("Three property maps, checked at three independent steps");
  shapeTrace([
    ["Order", "id, customer, totalCents", "resolves the '.customer' step"],
    ["Customer", "id, fullName, address", "resolves the '.address' step"],
    ["Address", "street, city, postalCode", "resolves the '.city' step"],
  ]);
  note("`order.customer.address.city` is three lookups, not one — each against a different map.");

  blank();
  section("A typo ONE level in: caught at that exact level");

  ts("order.customer.adress.city");
  compileTimeOnly(() => {
    // @ts-expect-error TS2551: Property 'adress' does not exist on type
    // 'Customer'. Did you mean 'address'?
    const city = order.customer.adress.city;
    void city;
  });
  compilerSays(
    "TS2551",
    "Property 'adress' does not exist on type 'Customer'. Did you mean 'address'?",
    "The diagnostic is reported against 'Customer' — the type of the segment " +
      "immediately BEFORE the typo — not against 'Order' or 'Address'. The " +
      "chain is resolved left to right, and the error lands at the exact link " +
      "that broke.",
  );

  blank();
  section("A typo TWO levels in: caught there too, not at the top");

  ts("order.customer.address.ciyt");
  compileTimeOnly(() => {
    // @ts-expect-error TS2339: Property 'ciyt' does not exist on type 'Address'.
    const city = order.customer.address.ciyt;
    void city;
  });
  compilerSays(
    "TS2339",
    "Property 'ciyt' does not exist on type 'Address'.",
    "In JavaScript this typo was the SILENT one — no crash, because there was " +
      "nothing further to dereference. Here it is caught with exactly the same " +
      "certainty as the crashing one above: depth never changes whether the " +
      "compiler notices.",
  );

  blank();
  section("A typo at the TOP: still caught at its own level, not two hops downstream");

  ts("order.custmer.address.city");
  compileTimeOnly(() => {
    // @ts-expect-error TS2551: Property 'custmer' does not exist on type
    // 'Order'. Did you mean 'customer'?
    const city = order.custmer.address.city;
    void city;
  });
  compilerSays(
    "TS2551",
    "Property 'custmer' does not exist on type 'Order'. Did you mean 'customer'?",
    "JavaScript's crash for this one landed on '.address', TWO tokens away " +
      "from the actual mistake. TypeScript's diagnostic lands on 'custmer' " +
      "itself — the cause, not a downstream symptom.",
  );

  blank();
  section("The correct chain");
  const city = order.customer.address.city;
  proveType<string>()(city, "string", "three resolved links: Order -> Customer -> Address -> string");
  good(`City: "${city}" — resolved through three property maps, zero typos, zero crashes.`);

  blank();
  table(
    ["typo location", "JavaScript outcome", "TypeScript diagnostic (reported AT the typo)"],
    [
      ["order.customer.adress.city", "TypeError, 1 hop downstream", "TS2551 on 'Customer'"],
      ["order.customer.address.ciyt", "silent undefined, 0 hops", "TS2339 on 'Address'"],
      ["order.custmer.address.city", "TypeError, 2 hops downstream", "TS2551 on 'Order'"],
    ],
  );
  note("Depth changes JavaScript's behaviour. It changes nothing about TypeScript's.");
}
