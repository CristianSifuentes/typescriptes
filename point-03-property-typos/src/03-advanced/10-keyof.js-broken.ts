// @ts-nocheck
/**
 * 10-keyof — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A generic "get any field by name" helper — the kind of utility a CSV
 * export or a dynamic table renderer needs. In JavaScript, `key` is just a
 * string; ANY string compiles, so a typo in a column name is discovered only
 * when the exported report has a blank column.
 *
 * DOMAIN: exporting selected order fields to a CSV row.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function getProperty(obj, key) {
  return obj[key];
}

function loadOrder() {
  return { id: "o-330", totalCents: 5200, customerEmail: "grace@example.com" };
}

export function runBroken(): void {
  const order = loadOrder();

  section("Reading fields by name, generically");

  js('getProperty(order, "totalCents")  — correct column name');
  detonate('getProperty(order, "totalCents")', () => getProperty(order, "totalCents"));

  blank();
  js('getProperty(order, "totalCent")  — column name typo\'d in a config array');
  detonate('getProperty(order, "totalCent")', () => getProperty(order, "totalCent"));
  runtimeSays(
    "no error at all",
    "undefined, silently. Nothing about calling a GENERIC accessor with a " +
      "typo'd string looks any different from calling it correctly.",
  );

  blank();
  section("Building a CSV row from a column list");

  const columns = ["id", "totalCent", "customerEmail"]; // typo baked into config
  js("columns.map(col => getProperty(order, col))");
  detonate("csv row", () => columns.map((col) => getProperty(order, col)).join(","));
  note("One blank cell in every exported row, forever, until a human notices.");

  blank();
  table(
    ["column requested", "exists on order?", "csv cell"],
    [
      ["id", "yes", "o-330"],
      ["totalCent", "NO (typo)", "(blank)"],
      ["customerEmail", "yes", "grace@example.com"],
    ],
  );
}
