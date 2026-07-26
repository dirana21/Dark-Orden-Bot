import { AuthError } from "./errors";

const USERNAME_PATTERN = /^[\p{L}\p{N}_-]+$/u;
const LETTER_PATTERN = /\p{L}/u;
const NUMBER_PATTERN = /\p{N}/u;

export function normalizeUsername(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("ru");
}

export function validateUsername(value: string): string {
  const username = normalizeUsername(value);

  if (username.length < 3 || username.length > 24) {
    throw new AuthError(
      "INVALID_INPUT",
      "Логин должен содержать от 3 до 24 символов.",
    );
  }

  if (!USERNAME_PATTERN.test(username)) {
    throw new AuthError(
      "INVALID_INPUT",
      "В логине разрешены буквы, цифры, дефис и нижнее подчёркивание.",
    );
  }

  return username;
}

export function validateDisplayName(value: string): string {
  const displayName = value.normalize("NFKC").trim().replace(/\s+/g, " ");

  if (displayName.length < 2 || displayName.length > 40) {
    throw new AuthError(
      "INVALID_INPUT",
      "Имя персонажа должно содержать от 2 до 40 символов.",
    );
  }

  return displayName;
}

export function validateRealName(value?: string | null): string | null {
  const realName = (value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");

  if (!realName) {
    return null;
  }

  if (realName.length < 2 || realName.length > 60) {
    throw new AuthError(
      "INVALID_INPUT",
      "Реальное имя должно содержать от 2 до 60 символов.",
    );
  }

  return realName;
}

export function validatePassword(value: string): string {
  if (value.length < 10 || value.length > 128) {
    throw new AuthError(
      "INVALID_INPUT",
      "Пароль должен содержать от 10 до 128 символов.",
    );
  }

  if (!LETTER_PATTERN.test(value) || !NUMBER_PATTERN.test(value)) {
    throw new AuthError(
      "INVALID_INPUT",
      "Добавьте в пароль хотя бы одну букву и одну цифру.",
    );
  }

  return value;
}

export function validateGuildIdentifier(value: string): string {
  const identifier = value.normalize("NFKC").trim();

  if (identifier.length < 4 || identifier.length > 64) {
    throw new AuthError(
      "INVALID_IDENTIFIER",
      "Неверный идентификатор гильдии.",
    );
  }

  return identifier;
}
