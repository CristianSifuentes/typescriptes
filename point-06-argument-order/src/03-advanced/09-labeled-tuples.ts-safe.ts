/**
 * 09-labeled-tuples — POSITIONS AS A TYPE
 * ---------------------------------------------------------------------------
 * A TUPLE type gives an array a fixed length and a type per index, so an
 * argument list stored in a variable keeps its ordering contract.
 *
 * A LABELED TUPLE adds names to the positions:
 *
 *     type BookingArgs = [roomId: string, checkIn: Date, checkOut: Date, guests: number];
 *
 * This demo is careful about one thing that is widely misunderstood, and it is
 * the reason the demo exists at all:
 *
 *     THE LABELS ARE DOCUMENTATION. THEY DO NO CHECKING.
 *
 * `[start: Date, end: Date]` and `[end: Date, start: Date]` are the SAME TYPE.
 * The labels improve editor hints and destructuring; they add exactly zero
 * safety. Everything the tuple buys comes from the *types* at each position —
 * so where two positions share a type, you are back in the level-02 blind spot
 * and you need brands.
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
  compileTimeOnly,
} from "../99-runner/trace.js";
import { proveType, proofBlock, type Equals, type Expect } from "../99-runner/type-assert.js";

declare const brand: unique symbol;
type Brand<T, K extends string> = T & { readonly [brand]: K };

type CheckIn = Brand<Date, "CheckIn">;
type CheckOut = Brand<Date, "CheckOut">;
const checkIn = (d: Date): CheckIn => d as CheckIn;
const checkOut = (d: Date): CheckOut => d as CheckOut;

interface Booking {
  readonly roomId: string;
  readonly nights: number;
  readonly guests: number;
}

/** Labeled tuple: fixed length, a type per index, names for humans. */
// Note: NOT `readonly`. SPREADING a readonly tuple into a rest parameter is
// fine — but ASSIGNING one to a mutable tuple is TS4104, and that is what a
// generic forwarding helper does: `withRetry<A>(fn: (...args: A) => R, args: A)`
// infers `A` from the callee's rest parameter as a mutable tuple, so a readonly
// `args` fails. Declare argument tuples mutable; declare data tuples readonly.
// (Both halves of that sentence were checked in the evidence lab; the first
// version of this comment asserted the spread failed, and it does not.)
type BookingArgs = [roomId: string, checkIn: Date, checkOut: Date, guests: number];

const bookRoom = (...args: BookingArgs): Booking => {
  const [roomId, from, to, guests] = args;
  return {
    roomId,
    nights: Math.round((to.getTime() - from.getTime()) / 86_400_000),
    guests,
  };
};

/** The branded version, where the two `Date` positions are genuinely distinct. */
type SafeBookingArgs = [roomId: string, checkIn: CheckIn, checkOut: CheckOut, guests: number];
const bookRoomSafe = (...args: SafeBookingArgs): Booking => {
  const [roomId, from, to, guests] = args;
  return {
    roomId,
    nights: Math.round((to.getTime() - from.getTime()) / 86_400_000),
    guests,
  };
};

/**
 * THE PROOF that labels are not types: these two tuple types have the same
 * element types in the same order and DIFFERENT labels, and the compiler
 * considers them equal.
 */
type LabelledOneWay = readonly [start: Date, end: Date];
type LabelledOtherWay = readonly [end: Date, start: Date];
type _LabelsAreNotTypes = Expect<Equals<LabelledOneWay, LabelledOtherWay>>;

