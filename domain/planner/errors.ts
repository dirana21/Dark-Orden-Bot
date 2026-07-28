export type PlannerErrorCode = "FORBIDDEN" | "INVALID_INPUT" | "NOT_FOUND";

export class PlannerError extends Error {
  constructor(
    public readonly code: PlannerErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PlannerError";
  }
}
