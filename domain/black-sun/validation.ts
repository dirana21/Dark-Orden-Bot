import { AuthError } from "@/domain/auth/errors";

const MAX_BLACK_SUN_POINTS = 999_999_999;

export function validateBlackSunPoints(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > MAX_BLACK_SUN_POINTS
  ) {
    throw new AuthError(
      "INVALID_INPUT",
      "Укажите целое число очков от 0 до 999 999 999.",
    );
  }

  return value;
}