export function runSafe(): void {
  // =========================================================================
  // 1. WHAT THE TUPLE DOES BUY
  // =========================================================================
  section("A tuple restores length and per-position types");

  const from = new Date("2026-03-01");
  const to = new Date("2026-03-05");

  const goodArgs: BookingArgs = ["r-1", from, to, 2];
  proofBlock("the argument list, as a type");
  proveType<BookingArgs>()(goodArgs, "BookingArgs", "length 4, a type per index");

  detonate("bookRoom(...goodArgs)", () => JSON.stringify(bookRoom(...goodArgs)));

  ts("const short: BookingArgs = ['r-1', from, to];   // three elements");
  compileTimeOnly(() => {
    // @ts-expect-error TS2741: Property '3' is missing in type '[string, Date, Date]' but
    // required in type '[roomId: string, checkIn: Date, checkOut: Date, guests: number]'.
    const short: BookingArgs = ["r-1", from, to];
    void short;
  });
  compilerSays(
    "TS2741",
    "Property '3' is missing in type '[string, Date, Date]' but required in " +
      "type '[roomId: string, checkIn: Date, checkOut: Date, guests: number]'.",
    "Arity, restored. The JavaScript twin's `guests: undefined` — from an " +
      "array that simply ran out of values — cannot be built.",
  );

  ts("const wrongSlot: BookingArgs = ['r-1', from, to, 'two'];");
  compileTimeOnly(() => {
    // @ts-expect-error TS2322: Type 'string' is not assignable to type 'number'.
    const wrongSlot: BookingArgs = ["r-1", from, to, "two"];
    void wrongSlot;
  });
  good(
    "Per-slot types, restored — and note that these checks happen where the " +
      "ARRAY IS BUILT, which in the JavaScript twin was a different file from " +
      "the call. The tuple type carries the contract across that boundary.",
  );

  // =========================================================================
  // 2. WHAT THE LABELS DO NOT BUY
  // =========================================================================
  blank();
  section("The labels are documentation. They do no checking.");

  note("    type LabelledOneWay   = readonly [start: Date, end: Date];");
  note("    type LabelledOtherWay = readonly [end: Date, start: Date];");
  note("    type _Proof = Expect<Equals<LabelledOneWay, LabelledOtherWay>>;  // compiles!");
  warn(
    "That alias type-checks at the top of this file. Two tuple types with the " +
      "same element types in the same order and DIFFERENT labels are the SAME " +
      "TYPE. Labels affect editor hints and destructuring names — nothing else.",
  );

  const reversed: BookingArgs = ["r-1", to, from, 2];
  detonate("bookRoom with the dates reversed", () => JSON.stringify(bookRoom(...reversed)));
  warn(
    "`nights: -4`, compiled without complaint. Both positions are `Date`, so " +
      "this is the level-02 blind spot, reached through a tuple instead of an " +
      "argument list. Labels did not help, and were never going to.",
  );

  // =========================================================================
  // 3. THE COMBINATION THAT WORKS
  // =========================================================================
  blank();
  section("Labels for humans, brands for the compiler");

  const safeArgs: SafeBookingArgs = [
    "r-1",
    checkIn(new Date("2026-03-01")),
    checkOut(new Date("2026-03-05")),
    2,
  ];
  detonate("bookRoomSafe(...safeArgs)", () => JSON.stringify(bookRoomSafe(...safeArgs)));

  ts("const reversed: SafeBookingArgs = ['r-1', checkOut(...), checkIn(...), 2];");
  compileTimeOnly(() => {
    const reversedSafe: SafeBookingArgs = [
      "r-1",
      // @ts-expect-error TS2322: Type 'CheckOut' is not assignable to type 'CheckIn'.
      checkOut(new Date("2026-03-05")),
      // @ts-expect-error TS2322: Type 'CheckIn' is not assignable to type 'CheckOut'.
      checkIn(new Date("2026-03-01")),
      2,
    ];
    void reversedSafe;
  });
  compilerSays(
    "TS2322",
    "Type 'CheckOut' is not assignable to type 'CheckIn'.",
    "Note the code: TS2322 rather than TS2345, because what is being checked " +
      "is an ARRAY LITERAL against a tuple type rather than arguments against " +
      "parameters. Note also that BOTH bad elements are reported — element-wise " +
      "checking of a literal does not stop at the first failure the way " +
      "argument checking does.",
  );
  good(
    "The reversed date range is now unrepresentable, at the point where the " +
      "array is built.",
  );

  // =========================================================================
  // 4. WHERE LABELED TUPLES EARN THEIR KEEP
  // =========================================================================
  blank();
  section("Where this technique is actually worth it");

  note(
    "    Labeled tuples are rarely the right way to declare an ordinary " +
      "function — parameters already have names. They earn their keep in " +
      "GENERIC FORWARDING, where a helper must accept and re-apply someone " +
      "else's argument list without flattening it to `any[]`:",
  );

  const withRetry = <A extends readonly unknown[], R>(
    fn: (...args: A) => R,
    args: A,
    attempts = 2,
  ): R => {
    let lastError: unknown;
    for (let i = 0; i < attempts; i += 1) {
      try {
        return fn(...args);
      } catch (error: unknown) {
        lastError = error;
      }
    }
    throw lastError;
  };

  detonate("withRetry(bookRoomSafe, safeArgs)", () =>
    JSON.stringify(withRetry(bookRoomSafe, safeArgs)),
  );

  ts("withRetry(bookRoomSafe, ['r-1', from, to, 2])   // unbranded dates");
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Type 'Date' is not assignable to type 'CheckIn'.
    const bogus = withRetry(bookRoomSafe, ["r-1", from, to, 2]);
    void bogus;
  });
  good(
    "`A extends readonly unknown[]` captures the callee's parameter list as a " +
      "tuple, so the helper stays fully typed — including the brands. This is " +
      "the pattern behind `Parameters<T>`, `bind`, and every typed " +
      "middleware/decorator you will write.",
  );

  blank();
  table(
    ["property", "plain array", "tuple", "labeled tuple", "labeled + branded"],
    [
      ["fixed length", "no", "yes", "yes", "yes"],
      ["type per position", "no", "yes", "yes", "yes"],
      ["readable slots", "no", "no", "**yes**", "yes"],
      ["catches same-typed swap", "no", "no", "**no**", "**yes**"],
      ["forwards generically", "as any[]", "yes", "yes", "yes"],
    ],
  );
  note(
    "Row 3 and row 4 are the whole lesson: labels fix the READABILITY of the " +
      "positions and brands fix the CHECKING of them. They are different jobs " +
      "and you usually want both.",
  );
}
