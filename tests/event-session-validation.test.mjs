import assert from "node:assert/strict";
import test from "node:test";
import {
  validateEventRole,
  validateEventSession,
} from "../domain/events/validation.ts";

test("accepts the four event sessions", () => {
  assert.equal(validateEventSession("1"), 1);
  assert.equal(validateEventSession(2), 2);
  assert.equal(validateEventSession("4"), 4);
});

test("rejects unknown event sessions", () => {
  assert.throws(() => validateEventSession(null));
  assert.throws(() => validateEventSession(0));
  assert.throws(() => validateEventSession("5"));
});

test("accepts the four event roles", () => {
  assert.equal(validateEventRole("hunter"), "hunter");
  assert.equal(validateEventRole("solo"), "solo");
  assert.equal(validateEventRole("farmer"), "farmer");
  assert.equal(validateEventRole("absent"), "absent");
});

test("rejects unknown event roles", () => {
  assert.throws(() => validateEventRole("owner"));
  assert.throws(() => validateEventRole(""));
  assert.throws(() => validateEventRole(null));
});
