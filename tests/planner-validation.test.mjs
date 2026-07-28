import assert from "node:assert/strict";
import test from "node:test";
import {
  addPlannerDays,
  validatePlannerCompleted,
  validatePlannerDate,
  validatePlannerMonthStart,
  validatePlannerTaskKind,
  validatePlannerTaskTitle,
  validatePlannerWeekStart,
} from "../domain/planner/validation.ts";

test("validates and normalizes planner task input", () => {
  assert.equal(
    validatePlannerTaskTitle("  Собрать   ресурсы  "),
    "Собрать ресурсы",
  );
  assert.equal(validatePlannerTaskKind("daily"), "daily");
  assert.equal(validatePlannerTaskKind("weekly"), "weekly");
  assert.equal(validatePlannerTaskKind("monthly"), "monthly");
  assert.equal(validatePlannerCompleted(true), true);
  assert.throws(() => validatePlannerTaskTitle(" "));
  assert.throws(() => validatePlannerTaskKind("yearly"));
  assert.throws(() => validatePlannerCompleted("yes"));
});

test("accepts real dates and Monday week starts", () => {
  assert.equal(validatePlannerDate("2026-07-28"), "2026-07-28");
  assert.equal(validatePlannerWeekStart("2026-07-27"), "2026-07-27");
  assert.equal(validatePlannerMonthStart("2026-07-01"), "2026-07-01");
  assert.equal(addPlannerDays("2026-07-27", 6), "2026-08-02");
  assert.throws(() => validatePlannerDate("2026-02-30"));
  assert.throws(() => validatePlannerWeekStart("2026-07-28"));
  assert.throws(() => validatePlannerMonthStart("2026-07-02"));
});
