/**
 * 07-branded-types — THE REMEDY
 * ---------------------------------------------------------------------------
 * The blind spot exists because `width: number` and `height: number` are the
 * same type. The remedy is therefore not subtle: MAKE THEM DIFFERENT TYPES.
 *
 * A BRANDED TYPE (also: tagged, opaque, or phantom type) is an intersection of
 * a base type with an object carrying a PHANTOM MEMBER — a member that exists
 * only in the type world and is never present on the value:
 *
 *     declare const brand: unique symbol;
 *     type Brand<T, K extends string> = T & { readonly [brand]: K };
 *     type Width  = Brand<number, "Width">;
 *     type Height = Brand<number, "Height">;
 *
 * `Width` and `Height` now differ STRUCTURALLY — their `[brand]` members have
 * different literal types — so they are mutually unassignable. We did not add a
 * nominal type system to TypeScript; we ENCODED NOMINALITY STRUCTURALLY, by
 * giving each type a structure nothing else can accidentally have.
 *
 * Three properties, each verified below:
 *   1. The swap is a compile error.
 *   2. The value is still a plain number at runtime (`npm run erasure` proves it).
 *   3. Values must be constructed deliberately, via a SMART CONSTRUCTOR.
 */

import {
  section,
  ts,
  good,
  warn,
  note,
  compilerSays,
  positionTrace,
  table,
  blank,
  detonate,
  compileTimeOnly,
} from "../99-runner/trace.js";
import { proveType, proofBlock, type Equals, type Expect } from "../99-runner/type-assert.js";

// ===========================================================================
// THE BRAND MACHINERY
// ===========================================================================

/**
 * `unique symbol` rather than a string key, deliberately.
 *
 * A string key (`{ readonly __brand: "Width" }`) can be written by hand from
 * anywhere, so an object literal could forge a branded value. A `unique symbol`
 * declared in one module cannot be named outside it, which closes that door.
 */
declare const brand: unique symbol;

type Brand<T, K extends string> = T & { readonly [brand]: K };

type Width = Brand<number, "Width">;
type Height = Brand<number, "Height">;
type FirstName = Brand<string, "FirstName">;
type LastName = Brand<string, "LastName">;

/** SMART CONSTRUCTORS. The single `as` per brand lives here, under test. */
const width = (value: number): Width => {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`bad width: ${value}`);
  return value as Width;
};
const height = (value: number): Height => {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`bad height: ${value}`);
  return value as Height;
};
const firstName = (value: string): FirstName => value.trim() as FirstName;
const lastName = (value: string): LastName => value.trim() as LastName;

// ===========================================================================
// THE BRANDED API
// ===========================================================================

const aspectRatio = (w: Width, h: Height): number => w / h;
const orientationOf = (w: Width, h: Height): "landscape" | "portrait" | "square" =>
  w > h ? "landscape" : w < h ? "portrait" : "square";
const fullName = (first: FirstName, last: LastName): string => `${last}, ${first}`;

/** The blind-spot proof from demo 04, now inverted: the types are NOT equal. */
type _NoLongerTheSameType = Expect<Equals<Equals<Width, Height>, false>>;

