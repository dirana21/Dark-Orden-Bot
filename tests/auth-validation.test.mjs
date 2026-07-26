import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeUsername,
  validateDisplayName,
  validatePassword,
  validateUsername,
} from "../domain/auth/validation.ts";

test("normalizes login names consistently", () => {
  assert.equal(normalizeUsername("  Dirana_21  "), "dirana_21");
  assert.equal(validateUsername("Рыцарь-7"), "рыцарь-7");
});

test("validates registration fields", () => {
  assert.equal(validateDisplayName("  Dirana   Prime  "), "Dirana Prime");
  assert.equal(validatePassword("DarkOrden2026"), "DarkOrden2026");
  assert.throws(() => validateUsername("x"));
  assert.throws(() => validatePassword("onlyletters"));
});
