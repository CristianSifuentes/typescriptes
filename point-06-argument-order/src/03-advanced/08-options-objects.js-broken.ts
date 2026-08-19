// @ts-nocheck
/**
 * 08-options-objects — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * An options object is the oldest remedy for argument order, and it predates
 * TypeScript by decades: replace a positional list with a single object whose
 * fields are named, so ORDER STOPS BEING A CONCEPT.
 *
 * It genuinely helps in JavaScript — a named field is readable, and you cannot
 * transpose two fields of an object literal. But plain JavaScript gives it no
 * enforcement, so it trades one silent failure for two others:
 *
 *   • a MISSING field is `undefined`, exactly like a missing argument;
 *   • a MISSPELLED field is silently ignored, and the intended field is
 *     `undefined` — a failure mode positional arguments do not even have.
 *
 * DOMAIN: a report generator with six parameters — the case where positional
 * style has clearly stopped working.
 */

import { section, js, note, detonate, table, blank, warn } from "../99-runner/trace.js";

// --- the positional version, at the size where it becomes unusable ----------
function generateReportPositional(title, startDate, endDate, includeCharts, groupBy, currency) {
  return {
    title,
    range: `${startDate}..${endDate}`,
    charts: includeCharts ? "yes" : "no",
    groupBy,
    currency,
  };
}

// --- the options-object version --------------------------------------------
function generateReport(options) {
  return {
    title: options.title,
    range: `${options.startDate}..${options.endDate}`,
    charts: options.includeCharts ? "yes" : "no",
    groupBy: options.groupBy,
    currency: options.currency,
  };
}

export function runBroken(): void {
  section("Six positional parameters: the point where order becomes unmanageable");

  js("generateReportPositional('Q1', '2026-01-01', '2026-03-31', true, 'region', 'EUR')");
  detonate("report", () =>
    JSON.stringify(
      generateReportPositional("Q1", "2026-01-01", "2026-03-31", true, "region", "EUR"),
    ),
  );

  blank();
  js("the same call with startDate and endDate exchanged");
  detonate("report", () =>
    JSON.stringify(
      generateReportPositional("Q1", "2026-03-31", "2026-01-01", true, "region", "EUR"),
    ),
  );
  note(
    "A backwards date range. Four of the six parameters are strings, so this " +
      "is the level-02 blind spot at scale: 4! = 24 orderings of the string " +
      "parameters alone, all accepted.",
  );

  blank();
  js("and the same call with groupBy and currency exchanged");
  detonate("report", () =>
    JSON.stringify(
      generateReportPositional("Q1", "2026-01-01", "2026-03-31", true, "EUR", "region"),
    ),
  );
  warn(
    "Grouped by \"EUR\", denominated in \"region\". Both fields are strings, " +
      "both accepted, and the output is a plausible-looking report object.",
  );

  blank();
  section("The options object removes ORDER as a concept");

  js("fields written in the natural order");
  detonate("report", () =>
    JSON.stringify(
      generateReport({
        title: "Q1",
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        includeCharts: true,
        groupBy: "region",
        currency: "EUR",
      }),
    ),
  );

  js("the same fields, written in a completely different order");
  detonate("report", () =>
    JSON.stringify(
      generateReport({
        currency: "EUR",
        includeCharts: true,
        endDate: "2026-03-31",
        groupBy: "region",
        title: "Q1",
        startDate: "2026-01-01",
      }),
    ),
  );
  note(
    "Identical results. This is the win, and it is a real one: there is no " +
      "ordering mistake left to make, because there is no ordering.",
  );

  blank();
  section("…and introduces two failures of its own");

  js("a MISSING field");
  detonate("report", () =>
    JSON.stringify(generateReport({ title: "Q1", startDate: "2026-01-01" })),
  );
  note(
    '"undefined..undefined" and `groupBy: undefined`. Exactly the missing-' +
      "argument failure, wearing different clothes.",
  );

  blank();
  js("a MISSPELLED field");
  detonate("report", () =>
    JSON.stringify(
      generateReport({
        title: "Q1",
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        includeCharts: true,
        groupBy: "region",
        currancy: "EUR",
      }),
    ),
  );
  warn(
    "`currency: undefined`. The typo'd key was accepted into the object and " +
      "silently ignored, and the intended field is missing. Positional " +
      "arguments do not even HAVE this failure mode — options objects add it.",
  );

  blank();
  section("The trade, in plain JavaScript");
  table(
    ["failure", "positional", "options object (plain JS)"],
    [
      ["wrong order", "silent corruption", "**impossible — no order exists**"],
      ["missing value", "`undefined` bound", "`undefined` read"],
      ["misspelled name", "n/a", "**silently ignored — a NEW failure**"],
      ["readable call site", "no", "**yes**"],
      ["enforcement", "none", "none"],
    ],
  );
  note(
    "Options objects are the right idea and JavaScript cannot finish it. The " +
      "TypeScript twin adds the missing column: enforcement, by NAME, at " +
      "compile time.",
  );
}
