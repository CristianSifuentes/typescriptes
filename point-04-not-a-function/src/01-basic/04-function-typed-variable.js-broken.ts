// @ts-nocheck
/**
 * 04-function-typed-variable — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * A "slot" that is supposed to hold a callback — an `onClose` handler for a
 * modal dialog. JavaScript places no restriction whatsoever on what gets
 * assigned into that slot: a string, a number, `undefined`, anything. The
 * slot's NAME suggests its purpose; nothing enforces it.
 *
 * DOMAIN: a modal dialog component with a configurable close handler.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

function openModal(options) {
  return {
    close() {
      // Some other part of the system eventually calls the configured
      // handler when the modal closes.
      options.onClose();
    },
  };
}

export function runBroken(): void {
  section("Configuring the modal correctly");

  const goodModal = openModal({ onClose: () => "cleanup ran" });
  js("goodModal.close()");
  detonate("goodModal.close()", () => goodModal.close());

  blank();
  section("A typo in the CONFIGURATION, not the code");

  // Someone meant to pass a function, and instead assigned a farewell
  // string to the slot — maybe copy-pasted from a different config object.
  const brokenModal = openModal({ onClose: "goodbye" });

  js("brokenModal.close()");
  detonate("brokenModal.close()", () => brokenModal.close());
  runtimeSays(
    "TypeError: options.onClose is not a function",
    "'onClose' was assigned a STRING, not a function. Nothing about " +
      "creating 'brokenModal' complained — the mistake only surfaces later, " +
      "inside 'close()', at the moment somebody actually closes the modal.",
  );

  blank();
  table(
    ["onClose value", "type", "callable?", "when the mistake surfaces"],
    [
      ["() => \"cleanup ran\"", "function", "yes", "never — it's correct"],
      ["\"goodbye\"", "string", "no", "whenever .close() is eventually called"],
    ],
  );
  note(
    "The distance between 'wrote the wrong config' and 'the modal crashed' " +
      "can be an entire user session — the config was built at page load, " +
      "the crash happens whenever that particular modal is closed.",
  );
}
