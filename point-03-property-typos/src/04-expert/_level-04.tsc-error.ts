/**
 * EVIDENCE FIXTURE — level 04 (expert)
 * ---------------------------------------------------------------------------
 * Excluded from `tsconfig.json`; compiled only by `tsconfig.evidence.json`
 * (`npm run evidence`). Every error below is real and unsuppressed.
 *
 * Expected outcome: compilation FAILS. That is the deliverable.
 */

// ===========================================================================
// 12 — THE RESOLUTION MODEL: own -> inherited -> index signature -> error
// ===========================================================================

class Entity {
  readonly id: string;
  constructor(id: string) {
    this.id = id;
  }
}
class Invoice extends Entity {
  readonly totalCents: number;
  constructor(id: string, totalCents: number) {
    super(id);
    this.totalCents = totalCents;
  }
}
declare const invoice: Invoice;

/** TS2551: Property 'totlaCents' does not exist on type 'Invoice'. Did you mean 'totalCents'? */
const inheritedTypo = invoice.totlaCents;

// ===========================================================================
// 13 — SOUNDNESS LIMITS: the one guard `as` still enforces
// ===========================================================================

interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}
const notEvenAnObject: string = "not a user at all";

/** TS2352: Conversion of type 'string' to type 'User' may be a mistake because
 *  neither type sufficiently overlaps with the other. If this was
 *  intentional, convert the expression to 'unknown' first. */
const badAssertion = notEvenAnObject as User;

declare const user: User;
declare const fieldName: string;

/** TS7053: Element implicitly has an 'any' type because expression of type
 *  'string' can't be used to index type 'User'. No index signature with a
 *  parameter of type 'string' was found on type 'User'. */
const dynamicRead = user[fieldName];

// ===========================================================================
// 14 — RENAME SAFETY: a call site that never got updated
// ===========================================================================

interface UserV2 {
  readonly userId: string;
  readonly name: string;
}
declare const userV2: UserV2;

/** TS2339: Property 'id' does not exist on type 'UserV2'. */
const legacyRead = userV2.id;

// ===========================================================================
// 15 — EXHAUSTIVENESS OVER keyof T: an omitted key
// ===========================================================================

interface SignupForm {
  readonly username: string;
  readonly password: string;
  readonly confirmPassword: string;
}
type Validators = { [K in keyof SignupForm]: (value: string) => string | null };

/** TS2741: Property 'confirmPassword' is missing in type '{ username: (v: string) => "too short" | null; password: (v: string) => "too short" | null; }' but required in type 'Validators'. */
const incompleteValidators: Validators = {
  username: (v) => (v.length < 3 ? "too short" : null),
  password: (v) => (v.length < 8 ? "too short" : null),
};

// ===========================================================================
// 16 — SYMBOL KEYS: a second, independently-declared symbol
// ===========================================================================

const VALIDATED: unique symbol = Symbol("validated");
const ALSO_VALIDATED: unique symbol = Symbol("validated");
interface ValidatedOrder {
  readonly [VALIDATED]: true;
}
declare const validatedOrder: ValidatedOrder;

/** TS7053: Element implicitly has an 'any' type because expression of type
 *  'unique symbol' can't be used to index type 'ValidatedOrder'. Property
 *  '[ALSO_VALIDATED]' does not exist on type 'ValidatedOrder'. */
const wrongSymbol = validatedOrder[ALSO_VALIDATED];

export const evidence = {
  inheritedTypo,
  badAssertion,
  dynamicRead,
  legacyRead,
  incompleteValidators,
  wrongSymbol,
};
