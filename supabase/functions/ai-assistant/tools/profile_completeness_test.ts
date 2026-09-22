import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { computeCompleteness, OTHER_SLOT_WEIGHT, WELCOME_INTERVIEW_WEIGHT } from "./profile_completeness.ts";

const catalog = [
  { slot_key: "a", is_welcome_interview: true },
  { slot_key: "b", is_welcome_interview: true },
  { slot_key: "c", is_welcome_interview: false },
  { slot_key: "d", is_welcome_interview: false },
];

Deno.test("weights: welcome-interview slots count 3x, others 1x", () => {
  assertEquals(WELCOME_INTERVIEW_WEIGHT, 3);
  assertEquals(OTHER_SLOT_WEIGHT, 1);
});

Deno.test("nothing answered -> 0%", () => {
  assertEquals(computeCompleteness(catalog, new Set()), { percent: 0, answeredWeight: 0, totalWeight: 8 });
});

Deno.test("everything answered -> 100%", () => {
  assertEquals(computeCompleteness(catalog, new Set(["a", "b", "c", "d"])), { percent: 100, answeredWeight: 8, totalWeight: 8 });
});

Deno.test("one welcome-interview slot answered outweighs one ordinary slot", () => {
  const withWelcome = computeCompleteness(catalog, new Set(["a"]));
  const withOrdinary = computeCompleteness(catalog, new Set(["c"]));
  assertEquals(withWelcome.answeredWeight, 3);
  assertEquals(withOrdinary.answeredWeight, 1);
  assertEquals(withWelcome.percent > withOrdinary.percent, true);
});

Deno.test("rounds to the nearest percent", () => {
  // 1 of 3 total weight (a single ordinary slot in a catalog of one) -> not applicable here;
  // use a case that doesn't divide evenly instead: 1 welcome (weight 3) of 8 total -> 37.5 -> 38
  const c = computeCompleteness(catalog, new Set(["a"]));
  assertEquals(c.percent, 38);
});

Deno.test("an empty catalog is 0%, not NaN or a division error", () => {
  assertEquals(computeCompleteness([], new Set()), { percent: 0, answeredWeight: 0, totalWeight: 0 });
});

Deno.test("an answered key not in the catalog is ignored, not double-counted", () => {
  const c = computeCompleteness(catalog, new Set(["a", "not-a-real-slot"]));
  assertEquals(c.answeredWeight, 3);
});
