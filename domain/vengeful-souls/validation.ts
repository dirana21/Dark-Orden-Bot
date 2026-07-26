import { AuthError } from "@/domain/auth/errors";

const MAX_VENGEFUL_SOULS_POINTS = 999_999_999;

export function validateVengefulSoulsPoints(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > MAX_VENGEFUL_SOULS_POINTS
  ) {
    throw new AuthError(
      "INVALID_INPUT",
      "Укажите целое число очков от 0 до 999 999 999.",
    );
  }

  return value;
}
