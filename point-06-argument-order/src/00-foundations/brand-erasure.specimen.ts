/**
 * brand-erasure.specimen.ts — the subject of the erasure experiment.
 *
 * Compiled and then read back off disk by `brand-erasure.demo.ts`, which
 * compares this source with its own emitted JavaScript.
 *
 * It lives in a separate module because an experiment must be separable from
 * its instrument: if the prober and the specimen shared a file, the prober's
 * own search strings would match and every construct would appear to survive.
 *
 * Comments here are kept free of brand keywords, since the emitter preserves
 * comments and the prober strips them before searching.
 */

declare const brand: unique symbol;

export type Brand<T, K extends string> = T & { readonly [brand]: K };

export type Width = Brand<number, "Width">;
export type Height = Brand<number, "Height">;

export const width = (value: number): Width => value as Width;
export const height = (value: number): Height => value as Height;

/**
 * The specimen. Two parameters that are the same primitive at runtime and two
 * different types at compile time. Note that the body does ordinary arithmetic
 * on them — no unwrapping, no `.value`, no conversion.
 */
export function aspectRatio(w: Width, h: Height): number {
  return w / h;
}

export function scaleWidth(w: Width, factor: number): Width {
  return width(w * factor);
}
