import type { PlannerTaskKind } from "./model";
import { PlannerError } from "./errors";

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function validatePlannerTaskTitle(value: unknown): string {
  if (typeof value !== "string") {
    throw new PlannerError("INVALID_INPUT", "Введите название задачи.");
  }

  const title = value.trim().replace(/\s+/g, " ");
  if (title.length < 1 || title.length > 120) {
    throw new PlannerError(
      "INVALID_INPUT",
      "Название задачи должно содержать от 1 до 120 символов.",
    );
  }

  return title;
}

export function validatePlannerTaskKind(value: unknown): PlannerTaskKind {
  if (value === "weekly" || value === "daily") {
    return value;
  }

  throw new PlannerError("INVALID_INPUT", "Неизвестный тип задачи.");
}

export function validatePlannerDate(value: unknown): string {
  if (typeof value !== "string") {
    throw new PlannerError("INVALID_INPUT", "Укажите дату задачи.");
  }

  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) {
    throw new PlannerError("INVALID_INPUT", "Дата задачи указана неверно.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const isValid =
    year >= 2020 &&
    year <= 2100 &&
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;

  if (!isValid) {
    throw new PlannerError("INVALID_INPUT", "Дата задачи указана неверно.");
  }

  return value;
}

export function validatePlannerWeekStart(value: unknown): string {
  const date = validatePlannerDate(value);
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (parsed.getUTCDay() !== 1) {
    throw new PlannerError(
      "INVALID_INPUT",
      "Началом недели должен быть понедельник.",
    );
  }

  return date;
}

export function validatePlannerTaskId(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 100
  ) {
    throw new PlannerError("INVALID_INPUT", "Задача указана неверно.");
  }

  return value;
}

export function validatePlannerCompleted(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new PlannerError(
      "INVALID_INPUT",
      "Статус выполнения указан неверно.",
    );
  }

  return value;
}

export function addPlannerDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}
