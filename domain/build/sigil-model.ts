export const buildSigilCategories = [
  "Безупречное",
  "Светлое",
  "Упорядоченное",
  "Защита",
  "Сияющие",
  "Тусклое",
] as const;

export type BuildSigilCategory =
  (typeof buildSigilCategories)[number];

export interface BuildSigil {
  id: string;
  name: string;
  category: BuildSigilCategory;
  description: string;
  iconUrl: string;
  createdAt: number;
  updatedAt: number;
}
