/**
 * type-erasure.specimen.ts — the subject of the erasure experiment.
 *
 * This file exists ONLY to be compiled and then read back off disk by
 * `type-erasure.demo.ts`, which compares this source against its own emitted
 * JavaScript.
 *
 * It lives in a separate module for a reason worth stating, because the first
 * version of this demo got it wrong: if the specimen and the code that searches
 * it share a file, the search finds its own search strings. The probe for
 * "interface Customer" matched the string literal `"interface Customer"` in the
 * prober, and every construct appeared to have survived erasure. An experiment
 * has to be separable from its instrument.
 *
 * Everything below is deliberately dense with type-level syntax so that the
 * erasure is dramatic. Comments are kept minimal and free of type keywords,
 * since the emitter preserves comments and the prober strips them before
 * searching.
 */

export type Cents = number;

export type OrderStatus = "draft" | "placed" | "shipped" | "cancelled";

export interface Customer {
  readonly id: string;
  readonly email: string;
  readonly loyaltyTier: "none" | "silver" | "gold";
}

export interface Order {
  readonly id: string;
  readonly customer: Customer;
  readonly status: OrderStatus;
  readonly lineTotals: readonly Cents[];
}

export type Discountable<T extends { status: OrderStatus }> = T & {
  readonly discountBasisPoints: number;
};

/**
 * The specimen function. Six constructs appear here: a generic parameter, a
 * constraint, a named shape, a return annotation, an explicit type argument,
 * and a `satisfies` clause. Exactly one line of it does arithmetic.
 */
export function settle<T extends Order>(order: Discountable<T>, tax: number): Cents {
  const subtotal: Cents = order.lineTotals.reduce<Cents>((sum, line) => sum + line, 0);
  const discount: Cents = Math.round((subtotal * order.discountBasisPoints) / 10_000);
  const taxable = subtotal - discount;
  const rates = { standard: tax, zero: 0 } satisfies Record<string, number>;
  return taxable + Math.round(taxable * rates.standard);
}
