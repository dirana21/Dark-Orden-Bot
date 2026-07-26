export type AuthErrorCode =
  | "INVALID_INPUT"
  | "INVALID_IDENTIFIER"
  | "USER_EXISTS"
  | "INVALID_CREDENTIALS"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "SERVICE_UNAVAILABLE";

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}
