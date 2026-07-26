// @ts-nocheck
/**
 * 08-structural-typing — THE JAVASCRIPT VERSION (unchecked)
 * ---------------------------------------------------------------------------
 * JavaScript has no declared types at all, so "structural vs nominal" is not
 * even a meaningful question at runtime — every object is just a bag of
 * keys, compared to nothing. This file exists mainly to establish the
 * DOMAIN two independently-authored pieces of code both reach for the same
 * shape without coordinating, and a typo in either one is equally invisible.
 *
 * DOMAIN: a geolocation coordinate produced by a mapping library, consumed
 * by an unrelated "nearest store" feature that defines its own notion of
 * "a point" without ever importing the mapping library's type.
 */

import { section, js, note, detonate, table, runtimeSays, blank } from "../99-runner/trace.js";

// The mapping library's own idea of a coordinate.
function currentPosition() {
  return { lat: 40.7128, lng: -74.006 };
}

// The store-locator feature's UNRELATED, independently-written idea of "a
// point" — same fields, never coordinated with the function above.
function distanceToStore(point, store) {
  const dLat = point.lat - store.lat;
  const dLng = point.lng - store.lng;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

export function runBroken(): void {
  section("Two independently-written 'point' shapes, used together");

  const here = currentPosition();
  const store = { lat: 40.73, lng: -73.99 };
  js("distanceToStore(here, store)  — both are plain objects, no declared type at all");
  detonate("distanceToStore(here, store)", () => distanceToStore(here, store));
  note("Works, because both happen to have 'lat' and 'lng'. Nothing enforced that; luck did.");

  blank();
  section("A typo in EITHER shape is equally invisible");

  const mistyped = { lat: 40.73, lgn: -73.99 }; // 'lgn' instead of 'lng'
  js("distanceToStore(here, mistyped)  — 'lng' misspelled as 'lgn'");
  detonate("distanceToStore(here, mistyped)", () => distanceToStore(here, mistyped));
  runtimeSays(
    "no error at all",
    "store.lng is undefined, so dLng is NaN, so the whole distance is NaN. " +
      "The nearest-store feature now thinks every store is infinitely far, " +
      "or not-a-number-far, and nothing about this typo pointed at its cause.",
  );

  blank();
  table(
    ["shape", "declared by", "coordinates with"],
    [
      ["currentPosition() result", "the mapping library", "nothing — just a plain object"],
      ["store", "the store-locator feature", "nothing — just a plain object"],
    ],
  );
  note(
    "Neither piece of code ever declared what a 'point' is. They happen to " +
      "agree today by coincidence, and a typo in either one breaks the " +
      "agreement silently.",
  );
}
