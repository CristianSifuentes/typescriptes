/**
 * 10-keyof — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `keyof T` turns a type's property map into a CHECKABLE VALUE-LEVEL
 * ARTEFACT: the union of its keys as string-literal types. A generic
 * accessor constrained by `K extends keyof T` cannot be called with a string
 * that is not one of those literals — the compiler enforces it exactly like
 * every other property-name check in this project, just parameterised.
 */

import { section, ts, good, note, compilerSays, table, blank, shapeTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface Order {
  readonly id: string;
  readonly totalCents: number;
  readonly customerEmail: string;
}

function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

function loadOrder(): Order {
  return { id: "o-330", totalCents: 5200, customerEmail: "grace@example.com" };
}

export function runSafe(): void {
  const order = loadOrder();

  section("keyof Order — the property map, reified as a type");
  shapeTrace([["keyof Order", '"id" | "totalCents" | "customerEmail"', "keyof Order (derived, not hand-written)"]]);
  note(
    "This union is not typed out by hand anywhere — it is COMPUTED from " +
      "'interface Order'. Add, remove, or rename a field there, and this " +
      "union updates itself; nothing can let it drift out of sync.",
  );

  blank();
  section("Calling the generic accessor correctly");

  const total = getProperty(order, "totalCents");
  proveType<number>()(total, "number", "K = 'totalCents', so T[K] = Order['totalCents'] = number");
  good(`getProperty(order, "totalCents") = ${total}`);

  blank();
  section("Calling it with a typo'd key");

  ts('getProperty(order, "totalCent")');
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type '"totalCent"' is not
    // assignable to parameter of type 'keyof Order'.
    const bad = getProperty(order, "totalCent");
    void bad;
  });
  compilerSays(
    "TS2345",
    "Argument of type '\"totalCent\"' is not assignable to parameter of type 'keyof Order'.",
    "'totalCent' (the string) is not a MEMBER of the union 'keyof Order' " +
      "computed above. This is the same 'is this key in the map?' question as " +
      "every earlier demo, now checked at a call boundary instead of a direct " +
      "member access — because `key` is a value, not syntax, `keyof` is what " +
      "lets the checker still treat it as one.",
  );

  blank();
  section("A typo'd column list is now rejected at the array literal itself");

  ts('const columns: (keyof Order)[] = ["id", "totalCent", "customerEmail"];');
  compileTimeOnly(() => {
    const columns: (keyof Order)[] = [
      "id",
      // @ts-expect-error TS2322: Type '"totalCent"' is not assignable to type
      // 'keyof Order'.
      "totalCent",
      "customerEmail",
    ];
    void columns;
  });
  compilerSays(
    "TS2322",
    "Type '\"totalCent\"' is not assignable to type 'keyof Order'.",
    "The ENTIRE export configuration is now typed against the real property " +
      "map, so a typo'd column name is caught where the config is written — " +
      "not months later, in a blank CSV cell nobody explains.",
  );

  blank();
  section("The correct, fully-typed export");
  const columns: (keyof Order)[] = ["id", "totalCents", "customerEmail"];
  const row = columns.map((col) => String(getProperty(order, col)));
  good(`CSV row: ${row.join(",")}`);

  blank();
  table(
    ["mechanism", "what it makes checkable"],
    [
      ["property access (demos 01-09)", "a specific, syntactic '.key'"],
      ["keyof T", "'key' as a runtime VALUE, still checked against T's property map"],
      ["(keyof T)[]", "a whole configuration array of keys, checked element-wise"],
    ],
  );
}
