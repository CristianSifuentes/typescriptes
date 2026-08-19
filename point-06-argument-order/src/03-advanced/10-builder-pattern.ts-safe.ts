/**
 * 10-builder-pattern — TYPE-STATE BUILDERS
 * ---------------------------------------------------------------------------
 * A builder eliminates argument order by construction: every value arrives
 * through its own named method, so there are no positions to transpose. Two
 * `number`s that would be indistinguishable as `limit` and `offset` parameters
 * are perfectly distinguishable as `.limit(10)` and `.offset(20)`.
 *
 * The JavaScript twin showed the two holes this leaves — incomplete builds and
 * duplicate steps — plus one it introduces: STEP order.
 *
 * TypeScript closes all three with TYPE-STATE: each step returns a type that
 * records what has been supplied so far, so
 *
 *   • `build` is typed `never` — and so uncallable — until every required
 *     value is present;
 *   • a step already taken is no longer offered;
 *   • a step with prerequisites is only offered once they are met.
 *
 * This is the same "make illegal states unrepresentable" idea as a
 * discriminated union, applied to a construction sequence rather than to a
 * value.
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
import { proveType, proofBlock } from "../99-runner/type-assert.js";

interface Query {
  readonly sql: string;
}

/**
 * TYPE-STATE ENCODING.
 *
 * The builder is generic over a union of the step names already taken. Each
 * method (a) is only available when its prerequisites are in the set, (b)
 * removes itself from the returned type, and (c) adds its own name to the set.
 */
type Step = "from" | "where" | "limit" | "offset";

interface QueryBuilder<Taken extends Step> {
  /** Available once; the `Omit` in the return type removes it afterwards. */
  from(table: string): Omit<QueryBuilder<Taken | "from">, "from">;
  where(field: string, value: string): Omit<QueryBuilder<Taken | "where">, never>;
  limit(rows: number): Omit<QueryBuilder<Taken | "limit">, "limit">;
  offset(rows: number): Omit<QueryBuilder<Taken | "offset">, "offset">;
  /** Only present once BOTH `from` and `where` have been taken. */
  build: "from" extends Taken ? ("where" extends Taken ? () => Query : never) : never;
}

function queryBuilder(): Omit<QueryBuilder<never>, "build"> {
  const filters: string[] = [];
  let table = "";
  let limitRows: number | undefined;
  let offsetRows: number | undefined;

  const api = {
    from(name: string) {
      table = name;
      return api;
    },
    where(field: string, value: string) {
      filters.push(`${field}='${value}'`);
      return api;
    },
    limit(rows: number) {
      limitRows = rows;
      return api;
    },
    offset(rows: number) {
      offsetRows = rows;
      return api;
    },
    build(): Query {
      return {
        sql:
          `SELECT * FROM ${table} WHERE ${filters.join(" AND ")}` +
          (limitRows === undefined ? "" : ` LIMIT ${limitRows}`) +
          (offsetRows === undefined ? "" : ` OFFSET ${offsetRows}`),
      };
    },
  };
  // The single assertion in the pattern: the runtime object is one mutable
  // shape, while the type system sees a sequence of narrowing views of it.
  return api as unknown as Omit<QueryBuilder<never>, "build">;
}

