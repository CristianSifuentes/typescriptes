// @ts-nocheck
/**
 * 13-discriminated-unions — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * THE SHAPE OF THE PROBLEM: "boolean soup".
 *
 * A component needs to track a network request. The obvious JavaScript model
 * is a bag of independent fields:
 *
 *     { isLoading, data, error, isStale, retryCount }
 *
 * Five independent fields describe 2 × 2 × 2 × 2 × N states. Perhaps six of
 * them are meaningful. The rest are IMPOSSIBLE STATES — combinations that
 * should never exist — and every one of them is representable, constructible,
 * and reachable by a sequence of ordinary assignments.
 *
 * The bugs that follow are not type errors in the narrow sense. They are the
 * consequence of a data model that permits nonsense, and they are the most
 * expensive bugs in front-end and distributed systems work.
 *
 * DOMAIN: fetching an order from an API and rendering it.
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

function render(state) {
  if (state.isLoading) return "Loading…";
  if (state.error) return `Error: ${state.error}`;
  return `Order ${state.data.id}: ${state.data.totalCents}`;
}

export function runBroken(): void {
  section("The state space nobody counted");

  js("{ isLoading, data, error } — three fields, eight combinations");
  detonate("how many states are representable?", () => {
    const fields = ["isLoading", "data", "error"];
    return `2^${fields.length} = ${2 ** fields.length} combinations, of which 3 are meaningful`;
  });
  note("Five of the eight are nonsense. Nothing prevents any of them.");

  blank();
  section("Impossible state 1 — loading AND has data");

  detonate("render({ isLoading: true, data: {...} })", () =>
    render({ isLoading: true, data: { id: "o-1", totalCents: 500 }, error: null }),
  );
  note(
    'Renders "Loading…" while holding a perfectly good order. The user stares ' +
      "at a spinner over data that has already arrived — a bug measured in " +
      "abandoned checkouts, not in stack traces.",
  );

  blank();
  section("Impossible state 2 — error AND data");

  detonate("render({ error: 'timeout', data: {...} })", () =>
    render({ isLoading: false, data: { id: "o-1", totalCents: 500 }, error: "timeout" }),
  );
  note(
    "Shows the error and discards the data — or, with the branches in the " +
      "other order, shows stale data and hides the error. Which one you get " +
      "depends on the order of the `if`s, which no one thought of as a " +
      "decision.",
  );

  blank();
  section("Impossible state 3 — neither loading, nor error, nor data");

  detonate("render({})", () => render({}));
  note(
    "TypeError. This is the state right after `useState({})`, before anything " +
      "has been dispatched. It is not an edge case; it is the FIRST state the " +
      "component is ever in.",
  );

  blank();
  section("Impossible state 4 — the partial update");

  detonate("a reducer that forgets to clear a field", () => {
    let state = { isLoading: true, data: null, error: null };
    // success arrives:
    state = { ...state, data: { id: "o-1", totalCents: 500 } }; // forgot isLoading: false
    return render(state);
  });
  note(
    "Spread-based updates make this trivially easy: you must remember to clear " +
      "every field that the new state invalidates. The model does not tell you " +
      "which those are, because the model does not know they are related.",
  );

  blank();
  table(
    ["isLoading", "data", "error", "meaning", "representable?"],
    [
      ["false", "null", "null", "idle — or a bug", "yes"],
      ["true", "null", "null", "loading", "yes"],
      ["false", "set", "null", "success", "yes"],
      ["false", "null", "set", "failure", "yes"],
      ["true", "set", "null", "IMPOSSIBLE", "yes"],
      ["true", "null", "set", "IMPOSSIBLE", "yes"],
      ["false", "set", "set", "IMPOSSIBLE", "yes"],
      ["true", "set", "set", "IMPOSSIBLE", "yes"],
    ],
  );
  note(
    "Four impossible rows, all representable. Add `isStale` and `retryCount` " +
      "and the table has dozens of rows. The defensive `if`s scattered through " +
      "the codebase are an attempt to enforce, at runtime and by hand, a " +
      "constraint that should have been part of the data model.",
  );
}
