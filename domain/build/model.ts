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
  name: string;
  descriptionHtml: string;
  iconUrl: string;
  comboAvailable: boolean;
  comboEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}
