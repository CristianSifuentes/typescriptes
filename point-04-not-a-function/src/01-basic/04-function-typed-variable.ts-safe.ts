/**
 * 04-function-typed-variable — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `() => void` is a type — a call signature with zero parameters and a
 * `void` return — exactly as legitimate a type as `string` or `number`
 * (manifesto §1). `onClose: () => void` therefore participates in ordinary
 * assignability checking: assigning a `string` to a slot typed `() => void`
 * fails for the SAME reason assigning a `string` to a slot typed `number`
 * would — TS2322 — just with a function type on the right of "not
 * assignable to".
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

interface ModalOptions {
  readonly onClose: () => void;
}

function openModal(options: ModalOptions): { close: () => void } {
  return {
    close() {
      options.onClose();
    },
  };
}

export function runSafe(): void {
  section("The slot's type IS a call signature, checked like any other type");
  callableTrace([
    ["ModalOptions.onClose", "() => void", "() => void", "declared as a function type — assignability is checked accordingly"],
  ]);

  blank();
  section("Assigning a non-function to a function-typed slot");

  ts('openModal({ onClose: "goodbye" })');
  compileTimeOnly(() => {
    const brokenModal = openModal({
      // @ts-expect-error TS2322: Type 'string' is not assignable to type
      // '() => void'.
      onClose: "goodbye",
    });
    void brokenModal;
  });
  compilerSays(
    "TS2322",
    "Type 'string' is not assignable to type '() => void'.",
    "Read literally, this is the SAME assignability check as 'const n: " +
      "number = \"x\"' — a value of one type where another type is required. " +
      "Function types are not a special case of the type system; they " +
      "participate in assignability exactly like every other type.",
  );

  blank();
  section("The correct configuration");

  const log: string[] = [];
  const goodModal = openModal({ onClose: () => log.push("cleanup ran") });
  goodModal.close();
  proveType<() => void>()(goodModal.close, "() => void", "the slot really is callable, so close() really invoked it");
  good(`goodModal.close() ran the real handler — log = [${log.join(", ")}].`);

  blank();
  table(
    ["onClose value", "assignable to () => void?", "TypeScript diagnostic"],
    [
      ["\"goodbye\" (string)", "no", "TS2322"],
      ["() => (cleanupRan = true)", "yes", "no diagnostic"],
    ],
  );
  note(
    "This check happens at CONFIGURATION time — where 'openModal' is called " +
      "— not at CLOSE time, months later in a user's session. The mistake " +
      "and its diagnosis share the same line.",
  );
}
