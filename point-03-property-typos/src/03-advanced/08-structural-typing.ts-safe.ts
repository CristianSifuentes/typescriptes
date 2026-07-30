/**
 * 08-structural-typing — THE TYPESCRIPT VERSION (checked)
 * ---------------------------------------------------------------------------
 * `GeoCoordinate` (declared by the mapping library) and `MapPin` (declared,
 * independently, by the store-locator feature) never mention each other.
 * TypeScript is STRUCTURALLY typed: assignability is decided by comparing
 * PROPERTY MAPS, not declared names, so the two are mutually assignable
 * anyway — while a typo in either one is caught with exactly the same
 * certainty as if there were only one shared type.
 */

import { section, ts, good, note, compilerSays, table, blank, shapeTrace, compileTimeOnly } from "../99-runner/trace.js";
import { proveType } from "../99-runner/type-assert.js";

// Declared by "the mapping library" — knows nothing about MapPin.
interface GeoCoordinate {
  readonly lat: number;
  readonly lng: number;
}

// Declared by "the store-locator feature" — knows nothing about GeoCoordinate.
interface MapPin {
  readonly lat: number;
  readonly lng: number;
}

function currentPosition(): GeoCoordinate {
  return { lat: 40.7128, lng: -74.006 };
}

function distanceToStore(point: MapPin, store: MapPin): number {
  const dLat = point.lat - store.lat;
  const dLng = point.lng - store.lng;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

export function runSafe(): void {
  section("Two independently declared interfaces, compared as property maps");
  shapeTrace([
    ["GeoCoordinate", "lat, lng", "the mapping library's own declaration"],
    ["MapPin", "lat, lng", "the store-locator feature's own declaration — unrelated"],
  ]);

  blank();
  ts("distanceToStore(currentPosition(), store)  — GeoCoordinate passed where MapPin is expected");
  const here: GeoCoordinate = currentPosition();
  const store: MapPin = { lat: 40.73, lng: -73.99 };
  const distance = distanceToStore(here, store); // ACCEPTED — structural match
  proveType<number>()(distance, "number", "GeoCoordinate structurally satisfies MapPin");
  good(
    `distanceToStore accepted a 'GeoCoordinate' where it declared 'MapPin' — ` +
      `${distance.toFixed(4)} — because the compiler compared PROPERTY MAPS, ` +
      "not the two interfaces' names. This is structural typing, and it is " +
      "correct: 'GeoCoordinate' has everything 'MapPin' requires.",
  );

  blank();
  section("A typo is caught identically, regardless of which name is in scope");

  ts("{ lat: 40.73, lgn: -73.99 }  assigned to MapPin — 'lng' misspelled as 'lgn'");
  compileTimeOnly(() => {
    // @ts-expect-error TS2353: Object literal may only specify known
    // properties, and 'lgn' does not exist in type 'MapPin'.
    const mistyped: MapPin = { lat: 40.73, lgn: -73.99 };
    void mistyped;
  });
  compilerSays(
    "TS2353",
    "Object literal may only specify known properties, and 'lgn' does not exist in type 'MapPin'.",
    "Same excess-property check as demo 03's TS2561, a different code because " +
      "'lgn' is not a close-enough edit of any real key for the suggestion " +
      "pass to fire (a 3-letter field leaves little room for 'close'). The " +
      "diagnostic still names 'MapPin' — whichever type happened to be the " +
      "target at THIS call site. Assigned to a 'GeoCoordinate'-typed variable " +
      "instead, the message would read 'GeoCoordinate' — same property map, " +
      "same check, different label.",
  );

  blank();
  section("Structural typing is not a loophole for typos");
  note(
    "It is tempting to think 'if any shape with the right fields is " +
      "accepted, surely a typo could sneak through as some OTHER accidental " +
      "shape'. It cannot: assignability requires the VALUE to actually have " +
      "'lng' (or something assignable to it). A typo'd 'lgn' does not make " +
      "the value satisfy any type that declares 'lng' as required — there is " +
      "no shape it could structurally match by accident.",
  );

  blank();
  table(
    ["question", "answer"],
    [
      ["do GeoCoordinate and MapPin need to import each other?", "no — never related at all"],
      ["are they mutually assignable?", "yes — same property map"],
      ["does a typo in one context leak past into the other?", "no — every context re-checks the map"],
    ],
  );
}
