import { BuildError } from "./errors";
import {
  buildSigilCategories,
  type BuildSigilCategory,
} from "./sigil-model";

export const BUILD_SIGIL_ICON_MAX_BYTES = 2 * 1024 * 1024;
export const BUILD_SIGIL_ICON_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export function validateBuildSigilName(value: unknown): string {
  if (typeof value !== "string") {
    throw new BuildError("Укажите название сигила.");
  }

  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) {
    throw new BuildError(
      "Название сигила должно содержать от 2 до 80 символов.",
    );
  }

  return name;
}

export function validateBuildSigilCategory(
  value: unknown,
): BuildSigilCategory {
  if (
    typeof value === "string" &&
    (buildSigilCategories as readonly string[]).includes(value)
  ) {
    return value as BuildSigilCategory;
  }

  throw new BuildError("Выберите категорию сигила из списка.");
}

export function validateBuildSigilDescription(
  value: unknown,
): string {
  if (typeof value !== "string") {
    throw new BuildError("Добавьте описание сигила.");
  }

  const description = value.trim().replace(/\r\n/g, "\n");
  if (description.length < 2 || description.length > 1000) {
    throw new BuildError(
      "Описание сигила должно содержать от 2 до 1000 символов.",
    );
  }

  return description;
}

export function validateBuildSigilIcon(file: unknown): File {
  if (!(file instanceof File) || file.size === 0) {
    throw new BuildError("Добавьте иконку сигила.");
  }
  if (file.size > BUILD_SIGIL_ICON_MAX_BYTES) {
    throw new BuildError("Иконка сигила должна быть не больше 2 МБ.");
  }
  if (!(BUILD_SIGIL_ICON_TYPES as readonly string[]).includes(file.type)) {
    throw new BuildError(
      "Иконка сигила должна быть в формате PNG, JPG или WEBP.",
    );
  }

  return file;
}
