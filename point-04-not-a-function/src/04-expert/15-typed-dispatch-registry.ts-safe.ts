/**
 * 15-typed-dispatch-registry — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `CommandId` is a CLOSED union of string literals — not `string`. Two
 * independent mechanisms then make "a missing or renamed handler" a
 * compile-time fact instead of a runtime lookup miss:
 *
 *   1. `Record<CommandId, Handler>` requires EVERY member of the union to
 *      have an entry — omitting one is a missing-property error, exactly
 *      like omitting a required field from any other object type.
 *   2. `dispatch(commandId: CommandId)` only accepts arguments that are
 *      already a member of the union — an unregistered or renamed id is
 *      rejected at the CALL, the same mechanism demo 13 dissects.
 *
 * A third layer — an exhaustiveness check via `never` — catches the same
 * mistake from the OPPOSITE direction: if `CommandId` grows a new member
 * that a `switch` forgets to handle, the `default` branch's fallback value
 * is no longer assignable to `never`, and the compiler flags exactly the
 * line that needs updating.
 */

import { section, ts, good, note, compilerSays, table, blank, callableTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

type CommandId = "editor.save" | "editor.undo" | "editor.redoLastChange";
type Handler = () => string;

// Record<CommandId, Handler> is a TOTAL map: TypeScript rejects this object
// literal unless every member of CommandId is present as a key.
const commands: Record<CommandId, Handler> = {
  "editor.save": () => "saved",
  "editor.undo": () => "undid last change",
  "editor.redoLastChange": () => "redid last change",
};

function dispatch(commandId: CommandId): string {
  return commands[commandId](); // commandId: CommandId, so this key is GUARANTEED to exist
}

/** Reached only if a switch branch fails to narrow `id` down to `never`. */
function assertNever(id: never): never {
  throw new Error(`unhandled command: ${String(id)}`);
}

function dispatchViaSwitch(commandId: CommandId): string {
  switch (commandId) {
    case "editor.save":
      return "saved";
    case "editor.undo":
      return "undid last change";
    case "editor.redoLastChange":
      return "redid last change";
    default:
      // If CommandId ever grows a member this switch doesn't handle,
      // `commandId` in this branch stops being `never` and the line below
      // fails to compile — a second, independent exhaustiveness net.
      return assertNever(commandId);
  }
}

export function runSafe(): void {
  section("The closed key set, and the total map it forces");
  callableTrace([
    ["CommandId", '"editor.save" | "editor.undo" | "editor.redoLastChange"', "n/a", "a CLOSED union — not `string`"],
    ["commands", "Record<CommandId, Handler>", "every member has a Handler", "TOTAL map — a missing key is a TYPE error, not a runtime miss"],
  ]);

  blank();
  section("Dispatching a renamed/unregistered command id");

  ts('dispatch("editor.redo")  — renamed to "editor.redoLastChange"');
  compileTimeOnly(() => {
    // @ts-expect-error TS2345: Argument of type '"editor.redo"' is not
    // assignable to parameter of type 'CommandId'.
    dispatch("editor.redo");
  });
  compilerSays(
    "TS2345",
    "Argument of type '\"editor.redo\"' is not assignable to parameter of " +
      "type 'CommandId'.",
    "'editor.redo' is not, and was never, a member of the CLOSED union " +
      "'CommandId' — the rename is caught the INSTANT the stale string is " +
      "typed, at every call site across the whole codebase, not just the " +
      "one a test happens to exercise.",
  );

  blank();
  section("Removing a handler from the registry without updating CommandId");

  ts('const commands: Record<CommandId, Handler> = { "editor.save": ..., "editor.undo": ... }  — missing "editor.redoLastChange"');
  compileTimeOnly(() => {
    // @ts-expect-error TS2741: Property 'editor.redoLastChange' is missing
    // in type '{ "editor.save": () => string; "editor.undo": () => string; }'
    // but required in type 'Record<CommandId, Handler>'.
    const _incompleteCommands: Record<CommandId, Handler> = {
      "editor.save": () => "saved",
      "editor.undo": () => "undid last change",
    };
    void _incompleteCommands;
  });
  compilerSays(
    "TS2741",
    "Property 'editor.redoLastChange' is missing in type '{ ... }' but " +
      "required in type 'Record<CommandId, Handler>'.",
    "The FAILURE MODE this catches is the mirror image of the previous " +
      "one: instead of a caller referencing a command that doesn't exist, " +
      "here the REGISTRY itself forgot to implement one that the union " +
      "promises exists. Both directions of the same mistake are closed by " +
      "the same total-map type.",
  );

  blank();
  section("A valid dispatch, through both dispatch strategies");

  const result = dispatch("editor.save");
  proveType<string>()(result, "string", "commandId is CommandId — commands[commandId] is GUARANTEED to be a Handler");
  good(`dispatch("editor.save") → ${result}`);

  const viaSwitch = dispatchViaSwitch("editor.redoLastChange");
  proveType<string>()(viaSwitch, "string", "every CommandId member is handled — assertNever is provably unreachable");
  good(`dispatchViaSwitch("editor.redoLastChange") → ${viaSwitch}`);

  blank();
  table(
    ["mistake", "caught by", "diagnostic"],
    [
      ["caller references a renamed/unknown command id", "CommandId parameter type", "TS2345"],
      ["registry forgets to implement a registered command id", "Record<CommandId, Handler> totality", "TS2741"],
      ["switch forgets a case after CommandId grows", "assertNever(commandId: never)", "TS2345 at the assertNever call"],
    ],
  );
  note(
    "None of these three checks exist because of a special 'dispatch' " +
      "feature — they are ordinary union-membership and object-totality " +
      "checks (point-01, point-03) applied to the specific case of a " +
      "string-keyed command table.",
  );
}
