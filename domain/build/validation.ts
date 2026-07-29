import {
  buildCharacterClasses,
  type BuildCharacterClass,
  type BuildCharacterSlot,
} from "./model";
import { BuildError } from "./errors";

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
