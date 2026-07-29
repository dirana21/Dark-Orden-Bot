import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCharacterClasses,
  getBuildSkillSocketTypes,
  isSocketlessBuildSkillSlot,
  normalizeBuildSkillConfigurableSocketTypes,
} from "../domain/build/model.ts";
import { canManageBuildSkills } from "../domain/build/permissions.ts";
import {
  PLAYER_BUILD_SLOT_LIMIT,
  playerBuildSetupTypes,
} from "../domain/build/player-build-model.ts";
import {
  validatePlayerBuildSetupType,
  validatePlayerBuildSlots,
} from "../domain/build/player-build-validation.ts";
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

test("accepts configured and future build characters", () => {
  assert.equal(buildCharacterClasses.length, 30);
  assert.equal(validateBuildCharacter("Воин"), "Воин");
  assert.equal(validateBuildCharacter("Сераф"), "Сераф");
  assert.equal(
    validateBuildCharacter("  Новый   герой  "),
    "Новый герой",
  );
  assert.equal(validateBuildCharacterSlot("main"), "main");
  assert.equal(validateBuildCharacterSlot("mirror"), "mirror");
});

test("rejects invalid build character names and slots", () => {
  assert.throws(() => validateBuildCharacter("x"));
  assert.throws(() => validateBuildCharacter("Герой ⚔"));
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

test("validates ten unique skills and up to four sigils in a personal build", () => {
  assert.equal(PLAYER_BUILD_SLOT_LIMIT, 10);
  const slots = Array.from({ length: PLAYER_BUILD_SLOT_LIMIT }, (_, index) => ({
    skillId: `skill-${index + 1}`,
    sigilIds: [null, `sigil-${index + 1}`],
  }));

  assert.deepEqual(validatePlayerBuildSlots(slots), slots);
  assert.throws(() =>
    validatePlayerBuildSlots([
      { skillId: "skill-1", sigilIds: [] },
      { skillId: "skill-1", sigilIds: [] },
    ]),
  );
  assert.throws(() =>
    validatePlayerBuildSlots([
      {
        skillId: "skill-1",
        sigilIds: ["one", "two", "three", "four", "five"],
      },
    ]),
  );
  assert.throws(() =>
    validatePlayerBuildSlots([
      ...slots,
      { skillId: "skill-11", sigilIds: [] },
    ]),
  );
});

test("supports the four personal build setup types", () => {
  assert.deepEqual(playerBuildSetupTypes, [
    "mass-pvp",
    "pvp",
    "pve",
    "bosses",
  ]);
  assert.equal(
    validatePlayerBuildSetupType("mass-pvp"),
    "mass-pvp",
  );
  assert.equal(validatePlayerBuildSetupType("pvp"), "pvp");
  assert.equal(validatePlayerBuildSetupType("pve"), "pve");
  assert.equal(validatePlayerBuildSetupType("bosses"), "bosses");
  assert.throws(() => validatePlayerBuildSetupType("arena"));
});
