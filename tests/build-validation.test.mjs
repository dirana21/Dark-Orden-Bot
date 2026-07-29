import assert from "node:assert/strict";
import test from "node:test";
import { buildCharacterClasses } from "../domain/build/model.ts";
import {
  validateBuildCharacter,
  validateBuildCharacterSlot,
} from "../domain/build/validation.ts";

test("accepts the configured build characters", () => {
  assert.equal(buildCharacterClasses.length, 30);
  assert.equal(validateBuildCharacter("Воин"), "Воин");
  assert.equal(validateBuildCharacter("Сераф"), "Сераф");
  assert.equal(validateBuildCharacterSlot("main"), "main");
  assert.equal(validateBuildCharacterSlot("mirror"), "mirror");
});

test("rejects unknown build characters and slots", () => {
  assert.throws(() => validateBuildCharacter("Неизвестный герой"));
  assert.throws(() => validateBuildCharacterSlot("third"));
});