export function runSafe(): void {
  // =========================================================================
  // 1. THE WIN: NO POSITIONS TO TRANSPOSE
  // =========================================================================
  section("Two same-typed values, made unswappable by naming the methods");

  const a = queryBuilder().from("orders").where("status", "paid").limit(10).offset(20).build();
  const b = queryBuilder().from("orders").where("status", "paid").offset(20).limit(10).build();

  proofBlock("both chains, both complete");
  proveType<Query>()(a, "Query", "limit then offset");
  proveType<Query>()(b, "Query", "offset then limit");

  blank();
  detonate("limit(10).offset(20)", () => a.sql);
  detonate("offset(20).limit(10)", () => b.sql);
  good(
    "Identical. `limit` and `offset` are both `number` — the level-02 blind " +
      "spot — but they arrive through DIFFERENT METHODS, so there is no " +
      "position to get wrong. The method name does the job a parameter name " +
      "could not do.",
  );

  // =========================================================================
  // 2. HOLE 1 CLOSED: `build` is uncallable until the value is complete
  // =========================================================================
  blank();
  section("An incomplete build is not a runtime error — it is an uncallable member");

  ts("queryBuilder().limit(10).build()   // no table, no filter");
  compileTimeOnly(() => {
    // @ts-expect-error TS2349: This expression is not callable.
    const incomplete = queryBuilder().limit(10).build();
    void incomplete;
  });
  compilerSays(
    "TS2349",
    "This expression is not callable.\n    Type 'never' has no call signatures.",
    "Be precise about what happened, because the section heading overstates " +
      "it slightly: `build` IS a member of the type. The conditional collapses " +
      "its TYPE to `never` until both `from` and `where` are in the set, so " +
      "the property ACCESS succeeds and the CALL is what fails. (The " +
      "duplicate-step case below is the other kind: `Omit` genuinely removes " +
      "the member, and the access itself is TS2339.)",
  );

  ts("queryBuilder().from('orders').build()   // table but no filter");
  compileTimeOnly(() => {
    // @ts-expect-error TS2349: This expression is not callable.
    const noFilter = queryBuilder().from("orders").build();
    void noFilter;
  });
  note(
    "    Same code, one step further along: `from` is taken but `where` is " +
      "not, so `build` is still typed `never`.",
  );
  good(
    "`SELECT * FROM undefined WHERE  LIMIT 10` — the nonsense string from the " +
      "JavaScript twin — is now unconstructible.",
  );

  // =========================================================================
  // 3. HOLE 2 CLOSED: a step already taken is no longer offered
  // =========================================================================
  blank();
  section("Duplicate steps: removed from the type, not silently overwritten");

  ts("queryBuilder().from('orders').from('customers')");
  compileTimeOnly(() => {
    // @ts-expect-error TS2339: Property 'from' does not exist on type
    // 'Omit<QueryBuilder<"from">, "from">'.
    const twice = queryBuilder().from("orders").from("customers");
    void twice;
  });
  compilerSays(
    "TS2339",
    "Property 'from' does not exist on type 'Omit<QueryBuilder<\"from\">, \"from\">'.",
    "`Omit<…, \"from\">` is doing the work: each step returns a view of the " +
      "builder with itself removed. The editor's autocomplete list shrinks as " +
      "you type — the type is guiding the call rather than merely checking it.",
  );

  // =========================================================================
  // 4. WHAT THE TYPE LOOKS LIKE AT EACH STEP
  // =========================================================================
  blank();
  section("The type-state, step by step");

  table(
    ["after", "`Taken` is", "`build` is", "still offered"],
    [
      ["queryBuilder()", "never", "removed by Omit", "from, where, limit, offset"],
      [".from('orders')", '"from"', "never (not callable)", "where, limit, offset"],
      [".where('status','paid')", '"from" | "where"', "**() => Query**", "where, limit, offset"],
      [".limit(10)", '… | "limit"', "() => Query", "where, offset"],
      [".offset(20)", '… | "offset"', "() => Query", "where"],
    ],
  );
  note(
    "    Row 3 is where `build` appears. The transition is computed by a " +
      "conditional type, so the API's shape is a FUNCTION of the steps taken.",
  );

  // =========================================================================
  // 5. THE HONEST COSTS
  // =========================================================================
  blank();
  section("What this pattern costs");

  warn(
    "(a) THE ASSERTION. `return api as unknown as …` — one double assertion, in " +
      "the factory. The runtime object is a single mutable shape while the type " +
      "system sees a sequence of narrowing views of it, and nothing checks that " +
      "the two stories agree. It is the demo-13 hole, deliberately taken, in " +
      "one auditable place.",
  );
  warn(
    "(b) TYPE COMPLEXITY. `Omit<QueryBuilder<Taken | \"limit\">, \"limit\">` is " +
      "not beginner-readable, error messages get long, and the compiler does " +
      "real work at each step. Weigh that against the API's blast radius: this " +
      "is worth it for a library used by hundreds of call sites, and overkill " +
      "for a helper used twice.",
  );
  warn(
    "(c) IT IS STILL A SEQUENCE. A builder converts argument order into STEP " +
      "order. Type-state fixes the steps that have prerequisites; it does not " +
      "make the concept of ordering disappear the way an options object does.",
  );

  blank();
  table(
    ["problem", "positional", "options object", "builder + type-state"],
    [
      ["argument order", "silent corruption", "eliminated", "eliminated"],
      ["same-typed values", "needs brands", "needs brands", "**method names suffice**"],
      ["incomplete input", "TS2554", "TS2739", "`build` typed `never` (TS2349)"],
      ["duplicate value", "n/a", "TS1117 duplicate key", "method removed from type"],
      ["step prerequisites", "n/a", "n/a", "**encoded in the type**"],
      ["readability", "poor", "good", "**best — reads as prose**"],
      ["cost", "none", "one interface", "**generic type-state machinery**"],
    ],
  );
  good(
    "Row 2 is why builders belong in this project at all: they are the only " +
      "remedy here that separates two same-typed values WITHOUT branding them.",
  );
}
