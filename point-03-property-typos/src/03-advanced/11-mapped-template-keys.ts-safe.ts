/**
 * 11-mapped-template-keys — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * A MAPPED TYPE with a TEMPLATE-LITERAL key re-maps every key of `keyof T`
 * (demo 10) through a string transformation, GENERATING a brand-new property
 * map — `getId`, `getTotalCents`, `getCustomerEmail` — that did not exist as
 * literal syntax anywhere in the source. The generated map is still exactly
 * as checkable as any hand-written interface: a typo in one of the
 * GENERATED keys is caught by the same excess-property machinery as demo 03.
 */

import { section, ts, good, note, compilerSays, table, blank, shapeTrace } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface Order {
  readonly id: string;
  readonly totalCents: number;
  readonly customerEmail: string;
}

/**
 * For every key K of T, generate a new key `get${Capitalize<K>}` whose value
 * is a zero-argument accessor returning T[K]. `string & K` narrows K (which
 * TypeScript treats as `string | number | symbol` inside a mapped type) down
 * to the subset template-literal types can operate on.
 */
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

function loadOrder(): Order {
  return { id: "o-9001", totalCents: 3300, customerEmail: "hedy@example.com" };
}

export function runSafe(): void {
  const order = loadOrder();

  section("The GENERATED property map — computed, not hand-written");
  shapeTrace([
    ["keyof Order", '"id" | "totalCents" | "customerEmail"', "the source union (demo 10)"],
    ["Getters<Order>", "getId, getTotalCents, getCustomerEmail", "each key run through `get${Capitalize<K>}`"],
  ]);
  note(
    "None of 'getId', 'getTotalCents', or 'getCustomerEmail' appears as a " +
      "literal string anywhere in this file. They are COMPUTED, at the type " +
      "level, from Order's own keys — and the compiler checks object literals " +
      "against the computed result exactly as it would against any interface.",
  );

  blank();
  section("Implementing the generated shape, with one typo'd key");

  ts("const getters: Getters<Order> = { getId, getTotalCent, getCustomerEmail };");
  const getters: Getters<Order> = {
    getId: () => order.id,
    // @ts-expect-error TS2561: Object literal may only specify known
    // properties, but 'getTotalCent' does not exist in type 'Getters<Order>'.
    // Did you mean to write 'getTotalCents'?
    getTotalCent: () => order.totalCents,
    getCustomerEmail: () => order.customerEmail,
  };
  compilerSays(
    "TS2561",
    "Object literal may only specify known properties, but 'getTotalCent' does not exist in type 'Getters<Order>'. Did you mean to write 'getTotalCents'?",
    "The suggestion 'getTotalCents' was not written anywhere by a human — the " +
      "compiler generated it from 'totalCents' via the SAME template-literal " +
      "type the object is being checked against, then ran the ordinary " +
      "spelling-suggestion pass over the generated set.",
  );

  blank();
  section("The correct, fully generated implementation");
  const correctGetters: Getters<Order> = {
    getId: () => order.id,
    getTotalCents: () => order.totalCents,
    getCustomerEmail: () => order.customerEmail,
  };
  const total = correctGetters.getTotalCents();
  proveType<number>()(total, "number", "Getters<Order>['getTotalCents'] = () => Order['totalCents']");
  good(`correctGetters.getTotalCents() = ${total} — generated key, fully typed, fully checked.`);
  void getters;

  blank();
  table(
    ["source key (Order)", "generated key (Getters<Order>)", "typo of the generated key is caught?"],
    [
      ["id", "getId", "yes — TS2339/TS2551/TS2561, same as any interface"],
      ["totalCents", "getTotalCents", "yes"],
      ["customerEmail", "getCustomerEmail", "yes"],
    ],
  );
  note(
    "Add a field to 'Order' and 'Getters<Order>' grows a new accessor key " +
      "automatically — there is no second place to keep in sync, and " +
      "therefore no second place a typo could hide.",
  );
}
