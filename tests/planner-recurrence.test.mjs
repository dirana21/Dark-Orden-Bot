import assert from "node:assert/strict";
import test from "node:test";
import { isPlannerCompletionCurrent } from "../domain/planner/recurrence.ts";

test("daily task completion resets when the day changes", () => {
  assert.equal(
    isPlannerCompletionCurrent(
      "daily",
      "2026-07-28",
      "2026-07-28",
      "2026-07-27",
    ),
    true,
  );
  assert.equal(
    isPlannerCompletionCurrent(
      "daily",
      "2026-07-27",
      "2026-07-28",
      "2026-07-27",
    ),
    false,
  );
});

test("weekly task completion resets when a new week starts", () => {
  assert.equal(
    isPlannerCompletionCurrent(
      "weekly",
      "2026-07-27",
      "2026-07-30",
      "2026-07-27",
    ),
    true,
  );
  assert.equal(
    isPlannerCompletionCurrent(
      "weekly",
      "2026-07-20",
      "2026-07-27",
      "2026-07-27",
    ),
    false,
  );
});
