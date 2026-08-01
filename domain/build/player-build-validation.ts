import { BuildError } from "./errors";
import {
  PLAYER_BUILD_SLOT_LIMIT,
  playerBuildSetupTypes,
  type PlayerBuildSetupType,
  type PlayerBuildSlot,
} from "./player-build-model";

function validateId(value: unknown, label: string): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 160
  ) {
    throw new BuildError(`Не удалось определить ${label}.`);
  }
  return value;
}

export function validatePlayerBuildSlots(
  value: unknown,
): PlayerBuildSlot[] {
  if (!Array.isArray(value) || value.length > PLAYER_BUILD_SLOT_LIMIT) {
    throw new BuildError(
      `В личном билде доступно не больше ${PLAYER_BUILD_SLOT_LIMIT} навыков.`,
    );
  }

  const slots = value.map((item) => {
    if (!item || typeof item !== "object") {
      throw new BuildError("Не удалось прочитать слот личного билда.");
    }
    const candidate = item as {
      skillId?: unknown;
      sigilIds?: unknown;
      comboEnabled?: unknown;
      alternateEnabled?: unknown;
    };
    if (
      !Array.isArray(candidate.sigilIds) ||
      candidate.sigilIds.length > 4
    ) {
      throw new BuildError(
        "Для навыка доступно не больше четырёх сигилов.",
      );
    }
    if (
      candidate.alternateEnabled !== undefined &&
      typeof candidate.alternateEnabled !== "boolean"
    ) {
      throw new BuildError("Стойка навыка в личном билде указана неверно.");
    }
    if (
      candidate.comboEnabled !== undefined &&
      candidate.comboEnabled !== null &&
      typeof candidate.comboEnabled !== "boolean"
    ) {
      throw new BuildError(
        "Состояние комбо в личном билде указано неверно.",
      );
    }

    return {
      skillId: validateId(candidate.skillId, "навык"),
      sigilIds: candidate.sigilIds.map((sigilId) =>
        sigilId === null
          ? null
          : validateId(sigilId, "сигил"),
      ),
      comboEnabled:
        typeof candidate.comboEnabled === "boolean"
          ? candidate.comboEnabled
          : null,
      alternateEnabled: candidate.alternateEnabled === true,
    };
  });

  if (new Set(slots.map((slot) => slot.skillId)).size !== slots.length) {
    throw new BuildError(
      "Один навык нельзя добавить в личный билд несколько раз.",
    );
  }
  return slots;
}

export function validatePlayerBuildSetupType(
  value: unknown,
): PlayerBuildSetupType {
  if (
    typeof value !== "string" ||
    !playerBuildSetupTypes.includes(value as PlayerBuildSetupType)
  ) {
    throw new BuildError("Выберите один из четырёх сетапов билда.");
  }
  return value as PlayerBuildSetupType;
}
