import assert from "node:assert/strict";
import test from "node:test";
import { buildCharacterClasses } from "../domain/build/model.ts";
import {
  sanitizeBuildSkillDescription,
  validateBuildCharacter,
  validateBuildCharacterSlot,
  validateBuildSkillName,
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

test("validates skill names and preserves safe rich formatting", () => {
  assert.equal(validateBuildSkillName("  Волна   тьмы  "), "Волна тьмы");

  const description = sanitizeBuildSkillDescription(
    '<p><strong>Лимит:</strong> <span style="color:#55d8bd">2</span></p>' +
      '<ul><li>Урон <span style="color: rgb(235, 183, 52)">1031%</span></li></ul>',
  );

  assert.match(description, /<strong>Лимит:<\/strong>/);
  assert.match(description, /color:#55d8bd/);
  assert.match(description, /<ul><li>/);
});

test("removes unsafe markup from skill descriptions", () => {
  const description = sanitizeBuildSkillDescription(
    '<p onclick="alert(1)">Описание</p><script>alert(1)</script>' +
      '<img src=x onerror=alert(1)>',
  );

  assert.equal(description, "<p>Описание</p>");
  assert.doesNotMatch(description, /script|onclick|img|onerror/i);
  assert.throws(() => validateBuildSkillName("x"));
  assert.throws(() => sanitizeBuildSkillDescription("<br>"));
});
