import type { Clock } from "@/domain/auth/ports";
import { AuthError } from "@/domain/auth/errors";
import type { VengefulSoulsRepository } from "@/domain/vengeful-souls/ports";
import { validateVengefulSoulsPoints } from "@/domain/vengeful-souls/validation";
import type { EventSessionNumber } from "@/domain/events/model";

export class SubmitVengefulSoulsScore {
  constructor(
    private readonly scores: VengefulSoulsRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    userId: string,
    guildId: string,
    sessionNumber: EventSessionNumber,
    points: unknown,
  ): Promise<void> {
    const saved = await this.scores.savePlayerScore(
      userId,
      guildId,
      sessionNumber,
      validateVengefulSoulsPoints(points),
      this.clock.now(),
    );

    if (!saved) {
      throw new AuthError(
        "FORBIDDEN",
        "Скрытая учётная запись не участвует в рейтинге Ночи неупокоеных душ.",
      );
    }
  }
}
