import type { BuildSigilCategory } from "./sigil-model";

export const buildCharacterClasses = [
  "Воин",
  "Лучница",
  "Волшебница",
  "Варвар",
  "Валькирия",
  "Колдунья",
  "Мастер меча",
  "Укротительница",
  "Ниндзя",
  "Темный Рыцарь",
  "Боевой Мастер",
  "Маэва",
  "Лан",
  "Мистик",
  "Волшебник",
  "Шай",
  "Куноити",
  "Лучник",
  "Хассашин",
  "Нова",
  "Страж",
  "Корсар",
  "Мудрец",
  "Драканиа",
  "Мэгу",
  "Уса",
  "Сколария",
  "Тоса",
  "Мертвый Глаз",
  "Сераф",
] as const;

export type BuildCharacterClass = (typeof buildCharacterClasses)[number];
export type BuildCharacterSlot = "main" | "mirror";
export type BuildSkillSlotType = "rabam" | "normal";

export const buildSkillSlotLimits: Record<BuildSkillSlotType, number> = {
  rabam: 4,
  normal: 13,
};

export const fixedBuildSkillSocketCategory: BuildSigilCategory =
  "Категория";

export function isSocketlessBuildSkillSlot(
  slotType: BuildSkillSlotType,
  slotIndex: number,
): boolean {
  return slotType === "normal" && slotIndex === buildSkillSlotLimits.normal;
}

export function normalizeBuildSkillConfigurableSocketTypes(
  slotType: BuildSkillSlotType,
  slotIndex: number,
  socketTypes: readonly BuildSigilCategory[],
): BuildSigilCategory[] {
  if (isSocketlessBuildSkillSlot(slotType, slotIndex)) {
    return [];
  }

  return socketTypes
    .filter((socketType) => socketType !== fixedBuildSkillSocketCategory)
    .slice(0, 3);
}

export function getBuildSkillSocketTypes(
  slotType: BuildSkillSlotType,
  slotIndex: number,
  configurableSocketTypes: readonly BuildSigilCategory[],
): BuildSigilCategory[] {
  if (isSocketlessBuildSkillSlot(slotType, slotIndex)) {
    return [];
  }

  return [
    fixedBuildSkillSocketCategory,
    ...normalizeBuildSkillConfigurableSocketTypes(
      slotType,
      slotIndex,
      configurableSocketTypes,
    ),
  ];
}

export interface BuildProfile {
  mainCharacter: BuildCharacterClass | null;
  mirrorCharacter: BuildCharacterClass | null;
  updatedAt: number | null;
}

export interface BuildSkill {
  id: string;
  character: BuildCharacterClass;
  slotType: BuildSkillSlotType;
  slotIndex: number;
  socketTypes: BuildSigilCategory[];
  name: string;
  descriptionHtml: string;
  iconUrl: string;
  comboAvailable: boolean;
  comboEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}
