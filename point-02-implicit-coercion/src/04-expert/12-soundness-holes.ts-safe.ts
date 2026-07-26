/**
 * 12-soundness-holes — THE TYPESCRIPT VERSION (checked — and where "checked" stops meaning anything)
 * ---------------------------------------------------------------------------
 * Every previous demo in this project showed TypeScript BLOCKING an invalid
 * mixed-type operation. This demo shows the two places that protection can
 * be switched off, on purpose or by habit, with ZERO diagnostics:
 *
 *   1. `as SomeType`   — an assertion the compiler does not verify or emit a
 *                         runtime check for. It silences the checker; it does
 *                         not inform it.
 *   2. `any`            — disables checking for that value AND everything it
 *                         touches, contagiously, through inference.
 *
 * Neither line below needs `@ts-expect-error`, because neither PRODUCES an
 * error. That absence of red squiggles is the entire lesson: `strict: true`
 * proves things about the SOURCE TEXT you wrote, not about the DATA your
 * program receives at runtime — and `as`/`any` are exactly the two places
 * where you tell the compiler to stop trying to reconcile the two.
 */

import {
  section,
  ts,
  good,
  warn,
  note,
  table,
  blank,
  detonate,
} from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface OrderResponse {
  readonly totalCents: number;
  readonly items: number;
}

export function runSafe(): void {
  // =========================================================================
  // 1. `as` REOPENS THE DOOR, WITH THE COMPILER'S FULL COOPERATION
  // =========================================================================
  section('`JSON.parse(...) as OrderResponse` — a claim, not a proof');

  const responseBody = '{"totalCents": "1999", "items": 3}'; // totalCents is a STRING in the real payload

  ts("JSON.parse(responseBody) as OrderResponse");
  const parsed = JSON.parse(responseBody) as OrderResponse;
  proveType<number>()(parsed.totalCents, "number", "the COMPILER believes this — the runtime value disagrees");
  warn(
    "No error anywhere on this line. `JSON.parse` returns `any`, and `as` " +
      "converts that `any` into whatever type you name, WITHOUT running any " +
      "check. `strict: true` is fully satisfied — every rule from demos 01-11 " +
      "is switched off for this value, because none of them ever gets to see it.",
  );

  blank();
  ts("parsed.totalCents + parsed.items");
  const total = parsed.totalCents + parsed.items;
  proveType<number>()(total, "number", "STILL what the compiler believes");
  detonate("total (the compiler thinks this is arithmetic)", () => total);
  note(
    '"19993" at runtime — the exact same string-concatenation bug demos 01 ' +
      "and 02 exist to prevent, now running INSIDE a fully `strict` file with " +
      "zero diagnostics, because `as` told the checker to stop looking.",
  );

  // =========================================================================
  // 2. `any` IS CONTAGIOUS — IT SPREADS THROUGH EVERYTHING IT TOUCHES
  // =========================================================================
  blank();
  section("`any` disables every rule in this project, and it spreads");

  function readConfigValue(key: string): any {
    const raw: Record<string, string> = { discountPercent: "15", saleTag: "SUMMER" };
    return raw[key]; // declared to return `any` — a common, easy-to-miss pattern
  }

  const discount = readConfigValue("discountPercent"); // inferred type: any
  ts("basePrice * discount   -- `discount` is `any`, so EVERY arithmetic rule is off");
  const discounted = 80 * discount;
  detonate("discounted (no TS2363 here — `any` is exempt from every rule)", () => discounted);
  note(
    '1200 — correct, this time, purely by luck: "15" happens to parse. `any` ' +
      "bypasses TS2362/TS2363 (demo 02) uniformly, so nothing distinguishes " +
      "this from the next line.",
  );

  blank();
  const saleTag = readConfigValue("saleTag"); // also `any` — same function, different key
  ts("basePrice * saleTag   -- SAME function, SAME lack of checking, different key");
  detonate("corrupted (no TS2363 here either)", () => 80 * saleTag);
  note(
    "NaN — `any` bypassed the check identically for both calls; only the " +
      "runtime CONTENT differed. The exemption PROPAGATES: `discount`, " +
      "`saleTag`, and every value derived from either are `any` too, unless a " +
      "later line explicitly re-annotates them.",
  );

  // =========================================================================
  // 3. THE ONE THING THAT ACTUALLY WORKS: VALIDATE, DON'T ASSERT
  // =========================================================================
  blank();
  section("The fix: `unknown` + a real check, instead of `as` + a hope");

  function parseOrderResponse(raw: unknown): OrderResponse {
    if (
      typeof raw === "object" &&
      raw !== null &&
      "totalCents" in raw &&
      "items" in raw &&
      typeof (raw as { totalCents: unknown }).totalCents === "number" &&
      typeof (raw as { items: unknown }).items === "number"
    ) {
      return raw as OrderResponse; // the ONLY `as` in this function — justified
                                     // by the typeof checks immediately above it
    }
    throw new TypeError("malformed OrderResponse");
  }

  ts("parseOrderResponse(JSON.parse(responseBody))");
  detonate("parseOrderResponse (should throw — totalCents is a string)", () =>
    parseOrderResponse(JSON.parse(responseBody)),
  );
  good(
    "Throws TypeError('malformed OrderResponse') — LOUDLY, at the boundary, " +
      "instead of silently producing \"19993\" three lines into business logic.",
  );

  // =========================================================================
  // 4. THE HONEST SUMMARY
  // =========================================================================
  blank();
  section("What actually protects a value from coercion bugs");
  table(
    ["mechanism", "checks the VALUE at runtime?", "protects against coercion bugs?"],
    [
      ["a type annotation", "no", "only if the annotated type happens to be true"],
      ["`as SomeType`", "no", "no — actively hides a mismatch from the checker"],
      ["`any`", "no", "no — and it spreads to everything it touches"],
      ["`typeof`/`in` checks on `unknown`", "yes", "yes"],
      ["a schema validator (demo 13)", "yes", "yes, and it documents the shape too"],
    ],
  );
  note(
    "This is the manifesto's §4 in concrete form: TypeScript is a proof about " +
      "the code you wrote. `as` and `any` are how you tell it to stop " +
      "proving anything about a specific value — and it will comply, silently, " +
      "every time.",
  );
}
