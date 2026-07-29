import assert from "node:assert/strict";
import test from "node:test";
import { buildCharacterClasses } from "../domain/build/model.ts";
import {
  sanitizeBuildSkillDescription,
  validateBuildCharacter,
  validateBuildCharacterSlot,
  validateBuildSkillComboAvailable,
  validateBuildSkillComboEnabled,
  validateBuildSkillName,
  validateBuildSkillSlotIndex,
  validateBuildSkillSlotType,
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

  const legacyColor = sanitizeBuildSkillDescription(
    '<div><font color="#00ffe1">Голубой текст</font></div>',
  );
  assert.match(legacyColor, /<div><span style="color:#00ffe1">/);
  assert.doesNotMatch(legacyColor, /<font/i);
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

test("validates combo availability and personal state", () => {
  assert.equal(validateBuildSkillComboAvailable("true"), true);
  assert.equal(validateBuildSkillComboAvailable("false"), false);
  assert.equal(validateBuildSkillComboAvailable(null), false);
  assert.equal(validateBuildSkillComboEnabled(true), true);
  assert.equal(validateBuildSkillComboEnabled(false), false);
  assert.throws(() => validateBuildSkillComboAvailable("yes"));
  assert.throws(() => validateBuildSkillComboEnabled("true"));
});

test("limits build skill slots to four Rabams and thirteen normal skills", () => {
  assert.equal(validateBuildSkillSlotType("rabam"), "rabam");
  assert.equal(validateBuildSkillSlotType("normal"), "normal");
  assert.equal(validateBuildSkillSlotIndex("rabam", "1"), 1);
  assert.equal(validateBuildSkillSlotIndex("rabam", "4"), 4);
  assert.equal(validateBuildSkillSlotIndex("normal", "13"), 13);
  assert.throws(() => validateBuildSkillSlotType("ultimate"));
  assert.throws(() => validateBuildSkillSlotIndex("rabam", "5"));
  assert.throws(() => validateBuildSkillSlotIndex("normal", "14"));
  assert.throws(() => validateBuildSkillSlotIndex("normal", "1.5"));
});
