import assert from "node:assert/strict";
import test from "node:test";
import { validateBlackSunPoints } from "../domain/black-sun/validation.ts";

test("accepts valid Black Sun scores", () => {
  assert.equal(validateBlackSunPoints(0), 0);
  assert.equal(validateBlackSunPoints(123456), 123456);
  assert.equal(validateBlackSunPoints(999_999_999), 999_999_999);
});

test("rejects invalid Black Sun scores", () => {
  assert.throws(() => validateBlackSunPoints(-1));
  assert.throws(() => validateBlackSunPoints(1.5));
  assert.throws(() => validateBlackSunPoints("1200"));
  assert.throws(() => validateBlackSunPoints(1_000_000_000));
});
