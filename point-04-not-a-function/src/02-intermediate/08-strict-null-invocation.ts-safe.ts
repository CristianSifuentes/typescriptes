/**
 * 08-strict-null-invocation — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `onMessage` is not declared optional (`onMessage?:`) — it is declared with
 * an explicit union type, `Handler | undefined`, assigned `undefined`
 * initially and reassigned later by `setHandler`. `strictNullChecks` treats
 * `undefined` as a real, distinct member of that union that must be ruled
 * out — by an `if` check or `?.` — before invocation is permitted. This is
 * demo 06's mechanism (a union with a non-callable member) applied to a
 * MUTABLE field instead of an optional property, which is why the fix here
 * is narrowing via `if`, not `?.` on a property access.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

type Handler = (data: string) => void;

class SocketClient {
  private onMessage: Handler | undefined = undefined;

  setHandler(handler: Handler): void {
    this.onMessage = handler;
  }

  receive(data: string): void {
    if (this.onMessage) {
      this.onMessage(data); // narrowed: Handler, not Handler | undefined
    }
  }
}

export function runSafe(): void {
  section("The field's real, declared type");
  callableTrace([
    ["this.onMessage", "Handler | undefined", "present: (data: string) => void", "a UNION — `undefined` is a real member until proven otherwise"],
  ]);

  blank();
  section("Invoking the union member directly, unguarded");

  ts("this.onMessage(data)  — inside receive(), with no narrowing");
  compileTimeOnly(() => {
    class UnsafeSocketClient {
      private onMessage: Handler | undefined = undefined;
      receive(data: string): void {
        // @ts-expect-error TS18048: 'this.onMessage' is possibly 'undefined'.
        this.onMessage(data);
      }
    }
    void UnsafeSocketClient;
  });
  compilerSays(
    "TS18048",
    "'this.onMessage' is possibly 'undefined'.",
    "Identical mechanism to demo 06's TS18048 — the difference is the " +
      "SOURCE of the union. There it came from an optional property " +
      "('onError?:'); here it comes from an explicit 'Handler | undefined' " +
      "annotation on a field that starts empty and is filled in later. " +
      "Either way, `strictNullChecks` refuses the call until 'undefined' is " +
      "excluded.",
  );

  blank();
  section("The disciplined fix: narrow before calling");

  const earlyClient = new SocketClient();
  earlyClient.receive("ping"); // safe no-op: onMessage is still undefined
  good("earlyClient.receive('ping') before setHandler() — no crash, silently skipped.");

  const log: string[] = [];
  const wiredClient = new SocketClient();
  wiredClient.setHandler((data) => log.push(`handled: ${data}`));
  wiredClient.receive("ping");
  proveType<string[]>()(log, "string[]", "narrowed inside the `if`, so the call really is safe");
  good(`wiredClient.receive('ping') after setHandler() — ran the real handler: [${log.join(", ")}]`);

  blank();
  table(
    ["call order", "this.onMessage narrowed type inside if(...)", "outcome"],
    [
      ["receive() before setHandler()", "the `if` is false — body skipped", "no-op, no crash"],
      ["receive() after setHandler()", "Handler (undefined excluded)", "calls the real handler"],
    ],
  );
  note(
    "Both orderings are still 'valid' at runtime, exactly as in the " +
      "JavaScript version — but neither one can EVER throw 'is not a " +
      "function', because the only code path that invokes 'onMessage' is " +
      "the one the compiler has already proven excludes 'undefined'.",
  );
}
