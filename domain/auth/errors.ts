export type AuthErrorCode =
  | "INVALID_INPUT"
  | "USER_EXISTS"
  | "INVALID_CREDENTIALS"
  | "UNAUTHORIZED"
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
