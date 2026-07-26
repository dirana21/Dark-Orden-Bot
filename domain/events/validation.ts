import { AuthError } from "@/domain/auth/errors";
import {
  eventRoles,
  eventSessionNumbers,
  type EventRole,
  type EventSessionNumber,
} from "./model";

export function validateEventSession(value: unknown): EventSessionNumber {
  const parsed =
    typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : value;

  if (
    typeof parsed !== "number" ||
    !eventSessionNumbers.includes(parsed as EventSessionNumber)
  ) {
    throw new AuthError(
      "INVALID_INPUT",
      "Выберите сессию события от 1 до 4.",
    );
  }

  return parsed as EventSessionNumber;
}

export function validateEventRole(value: unknown): EventRole {
  if (
    typeof value !== "string" ||
    !eventRoles.includes(value as EventRole)
  ) {
    throw new AuthError(
      "INVALID_INPUT",
      "Выберите одну из доступных ролей события.",
    );
  }

  return value as EventRole;
}
