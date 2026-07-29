import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCharacterClasses,
  getBuildSkillSocketTypes,
  isSocketlessBuildSkillSlot,
  normalizeBuildSkillConfigurableSocketTypes,
} from "../domain/build/model.ts";
import { canManageBuildSkills } from "../domain/build/permissions.ts";
import { buildSigilCategories } from "../domain/build/sigil-model.ts";
import {
  validateBuildSigilCategory,
  validateBuildSigilDescription,
  validateBuildSigilName,
} from "../domain/build/sigil-validation.ts";
import {
  sanitizeBuildSkillDescription,
  validateBuildCharacter,
  validateBuildCharacterSlot,
  validateBuildSkillComboAvailable,
  validateBuildSkillComboEnabled,
  validateBuildSkillName,
  validateBuildSkillSocketTypes,
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

test("allows guild officers to edit the shared skill catalog", () => {
  assert.equal(canManageBuildSkills("superadmin"), true);
  assert.equal(canManageBuildSkills("owner"), true);
  assert.equal(canManageBuildSkills("officer"), true);
  assert.equal(canManageBuildSkills("member"), false);
});

test("validates the seven configured sigil categories and text fields", () => {
  assert.equal(buildSigilCategories.length, 7);
  assert.equal(
    validateBuildSigilCategory("Категория"),
    "Категория",
  );
  assert.equal(
    validateBuildSigilCategory("Безупречное"),
    "Безупречное",
  );
  assert.equal(
    validateBuildSigilCategory("Тусклое"),
    "Тусклое",
  );
  assert.equal(
    validateBuildSigilName("  Тайное   учение  "),
    "Тайное учение",
  );
  assert.equal(
    validateBuildSigilDescription("  Усиливает навык  "),
    "Усиливает навык",
  );
  assert.throws(() => validateBuildSigilCategory("Неизвестное"));
  assert.throws(() => validateBuildSigilName("x"));
  assert.throws(() => validateBuildSigilDescription(""));
});

test("validates up to three socket specifications per skill", () => {
  assert.deepEqual(
    validateBuildSkillSocketTypes(
      JSON.stringify(["Защита", "Категория", "Сияющие"]),
    ),
    ["Защита", "Категория", "Сияющие"],
  );
  assert.deepEqual(validateBuildSkillSocketTypes("[]"), []);
  assert.throws(() =>
    validateBuildSkillSocketTypes(
      JSON.stringify([
        "Защита",
        "Светлое",
        "Тусклое",
        "Сияющие",
      ]),
    ),
  );
  assert.throws(() =>
    validateBuildSkillSocketTypes(JSON.stringify(["Неизвестное"])),
  );
});

test("fixes Category as socket one and removes sockets from skill 17", () => {
  assert.deepEqual(getBuildSkillSocketTypes("rabam", 1, []), [
    "Категория",
  ]);
  assert.deepEqual(
    getBuildSkillSocketTypes("normal", 12, [
      "Категория",
      "Защита",
      "Сияющие",
    ]),
    ["Категория", "Защита", "Сияющие"],
  );
  assert.deepEqual(
    normalizeBuildSkillConfigurableSocketTypes("normal", 4, [
      "Категория",
      "Светлое",
      "Тусклое",
    ]),
    ["Светлое", "Тусклое"],
  );
  assert.equal(isSocketlessBuildSkillSlot("normal", 13), true);
  assert.equal(isSocketlessBuildSkillSlot("rabam", 4), false);
  assert.deepEqual(
    getBuildSkillSocketTypes("normal", 13, [
      "Защита",
      "Сияющие",
    ]),
    [],
  );
});