export function runSafe(): void {
  // =========================================================================
  // 1. THE SWAP, NOW AN ERROR
  // =========================================================================
  section("The swap demo 04 could not see");

  ts("aspectRatio(height(10), width(3))");
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'Height' is not assignable to parameter
    // of type 'Width'.
    const swapped = aspectRatio(height(10), width(3));
    void swapped;
  });
  compilerSays(
    "TS2345",
    "Argument of type 'Height' is not assignable to parameter of type 'Width'.\n" +
      "    Type 'Height' is not assignable to type '{ readonly [brand]: \"Width\"; }'.\n" +
      "      Types of property '[brand]' are incompatible.\n" +
      "        Type '\"Height\"' is not assignable to type '\"Width\"'.",
    "Read the elaboration chain — it shows the entire trick. The compiler " +
      "walked into the intersection, found the phantom `[brand]` member, and " +
      "compared two string LITERAL types. Nominality, assembled out of purely " +
      "structural parts.",
  );
  good(
    "Both values are `number` at runtime. The distinction that blocks this " +
      "call exists only while `tsc` is running.",
  );

  ts("fullName(lastName('Lovelace'), firstName('Ada'))");
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'LastName' is not assignable to
    // parameter of type 'FirstName'.
    const swapped = fullName(lastName("Lovelace"), firstName("Ada"));
    void swapped;
  });
  compilerSays(
    "TS2345",
    "Argument of type 'LastName' is not assignable to parameter of type 'FirstName'.",
    "Two strings, no longer interchangeable.",
  );

  // =========================================================================
  // 2. RAW VALUES ARE ALSO REJECTED — the cost, stated honestly
  // =========================================================================
  blank();
  section("The price: raw literals no longer type-check");

  ts("aspectRatio(3, 10)   // two ordinary numbers");
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type 'number' is not assignable to parameter
    // of type 'Width'.
    const raw = aspectRatio(3, 10);
    void raw;
  });
  compilerSays(
    "TS2345",
    "Argument of type 'number' is not assignable to parameter of type 'Width'.\n" +
      "    Type 'number' is not assignable to type '{ readonly [brand]: \"Width\"; }'.",
    "This is the ergonomic cost, and it is not small: every call site must now " +
      "state which quantity it is passing. Whether that is worth paying is the " +
      "subject of demo 14 — but note that the cost is also the FEATURE. The " +
      "compiler is asking the exact question the bug depends on.",
  );

  // =========================================================================
  // 3. THE POSITION TRACE, WITH THE COLUMN FILLED IN AGAIN
  // =========================================================================
  blank();
  section("What the compiler demands at each position now");

  positionTrace([
    ["0", "w", "Width  (number & {[brand]: \"Width\"})", "height(10) → Height", "✘ TS2345"],
    ["1", "h", "Height (number & {[brand]: \"Height\"})", "width(3) → Width", "✘ (unreported — one per call)"],
  ]);
  note("    …and the correct call:");
  positionTrace([
    ["0", "w", 'Width', "width(3) → Width", "✔ assignable"],
    ["1", "h", "Height", "height(10) → Height", "✔ assignable"],
  ]);
  good(
    "Compare with demo 04's trace, where the verdict column had gone blank. " +
      "The check was always running; it simply had nothing to compare. Now it " +
      "does.",
  );

  // =========================================================================
  // 4. THE VALUES ARE STILL NUMBERS
  // =========================================================================
  blank();
  section("Zero runtime cost: a Width IS a number");

  const w = width(3);
  const h = height(10);

  proofBlock("what the compiler believes, and what the runtime holds");
  proveType<Width>()(w, "Width", "the branded type");
  proveType<number>()(w * 2, "number", "arithmetic yields plain number — the brand does not survive `*`");
  proveType<number>()(aspectRatio(w, h), "number", "the function returns an unbranded ratio");

  blank();
  detonate("typeof width(3)", () => typeof w);
  detonate("width(3) === 3", () => (w as number) === 3);
  detonate("Math.max(width(3), 5)", () => Math.max(w, 5));
  detonate("JSON.stringify({ w, h })", () => JSON.stringify({ w, h }));
  detonate("aspectRatio(w, h)", () => aspectRatio(w, h).toFixed(4));
  detonate("orientationOf(w, h)", () => orientationOf(w, h));

  good(
    "No wrapper, no `.value`, no allocation, no adapter for existing APIs. " +
      "Compare the JavaScript twin's DEFENCE 3, which bought the same " +
      "guarantee with an object per value and an unwrap at every use.",
  );
  note(
    "    Note the second proof line: `w * 2` is `number`, not `Width`. " +
      "Arithmetic strips the brand, because the result of multiplying a width " +
      "by a scalar is not automatically a width. If you want it to be, say so " +
      "— `width(w * 2)` — which forces you to think about whether it is true.",
  );

  // =========================================================================
  // 5. WHAT BRANDING DOES NOT DO
  // =========================================================================
  blank();
  section("The honest boundary");

  warn(
    "A brand is a compile-time label, so nothing at runtime can check it. " +
      "`JSON.parse(body).width as Width` is a `Width` to the compiler and a " +
      "lie to reality. This is why brands need SMART CONSTRUCTORS — the one " +
      "place where `as` appears, where validation happens, and which is worth " +
      "unit-testing. Demo 12 builds the reusable toolkit.",
  );

  blank();
  table(
    ["defence", "catches the swap?", "when", "runtime cost"],
    [
      ["naming convention", "no", "—", "none"],
      ["range check", "sometimes, by luck", "runtime", "a comparison"],
      ["wrapper objects", "yes", "runtime", "an allocation + unwrap everywhere"],
      ["JSDoc", "no", "—", "none"],
      ["**branded types**", "**yes**", "**compile time**", "**none**"],
    ],
  );
}
