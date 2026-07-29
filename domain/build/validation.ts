import {
  buildCharacterClasses,
  type BuildCharacterClass,
  type BuildCharacterSlot,
  buildSkillSlotLimits,
  type BuildSkillSlotType,
} from "./model";
import { BuildError } from "./errors";
import sanitizeHtml from "sanitize-html";
import {
  buildSigilCategories,
  type BuildSigilCategory,
} from "./sigil-model";

export const BUILD_SKILL_ICON_MAX_BYTES = 2 * 1024 * 1024;
export const BUILD_SKILL_ICON_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export function validateBuildCharacter(
  value: unknown,
): BuildCharacterClass {
  if (
    typeof value === "string" &&
    (buildCharacterClasses as readonly string[]).includes(value)
  ) {
    return value as BuildCharacterClass;
  }

  throw new BuildError("Выберите персонажа из списка.");
}

export function validateBuildCharacterSlot(
  value: unknown,
): BuildCharacterSlot {
  if (value === "main" || value === "mirror") {
    return value;
  }

  throw new BuildError("Не удалось определить слот персонажа.");
}

export function validateBuildSkillSlotType(
  value: unknown,
): BuildSkillSlotType {
  if (value === "rabam" || value === "normal") {
    return value;
  }

  throw new BuildError("Не удалось определить тип слота умения.");
}

export function validateBuildSkillSlotIndex(
  slotType: BuildSkillSlotType,
  value: unknown,
): number {
  const slotIndex =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  if (
    Number.isInteger(slotIndex) &&
    slotIndex >= 1 &&
    slotIndex <= buildSkillSlotLimits[slotType]
  ) {
    return slotIndex;
  }

  throw new BuildError(
    slotType === "rabam"
      ? "Для Рабамов доступны только 4 слота."
      : "Для обычных умений доступны только 13 слотов.",
  );
}

export function validateBuildSkillSocketTypes(
  value: unknown,
): BuildSigilCategory[] {
  let parsed: unknown;
  try {
    parsed =
      typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    throw new BuildError("Не удалось прочитать сокеты умения.");
  }

  if (!Array.isArray(parsed) || parsed.length > 3) {
    throw new BuildError("Для умения доступно не больше трёх сокетов.");
  }

  const allowed = buildSigilCategories as readonly string[];
  if (
    !parsed.every(
      (item) => typeof item === "string" && allowed.includes(item),
    )
  ) {
    throw new BuildError("Выберите типы сокетов из списка.");
  }

  return parsed as BuildSigilCategory[];
}

export function validateBuildSkillName(value: unknown): string {
  if (typeof value !== "string") {
    throw new BuildError("Укажите название умения.");
  }

  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) {
    throw new BuildError("Название умения должно содержать от 2 до 80 символов.");
  }

  return name;
}

export function sanitizeBuildSkillDescription(value: unknown): string {
  if (typeof value !== "string") {
    throw new BuildError("Добавьте описание умения.");
  }

  const description = sanitizeHtml(value, {
    allowedTags: [
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "strong",
      "b",
      "em",
      "i",
      "span",
      "div",
    ],
    allowedAttributes: {
      span: ["style"],
    },
    allowedStyles: {
      span: {
        color: [
          /^#[0-9a-f]{3}([0-9a-f]{3})?$/i,
          /^rgb\(\s*(?:\d{1,3}\s*,\s*){2}\d{1,3}\s*\)$/i,
        ],
      },
    },
    transformTags: {
      font: (_tagName, attributes) => ({
        tagName: "span",
        attribs: attributes.color
          ? { style: `color: ${attributes.color}` }
          : {},
      }),
    },
    disallowedTagsMode: "discard",
  }).trim();

  const plainText = sanitizeHtml(description, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;/g, " ")
    .trim();

  if (plainText.length < 2) {
    throw new BuildError("Добавьте текст описания умения.");
  }
  if (description.length > 20_000) {
    throw new BuildError("Описание умения слишком длинное.");
  }

  return description;
}

export function validateBuildSkillIcon(file: unknown): File {
  if (!(file instanceof File) || file.size === 0) {
    throw new BuildError("Добавьте иконку умения.");
  }
  if (file.size > BUILD_SKILL_ICON_MAX_BYTES) {
    throw new BuildError("Иконка должна быть не больше 2 МБ.");
  }
  if (!(BUILD_SKILL_ICON_TYPES as readonly string[]).includes(file.type)) {
    throw new BuildError("Иконка должна быть в формате PNG, JPG или WEBP.");
  }

  return file;
}

export function validateBuildSkillComboAvailable(value: unknown): boolean {
  if (value === true || value === "true") {
    return true;
  }
  if (value === false || value === "false" || value === null) {
    return false;
  }

  throw new BuildError("Укажите, доступно ли комбо для этого умения.");
}

export function validateBuildSkillComboEnabled(value: unknown): boolean {
  if (value === true || value === false) {
    return value;
  }

  throw new BuildError("Не удалось определить состояние комбо.");
}
