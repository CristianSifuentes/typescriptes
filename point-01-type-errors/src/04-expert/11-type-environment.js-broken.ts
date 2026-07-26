// @ts-nocheck
/**
 * 11-type-environment — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * JavaScript has exactly ONE environment: the runtime one, mapping names to
 * VALUES, mutated as the program executes. There is no second environment
 * mapping names to types, so there is nothing to consult before running.
 *
 * Two consequences are on display here:
 *
 *   1. The only way to answer "what is `x` here?" is to RUN THE PROGRAM and
 *      look — which answers the question for one execution, not for the code.
 *   2. The runtime environment has its own surprises (hoisting, the temporal
 *      dead zone, `var` function-scoping, `this` rebinding) that no static
 *      reasoning is available to protect you from.
 *
 * DOMAIN: order pricing, with a discount rule that changes shape as the
 * function proceeds.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

export function runBroken(): void {
  section("The only way to know what a name holds is to run the code");

  detonate("what is `discount` at each step?", () => {
    let discount = "10%"; // string
    const steps = [`1: ${typeof discount}`];
    discount = Number.parseFloat(discount) / 100; // now a number
    steps.push(`2: ${typeof discount}`);
    discount = { rate: discount, source: "coupon" }; // now an object
    steps.push(`3: ${typeof discount}`);
    discount = null; // now null
    steps.push(`4: ${typeof discount}`);
    return steps.join(" → ");
  });
  note(
    "One binding, four types, no declaration anywhere. `typeof` answered for " +
      "THIS run only — and it is famously unreliable (typeof null === " +
      '"object", typeof NaN === "number", typeof [] === "object").',
  );

  blank();
  section("The runtime environment has surprises of its own");

  js("hoisting: `var` is initialised to undefined before its assignment");
  detonate("var before assignment", () => {
    // eslint-disable-next-line no-var, vars-on-top
    var rate;
    const before = rate; // undefined, not a ReferenceError
    rate = 0.1;
    return `before=${before}, after=${rate}`;
  });

  blank();
  js("temporal dead zone: `let` throws instead");
  detonate("let before declaration", () => {
    // Reading a `let` binding before its declaration executes, IN THE SAME
    // BLOCK, is a ReferenceError rather than `undefined`.
    const before = rate2;
    let rate2 = 0.1;
    return `before=${before}, after=${rate2}`;
  });
  runtimeSays(
    "ReferenceError: Cannot access 'rate2' before initialization",
    "Two declaration keywords, two completely different behaviours for the " +
      "same mistake. Both decided at runtime.",
  );

  blank();
  js("`this` is not lexical in a normal function");
  detonate("extracted method loses its receiver", () => {
    const cart = {
      items: [1, 2, 3],
      count() {
        return this.items.length;
      },
    };
    const count = cart.count; // detached from `cart`
    return count();
  });
  runtimeSays(
    "TypeError: Cannot read properties of undefined (reading 'items')",
    "`this` is bound by the CALL, not by the definition. In strict mode a " +
      "detached call gets `undefined`.",
  );

  blank();
  section("What a JavaScript developer actually has");
  table(
    ["question", "how it gets answered in JavaScript"],
    [
      ["what type is `x` here?", "add a console.log and run it"],
      ["what shapes can `x` have?", "read every assignment by hand"],
      ["is this member present?", "run it and see"],
      ["is this name in scope?", "run it and see (or read the spec on hoisting)"],
      ["what is `this`?", "find the call site"],
    ],
  );
  note(
    "Every answer is 'run it'. That is the definition of a runtime type system, " +
      "and it is why the answers apply to one execution rather than to the code.",
  );
}
