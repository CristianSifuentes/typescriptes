/**
 * EVIDENCE FIXTURE — level 01 (basic)
 * ---------------------------------------------------------------------------
 * Compiled only by `tsconfig.evidence.json` (`npm run evidence`). Every error
 * below is real and unsuppressed: no `@ts-ignore`, no `@ts-expect-error`.
 *
 * Level 01 is the good news: when two swapped parameters have DIFFERENT types,
 * positional checking catches the swap at the exact argument that is wrong.
 *
 * Expected outcome: compilation FAILS. That failure is the deliverable.
 */

// ===========================================================================
// 01 — THE CANONICAL SWAP
// ===========================================================================

interface User {
  readonly name: string;
  readonly age: number;
}

function createUser(name: string, age: number): User {
  return { name, age };
}

/** TS2345: Argument of type 'number' is not assignable to parameter of type
 *  'string'.
 *
 *  IMPORTANT AND COUNTER-INTUITIVE: this call has TWO wrong arguments and
 *  produces exactly ONE diagnostic. For a call with a single (non-overloaded)
 *  signature the checker reports the FIRST mismatching position and stops
 *  checking that call — fixing it reveals the next one.
 *
 *  So the error message never says "these arguments look swapped". It says
 *  "position 0 is wrong". The swap is an inference YOU make from the message;
 *  the compiler only reports positions. */
const swappedUser = createUser(25, "Ana");

/** Also one diagnostic, and at the same position — the two calls are
 *  indistinguishable from the message alone. */
const halfSwapped = createUser(25, 25);

// ===========================================================================
// 02 — POSITIONAL BINDING: ARITY, OPTIONALS, RESTS, SPREADS
// ===========================================================================

function scheduleJob(name: string, runAt: Date, retries = 3, ...tags: string[]): string {
  return `${name}@${runAt.toISOString()} r=${retries} [${tags.join(",")}]`;
}

/** TS2555: Expected at least 2 arguments, but got 1.
 *  Arity is checked before positions can be. Note the code: because `tags` is
 *  a REST parameter the signature has no upper bound, so the compiler emits
 *  TS2555 ("at least N") rather than TS2554 ("expected N"). A fixed-arity
 *  signature gives TS2554 instead — same defect, two codes, depending on
 *  whether the parameter list is bounded. */
const tooShort = scheduleJob("sync");

/** TS2345: the optional parameter is still POSITIONAL — passing the tag where
 *  `retries` lives does not "skip" it. */
const misplacedOptional = scheduleJob("sync", new Date(), "urgent");

/** TS2345: rest parameters do not relax the positions before them. */
const restDoesNotHelp = scheduleJob(new Date(), "sync", 1, "a", "b");

/** A spread of a plain array cannot satisfy fixed positions: the compiler
 *  knows the length only as `number`. */
const args = ["sync", new Date()];
const spreadOfArray = scheduleJob(...args);

/** A spread of a TUPLE can: the tuple's positions map onto the parameters,
 *  and a wrongly-ordered tuple is caught exactly like wrongly-ordered
 *  arguments. */
const badTuple: [Date, string] = [new Date(), "sync"];
const spreadOfBadTuple = scheduleJob(...badTuple);

// ===========================================================================
// OVERLOADS: the same rule, noisier output
// ===========================================================================

function parseRange(start: Date, end: Date): string;
function parseRange(start: string, end: string): string;
function parseRange(start: Date | string, end: Date | string): string {
  return `${String(start)}..${String(end)}`;
}

/** When NO overload matches, the message changes shape: the compiler reports
 *  the failure of the whole call and then elaborates each candidate. */
const noOverloadMatches = parseRange(new Date(), "2026-03-01");

// ===========================================================================
// 03 — THE CORRUPTION MODES, EACH BLOCKED
// ===========================================================================

/** Would produce NaN in JavaScript: `"EUR" * 100`. */
function priceIn(amountCents: number, currency: string): string {
  return `${(amountCents / 100).toFixed(2)} ${currency}`;
}
const nanSwap = priceIn("EUR", 4500);

/** Would produce "[object Object]" in JavaScript. */
interface BadgeConfig {
  readonly colour: string;
  readonly outlined: boolean;
}
function renderBadge(label: string, config: BadgeConfig): string {
  return `<span class="${config.colour}">${label}</span>`;
}
const objectSwap = renderBadge({ colour: "red", outlined: true }, "SALE");

/** Would take the WRONG BRANCH in JavaScript: a non-empty string is truthy,
 *  and `0`/`""` are falsy. */
function auditLog(message: string, verbose: boolean): string {
  return verbose ? `VERBOSE: ${message}` : message;
}
const branchSwap = auditLog(true, "disk full");

export const evidence = {
  swappedUser,
  halfSwapped,
  tooShort,
  misplacedOptional,
  restDoesNotHelp,
  spreadOfArray,
  spreadOfBadTuple,
  noOverloadMatches,
  nanSwap,
  objectSwap,
  branchSwap,
};
