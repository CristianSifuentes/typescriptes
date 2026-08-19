/**
 * EVIDENCE FIXTURE — level 02 (intermediate) — THE BLIND SPOT
 * ---------------------------------------------------------------------------
 * This fixture is the most important one in the project, and it is unusual:
 * **almost nothing in it produces a diagnostic.**
 *
 * That silence is the evidence. When two swapped parameters share a type,
 * positional checking has nothing to compare: the types agree and only the
 * MEANING differs. `tsc` accepts every call below without a word.
 *
 * A teaching project that only showed errors would leave the reader believing
 * TypeScript catches argument-order mistakes. It catches *some* of them. The
 * lab has to show the gap as rigorously as it shows the catches — so each
 * specimen below is labelled "NO DIAGNOSTIC (by design)" and the run of
 * `npm run evidence` proves it by reporting only the two errors at the end.
 */

// ===========================================================================
// 04 — TWO NUMBERS: geometry
// ===========================================================================

function areaOfRectangle(width: number, height: number): number {
  return width * height;
}

/** NO DIAGNOSTIC (by design). Area is commutative, so this one is harmless… */
const area = areaOfRectangle(3, 10);
const areaSwapped = areaOfRectangle(10, 3);

function aspectRatio(width: number, height: number): number {
  return width / height;
}

/** NO DIAGNOSTIC (by design). Division is NOT commutative: 0.3 vs 3.33.
 *  A layout engine given this receives a portrait image as landscape. */
const ratio = aspectRatio(3, 10);
const ratioSwapped = aspectRatio(10, 3);

function cropTo(x: number, y: number, width: number, height: number): string {
  return `${width}x${height}+${x}+${y}`;
}

/** NO DIAGNOSTIC (by design). FOUR same-typed parameters: 24 possible
 *  orderings, 23 of them wrong, all of them accepted. */
const crop = cropTo(10, 20, 640, 480);
const cropScrambled = cropTo(640, 480, 10, 20);

// ===========================================================================
// 05 — TWO STRINGS: people and money
// ===========================================================================

function fullName(firstName: string, lastName: string): string {
  return `${lastName}, ${firstName}`;
}

/** NO DIAGNOSTIC (by design). "Lovelace, Ada" or "Ada, Lovelace" — the
 *  compiler has no opinion. */
const name = fullName("Ada", "Lovelace");
const nameSwapped = fullName("Lovelace", "Ada");

function transfer(fromAccountId: string, toAccountId: string, amountCents: number): string {
  return `${amountCents} from ${fromAccountId} to ${toAccountId}`;
}

/** NO DIAGNOSTIC (by design). This is the expensive one: the money moves in
 *  the wrong direction and every type in the call is correct. */
const paid = transfer("acct-payer", "acct-payee", 12_950);
const refunded = transfer("acct-payee", "acct-payer", 12_950);

// ===========================================================================
// 06 — TWO BOOLEANS: the "boolean trap"
// ===========================================================================

function createAccount(email: string, isActive: boolean, isAdmin: boolean): string {
  return `${email} active=${isActive} admin=${isAdmin}`;
}

/** NO DIAGNOSTIC (by design). `createAccount(e, false, true)` silently creates
 *  a DISABLED ADMINISTRATOR instead of an active regular user — a privilege
 *  bug with no type error anywhere in it. */
const account = createAccount("ada@example.com", true, false);
const accountSwapped = createAccount("ada@example.com", false, true);

// ===========================================================================
// WHAT *IS* STILL CAUGHT AT THIS LEVEL
// ===========================================================================

/** TS2345: as soon as ONE of the swapped parameters has a different type, the
 *  positional check bites again. The blind spot is exactly and only
 *  "same type, different meaning". */
const stillCaught = createAccount(true, "ada@example.com", false);

export const evidence = {
  area,
  areaSwapped,
  ratio,
  ratioSwapped,
  crop,
  cropScrambled,
  name,
  nameSwapped,
  paid,
  refunded,
  account,
  accountSwapped,
  stillCaught,
};
