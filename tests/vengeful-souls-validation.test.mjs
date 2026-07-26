import assert from "node:assert/strict";
import test from "node:test";
import { validateVengefulSoulsPoints } from "../domain/vengeful-souls/validation.ts";

test("accepts valid Night of Vengeful Souls scores", () => {
  assert.equal(validateVengefulSoulsPoints(0), 0);
  assert.equal(validateVengefulSoulsPoints(123456), 123456);
  assert.equal(validateVengefulSoulsPoints(999_999_999), 999_999_999);
});

test("rejects invalid Night of Vengeful Souls scores", () => {
  assert.throws(() => validateVengefulSoulsPoints(-1));
  assert.throws(() => validateVengefulSoulsPoints(1.5));
  assert.throws(() => validateVengefulSoulsPoints("1200"));
  assert.throws(() => validateVengefulSoulsPoints(1_000_000_000));
});
