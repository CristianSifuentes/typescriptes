// @ts-nocheck
/**
 * 09-labeled-tuples — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * Argument lists are not the only place ordering matters. The moment you store
 * an argument list in a variable — to forward it, to log it, to retry with it —
 * it becomes an ARRAY, and an array's ordering is even less visible than a call
 * site's.
 *
 * DOMAIN: a retry wrapper and a booking system with date ranges.
 *
 * THE PATTERN TO WATCH: the array is built in one place and applied in another.
 * The two halves of an ordering bug can live in different files, written by
 * different people, months apart.
 */

import { section, js, note, detonate, table, blank, warn } from "../99-runner/trace.js";

function bookRoom(roomId, checkIn, checkOut, guests) {
  const nights = Math.round((checkOut - checkIn) / 86_400_000);
  return { roomId, nights, guests, valid: nights > 0 };
}

/** A generic retry helper — the shape that turns arguments into arrays. */
function withRetry(fn, args, attempts = 2) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return fn(...args);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export function runBroken(): void {
  section("An argument list, stored as an array");

  const checkIn = new Date("2026-03-01");
  const checkOut = new Date("2026-03-05");

  js("bookRoom('r-1', checkIn, checkOut, 2)   — direct call");
  detonate("booking", () => JSON.stringify(bookRoom("r-1", checkIn, checkOut, 2)));

  blank();
  js("the same call, forwarded through an array");
  detonate("booking", () => {
    const args = ["r-1", checkIn, checkOut, 2];
    return JSON.stringify(withRetry(bookRoom, args));
  });

  blank();
  js("the array built with the dates the other way round");
  detonate("booking", () => {
    const args = ["r-1", checkOut, checkIn, 2];
    return JSON.stringify(withRetry(bookRoom, args));
  });
  warn(
    "`nights: -4`, `valid: false`. Two `Date` objects, the same blind spot as " +
      "two numbers — and now the mistake is in an ARRAY LITERAL, which is even " +
      "less readable than an argument list because there is no function name " +
      "next to it to hint at what each slot means.",
  );

  blank();
  section("The array can be built anywhere");

  detonate("built from a config object, in a different module", () => {
    const config = { room: "r-1", from: checkOut, to: checkIn, party: 2 };
    // Somebody maps the config onto the parameter order, and gets it wrong.
    const args = [config.room, config.from, config.to, config.party];
    return JSON.stringify(withRetry(bookRoom, args));
  });
  note(
    "The mapping from config field to argument position is written by hand, " +
      "in a file that does not contain `bookRoom`. Nothing connects the two.",
  );

  blank();
  section("And the array can be the wrong LENGTH too");

  detonate("three elements for a four-parameter function", () => {
    const args = ["r-1", checkIn, checkOut];
    return JSON.stringify(withRetry(bookRoom, args));
  });
  note("`guests: undefined`. No error — the spread simply ran out of values.");

  blank();
  detonate("five elements", () => {
    const args = ["r-1", checkIn, checkOut, 2, "extra"];
    return JSON.stringify(withRetry(bookRoom, args));
  });
  note("The fifth is discarded in silence.");

  blank();
  table(
    ["property of an argument array", "consequence"],
    [
      ["no element names", "slot 1 and slot 2 are indistinguishable"],
      ["no fixed length", "too few → undefined; too many → dropped"],
      ["built far from the call", "the two halves of the bug live apart"],
      ["hetero­geneous by default", "no type ties slot *i* to parameter *i*"],
      ["invisible in review", "`[a, b, c, d]` shows nothing about meaning"],
    ],
  );
  note(
    "The TypeScript twin fixes the length and the per-slot types with a TUPLE, " +
      "and improves the readability with LABELS — then admits, precisely, that " +
      "the labels do no checking at all.",
  );
}
