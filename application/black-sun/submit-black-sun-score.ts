import { AuthError } from "@/domain/auth/errors";
import type { BlackSunRepository } from "@/domain/black-sun/ports";
import { validateBlackSunPoints } from "@/domain/black-sun/validation";
import type { Clock } from "@/domain/auth/ports";

export class SubmitBlackSunScore {
  constructor(
    private readonly scores: BlackSunRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    userId: string,
    guildId: string,
    points: unknown,
  ): Promise<void> {
    const saved = await this.scores.savePlayerScore(
      userId,
      guildId,
      validateBlackSunPoints(points),
      this.clock.now(),
    );

    if (!saved) {
      throw new AuthError(
        "FORBIDDEN",
        "Скрытая учётная запись не участвует в рейтинге Чёрного Солнца.",
      );
    }
  }
}
