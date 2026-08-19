// @ts-nocheck
/**
 * 10-builder-pattern — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A builder replaces a positional argument list with a chain of NAMED METHOD
 * CALLS, so every value is labelled at the call site by the method that
 * receives it:
 *
 *     query().from("orders").where("status", "paid").limit(10).build()
 *
 * There is no position to get wrong: `.limit(10)` cannot be mistaken for
 * `.offset(10)` because they are different methods.
 *
 * In JavaScript the pattern still has three unguarded holes, and this file
 * shows all three:
 *
 *   1. INCOMPLETE builds — `build()` runs whether or not you set everything.
 *   2. DUPLICATE steps — calling `.from()` twice silently keeps the last.
 *   3. WRONG-ORDER steps that matter — when a step depends on an earlier one.
 *
 * DOMAIN: a query builder and a rectangle builder.
 */

import { section, js, note, detonate, table, blank, warn, runtimeSays } from "../99-runner/trace.js";

function queryBuilder() {
  const state = { table: undefined, filters: [], limit: undefined, offset: undefined };
  const api = {
    from(name) {
      state.table = name;
      return api;
    },
    where(field, value) {
      state.filters.push(`${field}=${value}`);
      return api;
    },
    limit(n) {
      state.limit = n;
      return api;
    },
    offset(n) {
      state.offset = n;
      return api;
    },
    build() {
      return `SELECT * FROM ${state.table} WHERE ${state.filters.join(" AND ")} LIMIT ${state.limit} OFFSET ${state.offset}`;
    },
  };
  return api;
}

export function runBroken(): void {
  section("What the builder DOES fix, even in plain JavaScript");

  js("query().from('orders').where('status','paid').limit(10).offset(20).build()");
  detonate("sql", () =>
    queryBuilder().from("orders").where("status", "paid").limit(10).offset(20).build(),
  );

  blank();
  js("the same chain with the two numbers written in the other order");
  detonate("sql", () =>
    queryBuilder().from("orders").where("status", "paid").offset(20).limit(10).build(),
  );
  note(
    "IDENTICAL. This is the builder's real win and it is a big one: `limit(10)` " +
      "and `offset(20)` are two `number`s — the level-02 blind spot — but they " +
      "arrive through DIFFERENT METHODS, so there is no position to transpose. " +
      "The method name does the job a parameter name could not.",
  );

  blank();
  section("HOLE 1 — an incomplete build runs anyway");

  detonate("build() with no table and no filters", () => queryBuilder().limit(10).build());
  warn(
    "`SELECT * FROM undefined WHERE  LIMIT 10 OFFSET undefined`. Syntactically " +
      "a string, semantically nonsense, and it will be sent to a database " +
      "driver that will reject it at runtime — or worse, a query builder that " +
      'interprets "undefined" as a table name.',
  );

  blank();
  section("HOLE 2 — duplicate steps silently overwrite");

  detonate("from() called twice", () =>
    queryBuilder().from("orders").from("customers").where("id", 1).limit(1).offset(0).build(),
  );
  note(
    "The first `from` is silently discarded. In a long chain assembled across " +
      "several helper functions, this is genuinely hard to see.",
  );

  blank();
  section("HOLE 3 — steps whose order actually matters");

  detonate("a rectangle builder that scales before the width is set", () => {
    function rect() {
      const s = { w: undefined, h: undefined };
      const api = {
        width(v) {
          s.w = v;
          return api;
        },
        height(v) {
          s.h = v;
          return api;
        },
        scale(f) {
          s.w = s.w * f;
          s.h = s.h * f;
          return api;
        },
        area() {
          return s.w * s.h;
        },
      };
      return api;
    }
    return rect().scale(2).width(10).height(3).area();
  });
  runtimeSays(
    "no error — the result is 30",
    "`scale(2)` ran while both dimensions were `undefined`, so it computed " +
      "`undefined * 2` = NaN into both fields, and then `width`/`height` " +
      "overwrote them. The scale was silently lost. A builder removes " +
      "ARGUMENT order and can quietly introduce STEP order.",
  );

  blank();
  table(
    ["problem", "positional args", "builder (plain JS)"],
    [
      ["argument order", "silent corruption", "**eliminated — no positions**"],
      ["readable call site", "no", "**yes — method names**"],
      ["incomplete input", "`undefined` bound", "`undefined` in the output"],
      ["duplicate value", "n/a", "silently overwrites"],
      ["step order", "n/a", "**a new failure mode**"],
      ["enforcement", "none", "none"],
    ],
  );
  note(
    "The builder trades one problem for two smaller ones. The TypeScript twin " +
      "closes both with TYPE-STATE: each step returns a type that records what " +
      "has been set, so `build()` does not exist until the value is complete.",
  );
}
