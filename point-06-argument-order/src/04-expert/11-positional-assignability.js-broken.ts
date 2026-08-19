// @ts-nocheck
/**
 * 11-positional-assignability — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * This demo has no bug to catch. Its subject is the MACHINERY: what a function
 * "is" in each language, and what — if anything — decides whether a call is
 * legal.
 *
 * In JavaScript a function is an ordinary object with a `[[Call]]` internal
 * method. It carries a `length` (the count of parameters before the first
 * default or rest) and a `name`, and neither is consulted when you call it.
 * There is no signature, no arity check, no relation between functions beyond
 * "both are callable".
 *
 * The consequence for argument order: there is nothing to check against.
 */

import { section, js, note, detonate, table, blank } from "../99-runner/trace.js";

function aspectRatio(width, height) {
  return width / height;
}

function greet(name, age, isAdmin = false, ...tags) {
  return `${name} ${age} ${isAdmin} ${tags}`;
}

export function runBroken(): void {
  section("A function is an object; its 'signature' is metadata nobody reads");

  detonate("aspectRatio.length", () => aspectRatio.length);
  detonate("aspectRatio.name", () => aspectRatio.name);
  detonate("greet.length  — stops at the first default", () => greet.length);
  detonate("typeof aspectRatio", () => typeof aspectRatio);
  detonate("aspectRatio instanceof Object", () => aspectRatio instanceof Object);
  note(
    "`length` is 2 for a two-parameter function and 2 for `greet` as well, " +
      "because it counts only the parameters before the first default. It is " +
      "documentation, computed once, and never consulted by a call.",
  );

  blank();
  section("Every function accepts every call");

  detonate("aspectRatio()", () => aspectRatio());
  detonate("aspectRatio(10)", () => aspectRatio(10));
  detonate("aspectRatio(10, 3, 'extra', {}, null)", () => aspectRatio(10, 3, "extra", {}, null));
  detonate("aspectRatio('a', 'b')", () => aspectRatio("a", "b"));
  detonate("aspectRatio({}, [])", () => aspectRatio({}, []));
  note(
    "Five calls, five results, zero errors. NaN, Infinity, and a number are " +
      "equally valid outcomes as far as the language is concerned.",
  );

  blank();
  section("Functions are interchangeable with each other");

  detonate("assigning any function where any other was expected", () => {
    let handler = aspectRatio;
    handler = greet; // completely different shape
    return handler("Ada", 25);
  });
  note(
    "There is no relation between function types because there are no function " +
      "types. Any callable can stand in for any other callable, and the " +
      "mismatch only shows up in the result.",
  );

  blank();
  section("call / apply / bind: three more ways to get the order wrong");

  detonate("aspectRatio.call(null, 10, 3)", () => aspectRatio.call(null, 10, 3));
  detonate("aspectRatio.apply(null, [10, 3])", () => aspectRatio.apply(null, [10, 3]));
  detonate("aspectRatio.apply(null, [3, 10])", () => aspectRatio.apply(null, [3, 10]));
  detonate("a partially applied function", () => {
    const withWidth10 = aspectRatio.bind(null, 10);
    return withWidth10(3);
  });
  note(
    "`bind` is the sharpest of the three: it FIXES the leading positions, so " +
      "the remaining call has a different position mapping from the original " +
      "function. Getting that mapping wrong is invisible.",
  );

  blank();
  detonate("bind with the arguments the wrong way round", () => {
    const withHeight3 = aspectRatio.bind(null, 3); // intended: fix the HEIGHT
    return withHeight3(10); // …but position 0 is the WIDTH
  });
  note(
    "0.3 instead of 3.333. The author meant to fix the height and fixed the " +
      "width instead. `bind` always binds from the LEFT — there is no way to " +
      "partially apply the second parameter.",
  );

  blank();
  table(
    ["question", "JavaScript's answer"],
    [
      ["what is a function?", "an object with a [[Call]] method"],
      ["what is a signature?", "there is none — `length` and `name` are metadata"],
      ["is this call legal?", "yes"],
      ["can this function stand in for that one?", "yes"],
      ["is argument *i* right for parameter *i*?", "the question cannot be asked"],
    ],
  );
  note(
    "Every row of the right-hand column is what TypeScript replaces. The " +
      "twin file shows what it replaces them WITH.",
  );
}
