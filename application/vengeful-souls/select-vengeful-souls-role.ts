import { AuthError } from "@/domain/auth/errors";
import type { EventSessionNumber } from "@/domain/events/model";
import { validateEventRole } from "@/domain/events/validation";
import type { VengefulSoulsRepository } from "@/domain/vengeful-souls/ports";

export class SelectVengefulSoulsRole {
  constructor(private readonly scores: VengefulSoulsRepository) {}

  async execute(
    userId: string,
    guildId: string,
    sessionNumber: EventSessionNumber,
    role: unknown,
  ): Promise<void> {
    const saved = await this.scores.savePlayerRole(
      userId,
      guildId,
      sessionNumber,
      validateEventRole(role),
    );

    if (!saved) {
      throw new AuthError(
        "FORBIDDEN",
        "Скрытая учётная запись не участвует в сессиях Ночи неупокоеных душ.",
      );
    }
  }
}
