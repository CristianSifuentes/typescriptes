/**
 * 05-property-not-function — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `config.retry()` is checked against `HttpClientConfig`'s property map:
 * `retry`'s declared type is `number`, which has no call signature — the
 * same TS2349 as demo 01, reached this time through a realistic mixed
 * data/callback configuration object instead of a bare variable.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface HttpClientConfig {
  readonly retry: number;
  readonly timeoutMs: number;
  readonly onRetry: (attempt: number) => void;
}

function loadConfig(): HttpClientConfig {
  return {
    retry: 3,
    timeoutMs: 5000,
    onRetry: (attempt) => console.log(`retry #${attempt}`),
  };
}

function performRequest(config: HttpClientConfig): void {
  for (let attempt = 1; attempt <= config.retry; attempt++) {
    config.onRetry(attempt);
  }
}

export function runSafe(): void {
  const config = loadConfig();

  section("Two fields, two very different call signatures");
  callableTrace([
    ["config.retry", "number", "none — number has no call signatures", "a data field, never meant to be called"],
    ["config.onRetry", "(attempt: number) => void", "(attempt: number) => void", "a real callback field"],
  ]);

  blank();
  section("Calling the data field");

  ts("config.retry()");
  compileTimeOnly(() => {
    // @ts-expect-error TS2349: This expression is not callable.
    //   Type 'Number' has no call signatures.
    const result = config.retry();
    void result;
  });
  compilerSays(
    "TS2349",
    "This expression is not callable.\n  Type 'Number' has no call signatures.",
    "Same diagnostic as demo 01's 'retryBudget()' — reached this time " +
      "through 'HttpClientConfig''s property map instead of a bare " +
      "variable. The mechanism does not care how many '.'s came before the " +
      "call; it only cares about the final expression's type.",
  );

  blank();
  section("The correctly-written request loop");

  const log: number[] = [];
  performRequest({ ...config, onRetry: (attempt) => log.push(attempt) });
  proveType<number[]>()(log, "number[]", "config.retry used as a LIMIT (comparison), config.onRetry used as a CALL");
  good(`performRequest ran attempts: [${log.join(", ")}] — retry read, onRetry called, each correctly.`);

  blank();
  table(
    ["expression", "field's actual type", "used as", "TypeScript diagnostic"],
    [
      ["config.retry()", "number", "a call", "TS2349"],
      ["config.retry (in a comparison)", "number", "a value", "no diagnostic"],
      ["config.onRetry(attempt)", "(attempt: number) => void", "a call", "no diagnostic"],
    ],
  );
  note(
    "The fix for the JavaScript bug ('attempt <= config.retry()' meant to be " +
      "'attempt <= config.retry') is exactly the diagnostic's location: the " +
      "stray '()' is flagged the instant it is typed, in the loop condition " +
      "itself — not three call-stack frames later.",
  );
}
