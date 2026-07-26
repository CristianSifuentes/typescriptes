/**
 * EVIDENCE FIXTURE — level 02 (intermediate)
 * ---------------------------------------------------------------------------
 * Excluded from `tsconfig.json`; compiled only by `tsconfig.evidence.json`
 * (`npm run evidence`). Every error below is real and unsuppressed.
 *
 * Expected outcome: compilation FAILS. That is the deliverable.
 */

// ===========================================================================
// 04 — OPTIONAL PROPERTIES VS TYPOS
// ===========================================================================

interface Order {
  readonly id: string;
  readonly totalCents: number;
  readonly note?: string;
}
declare const order: Order;

/** TS18048: 'order.note' is possibly 'undefined'. */
const noteLength = order.note.length;

/** TS2339: Property 'nots' does not exist on type 'Order'. */
const noteTypo = order.nots;

// ===========================================================================
// 05 — NESTED PROPERTY ACCESS
// ===========================================================================

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
interface FullOrder {
  readonly id: string;
  readonly customer: Customer;
}
declare const fullOrder: FullOrder;

/** TS2551: Property 'adress' does not exist on type 'Customer'. Did you mean 'address'? */
const cityViaTypo = fullOrder.customer.adress.city;

/** TS2339: Property 'ciyt' does not exist on type 'Address'. */
const cityViaDeepTypo = fullOrder.customer.address.ciyt;

// ===========================================================================
// 06 — READONLY PROPERTIES AND TYPOS IN ASSIGNMENT TARGETS
// ===========================================================================

interface Invoice {
  readonly id: string;
  readonly totalCents: number;
}
declare const invoice: Invoice;

/** TS2540: Cannot assign to 'id' because it is a read-only property. */
invoice.id = "inv-2024-0099";

/** TS2551: Property 'totlaCents' does not exist on type 'Invoice'. Did you mean 'totalCents'? */
invoice.totlaCents = 0;

// ===========================================================================
// 07 — INDEX SIGNATURES: dot access into an index-signature-resolved member
// ===========================================================================

interface FeatureFlags {
  readonly betaMode: boolean;
  readonly [key: string]: boolean;
}
declare const flags: FeatureFlags;

/** TS4111: Property 'betaMod' comes from an index signature, so it must be accessed with ['betaMod']. */
const betaTypo = flags.betaMod;

export const evidence = { noteLength, noteTypo, cityViaTypo, cityViaDeepTypo, betaTypo };
