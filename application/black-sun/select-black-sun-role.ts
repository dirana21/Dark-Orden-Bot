import { AuthError } from "@/domain/auth/errors";
import type { BlackSunRepository } from "@/domain/black-sun/ports";
import type { EventSessionNumber } from "@/domain/events/model";
import { validateEventRole } from "@/domain/events/validation";

export class SelectBlackSunRole {
  constructor(private readonly scores: BlackSunRepository) {}

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
        "Скрытая учётная запись не участвует в сессиях Чёрного Солнца.",
      );
    }
  }
}
