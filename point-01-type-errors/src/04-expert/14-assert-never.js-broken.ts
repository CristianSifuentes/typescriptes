// @ts-nocheck
/**
 * 14-assert-never — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * JavaScript developers are not unaware of the exhaustiveness problem. They
 * have three standard defences against it. This file shows all three, and how
 * each one fails.
 *
 *   DEFENCE 1: `default: throw new Error("unhandled")`
 *              → converts a silent wrong answer into a crash. Better! But the
 *                crash still happens IN PRODUCTION, on the one code path that
 *                reaches the new case.
 *
 *   DEFENCE 2: a lookup object `{ email: …, sms: … }`
 *              → a missing key is `undefined`, which is not even a crash.
 *
 *   DEFENCE 3: a unit test asserting every case
 *              → the test enumerates the cases the AUTHOR knew about. A case
 *                added later is absent from both the code and the test.
 *
 * All three share one defect: they are checks that run *later* — at runtime, or
 * at test time — against a list of cases that lives only in someone's head.
 *
 * DOMAIN: a notification service dispatching over several channels.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

/** DEFENCE 1 */
function subjectFor(channel) {
  switch (channel) {
    case "email":
      return "Your order";
    case "sms":
      return "Order update";
    default:
      throw new Error(`unhandled channel: ${channel}`);
  }
}

/** DEFENCE 2 */
const TEMPLATES = {
  email: "order-email.html",
  sms: "order-sms.txt",
};

/** DEFENCE 3 is a test file, which we simulate below. */

export function runBroken(): void {
  section("Defence 1 — a throwing default");

  detonate('subjectFor("email")', () => subjectFor("email"));
  detonate('subjectFor("sms")', () => subjectFor("sms"));
  js('a "push" channel is added in another file');
  detonate('subjectFor("push")', () => subjectFor("push"));
  runtimeSays(
    'Error: unhandled channel: push',
    "This is the BEST of the three outcomes and it is still a production " +
      "incident: the error surfaces on the first request that uses the new " +
      "channel, in front of a user, at whatever hour that happens to be.",
  );

  blank();
  section("Defence 2 — a lookup object");

  detonate('TEMPLATES["email"]', () => TEMPLATES["email"]);
  detonate('TEMPLATES["push"]', () => TEMPLATES["push"]);
  note(
    "`undefined`. Worse than the throw: the notification service will happily " +
      "call `renderTemplate(undefined)` and send an empty message, or none at " +
      "all, without a single log line.",
  );

  blank();
  detonate('TEMPLATES["push"].toUpperCase()', () => TEMPLATES["push"].toUpperCase());
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'toUpperCase')",
    "…unless something downstream happens to call a method, in which case you " +
      "get the crash after all — at a random distance from the cause.",
  );

  blank();
  section("Defence 3 — a test that enumerates the cases");

  detonate("the test suite, as written when there were two channels", () => {
    const CHANNELS_UNDER_TEST = ["email", "sms"]; // written by hand
    const results = CHANNELS_UNDER_TEST.map((c) => {
      try {
        return `${c}: ${subjectFor(c)}`;
      } catch {
        return `${c}: FAILED`;
      }
    });
    return results.join(" | ");
  });
  note(
    "Green. The test enumerates exactly the cases the author knew about, so " +
      "adding a case to the system does not add a case to the test. The suite " +
      "will stay green forever, no matter how many channels appear.",
  );

  blank();
  table(
    ["defence", "when it fires", "what the user sees", "who is woken up"],
    [
      ["nothing", "never", "undefined in the UI", "nobody"],
      ["throwing default", "on the first affected request", "a 500", "on-call"],
      ["lookup object", "never (or late)", "an empty notification", "nobody"],
      ["hand-written test", "never — it does not know", "everything above", "nobody"],
      ["a type checker", "at BUILD TIME", "nothing — it never shipped", "the author, immediately"],
    ],
  );
  note(
    "Only the last row moves the discovery to a point where it is cheap. That " +
      "is what the TypeScript twin builds — and it builds it out of ONE " +
      "four-line function.",
  );
}
